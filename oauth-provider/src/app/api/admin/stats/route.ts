import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function GET(req: NextRequest) {
    try {
        const session = await getSession(req);

        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Parallel execution of count/sum queries
        const [
            totalDonationsAmount,
            totalNetDonationsAmount,
            totalDisbursedAmount,
            totalAllocatedFundsAmount,
            totalAllocatedAmount,
            totalAvailableAmount,
            beneficiaryCount,
            pendingRequestCount,
            totalRequestCount,
            activePoolCount,
            registeredDonorCount,
            guestDonorCount,
            recentDonations,
            recentRequests
        ] = await Promise.all([
            prisma.donation.aggregate({
                where: { status: "completed" },
                _sum: { amount: true }
            }),
            prisma.donation.aggregate({
                where: { status: "completed" },
                _sum: { net_amount: true }
            }),
            prisma.allocation.aggregate({
                where: { is_disbursed: true },
                _sum: { amount: true }
            }),
            prisma.allocation.aggregate({
                _sum: { amount: true }
            }),
            prisma.pool.aggregate({
                where: { status: "active" },
                _sum: { allocated_amount: true }
            }),
            prisma.pool.aggregate({
                where: { status: "active" },
                _sum: { available_amount: true }
            }),
            prisma.beneficiary.count({
                where: { isActive: true }
            }),
            prisma.beneficiaryRequest.count({
                where: { status: "PENDING" }
            }),
            prisma.beneficiaryRequest.count(), // All requests
            prisma.pool.count({
                where: { status: "active" }
            }),
            prisma.registeredDonor.count(),
            prisma.guestDonor.count(),
            prisma.donation.findMany({
                where: { status: "completed" },
                orderBy: { paid_at: "desc" },
                take: 5,
                include: {
                    guestDonor: true,
                    registeredDonor: true
                }
            }),
            prisma.beneficiaryRequest.findMany({
                orderBy: { created_at: "desc" },
                take: 5,
                include: {
                    beneficiary: {
                        select: {
                            firstName: true,
                            lastName: true,
                            username: true
                        }
                    }
                }
            })
        ]);

        const totalDonations = totalDonationsAmount._sum.amount || 0;
        const totalNetDonations = totalNetDonationsAmount._sum.net_amount || 0;
        const totalAllocatedFunds = totalAllocatedFundsAmount._sum.amount || 0;
        const totalAllocated = totalAllocatedAmount._sum.allocated_amount || 0;
        const availableFunds = totalAvailableAmount._sum.available_amount || 0;

        return NextResponse.json({
            stats: {
                totalDonations,
                totalNetDonations,
                totalDisbursed: totalDisbursedAmount._sum.amount || 0,
                totalAllocatedFunds,
                totalAllocated,
                availableFunds,
                totalBeneficiaries: beneficiaryCount,
                pendingRequests: pendingRequestCount,
                totalRequests: totalRequestCount,
                activePools: activePoolCount,
                totalRegisteredDonors: registeredDonorCount,
                totalGuestDonors: guestDonorCount
            },
            recentDonations,
            recentRequests
        });
    } catch (error) {
        console.error("Admin stats error:", error);
        return NextResponse.json(
            { error: "Failed to fetch admin stats" },
            { status: 500 }
        );
    }
}
