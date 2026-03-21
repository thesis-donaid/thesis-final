import { getAvailableFunds } from "@/lib/allocation";
import { authOptions } from "@/lib/auth";
import { sendDisbursementNotificationEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";
import { recordProofOnChain, hasProofOnChain } from "@/blockchain/service";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

// Allow this route up to 60 seconds for blockchain transactions
// Vercel Hobby = 10s (default), Pro = 60s max
export const maxDuration = 60;

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if(!session?.user || session.user.role !== "admin") {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 },
            );
        }

        const { id } = await params;
        const requestId = parseInt(id);

        const request = await prisma.beneficiaryRequest.findUnique({
            where: { id: requestId },
            include: {
                beneficiary: {
                    include: { user: true }
                },
                documents: true,
                receipts: {
                    orderBy: { uploaded_at: 'desc' },
                },
                allocations: {
                    include: {
                        pool: true,
                        donationAllocations: {
                            include: {
                                donation: true,
                            }
                        }
                    }
                }
            }
        });

        if (!request) {
            return NextResponse.json(
                { success: false, error: "Request not found!" },
                { status: 404 }
            )
        }

        // Get  available funds for allocation dropdown
        const availableFunds = await getAvailableFunds();

        // Calculate already allocated amount
        const allocatedAmount = request.allocations.reduce(
            (sum, a) => sum + a.amount,
            0
        )
        const remainingToAllocate = request.amount - allocatedAmount;

        return NextResponse.json({
            success: true,
            data: {
                request: {
                    ...request,
                    allocatedAmount,
                    remainingToAllocate,
                },
                availableFunds,
            }
        })
    } catch(error) {
        console.error("Error fetching request:", error);
        return NextResponse.json(
        { success: false, error: "Failed to fetch request" },
        { status: 500 }
        );
    }
}


// PATCH - Update request status (approve, reject, mark under review)
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user || session.user.role !== "admin") {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { id } = await params;
        const requestId = parseInt(id);
        const body = await req.json();
        const { status, rejection_reason, disbursement_method } = body;

        // Validate status
        const validStatuses = ["UNDER_REVIEW", "APPROVED", "REJECTED", "DISBURSED"];
        if (!status || !validStatuses.includes(status)) {
            return NextResponse.json(
                { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
                { status: 400 }
            );
        }

        // Check request exists
        const existing = await prisma.beneficiaryRequest.findUnique({
            where: { id: requestId },
        });

        if (!existing) {
            return NextResponse.json(
                { success: false, error: "Request not found" },
                { status: 404 }
            );
        }

        // Rejection requires a reason
        if (status === "REJECTED" && !rejection_reason) {
            return NextResponse.json(
                { success: false, error: "Rejection reason is required" },
                { status: 400 }
            );
        }

        // Build update data
        const updateData: Record<string, unknown> = {
            status,
            reviewed_by: session.user.id,
            reviewed_at: new Date(),
        };

        if (status === "REJECTED") {
            updateData.rejection_reason = rejection_reason;
        }

        if (status === "DISBURSED") {
            // Disbursement requires a method
            const validMethods = ["cash", "check", "bank_transfer"];
            if (!disbursement_method || !validMethods.includes(disbursement_method)) {
                return NextResponse.json(
                    { success: false, error: `Disbursement method is required. Must be one of: ${validMethods.join(", ")}` },
                    { status: 400 }
                );
            }

            updateData.disbursed_at = new Date();

            // Calculate total disbursed from allocations
            const allocations = await prisma.allocation.findMany({
                where: { requestId: requestId },
            });

            const totalDisbursed = allocations.reduce((sum, a) => sum + a.amount, 0);
            updateData.disbursed_amount = totalDisbursed


            // Also mark all related allocations as disbursed
            await prisma.allocation.updateMany({
                where: {
                    requestId: requestId,
                    is_disbursed: false,
                },
                data: {
                    is_disbursed: true,
                    disbursed_at: new Date(),
                },
            });
        }

        const updated = await prisma.beneficiaryRequest.update({
            where: { id: requestId },
            data: updateData,
            include: {
                beneficiary: {
                    include: { user: true },
                },
                allocations: {
                    include: {
                        donationAllocations: {
                            include: {
                                donation: {
                                    include: {
                                        registeredDonor: { include: { user: true } }
                                    }
                                },
                            },
                        },
                    },
                },
            },
        });

        // Real-time & Persistent notification for beneficiary
        try {
            const notificationData = {
                title: `Request ${status.charAt(0) + status.slice(1).toLowerCase().replace('_', ' ')}`,
                message: `Your request for ${updated.purpose} has been marked as ${status.toLowerCase().replace('_', ' ')}.`,
                type: status === 'REJECTED' ? 'urgent' : 'system',
                link: `/beneficiary/requests`
            };

            // 1. Save to database
            await prisma.userNotification.create({
                data: {
                    userId: updated.beneficiary.userId,
                    ...notificationData
                }
            });

            // 2. Trigger Pusher
            await pusherServer.trigger(
                `user-${updated.beneficiary.userId}`,
                "notification",
                notificationData
            );
        } catch (pusherError) {
            console.error("Persistent notification failed:", pusherError);
        }

        // Send disbursement notifications
        if (status === "DISBURSED") {
            const totalDisbursed = updated.allocations.reduce((sum, a) => sum + a.amount, 0);
            const beneficiaryEmail = updated.email
                ?? updated.beneficiary.email
                ?? updated.beneficiary.user?.email;
            const beneficiaryName = `${updated.beneficiary.firstName ?? ""} ${updated.beneficiary.lastName ?? ""}`.trim()
                || updated.beneficiary.user?.name
                || "Beneficiary";

            // Notify beneficiary
            if (beneficiaryEmail) {
                try {
                    await sendDisbursementNotificationEmail({
                        to: beneficiaryEmail,
                        recipientName: beneficiaryName,
                        amount: totalDisbursed,
                        purpose: updated.purpose,
                        disbursementMethod: disbursement_method,
                        isBeneficiary: true,
                    });
                } catch (emailError) {
                    console.error("Failed to send disbursement email to beneficiary:", emailError);
                }
            }

            // Notify donors whose donations were linked
            const notifiedEmails = new Set<string>();
            for (const allocation of updated.allocations) {
                for (const da of allocation.donationAllocations) {
                    const donorEmail = da.donation.email;
                    if (donorEmail && !notifiedEmails.has(donorEmail)) {
                        notifiedEmails.add(donorEmail);
                        try {
                            await sendDisbursementNotificationEmail({
                                to: donorEmail,
                                recipientName: "Valued Donor",
                                amount: da.amount_used,
                                purpose: updated.purpose,
                                disbursementMethod: disbursement_method,
                                isBeneficiary: false,
                                beneficiaryName,
                            });
                        } catch (emailError) {
                            console.error(`Failed to send disbursement email to donor ${donorEmail}:`, emailError);
                        }

                        // Notify donor via Pusher
                        if (da.donation.registeredDonor?.userId) {
                            try {
                                const notificationData = {
                                    title: "Funds Disbursed",
                                    message: `₱${da.amount_used.toLocaleString()} of your donation was successfully disbursed for ${updated.purpose}.`,
                                    type: "disbursement",
                                    link: "/donor/impacts"
                                };
                                await prisma.userNotification.create({
                                    data: {
                                        userId: da.donation.registeredDonor.userId,
                                        ...notificationData
                                    }
                                });
                                await pusherServer.trigger(
                                    `user-${da.donation.registeredDonor.userId}`,
                                    "notification",
                                    notificationData
                                );
                            } catch(e) {
                                console.error("Failed pusher send", e);
                            }
                        }
                    }
                }
            }

            // Fallback: if no donationAllocations exist, query donations in the pool directly
            if (notifiedEmails.size === 0) {
                const poolIds = updated.allocations
                    .filter(a => a.poolId)
                    .map(a => a.poolId as string);

                if (poolIds.length > 0) {
                    const donations = await prisma.donation.findMany({
                        where: {
                            pool_id: { in: poolIds },
                            status: "completed",
                            is_anonymous: false,
                        },
                        include: {
                            registeredDonor: { include: { user: true } },
                        },
                        distinct: ["email"],
                    });

                    for (const donation of donations) {
                        if (donation.email && !notifiedEmails.has(donation.email)) {
                            notifiedEmails.add(donation.email);
                            const donorName = donation.registeredDonor?.name
                                ?? donation.registeredDonor?.user?.name
                                ?? "Valued Donor";
                            try {
                                await sendDisbursementNotificationEmail({
                                    to: donation.email,
                                    recipientName: donorName,
                                    amount: totalDisbursed,
                                    purpose: updated.purpose,
                                    disbursementMethod: disbursement_method,
                                    isBeneficiary: false,
                                    beneficiaryName,
                                });
                            } catch (emailError) {
                                console.error(`Failed to send disbursement email to donor ${donation.email}:`, emailError);
                            }

                            if (donation.registeredDonor?.userId) {
                                try {
                                    const notificationData = {
                                        title: "Funds Disbursed",
                                        message: `Your pool donation was successfully disbursed for ${updated.purpose}.`,
                                        type: "disbursement",
                                        link: "/donor/impacts"
                                    };
                                    await prisma.userNotification.create({
                                        data: {
                                            userId: donation.registeredDonor.userId,
                                            ...notificationData
                                        }
                                    });
                                    await pusherServer.trigger(
                                        `user-${donation.registeredDonor.userId}`,
                                        "notification",
                                        notificationData
                                    );
                                } catch(e) {
                                    console.error("Failed pusher send", e);
                                }
                            }
                        }
                    }
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: `Request ${status.toLowerCase()} successfully`,
            data: updated,
        });
    } catch (error) {
        console.error("Error updating request:", error);
        return NextResponse.json(
            { success: false, error: "Failed to update request" },
            { status: 500 }
        );
    }
}


// PUT - Update receipt status (admin review of beneficiary's proof/receipt)
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== "admin") {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { id } = await params;
        const requestId = parseInt(id);
        const body = await req.json();
        const { receipt_status } = body;

        const validStatuses = ["PENDING", "COMPLETED", "MISSING"];
        if (!receipt_status || !validStatuses.includes(receipt_status)) {
            return NextResponse.json(
                { success: false, error: `Invalid receipt status. Must be one of: ${validStatuses.join(", ")}` },
                { status: 400 }
            );
        }

        const existing = await prisma.beneficiaryRequest.findUnique({
            where: { id: requestId },
        });

        if (!existing) {
            return NextResponse.json(
                { success: false, error: "Request not found" },
                { status: 404 }
            );
        }

        if (existing.status !== "DISBURSED") {
            return NextResponse.json(
                { success: false, error: "Receipt status can only be set for disbursed requests" },
                { status: 400 }
            );
        }

        const updated = await prisma.beneficiaryRequest.update({
            where: { id: requestId },
            data: { receipt_status },
        });

        // When receipt is marked COMPLETED, record proof on blockchain
        if (receipt_status === "COMPLETED") {
            const fullRequest = await prisma.beneficiaryRequest.findUnique({
                where: { id: requestId },
                include: {
                    beneficiary: true,
                    receipts: { orderBy: { uploaded_at: "desc" } },
                    allocations: {
                        include: {
                            donationAllocations: {
                                include: { donation: true },
                            },
                            blockchainLedgers: true,
                        },
                    },
                },
            });

            if (fullRequest) {
                // Get proof document URLs
                const proofUrl = fullRequest.receipts[0]?.file_url || "";
                const disbursementReceiptUrl = fullRequest.receipts.length > 1
                    ? fullRequest.receipts[1]?.file_url || ""
                    : "";

                // Record one blockchain proof per allocation
                for (const allocation of fullRequest.allocations) {
                    // 1. Check if already has a record in our database
                    if (allocation.blockchainLedgers && allocation.blockchainLedgers.length > 0) {
                        console.log(`[Blockchain] Proof already recorded in DB for allocation ${allocation.id}. Skipping.`);
                        continue;
                    }

                    // 2. Secondary check on the blockchain directly (safety in case of DB sync issues)
                    const onChainExists = await hasProofOnChain(String(allocation.id));
                    if (onChainExists) {
                        console.log(`[Blockchain] Proof already recorded on-chain for allocation ${allocation.id}. Skipping DB-only update.`);
                        continue;
                    }

                    // Collect all donation IDs and donor IDs for this allocation
                    const donationIds: string[] = [];
                    const registeredDonorIds: number[] = [];
                    const guestDonorIds: number[] = [];

                    for (const da of allocation.donationAllocations) {
                        donationIds.push(da.donation.reference_code);
                        if (da.donation.registered_donor_id) {
                            registeredDonorIds.push(da.donation.registered_donor_id);
                        }
                        if (da.donation.guest_donor_id) {
                            guestDonorIds.push(da.donation.guest_donor_id);
                        }
                    }

                    if (donationIds.length === 0) continue;

                    const result = await recordProofOnChain({
                        donationIds,
                        allocationId: String(allocation.id),
                        beneficiaryId: String(fullRequest.beneficiaryId),
                        registeredDonorIds,
                        guestDonorIds,
                        amount: allocation.amount,
                        purpose: fullRequest.purpose,
                        disbursementReceiptUrl,
                        proofUrl,
                        proofHash: proofUrl, // Using URL as hash for now
                        proofType: "receipt",
                    });

                    if (result.success) {
                        // Update all DonationAllocations linked to this allocation
                        for (const da of allocation.donationAllocations) {
                            await prisma.donationAllocation.update({
                                where: { id: da.id },
                                data: {
                                    blockchain_tx_hash: result.transactionHash,
                                    blockchain_network: process.env.BLOCKCHAIN_NETWORK || "sepolia",
                                    blockchain_status: "confirmed",
                                    blockchain_saved_at: new Date(),
                                },
                            });
                        }

                        // Create audit log entry in BlockchainLedger
                        await prisma.blockchainLedger.create({
                            data: {
                                allocation_id: allocation.id,
                                request_id: requestId,
                                tx_hash: result.transactionHash,
                                block_number: result.blockNumber,
                                network: process.env.BLOCKCHAIN_NETWORK || "sepolia",
                                explorer_url: result.explorerUrl,
                                gas_used: result.gasUsed,
                                status: "confirmed",
                                purpose: fullRequest.purpose,
                                proof_url: proofUrl,
                                proof_hash: proofUrl, // Using URL as hash for now matching recordProofOnChain
                                proof_type: "receipt",
                            },
                        });
                    } else {
                        console.error(
                            `[Blockchain] Failed to record proof for allocation ${allocation.id}:`,
                            result.error
                        );
                    }
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: `Receipt status updated to ${receipt_status.toLowerCase()}`,
            data: updated,
        });
    } catch (error) {
        console.error("Error updating receipt status:", error);
        return NextResponse.json(
            { success: false, error: "Failed to update receipt status" },
            { status: 500 }
        );
    }
}