/**
 * DonationProof Contract ABI
 *
 * Auto-extracted from compiled Solidity contract.
 * If you modify the contract, re-compile and update this ABI.
 *
 * To regenerate:
 *   cd blockchain
 *   npx hardhat compile
 *   Copy abi from artifacts/contracts/DonationProof.sol/DonationProof.json
 */
export const DONATION_PROOF_ABI = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "previousOwner", type: "address" },
      { indexed: true, internalType: "address", name: "newOwner", type: "address" },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "string", name: "allocationId", type: "string" },
      { indexed: true, internalType: "string", name: "beneficiaryId", type: "string" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
      { indexed: false, internalType: "string", name: "purpose", type: "string" },
      { indexed: false, internalType: "string", name: "proofHash", type: "string" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" },
    ],
    name: "ProofRecorded",
    type: "event",
  },
  {
    inputs: [{ internalType: "string", name: "_allocationId", type: "string" }],
    name: "getProof",
    outputs: [
      { internalType: "string[]", name: "donationIds", type: "string[]" },
      { internalType: "string", name: "beneficiaryId", type: "string" },
      { internalType: "uint256[]", name: "registeredDonorIds", type: "uint256[]" },
      { internalType: "uint256[]", name: "guestDonorIds", type: "uint256[]" },
      { internalType: "uint256", name: "amount", type: "uint256" },
      { internalType: "string", name: "currency", type: "string" },
      { internalType: "string", name: "purpose", type: "string" },
      { internalType: "string", name: "disbursementReceiptUrl", type: "string" },
      { internalType: "string", name: "proofUrl", type: "string" },
      { internalType: "string", name: "proofHash", type: "string" },
      { internalType: "string", name: "proofType", type: "string" },
      { internalType: "uint256", name: "recordedAt", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getProofCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "index", type: "uint256" }],
    name: "getProofIdByIndex",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "string", name: "", type: "string" }],
    name: "hasProof",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "proofIndex",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "string[]", name: "_donationIds", type: "string[]" },
      { internalType: "string", name: "_allocationId", type: "string" },
      { internalType: "string", name: "_beneficiaryId", type: "string" },
      { internalType: "uint256[]", name: "_registeredDonorIds", type: "uint256[]" },
      { internalType: "uint256[]", name: "_guestDonorIds", type: "uint256[]" },
      { internalType: "uint256", name: "_amount", type: "uint256" },
      { internalType: "string", name: "_currency", type: "string" },
      { internalType: "string", name: "_purpose", type: "string" },
      { internalType: "string", name: "_disbursementReceiptUrl", type: "string" },
      { internalType: "string", name: "_proofUrl", type: "string" },
      { internalType: "string", name: "_proofHash", type: "string" },
      { internalType: "string", name: "_proofType", type: "string" },
    ],
    name: "recordProof",
    stateMutability: "nonpayable",
    type: "function",
    outputs: [],
  },
  {
    inputs: [],
    name: "totalProofs",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "newOwner", type: "address" }],
    name: "transferOwnership",
    stateMutability: "nonpayable",
    type: "function",
    outputs: [],
  },
] as const;
