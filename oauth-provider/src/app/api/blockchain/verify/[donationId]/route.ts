/**
 * GET /api/blockchain/verify/[donationId]
 *
 * Publicly accessible endpoint for donors to verify their donation proof
 * directly from the blockchain. No authentication required — that's the
 * whole point of blockchain transparency!
 *
 * Returns the on-chain proof data + explorer link so donors can
 * independently verify on PolygonScan.
 */

import { NextRequest, NextResponse } from "next/server";
import { getProofFromChain, hasProofOnChain } from "@/blockchain/service";
import { getExplorerTxUrl, getExplorerContractUrl } from "@/blockchain/config";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ donationId: string }> }
) {
  try {
    const { donationId } = await params;

    if (!donationId) {
      return NextResponse.json(
        { success: false, error: "Donation ID is required" },
        { status: 400 }
      );
    }

    // 1. Check if proof exists on-chain
    const exists = await hasProofOnChain(donationId);

    if (!exists) {
      return NextResponse.json({
        success: true,
        data: {
          verified: false,
          message: "No blockchain proof found for this donation yet.",
        },
      });
    }

    // 2. Get the full proof from blockchain
    const proof = await getProofFromChain(donationId);

    // 3. Get the transaction hash from our database for the explorer link
    const donation = await prisma.donation.findUnique({
      where: { reference_code: donationId },
      select: {
        blockchain_txt_hash: true,
        blockchain_network: true,
        blockchain_saved_at: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        verified: true,
        proof,
        blockchain: {
          transactionHash: donation?.blockchain_txt_hash || "",
          network: donation?.blockchain_network || "",
          savedAt: donation?.blockchain_saved_at || null,
          explorerTxUrl: donation?.blockchain_txt_hash
            ? getExplorerTxUrl(donation.blockchain_txt_hash)
            : "",
          contractUrl: getExplorerContractUrl(),
        },
      },
    });
  } catch (error) {
    console.error("[API] Error verifying proof:", error);
    return NextResponse.json(
      { success: false, error: "Failed to verify proof" },
      { status: 500 }
    );
  }
}
