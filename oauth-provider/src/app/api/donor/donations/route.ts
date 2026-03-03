import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Find the RegisteredDonor record for this user
        const registeredDonor = await prisma.registeredDonor.findUnique({
            where: { userId: session.user.id },
        });

        if (!registeredDonor) {
            // Return empty data — donor record may not exist yet
            return NextResponse.json({
                success: true,
                data: {
                    donations: [],
                    stats: {
                        totalDonated: 0,
                        donationCount: 0,
                        completedCount: 0,
                        pendingCount: 0,
                    },
                },
            });
        }

        const donations = await prisma.donation.findMany({
            where: { registered_donor_id: registeredDonor.id },
            include: {
                pool: { select: { id: true, name: true } },
            },
            orderBy: { created_at: "desc" },
        });

        const completedDonations = donations.filter(d => d.status === "completed");
        const pendingDonations   = donations.filter(d => d.status === "pending" || d.status === "processing");

        const stats = {
            totalDonated:    completedDonations.reduce((s, d) => s + d.amount, 0),
            donationCount:   donations.length,
            completedCount:  completedDonations.length,
            pendingCount:    pendingDonations.length,
        };

        return NextResponse.json({ success: true, data: { donations, stats } });
    } catch (error) {
        console.error("Donor donations fetch error:", error);
        return NextResponse.json({ error: "Failed to fetch donations" }, { status: 500 });
    }
}
