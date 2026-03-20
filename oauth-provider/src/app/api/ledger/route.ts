import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const ledgerEntries = await prisma.blockchainLedger.findMany({
            include: {
                allocation: {
                    select: {
                        amount: true,
                        source_type: true,
                        request: {
                            select: {
                                purpose: true,
                                beneficiary: {
                                    select: {
                                        firstName: true,
                                        lastName: true,
                                    }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: {
                recorded_at: 'desc'
            }
        });

        // Format data for easier use in tables
        const formattedEntries = ledgerEntries.map(entry => ({
            id: entry.id,
            allocationId: entry.allocation_id,
            requestId: entry.request_id,
            beneficiaryName: entry.allocation?.request?.beneficiary ? 
                `${entry.allocation.request.beneficiary.firstName} ${entry.allocation.request.beneficiary.lastName}` : 'Unknown',
            amount: entry.allocation?.amount || 0,
            purpose: entry.purpose || entry.allocation?.request?.purpose || 'General Need',
            sourceType: entry.allocation?.source_type || 'Unknown',
            txHash: entry.tx_hash,
            network: entry.network,
            explorerUrl: entry.explorer_url,
            status: entry.status,
            recordedAt: entry.recorded_at,
            proofUrl: entry.proof_url,
            proofType: entry.proof_type,
            proofHash: entry.proof_hash,
        }));

        return NextResponse.json({
            success: true,
            data: formattedEntries,
        });
    } catch (error) {
        console.error("Error fetching ledger entries:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch blockchain ledger" },
            { status: 500 }
        );
    }
}
