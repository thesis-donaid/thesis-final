import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/admin/pool-donors?poolId=xxx&source=RESTRICTED|UNRESTRICTED
 * Returns donors who donated to a specific pool (or unrestricted fund)
 * with remaining amounts available for allocation.
 */
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== "admin") {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(req.url);
        const source = searchParams.get("source"); // RESTRICTED or UNRESTRICTED
        const poolId = searchParams.get("poolId");

        if (!source) {
            return NextResponse.json(
                { success: false, error: "source parameter required" },
                { status: 400 }
            );
        }

        // Build where clause
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where: any = {
            status: "completed",
            remaining_amount: { gt: 0 },
        };

        if (source === "UNRESTRICTED") {
            where.donation_type = "unrestricted";
        } else if (source === "RESTRICTED") {
            if (!poolId) {
                return NextResponse.json(
                    { success: false, error: "poolId required for restricted source" },
                    { status: 400 }
                );
            }
            where.donation_type = "restricted";
            where.pool_id = poolId;
        } else {
            return NextResponse.json(
                { success: false, error: "Invalid source type" },
                { status: 400 }
            );
        }

        const donations = await prisma.donation.findMany({
            where,
            orderBy: { paid_at: "asc" },
            select: {
                id: true,
                email: true,
                amount: true,
                remaining_amount: true,
                is_anonymous: true,
                paid_at: true,
                registeredDonor: {
                    select: {
                        name: true,
                        user: { select: { name: true } },
                    },
                },
                guestDonor: {
                    select: { email: true },
                },
            },
        });

        const donors = donations.map((d) => {
            const donorName = d.is_anonymous
                ? "Anonymous"
                : d.registeredDonor?.name
                    ?? d.registeredDonor?.user?.name
                    ?? d.email?.split("@")[0];

            return {
                donationId: d.id,
                donorName,
                email: d.is_anonymous ? "hidden" : d.email,
                totalDonated: d.amount,
                remainingAmount: d.remaining_amount ?? 0,
                paidAt: d.paid_at,
                isAnonymous: d.is_anonymous,
            };
        });

        return NextResponse.json({
            success: true,
            data: donors,
        });
    } catch (error) {
        console.error("Error fetching pool donors:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch pool donors" },
            { status: 500 }
        );
    }
}
