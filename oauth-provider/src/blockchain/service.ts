/**
 * Blockchain Service — DonationProof Contract Integration
 *
 * This is the bridge between your Next.js backend and the Polygon blockchain.
 *
 * WRITE operations (recordProof) → require the backend wallet private key (server-side only)
 * READ operations (getProof)     → anyone can call, no private key needed
 *
 * Usage:
 *   import { recordProofOnChain, getProofFromChain } from "@/blockchain/service";
 */

import { ethers } from "ethers";
import { DONATION_PROOF_ABI } from "./abi";
import { getActiveConfig, getExplorerTxUrl } from "./config";

// ============================================
// Types
// ============================================

export interface RecordProofParams {
  donationId: string;
  allocationId: string;
  beneficiaryId: string;
  /** Amount in PHP (e.g., 500.00) — will be converted to centavos on-chain */
  amount: number;
  currency?: string;
  purpose: string;
  /** IPFS hash or URL of the receipt/proof document */
  proofHash: string;
  /** Type of proof: "receipt", "liquidation_report", "thank_you_letter" */
  proofType: string;
}

export interface OnChainProof {
  donationId: string;
  allocationId: string;
  beneficiaryId: string;
  amount: number;
  currency: string;
  purpose: string;
  proofHash: string;
  proofType: string;
  recordedAt: Date;
}

export interface RecordProofResult {
  success: boolean;
  transactionHash: string;
  blockNumber: number;
  explorerUrl: string;
  gasUsed: string;
  error?: string;
}

// ============================================
// Provider & Contract Instances
// ============================================

/**
 * Get a read-only provider (no private key needed).
 * Safe to use on client-side or server-side.
 */
function getProvider(): ethers.JsonRpcProvider {
  const config = getActiveConfig();
  return new ethers.JsonRpcProvider(config.rpcUrl);
}

/**
 * Get a signer (wallet) that can send transactions.
 * SERVER-SIDE ONLY — requires BLOCKCHAIN_PRIVATE_KEY env var.
 */
function getSigner(): ethers.Wallet {
  const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error(
      "BLOCKCHAIN_PRIVATE_KEY environment variable is not set. " +
      "This is required for recording proofs on the blockchain."
    );
  }
  const provider = getProvider();
  return new ethers.Wallet(privateKey, provider);
}

/**
 * Get a read-only contract instance (for querying data).
 */
function getReadContract(): ethers.Contract {
  const config = getActiveConfig();
  if (!config.contractAddress) {
    throw new Error(
      `Contract address not configured for network "${config.name}". ` +
      "Deploy the contract first and set DONATION_PROOF_CONTRACT_ADDRESS."
    );
  }
  const provider = getProvider();
  return new ethers.Contract(config.contractAddress, DONATION_PROOF_ABI, provider);
}

/**
 * Get a writable contract instance (for recording proofs).
 * SERVER-SIDE ONLY.
 */
function getWriteContract(): ethers.Contract {
  const config = getActiveConfig();
  if (!config.contractAddress) {
    throw new Error(
      `Contract address not configured for network "${config.name}". ` +
      "Deploy the contract first and set DONATION_PROOF_CONTRACT_ADDRESS."
    );
  }
  const signer = getSigner();
  return new ethers.Contract(config.contractAddress, DONATION_PROOF_ABI, signer);
}

// ============================================
// WRITE FUNCTIONS (Server-side only)
// ============================================

/**
 * Record a donation proof on the blockchain.
 *
 * Call this from your API route after a beneficiary uploads their receipt/proof.
 *
 * @example
 * ```ts
 * // In your API route (e.g., /api/proof/record)
 * const result = await recordProofOnChain({
 *   donationId: "DON-REF-001",
 *   allocationId: "1",
 *   beneficiaryId: "BEN-001",
 *   amount: 500.00,
 *   purpose: "School supplies for Scholar A",
 *   proofHash: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
 *   proofType: "receipt",
 * });
 *
 * // result.transactionHash → save to your database
 * // result.explorerUrl → show to user for verification
 * ```
 */
export async function recordProofOnChain(
  params: RecordProofParams
): Promise<RecordProofResult> {
  try {
    const contract = getWriteContract();

    // Convert PHP amount to centavos (integer) for on-chain storage
    // e.g., ₱500.00 → 50000
    const amountInCentavos = Math.round(params.amount * 100);

    const tx = await contract.recordProof(
      params.donationId,
      params.allocationId,
      params.beneficiaryId,
      amountInCentavos,
      params.currency || "PHP",
      params.purpose,
      params.proofHash,
      params.proofType
    );

    // Wait for transaction to be mined (1 confirmation)
    const receipt = await tx.wait(1);

    return {
      success: true,
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      explorerUrl: getExplorerTxUrl(receipt.hash),
      gasUsed: receipt.gasUsed.toString(),
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown blockchain error";
    console.error("[Blockchain] Failed to record proof:", message);
    return {
      success: false,
      transactionHash: "",
      blockNumber: 0,
      explorerUrl: "",
      gasUsed: "0",
      error: message,
    };
  }
}

/**
 * Record multiple proofs in a single transaction (saves gas).
 */
export async function recordProofBatchOnChain(
  proofs: RecordProofParams[]
): Promise<RecordProofResult> {
  try {
    const contract = getWriteContract();

    const tx = await contract.recordProofBatch(
      proofs.map((p) => p.donationId),
      proofs.map((p) => p.allocationId),
      proofs.map((p) => p.beneficiaryId),
      proofs.map((p) => Math.round(p.amount * 100)),
      proofs.map((p) => p.currency || "PHP"),
      proofs.map((p) => p.purpose),
      proofs.map((p) => p.proofHash),
      proofs.map((p) => p.proofType)
    );

    const receipt = await tx.wait(1);

    return {
      success: true,
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      explorerUrl: getExplorerTxUrl(receipt.hash),
      gasUsed: receipt.gasUsed.toString(),
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown blockchain error";
    console.error("[Blockchain] Failed to record batch proof:", message);
    return {
      success: false,
      transactionHash: "",
      blockNumber: 0,
      explorerUrl: "",
      gasUsed: "0",
      error: message,
    };
  }
}

// ============================================
// READ FUNCTIONS (Anyone can call)
// ============================================

/**
 * Get a proof from the blockchain by donation ID.
 * This is what donors use to verify their contribution.
 */
export async function getProofFromChain(
  donationId: string
): Promise<OnChainProof | null> {
  try {
    const contract = getReadContract();

    const exists = await contract.hasProof(donationId);
    if (!exists) return null;

    const proof = await contract.getProof(donationId);

    return {
      donationId,
      allocationId: proof.allocationId,
      beneficiaryId: proof.beneficiaryId,
      amount: Number(proof.amount) / 100, // Convert centavos back to PHP
      currency: proof.currency,
      purpose: proof.purpose,
      proofHash: proof.proofHash,
      proofType: proof.proofType,
      recordedAt: new Date(Number(proof.recordedAt) * 1000),
    };
  } catch (error) {
    console.error("[Blockchain] Failed to get proof:", error);
    return null;
  }
}

/**
 * Check if a donation already has a proof recorded on-chain.
 */
export async function hasProofOnChain(donationId: string): Promise<boolean> {
  try {
    const contract = getReadContract();
    return await contract.hasProof(donationId);
  } catch (error) {
    console.error("[Blockchain] Failed to check proof:", error);
    return false;
  }
}

/**
 * Get the total number of proofs recorded on the blockchain.
 */
export async function getProofCount(): Promise<number> {
  try {
    const contract = getReadContract();
    const count = await contract.getProofCount();
    return Number(count);
  } catch (error) {
    console.error("[Blockchain] Failed to get proof count:", error);
    return 0;
  }
}

/**
 * Get the wallet balance (in POL/MATIC) of the backend signer.
 * Useful for monitoring if the wallet needs to be topped up for gas.
 */
export async function getWalletBalance(): Promise<string> {
  try {
    const signer = getSigner();
    const balance = await signer.provider!.getBalance(signer.address);
    return ethers.formatEther(balance);
  } catch (error) {
    console.error("[Blockchain] Failed to get wallet balance:", error);
    return "0";
  }
}

/**
 * Get the wallet address of the backend signer.
 */
export async function getWalletAddress(): Promise<string> {
  try {
    const signer = getSigner();
    return signer.address;
  } catch (error) {
    console.error("[Blockchain] Failed to get wallet address:", error);
    return "";
  }
}
