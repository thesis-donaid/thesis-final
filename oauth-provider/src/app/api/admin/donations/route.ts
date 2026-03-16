import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

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
        const status = searchParams.get("status");
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");

        // Build where clause
        const where: Record<string, unknown> = {};
        
        if (status && status.toLowerCase() !== "all") {
             where.status = status.toLowerCase();
        }

        // Get total count
        const total = await prisma.donation.count({ where });

        // Get donations
        const donations = await prisma.donation.findMany({
            where,
            include: {
                guestDonor: {
                    select: {
                        email: true
                    }
                },
                registeredDonor: {
                    select: {
                        name: true,
                        user: {
                            select: {
                                name: true
                            }
                        }
                    }
                },
                pool: {
                    select: {
                        name: true
                    }
                }
            },
            orderBy: {
                created_at: "desc"
            },
            skip: (page - 1) * limit,
            take: limit,
        });

        return NextResponse.json({
            success: true,
            data: {
                donations,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                }
            }
        });
    } catch (error) {
        console.error("Error fetching admin donations:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch donations" },
            { status: 500 }
        );
    }
}
