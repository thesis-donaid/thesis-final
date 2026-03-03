import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("DonationProofModule", (m) => {
  const donationProof = m.contract("DonationProof");

  return { donationProof };
});
