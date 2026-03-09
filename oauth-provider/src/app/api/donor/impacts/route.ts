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

        const registeredDonor = await prisma.registeredDonor.findUnique({
            where: { userId: session.user.id },
        });

        if (!registeredDonor) {
            return NextResponse.json({
                success: true,
                data: { impactItems: [] },
            });
        }

        const donations = await prisma.donation.findMany({
            where: {
                registered_donor_id: registeredDonor.id,
                status: "completed",
            },
            include: {
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
                                        date_needed: true,
                                        email: true,
                                        additional_notes: true,
                                        urgency_level: true,
                                        reviewed_at: true,
                                        rejection_reason: true,
                                        disbursed_at: true,
                                        disbursed_amount: true,
                                        receipt_message: true,
                                        receipt_submitted_at: true,
                                        receipt_status: true,
                                        created_at: true,
                                        updated_at: true,
                                        beneficiary: {
                                            select: {
                                                firstName: true,
                                                lastName: true,
                                                type: true,
                                            },
                                        },
                                        documents: {
                                            select: {
                                                id: true,
                                                file_name: true,
                                                file_url: true,
                                                file_type: true,
                                                uploaded_at: true,
                                            },
                                            orderBy: { uploaded_at: "desc" },
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
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: { created_at: "desc" },
        });

        const seenRequestIds = new Set<number>();
        const impactItems = [];

        for (const donation of donations) {
            for (const da of donation.donationAllocations) {
                const req = da.allocation.request;
                if (!req || seenRequestIds.has(req.id)) continue;
                seenRequestIds.add(req.id);

                const bName = req.beneficiary
                    ? `${req.beneficiary.firstName ?? ""} ${req.beneficiary.lastName ?? ""}`.trim() || "Beneficiary"
                    : "Beneficiary";

                const amountFromDonor = donations.reduce((sum, d) => {
                    return (
                        sum +
                        d.donationAllocations
                            .filter((a) => a.allocation.request?.id === req.id)
                            .reduce((s, a) => s + a.amount_used, 0)
                    );
                }, 0);

                // Collect blockchain data from donations linked to this request
                const blockchainProofs: {
                    allocationId: number;
                    txHash: string;
                    network: string;
                    status: string;
                    savedAt: string;
                    donationReferenceCode: string;
                }[] = [];

                for (const d of donations) {
                    for (const a of d.donationAllocations) {
                        if (
                            a.allocation.request?.id === req.id &&
                            d.blockchain_txt_hash
                        ) {
                            // Avoid duplicate entries for the same allocation
                            if (!blockchainProofs.some((p) => p.allocationId === a.allocation.id)) {
                                blockchainProofs.push({
                                    allocationId: a.allocation.id,
                                    txHash: d.blockchain_txt_hash,
                                    network: d.blockchain_network ?? "",
                                    status: d.blockchain_status ?? "",
                                    savedAt: d.blockchain_saved_at?.toISOString() ?? "",
                                    donationReferenceCode: d.reference_code,
                                });
                            }
                        }
                    }
                }

                impactItems.push({
                    requestId: req.id,
                    purpose: req.purpose,
                    status: req.status,
                    requestAmount: req.amount,
                    amountFromDonor,
                    beneficiaryName: bName,
                    beneficiaryType: req.beneficiary?.type ?? null,
                    dateNeeded: req.date_needed.toISOString(),
                    additionalNotes: req.additional_notes,
                    urgencyLevel: req.urgency_level,
                    reviewedAt: req.reviewed_at?.toISOString() ?? null,
                    rejectionReason: req.rejection_reason,
                    disbursedAt: req.disbursed_at?.toISOString() ?? null,
                    disbursedAmount: req.disbursed_amount,
                    receiptMessage: req.receipt_message,
                    receiptSubmittedAt: req.receipt_submitted_at?.toISOString() ?? null,
                    receiptStatus: req.receipt_status,
                    createdAt: req.created_at.toISOString(),
                    updatedAt: req.updated_at.toISOString(),
                    documents: req.documents.map((d) => ({
                        id: d.id,
                        fileName: d.file_name,
                        fileUrl: d.file_url,
                        fileType: d.file_type,
                        uploadedAt: d.uploaded_at.toISOString(),
                    })),
                    receipts: req.receipts.map((r) => ({
                        id: r.id,
                        fileName: r.file_name,
                        fileUrl: r.file_url,
                        fileType: r.file_type,
                        uploadedAt: r.uploaded_at.toISOString(),
                    })),
                    blockchainProofs,
                });
            }
        }

        return NextResponse.json({ success: true, data: { impactItems } });
    } catch (error) {
        console.error("Donor impacts fetch error:", error);
        return NextResponse.json({ error: "Failed to fetch impacts" }, { status: 500 });
    }
}
