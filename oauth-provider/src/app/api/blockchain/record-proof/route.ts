/**
 * POST /api/blockchain/record-proof
 *
 * Records a donation proof on the Polygon blockchain.
 * Called by the admin after a beneficiary submits their proof/receipt.
 *
 * Request body:
 * {
 *   donationId: string,       // Donation reference code
 *   allocationId: string,     // Allocation ID
 *   beneficiaryId: string,    // Beneficiary identifier
 *   amount: number,           // Amount in PHP
 *   purpose: string,          // What the funds were used for
 *   proofHash: string,        // IPFS hash or URL of receipt
 *   proofType: string,        // "receipt" | "liquidation_report" | "thank_you_letter"
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { recordProofOnChain } from "@/blockchain/service";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const { donationId, allocationId, beneficiaryId, amount, purpose, proofHash, proofType } = body;

    if (!donationId || !allocationId || !beneficiaryId || !amount || !purpose || !proofHash) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Record on blockchain
    const result = await recordProofOnChain({
      donationId,
      allocationId: String(allocationId),
      beneficiaryId: String(beneficiaryId),
      amount: Number(amount),
      purpose,
      proofHash,
      proofType: proofType || "receipt",
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    // Update the donation record in your database with the blockchain info
    await prisma.donation.update({
      where: { reference_code: donationId },
      data: {
        blockchain_txt_hash: result.transactionHash,
        blockchain_network: process.env.BLOCKCHAIN_NETWORK || "amoy",
        blockchain_status: "confirmed",
        blockchain_saved_at: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        transactionHash: result.transactionHash,
        blockNumber: result.blockNumber,
        explorerUrl: result.explorerUrl,
        gasUsed: result.gasUsed,
      },
    });
  } catch (error) {
    console.error("[API] Error recording proof:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
