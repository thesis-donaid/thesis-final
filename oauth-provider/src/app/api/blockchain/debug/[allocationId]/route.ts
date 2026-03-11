/**
 * GET /api/blockchain/debug/[allocationId]
 * 
 * DEBUG ENDPOINT - Check if an allocation has a blockchain proof recorded
 * Shows what's on-chain vs what's in the database
 * 
 * Remove this endpoint in production!
 */

import { getProofFromChain } from "@/blockchain/service";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ allocationId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== "admin") {
            return NextResponse.json(
                { success: false, error: "Unauthorized - admin only" },
                { status: 401 }
            );
        }

        const { allocationId } = await params;

        // Check blockchain
        console.log(`[DEBUG] Checking blockchain proof for allocation ${allocationId}`);
        const onChainProof = await getProofFromChain(allocationId);

        // Check database
        const allocationRecord = await prisma.allocation.findUnique({
            where: { id: parseInt(allocationId) },
            include: {
                request: true,
                donationAllocations: {
                    include: {
                        donation: {
                            select: {
                                id: true,
                                reference_code: true,
                                blockchain_txt_hash: true,
                                blockchain_status: true,
                                blockchain_saved_at: true,
                            }
                        }
                    }
                }
            }
        });

        return NextResponse.json({
            success: true,
            allocationId,
            blockchain: {
                hasProof: !!onChainProof,
                proof: onChainProof || null,
            },
            database: {
                allocation: allocationRecord ? {
                    id: allocationRecord.id,
                    amount: allocationRecord.amount,
                    is_disbursed: allocationRecord.is_disbursed,
                    disbursed_at: allocationRecord.disbursed_at,
                    requestId: allocationRecord.requestId,
                    request: {
                        id: allocationRecord.request.id,
                        status: allocationRecord.request.status,
                        receipt_status: allocationRecord.request.receipt_status,
                    }
                } : null,
                donations: allocationRecord?.donationAllocations.map(da => ({
                    id: da.donation.id,
                    reference_code: da.donation.reference_code,
                    blockchain_txt_hash: da.donation.blockchain_txt_hash,
                    blockchain_status: da.donation.blockchain_status,
                    blockchain_saved_at: da.donation.blockchain_saved_at,
                })) || [],
            },
            summary: {
                onchainStatus: onChainProof ? "✅ Recorded on blockchain" : "❌ NOT on blockchain",
                databaseStatus: allocationRecord ? "✅ Found in database" : "❌ NOT in database",
                donationsUpdated: allocationRecord?.donationAllocations.some(da => da.donation.blockchain_txt_hash) 
                    ? "✅ Yes" 
                    : "❌ No",
                issue: !onChainProof && allocationRecord ? "⚠️ Allocation in DB but NOT on blockchain - transaction may have failed" : null,
            },
            recommendation: !onChainProof && allocationRecord ? 
                `Try marking receipt as COMPLETED again. Check Vercel logs for [BC-WAIT] errors.` 
                : "Status looks good!",
        });

    } catch (error) {
        console.error("[DEBUG] Error checking allocation:", error);
        return NextResponse.json(
            { 
                success: false, 
                error: error instanceof Error ? error.message : "Unknown error",
                note: "Check Vercel logs for [BC-WAIT] entries"
            },
            { status: 500 }
        );
    }
}
