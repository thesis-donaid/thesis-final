


/**
 * Get available funds for allocation
 */

import { AvailableFunds, CreateAllocationRequest } from "@/types/allocation";
import { prisma } from "@/lib/prisma";
import { FundSourceType } from "../../generated/prisma/enums";
import { Prisma } from "../../generated/prisma/client";

interface DonationWhereClause {
    status: string;
    remaining_amount: { gt: number };
    donation_type?: string;
    pool_id?: string | null
}


export async function getAvailableFunds(): Promise<AvailableFunds> {
    // Compute unrestricted fund balance dynamically from actual donation records
    // This avoids relying on the UnrestrictedFund summary table which can get out of sync
    const unrestrictedAgg = await prisma.donation.aggregate({
        where: {
            donation_type: "unrestricted",
            status: "completed",
            remaining_amount: { gt: 0 },
        },
        _sum: {
            remaining_amount: true,
            net_amount: true,
        },
    });

    const unrestrictedAvailable = unrestrictedAgg._sum.remaining_amount ?? 0;
    const unrestrictedTotal = unrestrictedAgg._sum.net_amount ?? 0;

    // Get all active pools with available balance
    const pools = await prisma.pool.findMany({
        where: {
            status: "active",
            available_amount: { gt: 0 }
        },
        select: {
            id: true,
            name: true,
            available_amount: true,
            total_received: true,
        }
    });


    return {
        unrestricted: {
            available: unrestrictedAvailable,
            total: unrestrictedTotal,
        },
        restricted: pools.map(pool => ({
            poolId: pool.id,
            poolName: pool.name,
            available: pool.available_amount,
            total: pool.total_received
        }))
    }
}


/**
 * Validate allocation request
 */

export async function validateAllocation(
    data: CreateAllocationRequest
): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // 1. check if request exists and is in valid status
    const request = await prisma.beneficiaryRequest.findUnique({
        where: { id: data.requestId },
        include: { allocations: true }
    });

    if (!request) {
        errors.push("Request not found");
        return { valid: false, errors }
    }

    if(!["PENDING", "UNDER_REVIEW"].includes(request.status)) {
        errors.push(`Cannot allocate to request with status: ${request.status}`);
    }

    // 2. Calculate total allocation
    const totalAllocation = data.allocations.reduce((sum, a) => sum + a.amount, 0);

    // Check if total exceeds requested amount
    const existingAllocations = request.allocations.reduce((sum, a) => sum + a.amount, 0);

    if (totalAllocation + existingAllocations > request.amount) {
        errors.push(`Total allocation (${totalAllocation + existingAllocations}) exceeds requested amount (${request.amount})`);
    }


    // 3, Validate each allocation source
    const availableFunds = await getAvailableFunds();

    for (const allocation of data.allocations) {
        if (allocation.amount <= 0) {
            errors.push("Allocation amount must be greater than 0");
            continue;
        }

        if (allocation.sourceType === "UNRESTRICTED") {
            if (allocation.amount > availableFunds.unrestricted.available) {
                errors.push(`Insufficient unrestricted funds. Available; ${availableFunds.unrestricted.available}`);
            }
        } else if (allocation.sourceType === "RESTRICTED") {
            if (!allocation.poolId) {
                errors.push("Pool ID required for restricted allocation");
                continue;
            }

            const pool = availableFunds.restricted.find(p => p.poolId === allocation.poolId);
            if (!pool) {
                errors.push(`Pool not found: ${allocation.poolId}`);
            } else if (allocation.amount > pool.available) {
                errors.push(`Insufficient funds in pool "${pool.poolName}". Avaialble: ${pool.available}`);
            }

        }
    }

    // 4. Validate disbursement date
    const disbursementDate = new Date(data.disbursementDate);
    if (isNaN(disbursementDate.getTime())) {
        errors.push("Invalid disbursement date");
    } else if (disbursementDate < new Date()) {
        errors.push("Disbursement date cannot be in the past");
    }

    return { valid: errors.length === 0, errors};
}

/**
 * Link donations to allocation (FIFO - First In First Out)
 */


async function linkDonationsToAllocation(
    tx: Prisma.TransactionClient,
    allocationId: number,
    sourceType: FundSourceType,
    poolId: string | null,
    amount: number
): Promise <{ donationId: number; amountUsed: number; donorEmail: string }[]> {
    const linkedDonations: { donationId: number; amountUsed: number; donorEmail: string }[] = [];
    let remainingToAllocate = amount;

    // Find donations with remaining balance (FIFO by paid_at date)
    const whereClause: DonationWhereClause = {
        status: "completed",
        remaining_amount: { gt: 0 },
    };

    if (sourceType === "UNRESTRICTED") {
        whereClause.donation_type = "unrestricted";
    } else {
        whereClause.donation_type = "restricted";
        whereClause.pool_id = poolId;
    }


    const donations = await tx.donation.findMany({
        where: whereClause,
        orderBy: { paid_at: "asc" },
        select: {
            id: true,
            email: true,
            remaining_amount: true,
        }
    });

    for (const donation of donations) {
        if(remainingToAllocate <= 0) break;

        const amountFromThisDonation = Math.min(
            donation.remaining_amount ?? 0,
            remainingToAllocate
        );

        if (amountFromThisDonation > 0) {
            // Create donation allocation link
            await tx.donationAllocation.create({
                data: {
                    allocationId,
                    donationId: donation.id,
                    amount_used: amountFromThisDonation,
                }
            });

            await tx.donation.update({
                where: { id: donation.id },
                data: {
                    remaining_amount: { decrement: amountFromThisDonation },
                }
            })

            const fullDonation = await tx.donation.findUnique({
                where: { id: donation.id },
                select: { registered_donor_id: true }
            });

            if (fullDonation?.registered_donor_id) {
                await tx.registeredDonor.update({
                    where: { id: fullDonation.registered_donor_id },
                    data: {
                        available_funds: { decrement: amountFromThisDonation }
                    }
                })
            }

            linkedDonations.push({
                donationId: donation.id,
                amountUsed: amountFromThisDonation,
                donorEmail: donation.email!
            });

            remainingToAllocate -= amountFromThisDonation;
        }

    }

    return linkedDonations;
}


/**
 * Create allocation and link to donations
 */

export async function createAllocation(
    data: CreateAllocationRequest,
    adminId: string
) {
    return await prisma.$transaction(async (tx) => {
        const allocations = [];

        for (const item of data.allocations) {
            // 1. Create allocation record

            const allocation = await tx.allocation.create({
                data: {
                    requestId: data.requestId,
                    source_type: item.sourceType,
                    poolId: item.sourceType === "RESTRICTED" ? item.poolId : null,
                    amount: item.amount,
                    allocated_by: adminId,
                    disbursement_date: new Date(data.disbursementDate),
                    disbursement_notes: data.disbursementNotes,
                },
                include: {
                    pool: true,
                }
            });

            // 2. Link donatios (FIFO)
            const linkedDonations = await linkDonationsToAllocation(
                tx,
                allocation.id,
                item.sourceType,
                item.poolId ?? null,
                item.amount
            );

            // 3. Update fund balances for restricted pools
            if (item.sourceType === "RESTRICTED" && item.poolId) {
                await tx.pool.update({
                    where: { id: item.poolId },
                    data: {
                        allocated_amount: { increment: item.amount },
                        available_amount: { decrement: item.amount },
                    }
                });
            }

            allocations.push({
                ...allocation,
                linkedDonations
            })
        }

        // 4. Update request status to APPROVED
        const totalAllocated = data.allocations.reduce((sum, a) => sum + a.amount, 0);

        // First ensure disbursed_amount is not null 
        const currentRequest = await tx.beneficiaryRequest.findUnique({
            where: { id: data.requestId },
            select: { disbursed_amount: true }
        })

        await tx.beneficiaryRequest.update({
            where: { id: data.requestId },
            data: {
                status: "APPROVED",
                reviewed_at: new Date(),
                disbursed_amount: (currentRequest?.disbursed_amount ?? 0) + totalAllocated
            }
        });
        return allocations;
    }, {
        maxWait: 5000,
        timeout: 30000,
    });
}

/**
 * Get donors to notify for an allocaiton
 */

export async function getDonorsToNotify(allocationIds: number[]) {
    const donationAllocations = await prisma.donationAllocation.findMany({
        where: {
            allocationId: { in: allocationIds },
            donor_notified: false,
        },
        include: {
            donation: {
                include: {
                    registeredDonor: { include: { user: true }},
                    guestDonor: true,
                }
            },
            allocation: {
                include: {
                    request: true,
                }
            }
        }
    });


    return donationAllocations.map(da => ({
        donationAllocationId: da.id,
        email: da.donation.email,
        donorName: da.donation.registeredDonor?.name
            ?? da.donation.guestDonor?.email?.split("@")[0]
            ?? "Generous Donor",
        amountUsed: da.amount_used,
        totalDonated: da.donation.amount,
        requestPurpose: da.allocation.request.purpose,
        disbursementDate: da.allocation.disbursement_date,
        isAnonymous: da.donation.is_anonymous,
        userId: da.donation.registeredDonor?.userId,
    }));
}

/**
 * Mark donors as notified
 *
 */

export async function markDonorsNotified(
    donationAllocationIds: number[],
    notificationType: string = "email"
) {
    await prisma.donationAllocation.updateMany({
        where: { id: { in: donationAllocationIds }},
        data: {
            donor_notified: true,
            notified_at: new Date(),
            notification_type: notificationType,
        }
    })
}