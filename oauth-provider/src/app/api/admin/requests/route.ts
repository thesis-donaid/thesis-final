import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

// GET - List all requests (with optional filtering)
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
        let status = searchParams.get("status"); // PENDING, UNDER_REVIEW, APPROVED, etc.
        const receiptStatus = searchParams.get("receipt_status"); // PENDING, COMPLETED, MISSING
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");

        // Build where clause
        const where: Record<string, unknown> = {};
        
        // Special case: if status is "RECEIPT/PROOF", we actually want to filter by receipt_status
        if (status === "RECEIPT/PROOF") {
             where.receipt_status = { in: ["PENDING", "COMPLETED", "MISSING"] }; // Show requests with receipt tracked
             status = null; // Clear primary status filter since it's a pseudo-tab
        }

        if (status) {
            // Support comma-separated statuses
            const statuses = status.split(",").map(s => s.trim().toUpperCase());
            where.status = { in: statuses };
        }

        if (receiptStatus) {
            where.receipt_status = receiptStatus.toUpperCase();
        }

        // Get total count
        const total = await prisma.beneficiaryRequest.count({ where });

        // Get requests
        const requests = await prisma.beneficiaryRequest.findMany({
            where,
            include: {
                beneficiary: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        username: true,
                        type: true,
                        email: true,
                    }
                },
                documents: {
                    select: {
                        id: true,
                        file_name: true,
                        file_type: true,
                    }
                },
                allocations: {
                    select: {
                        id: true,
                        amount: true,
                        source_type: true,
                        pool: {
                            select: {
                                name: true,
                            }
                        }
                    }
                }
            },
            orderBy: [
                { urgency_level: "desc" }, // HIGH first
                { created_at: "asc" }, // Oldest first
            ],
            skip: (page - 1) * limit,
            take: limit,
        });

        // Calculate allocated amounts for each request
        const requestsWithAllocations = requests.map(request => {
            const allocatedAmount = request.allocations.reduce((sum, a) => sum + a.amount, 0);
            return {
                ...request,
                allocatedAmount,
                remainingToAllocate: request.amount - allocatedAmount,
            };
        });

        return NextResponse.json({
            success: true,
            data: {
                requests: requestsWithAllocations,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                }
            }
        });
    } catch (error) {
        console.error("Error fetching requests:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch requests" },
            { status: 500 }
        );
    }
}
