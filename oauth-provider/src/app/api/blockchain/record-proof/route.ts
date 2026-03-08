/**
 * POST /api/blockchain/record-proof
 *
 * Records a donation proof on the blockchain.
 * This is a standalone endpoint — the primary trigger is through
 * PUT /api/admin/requests/[id] when receipt_status = COMPLETED.
 *
 * Request body:
 * {
 *   donationIds: string[],          // Donation reference codes
 *   allocationId: string,           // Allocation ID
 *   beneficiaryId: string,          // Beneficiary identifier
 *   registeredDonorIds: number[],   // Registered donor DB IDs
 *   guestDonorIds: number[],        // Guest donor DB IDs
 *   amount: number,                 // Amount in PHP
 *   purpose: string,                // What the funds were used for
 *   disbursementReceiptUrl: string, // URL of disbursement receipt
 *   proofUrl: string,               // URL of beneficiary's proof
 *   proofHash: string,              // Hash of the proof document
 *   proofType: string,              // "receipt" | "liquidation_report" | "thank_you_letter"
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { recordProofOnChain } from "@/blockchain/service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      donationIds, allocationId, beneficiaryId,
      registeredDonorIds, guestDonorIds,
      amount, purpose, disbursementReceiptUrl, proofUrl, proofHash, proofType,
    } = body;

    if (!donationIds?.length || !allocationId || !beneficiaryId || !amount || !purpose) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const result = await recordProofOnChain({
      donationIds,
      allocationId: String(allocationId),
      beneficiaryId: String(beneficiaryId),
      registeredDonorIds: registeredDonorIds || [],
      guestDonorIds: guestDonorIds || [],
      amount: Number(amount),
      purpose,
      disbursementReceiptUrl: disbursementReceiptUrl || "",
      proofUrl: proofUrl || "",
      proofHash: proofHash || proofUrl || "",
      proofType: proofType || "receipt",
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

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
