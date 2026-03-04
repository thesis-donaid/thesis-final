import { createAllocation, getAvailableFunds, getDonorsToNotify, markDonorsNotified, validateAllocation } from "@/lib/allocation";
import { authOptions } from "@/lib/auth";
import { sendAllocationNotificationEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { AllocationResponse, CreateAllocationRequest } from "@/types/allocation";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";



// GET - Ffetch available funds for allocation
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if(!session?.user || session?.user.role !== "admin") {
            return NextResponse.json(
                { success: false, error: "unauthorized" },
                { status: 401 }
            );
        }

        const funds = await getAvailableFunds();

        return NextResponse.json({
            success: true,
            data: funds,
        });
    } catch (error) {
        console.error("Error fetching available funds:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch available funds" },
            { status: 500 }
        )
    }

}

// POST - Create allocation
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if(!session?.user || session.user.role !== "admin") {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body: CreateAllocationRequest = await req.json();

        // Validate request
        const validation = await validateAllocation(body);
        if (!validation.valid) {
            return NextResponse.json(
                { success: false, errors: validation.errors },
                { status: 400 }
            );
        }

        // Create allocations
        const allocations = await createAllocation(body, session.user.id);

        // Get request details
        const request = await prisma.beneficiaryRequest.findUnique({
            where: { id: body.requestId },
            include: { beneficiary: { include: { user: true }}}
        });

        // Resolve beneficiary name for email
        const beneficiaryName = request?.beneficiary
            ? (`${request.beneficiary.firstName ?? ""} ${request.beneficiary.lastName ?? ""}`.trim()
                || request.beneficiary.user?.name
                || "a beneficiary")
            : "a beneficiary";

        // Send notification
        let donorCount = 0;
        let beneficiarNotified = false;

        if (body.notifyDonors) {
            const allocationIds = allocations.map(a => a.id);
            const donorsToNotify = await getDonorsToNotify(allocationIds);

            // Send emails to donors via linked donation allocations
            for (const donor of donorsToNotify) {
                if (!donor.isAnonymous) {
                    try {
                        await sendAllocationNotificationEmail({
                            to: donor.email,
                            donorName: donor.donorName,
                            amountUsed: donor.amountUsed,
                            purpose: donor.requestPurpose,
                            disbursementDate: donor.disbursementDate,
                            beneficiaryName,
                        });
                        donorCount++
                    } catch (emailError) {
                        console.error(`Failed to send email to ${donor.email}`)
                    }
                }
            }

            // mark as notified
            await markDonorsNotified(donorsToNotify.map(d => d.donationAllocationId));

            // Fallback: if no donors found via donationAllocations, query pool donations directly
            if (donorCount === 0) {
                const poolIds = allocations
                    .filter(a => a.pool?.id)
                    .map(a => a.pool!.id);

                const notifiedEmails = new Set<string>();

                if (poolIds.length > 0) {
                    const poolDonations = await prisma.donation.findMany({
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

                    for (const donation of poolDonations) {
                        if (donation.email && !notifiedEmails.has(donation.email)) {
                            notifiedEmails.add(donation.email);
                            const donorName = donation.registeredDonor?.name
                                ?? donation.registeredDonor?.user?.name
                                ?? "Generous Donor";
                            try {
                                await sendAllocationNotificationEmail({
                                    to: donation.email,
                                    donorName,
                                    amountUsed: donation.amount,
                                    purpose: request?.purpose ?? "Community Support",
                                    disbursementDate: new Date(body.disbursementDate),
                                    beneficiaryName,
                                });
                                donorCount++;
                            } catch (emailError) {
                                console.error(`Failed to send allocation email to donor ${donation.email}:`, emailError);
                            }
                        }
                    }
                }

                // Also check unrestricted donations
                const hasUnrestricted = allocations.some(a => a.source_type === "UNRESTRICTED");
                if (hasUnrestricted) {
                    const unrestrictedDonations = await prisma.donation.findMany({
                        where: {
                            donation_type: "unrestricted",
                            status: "completed",
                            is_anonymous: false,
                        },
                        include: {
                            registeredDonor: { include: { user: true } },
                        },
                        distinct: ["email"],
                    });

                    for (const donation of unrestrictedDonations) {
                        if (donation.email && !notifiedEmails.has(donation.email)) {
                            notifiedEmails.add(donation.email);
                            const donorName = donation.registeredDonor?.name
                                ?? donation.registeredDonor?.user?.name
                                ?? "Generous Donor";
                            try {
                                await sendAllocationNotificationEmail({
                                    to: donation.email,
                                    donorName,
                                    amountUsed: donation.amount,
                                    purpose: request?.purpose ?? "Community Support",
                                    disbursementDate: new Date(body.disbursementDate),
                                    beneficiaryName,
                                });
                                donorCount++;
                            } catch (emailError) {
                                console.error(`Failed to send allocation email to donor ${donation.email}:`, emailError);
                            }
                        }
                    }
                }
            }
        }

        if (body.notifyBeneficiary && request?.beneficiary) {
            try {
                // Send email to beneficiary
                const beneficiaryEmail = request.email
                    ?? request.beneficiary.email
                    ?? request.beneficiary.user?.email;

                if (!beneficiaryEmail) {
                    throw new Error("No email address found for beneficiary");
                }

                const beneficiaryName = `${request.beneficiary.firstName ?? ""} ${request.beneficiary.lastName ?? ""}`.trim()
                    || request.beneficiary.user?.name
                    || "Beneficiary";

                await sendAllocationNotificationEmail({
                    to: beneficiaryEmail,
                    donorName: beneficiaryName,
                    amountUsed: body.allocations.reduce((sum, a) => sum + a.amount, 0),
                    purpose: request.purpose,
                    disbursementDate: new Date(body.disbursementDate),
                    isBeneficiary: true
                });
                beneficiarNotified = true;
            } catch (emailError) {
                console.error("Failed to notify beneficiary:", emailError);
            }
        }

        const totalAllocated = allocations.reduce((sum, a) => sum + a.amount, 0);

        const response: AllocationResponse = {
            success: true,
            message: "Budget allocated successfully",
            data: {
                allocations: allocations.map(a => ({
                    id: a.id,
                    sourceType: a.source_type,
                    poolName: a.pool?.name,
                    amount: a.amount,
                    donationLinked: a.linkedDonations.length,
                })),
                totalAllocated,
                request: {
                    id: body.requestId,
                    purpose: request?.purpose ?? "",
                    requestAmount: request?.amount ?? 0,
                    status: "APPROVED",
                },
                notifications: {
                    donorCount,
                    beneficiarNotified
                }
            }
        };

        return NextResponse.json(response);
    } catch(error) {
        console.error("Error creating allocation:", error);
        return NextResponse.json(
            { success: false, error: "Failed to create allocation" },
            { status: 500 }
        )
    }
}