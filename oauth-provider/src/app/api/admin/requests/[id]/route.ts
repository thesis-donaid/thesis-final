import { getAvailableFunds } from "@/lib/allocation";
import { authOptions } from "@/lib/auth";
import { sendDisbursementNotificationEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";


export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if(!session?.user || session.user.role !== "admin") {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 },
            );
        }

        const { id } = await params;
        const requestId = parseInt(id);

        const request = await prisma.beneficiaryRequest.findUnique({
            where: { id: requestId },
            include: {
                beneficiary: {
                    include: { user: true }
                },
                documents: true,
                receipts: {
                    orderBy: { uploaded_at: 'desc' },
                },
                allocations: {
                    include: {
                        pool: true,
                        donationAllocations: {
                            include: {
                                donation: true,
                            }
                        }
                    }
                }
            }
        });

        if (!request) {
            return NextResponse.json(
                { success: false, error: "Request not found!" },
                { status: 404 }
            )
        }

        // Get  available funds for allocation dropdown
        const availableFunds = await getAvailableFunds();

        // Calculate already allocated amount
        const allocatedAmount = request.allocations.reduce(
            (sum, a) => sum + a.amount,
            0
        )
        const remainingToAllocate = request.amount - allocatedAmount;

        return NextResponse.json({
            success: true,
            data: {
                request: {
                    ...request,
                    allocatedAmount,
                    remainingToAllocate,
                },
                availableFunds,
            }
        })
    } catch(error) {
        console.error("Error fetching request:", error);
        return NextResponse.json(
        { success: false, error: "Failed to fetch request" },
        { status: 500 }
        );
    }
}


// PATCH - Update request status (approve, reject, mark under review)
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user || session.user.role !== "admin") {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { id } = await params;
        const requestId = parseInt(id);
        const body = await req.json();
        const { status, rejection_reason, disbursement_method } = body;

        // Validate status
        const validStatuses = ["UNDER_REVIEW", "APPROVED", "REJECTED", "DISBURSED"];
        if (!status || !validStatuses.includes(status)) {
            return NextResponse.json(
                { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
                { status: 400 }
            );
        }

        // Check request exists
        const existing = await prisma.beneficiaryRequest.findUnique({
            where: { id: requestId },
        });

        if (!existing) {
            return NextResponse.json(
                { success: false, error: "Request not found" },
                { status: 404 }
            );
        }

        // Rejection requires a reason
        if (status === "REJECTED" && !rejection_reason) {
            return NextResponse.json(
                { success: false, error: "Rejection reason is required" },
                { status: 400 }
            );
        }

        // Build update data
        const updateData: Record<string, unknown> = {
            status,
            reviewed_by: session.user.id,
            reviewed_at: new Date(),
        };

        if (status === "REJECTED") {
            updateData.rejection_reason = rejection_reason;
        }

        if (status === "DISBURSED") {
            // Disbursement requires a method
            const validMethods = ["cash", "check", "bank_transfer"];
            if (!disbursement_method || !validMethods.includes(disbursement_method)) {
                return NextResponse.json(
                    { success: false, error: `Disbursement method is required. Must be one of: ${validMethods.join(", ")}` },
                    { status: 400 }
                );
            }

            updateData.disbursed_at = new Date();

            // Also mark all related allocations as disbursed
            await prisma.allocation.updateMany({
                where: {
                    requestId: requestId,
                    is_disbursed: false,
                },
                data: {
                    is_disbursed: true,
                    disbursed_at: new Date(),
                },
            });
        }

        const updated = await prisma.beneficiaryRequest.update({
            where: { id: requestId },
            data: updateData,
            include: {
                beneficiary: {
                    include: { user: true },
                },
                allocations: {
                    include: {
                        donationAllocations: {
                            include: {
                                donation: true,
                            },
                        },
                    },
                },
            },
        });

        // Send disbursement notifications
        if (status === "DISBURSED") {
            const totalDisbursed = updated.allocations.reduce((sum, a) => sum + a.amount, 0);
            const beneficiaryEmail = updated.email
                ?? updated.beneficiary.email
                ?? updated.beneficiary.user?.email;
            const beneficiaryName = `${updated.beneficiary.firstName ?? ""} ${updated.beneficiary.lastName ?? ""}`.trim()
                || updated.beneficiary.user?.name
                || "Beneficiary";

            // Notify beneficiary
            if (beneficiaryEmail) {
                try {
                    await sendDisbursementNotificationEmail({
                        to: beneficiaryEmail,
                        recipientName: beneficiaryName,
                        amount: totalDisbursed,
                        purpose: updated.purpose,
                        disbursementMethod: disbursement_method,
                        isBeneficiary: true,
                    });
                } catch (emailError) {
                    console.error("Failed to send disbursement email to beneficiary:", emailError);
                }
            }

            // Notify donors whose donations were linked
            const notifiedEmails = new Set<string>();
            for (const allocation of updated.allocations) {
                for (const da of allocation.donationAllocations) {
                    const donorEmail = da.donation.email;
                    if (donorEmail && !notifiedEmails.has(donorEmail)) {
                        notifiedEmails.add(donorEmail);
                        try {
                            await sendDisbursementNotificationEmail({
                                to: donorEmail,
                                recipientName: "Valued Donor",
                                amount: da.amount_used,
                                purpose: updated.purpose,
                                disbursementMethod: disbursement_method,
                                isBeneficiary: false,
                            });
                        } catch (emailError) {
                            console.error(`Failed to send disbursement email to donor ${donorEmail}:`, emailError);
                        }
                    }
                }
            }

            // Fallback: if no donationAllocations exist, query donations in the pool directly
            if (notifiedEmails.size === 0) {
                const poolIds = updated.allocations
                    .filter(a => a.poolId)
                    .map(a => a.poolId as string);

                if (poolIds.length > 0) {
                    const donations = await prisma.donation.findMany({
                        where: {
                            pool_id: { in: poolIds },
                            status: "completed",
                            is_anonymous: false,
                        },
                        include: {
                            registeredDonor: { include: { user: true } },
                        },
                        distinct: ["email"],
                    });

                    for (const donation of donations) {
                        if (donation.email && !notifiedEmails.has(donation.email)) {
                            notifiedEmails.add(donation.email);
                            const donorName = donation.registeredDonor?.name
                                ?? donation.registeredDonor?.user?.name
                                ?? "Valued Donor";
                            try {
                                await sendDisbursementNotificationEmail({
                                    to: donation.email,
                                    recipientName: donorName,
                                    amount: totalDisbursed,
                                    purpose: updated.purpose,
                                    disbursementMethod: disbursement_method,
                                    isBeneficiary: false,
                                });
                            } catch (emailError) {
                                console.error(`Failed to send disbursement email to donor ${donation.email}:`, emailError);
                            }
                        }
                    }
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: `Request ${status.toLowerCase()} successfully`,
            data: updated,
        });
    } catch (error) {
        console.error("Error updating request:", error);
        return NextResponse.json(
            { success: false, error: "Failed to update request" },
            { status: 500 }
        );
    }
}