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
                where: { is_disbursed: false },
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

        // --- NEW: Charting Data ---
        
        // 1. Donation Trends (Last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const rawTrends = await prisma.donation.groupBy({
            by: ['paid_at'],
            where: {
                status: 'completed',
                paid_at: { gte: thirtyDaysAgo }
            },
            _sum: { amount: true },
            orderBy: { paid_at: 'asc' }
        });

        // Format trends for LineChart (filling in empty dates if needed, but simple for now)
        const donationTrends = rawTrends.map(t => ({
            date: t.paid_at ? t.paid_at.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Unknown',
            amount: t._sum.amount || 0
        }));

        // 2. Request Status Distribution
        const rawStatusDist = await prisma.beneficiaryRequest.groupBy({
            by: ['status'],
            _count: { _all: true }
        });
        
        const requestDistribution = rawStatusDist.map(s => ({
            name: s.status.replace('_', ' '),
            value: s._count._all
        }));

        // 3. Pool Analytics (All active pools)
        const activePools = await prisma.pool.findMany({
            where: { status: 'active' },
            select: {
              name: true,
              total_received: true,
              allocated_amount: true,
              available_amount: true
            }
        });

        const poolAnalytics = activePools.map(p => ({
            name: p.name,
            allocated: p.allocated_amount,
            available: p.available_amount,
            total: p.total_received
        }));

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
            recentRequests,
            charts: {
                donationTrends,
                requestDistribution,
                poolAnalytics
            }
        });
    } catch (error) {
        console.error("Admin stats error:", error);
        return NextResponse.json(
            { error: "Failed to fetch admin stats" },
            { status: 500 }
        );
    }
}
