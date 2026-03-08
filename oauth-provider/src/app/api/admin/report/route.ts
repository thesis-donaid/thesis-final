import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const session = await getSession(req);
        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const reports = await prisma.generatedReport.findMany({
            orderBy: { created_at: "desc" }
        });

        return NextResponse.json({ reports });
    } catch (error) {
        console.error("Fetch reports error:", error);
        return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getSession(req);
        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 1. Get the most recent report to determine the date range
        const lastReport = await prisma.generatedReport.findFirst({
            orderBy: { created_at: "desc" }
        });

        const startDate = lastReport ? lastReport.end_date : new Date(0);
        const endDate = new Date();

        // 2. Count beneficiary requests since last report
        const newRequestsCount = await prisma.beneficiaryRequest.count({
            where: {
                created_at: {
                    gt: startDate,
                    lte: endDate
                }
            }
        });

        // 3. Count requests by status in this period
        const requestsByStatus = await prisma.beneficiaryRequest.groupBy({
            by: ["status"],
            _count: { id: true },
            where: {
                created_at: {
                    gt: startDate,
                    lte: endDate
                }
            }
        });

        const statusBreakdown: Record<string, number> = {};
        for (const entry of requestsByStatus) {
            statusBreakdown[entry.status] = entry._count.id;
        }

        // 4. Count donations and total donated in this period
        const donationAgg = await prisma.donation.aggregate({
            _count: { id: true },
            _sum: { amount: true },
            where: {
                status: "completed",
                paid_at: {
                    gt: startDate,
                    lte: endDate
                }
            }
        });

        // 5. Sum disbursed amounts in this period
        const disbursedAgg = await prisma.beneficiaryRequest.aggregate({
            _count: { id: true },
            _sum: { disbursed_amount: true },
            where: {
                status: "DISBURSED",
                disbursed_at: {
                    gt: startDate,
                    lte: endDate
                }
            }
        });

        // 6. Fetch current pools
        const pools = await prisma.pool.findMany();

        // 7. Get previous pool stats from last report
        const previousPoolStats: Record<string, { current_amount: number; allocated_amount: number }> = {};
        if (lastReport && lastReport.pool_statistics) {
            const prevStats = lastReport.pool_statistics as Array<{ pool_id: string; current_amount: number; allocated_amount: number }>;
            for (const ps of prevStats) {
                previousPoolStats[ps.pool_id] = {
                    current_amount: ps.current_amount ?? 0,
                    allocated_amount: ps.allocated_amount ?? 0
                };
            }
        }

        // 8. Build pool statistics
        const poolStatistics = pools.map((pool) => {
            const prev = previousPoolStats[pool.id];
            const previousAmount = prev ? prev.current_amount : 0;
            const currentAmount = pool.total_received;
            const allocatedAmount = pool.allocated_amount;
            const totalRemaining = pool.available_amount;
            const difference = currentAmount - previousAmount;

            return {
                pool_id: pool.id,
                pool_name: pool.name,
                previous_amount: previousAmount,
                current_amount: currentAmount,
                allocated_amount: allocatedAmount,
                total_remaining: totalRemaining,
                difference
            };
        });

        // 9. Build summary
        const summary = {
            donations_count: donationAgg._count.id ?? 0,
            donations_amount: donationAgg._sum.amount ?? 0,
            disbursed_count: disbursedAgg._count.id ?? 0,
            disbursed_amount: disbursedAgg._sum.disbursed_amount ?? 0,
            requests_by_status: statusBreakdown,
        };

        // 10. Create report
        const newReport = await prisma.generatedReport.create({
            data: {
                start_date: startDate,
                end_date: endDate,
                total_beneficiary_requests: newRequestsCount,
                pool_statistics: poolStatistics,
                summary,
                generated_by: session.user.id
            }
        });

        return NextResponse.json({ message: "Report generated successfully", report: newReport });

    } catch (error) {
        console.error("Generate report error:", error);
        return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
    }
}