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
                donationAllocations: {
                    include: {
                        allocation: {
                            include: {
                                request: {
                                    select: {
                                        id: true,
                                        purpose: true,
                                        status: true,
                                        amount: true,
                                        receipt_message: true,
                                        receipt_submitted_at: true,
                                        disbursed_at: true,
                                        created_at: true,
                                        beneficiary: {
                                            select: {
                                                firstName: true,
                                                lastName: true,
                                            }
                                        },
                                        receipts: {
                                            select: {
                                                id: true,
                                                file_name: true,
                                                file_url: true,
                                                file_type: true,
                                                uploaded_at: true,
                                            },
                                            orderBy: { uploaded_at: "desc" },
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: { created_at: "desc" },
        });

        const completedDonations = donations.filter(d => d.status === "completed");
        const pendingDonations   = donations.filter(d => d.status === "pending" || d.status === "processing");

        // Calculate allocation stats
        const totalAllocated = completedDonations.reduce((sum, d) => {
            const allocated = d.donationAllocations.reduce((s, da) => s + da.amount_used, 0);
            return sum + allocated;
        }, 0);
        const totalDonated = completedDonations.reduce((s, d) => s + d.amount, 0);
        const totalAvailable = totalDonated - totalAllocated;

        // Build impact/allocation tracking data for donor
        const seenRequestIds = new Set<number>();
        const impactItems: {
            requestId: number;
            purpose: string;
            status: string;
            requestAmount: number;
            amountFromDonor: number;
            beneficiaryName: string;
            receiptMessage: string | null;
            receiptSubmittedAt: string | null;
            disbursedAt: string | null;
            createdAt: string;
            receipts: { id: number; fileName: string; fileUrl: string; fileType: string; uploadedAt: string }[];
        }[] = [];

        for (const donation of completedDonations) {
            for (const da of donation.donationAllocations) {
                const req = da.allocation.request;
                if (!req || seenRequestIds.has(req.id)) continue;
                seenRequestIds.add(req.id);

                const bName = req.beneficiary
                    ? `${req.beneficiary.firstName ?? ""} ${req.beneficiary.lastName ?? ""}`.trim() || "Beneficiary"
                    : "Beneficiary";

                // Sum total amount from this donor across all donation allocations for this request
                const amountFromDonor = completedDonations.reduce((sum, d) => {
                    return sum + d.donationAllocations
                        .filter(a => a.allocation.request?.id === req.id)
                        .reduce((s, a) => s + a.amount_used, 0);
                }, 0);

                impactItems.push({
                    requestId: req.id,
                    purpose: req.purpose,
                    status: req.status,
                    requestAmount: req.amount,
                    amountFromDonor,
                    beneficiaryName: bName,
                    receiptMessage: req.receipt_message,
                    receiptSubmittedAt: req.receipt_submitted_at?.toISOString() ?? null,
                    disbursedAt: req.disbursed_at?.toISOString() ?? null,
                    createdAt: req.created_at.toISOString(),
                    receipts: req.receipts.map(r => ({
                        id: r.id,
                        fileName: r.file_name,
                        fileUrl: r.file_url,
                        fileType: r.file_type,
                        uploadedAt: r.uploaded_at.toISOString(),
                    })),
                });
            }
        }

        const stats = {
            totalDonated,
            donationCount:   donations.length,
            completedCount:  completedDonations.length,
            pendingCount:    pendingDonations.length,
            totalAllocated,
            totalAvailable: Math.max(0, totalAvailable),
        };

        return NextResponse.json({ success: true, data: { donations, stats, impactItems } });
    } catch (error) {
        console.error("Donor donations fetch error:", error);
        return NextResponse.json({ error: "Failed to fetch donations" }, { status: 500 });
    }
}
