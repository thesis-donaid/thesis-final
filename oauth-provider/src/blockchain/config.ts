/**
 * Blockchain Configuration
 *
 * Centralized config for connecting to Polygon network
 * and the deployed DonationProof contract.
 */

// ============================================
// Network Configuration
// ============================================

export const BLOCKCHAIN_CONFIG = {
  // Polygon Amoy Testnet (for development)
  amoy: {
    chainId: 80002,
    name: "Polygon Amoy Testnet",
    rpcUrl: process.env.POLYGON_AMOY_RPC_URL || "https://rpc-amoy.polygon.technology",
    blockExplorer: "https://amoy.polygonscan.com",
    currency: "POL",
    contractAddress: process.env.DONATION_PROOF_CONTRACT_ADDRESS_AMOY || "",
  },
  // Polygon Mainnet (for production)
  polygon: {
    chainId: 137,
    name: "Polygon Mainnet",
    rpcUrl: process.env.POLYGON_MAINNET_RPC_URL || "https://polygon-rpc.com",
    blockExplorer: "https://polygonscan.com",
    currency: "POL",
    contractAddress: process.env.DONATION_PROOF_CONTRACT_ADDRESS || "",
  },
} as const;

// Which network to use — controlled by environment variable
export type NetworkName = keyof typeof BLOCKCHAIN_CONFIG;

export const ACTIVE_NETWORK: NetworkName =
  (process.env.BLOCKCHAIN_NETWORK as NetworkName) || "amoy";

export function getActiveConfig() {
  return BLOCKCHAIN_CONFIG[ACTIVE_NETWORK];
}

/**
 * Get the block explorer URL for a transaction hash
 */
export function getExplorerTxUrl(txHash: string): string {
  const config = getActiveConfig();
  return `${config.blockExplorer}/tx/${txHash}`;
}

/**
 * Get the block explorer URL for the contract
 */
export function getExplorerContractUrl(): string {
  const config = getActiveConfig();
  return `${config.blockExplorer}/address/${config.contractAddress}`;
}
