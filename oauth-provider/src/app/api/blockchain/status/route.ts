/**
 * GET /api/blockchain/status
 *
 * Returns the blockchain integration status:
 * - Wallet address & balance (for monitoring gas)
 * - Total proofs recorded
 * - Network info
 * - Contract address
 *
 * Admin-only endpoint for dashboard monitoring.
 */

import { NextResponse } from "next/server";
import { getWalletBalance, getWalletAddress, getProofCount } from "@/blockchain/service";
import { getActiveConfig, ACTIVE_NETWORK, getExplorerContractUrl } from "@/blockchain/config";

export async function GET() {
  try {
    const config = getActiveConfig();

    const [walletAddress, walletBalance, proofCount] = await Promise.all([
      getWalletAddress(),
      getWalletBalance(),
      getProofCount(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        network: {
          name: config.name,
          chainId: config.chainId,
          activeNetwork: ACTIVE_NETWORK,
          currency: config.currency,
        },
        contract: {
          address: config.contractAddress,
          explorerUrl: getExplorerContractUrl(),
          totalProofs: proofCount,
        },
        wallet: {
          address: walletAddress,
          balance: walletBalance,
          currency: config.currency,
        },
      },
    });
  } catch (error) {
    console.error("[API] Error getting blockchain status:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get blockchain status" },
      { status: 500 }
    );
  }
}
