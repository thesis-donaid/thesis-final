import { getAvailableFunds } from "@/lib/allocation";
import { authOptions } from "@/lib/auth";
import { sendDisbursementNotificationEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { recordProofOnChain } from "@/blockchain/service";
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

            // Calculate total disbursed from allocations
            const allocations = await prisma.allocation.findMany({
                where: { requestId: requestId },
            });

            const totalDisbursed = allocations.reduce((sum, a) => sum + a.amount, 0);
            updateData.disbursed_amount = totalDisbursed


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
                                beneficiaryName,
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
                                    beneficiaryName,
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


// PUT - Update receipt status (admin review of beneficiary's proof/receipt)
export async function PUT(
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
        const { receipt_status } = body;

        const validStatuses = ["PENDING", "COMPLETED", "MISSING"];
        if (!receipt_status || !validStatuses.includes(receipt_status)) {
            return NextResponse.json(
                { success: false, error: `Invalid receipt status. Must be one of: ${validStatuses.join(", ")}` },
                { status: 400 }
            );
        }

        const existing = await prisma.beneficiaryRequest.findUnique({
            where: { id: requestId },
        });

        if (!existing) {
            return NextResponse.json(
                { success: false, error: "Request not found" },
                { status: 404 }
            );
        }

        if (existing.status !== "DISBURSED") {
            return NextResponse.json(
                { success: false, error: "Receipt status can only be set for disbursed requests" },
                { status: 400 }
            );
        }

        const updated = await prisma.beneficiaryRequest.update({
            where: { id: requestId },
            data: { receipt_status },
        });

        // ============================================
        // BLOCKCHAIN RECORDING - Fire & Forget Pattern
        // ============================================
        // When receipt is marked COMPLETED, record proof on blockchain
        // Don't await - let it run in background. Vercel will try to complete it.
        if (receipt_status === "COMPLETED") {
            // Start blockchain recording without awaiting
            // This immediately returns the response while blockchain processes
            recordBlockchainInBackground(requestId).catch((error) => {
                console.error(`[Blockchain BG] Failed to record proof for request ${requestId}:`, error);
            });
        }

        return NextResponse.json({
            success: true,
            message: `Receipt status updated to ${receipt_status.toLowerCase()}. Blockchain recording in progress...`,
            data: updated,
        });
    } catch (error) {
        console.error("Error updating receipt status:", error);
        return NextResponse.json(
            { success: false, error: "Failed to update receipt status" },
            { status: 500 }
        );
    }
}

/**
 * Background function to record blockchain proofs
 * Runs independently of the HTTP response - doesn't block API
 * Errors are logged but don't affect the user's response
 */
async function recordBlockchainInBackground(requestId: number): Promise<void> {
    try {
        console.log(`[Blockchain BG] 🟢 Starting background recording for request ${requestId}`);

        const fullRequest = await prisma.beneficiaryRequest.findUnique({
            where: { id: requestId },
            include: {
                beneficiary: true,
                receipts: { orderBy: { uploaded_at: "desc" } },
                allocations: {
                    include: {
                        donationAllocations: {
                            include: { donation: true },
                        },
                    },
                },
            },
        });

        if (!fullRequest) {
            console.warn(`[Blockchain BG] ⚠️ Request ${requestId} not found`);
            return;
        }

        // Get proof document URLs
        const proofUrl = fullRequest.receipts[0]?.file_url || "";
        const disbursementReceiptUrl = fullRequest.receipts.length > 1
            ? fullRequest.receipts[1]?.file_url || ""
            : "";

        console.log(`[Blockchain BG] 📋 Processing ${fullRequest.allocations.length} allocation(s)`);

        let successCount = 0;
        let failureCount = 0;

        // Record one blockchain proof per allocation
        for (const allocation of fullRequest.allocations) {
            try {
                // Collect all donation IDs and donor IDs for this allocation
                const donationIds: string[] = [];
                const registeredDonorIds: number[] = [];
                const guestDonorIds: number[] = [];

                for (const da of allocation.donationAllocations) {
                    donationIds.push(da.donation.reference_code);
                    if (da.donation.registered_donor_id) {
                        registeredDonorIds.push(da.donation.registered_donor_id);
                    }
                    if (da.donation.guest_donor_id) {
                        guestDonorIds.push(da.donation.guest_donor_id);
                    }
                }

                if (donationIds.length === 0) {
                    console.log(`[Blockchain BG] ⏭️ Skipping allocation ${allocation.id} - no donations`);
                    continue;
                }

                console.log(
                    `[Blockchain BG] 🔗 Recording allocation ${allocation.id} (${donationIds.length} donations, ₱${allocation.amount})`
                );

                const result = await recordProofOnChain({
                    donationIds,
                    allocationId: String(allocation.id),
                    beneficiaryId: String(fullRequest.beneficiaryId),
                    registeredDonorIds,
                    guestDonorIds,
                    amount: allocation.amount,
                    purpose: fullRequest.purpose,
                    disbursementReceiptUrl,
                    proofUrl,
                    proofHash: proofUrl, // Using URL as hash for now
                    proofType: "receipt",
                });

                if (result.success) {
                    console.log(
                        `[Blockchain BG] ✅ Success for allocation ${allocation.id} | TX: ${result.transactionHash}`
                    );
                    successCount++;

                    // Update all donations linked to this allocation
                    for (const da of allocation.donationAllocations) {
                        await prisma.donation.update({
                            where: { id: da.donation.id },
                            data: {
                                blockchain_txt_hash: result.transactionHash,
                                blockchain_network: process.env.BLOCKCHAIN_NETWORK || "sepolia",
                                blockchain_status: "confirmed",
                                blockchain_saved_at: new Date(),
                            },
                        });
                    }

                    console.log(`[Blockchain BG] 📝 Updated ${allocation.donationAllocations.length} donation(s) with TX hash`);
                } else {
                    console.error(
                        `[Blockchain BG] ❌ Failed for allocation ${allocation.id}: ${result.error}`
                    );
                    failureCount++;
                }
            } catch (allocationError) {
                console.error(
                    `[Blockchain BG] 💥 Error processing allocation ${allocation.id}:`,
                    allocationError instanceof Error ? allocationError.message : String(allocationError)
                );
                failureCount++;
            }
        }

        console.log(
            `[Blockchain BG] 🎉 Completed for request ${requestId} | Success: ${successCount} | Failed: ${failureCount}`
        );
    } catch (error) {
        console.error(
            `[Blockchain BG] 💥 CRITICAL: Request ${requestId}:`,
            error instanceof Error ? error.message : String(error)
        );
    }
}