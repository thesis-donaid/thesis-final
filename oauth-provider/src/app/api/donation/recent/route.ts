import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const donations = await prisma.donation.findMany({
            where: {
                status: "completed" // Only show successful donations
            },
            take: 10,
            orderBy: {
                paid_at: "desc"
            },
            include: {
                guestDonor: true,
                registeredDonor: {
                    include: {
                        user: true
                    }
                }
            }
        });

        const formattedDonations = donations.map(d => {
            let donorName = "Anonymous Donor";
            
            if (!d.is_anonymous) {
                if (d.registeredDonor?.user?.name) {
                    donorName = d.registeredDonor.user.name;
                } else if (d.guestDonor?.email) {
                    // For guest donors, mask the email or use a placeholder if name isn't available
                    const [localPart] = d.guestDonor.email.split("@");
                    donorName = localPart.charAt(0).toUpperCase() + localPart.slice(1);
                }
            }

            return {
                id: d.id,
                donorName,
                amount: d.amount,
                currency: d.currency,
                message: d.message,
                paidAt: d.paid_at,
                isAnonymous: d.is_anonymous
            };
        });

        return NextResponse.json(formattedDonations);
    } catch (error) {
        console.error("Failed to fetch recent donations:", error);
        return NextResponse.json(
            { error: "Failed to fetch recent donations" },
            { status: 500 }
        );
    }
}
