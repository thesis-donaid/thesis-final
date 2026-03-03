import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("DonationProof", function () {
  // Helper to deploy the contract
  async function deployContract() {
    const [owner, otherAccount] = await ethers.getSigners();
    const contract = await ethers.deployContract("DonationProof");
    return { contract, owner, otherAccount };
  }

  // Sample proof data
  const sampleProof = {
    donationId: "DON-REF-001",
    allocationId: "ALLOC-001",
    beneficiaryId: "BEN-001",
    amount: 50000n, // ₱500.00 in centavos
    currency: "PHP",
    purpose: "School supplies for Scholar A",
    proofHash: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
    proofType: "receipt",
  };

  describe("Deployment", function () {
    it("Should set the deployer as owner", async function () {
      const { contract, owner } = await deployContract();
      expect(await contract.owner()).to.equal(owner.address);
    });

    it("Should start with zero proofs", async function () {
      const { contract } = await deployContract();
      expect(await contract.totalProofs()).to.equal(0n);
    });
  });

  describe("Recording Proofs", function () {
    it("Should record a proof and emit ProofRecorded event", async function () {
      const { contract } = await deployContract();

      await expect(
        contract.recordProof(
          sampleProof.donationId,
          sampleProof.allocationId,
          sampleProof.beneficiaryId,
          sampleProof.amount,
          sampleProof.currency,
          sampleProof.purpose,
          sampleProof.proofHash,
          sampleProof.proofType
        )
      )
        .to.emit(contract, "ProofRecorded")
        .withArgs(
          sampleProof.donationId,
          sampleProof.beneficiaryId,
          sampleProof.amount,
          sampleProof.purpose,
          sampleProof.proofHash,
          // timestamp is dynamic, so we just check the other args
          (value: bigint) => value > 0n
        );
    });

    it("Should increment totalProofs after recording", async function () {
      const { contract } = await deployContract();

      await contract.recordProof(
        sampleProof.donationId,
        sampleProof.allocationId,
        sampleProof.beneficiaryId,
        sampleProof.amount,
        sampleProof.currency,
        sampleProof.purpose,
        sampleProof.proofHash,
        sampleProof.proofType
      );

      expect(await contract.totalProofs()).to.equal(1n);
    });

    it("Should store proof data correctly and be retrievable", async function () {
      const { contract } = await deployContract();

      await contract.recordProof(
        sampleProof.donationId,
        sampleProof.allocationId,
        sampleProof.beneficiaryId,
        sampleProof.amount,
        sampleProof.currency,
        sampleProof.purpose,
        sampleProof.proofHash,
        sampleProof.proofType
      );

      const proof = await contract.getProof(sampleProof.donationId);

      expect(proof.allocationId).to.equal(sampleProof.allocationId);
      expect(proof.beneficiaryId).to.equal(sampleProof.beneficiaryId);
      expect(proof.amount).to.equal(sampleProof.amount);
      expect(proof.currency).to.equal(sampleProof.currency);
      expect(proof.purpose).to.equal(sampleProof.purpose);
      expect(proof.proofHash).to.equal(sampleProof.proofHash);
      expect(proof.proofType).to.equal(sampleProof.proofType);
      expect(proof.recordedAt).to.be.greaterThan(0n);
    });

    it("Should mark donation as having proof (hasProof)", async function () {
      const { contract } = await deployContract();

      expect(await contract.hasProof(sampleProof.donationId)).to.equal(false);

      await contract.recordProof(
        sampleProof.donationId,
        sampleProof.allocationId,
        sampleProof.beneficiaryId,
        sampleProof.amount,
        sampleProof.currency,
        sampleProof.purpose,
        sampleProof.proofHash,
        sampleProof.proofType
      );

      expect(await contract.hasProof(sampleProof.donationId)).to.equal(true);
    });

    it("Should NOT allow duplicate donation IDs", async function () {
      const { contract } = await deployContract();

      await contract.recordProof(
        sampleProof.donationId,
        sampleProof.allocationId,
        sampleProof.beneficiaryId,
        sampleProof.amount,
        sampleProof.currency,
        sampleProof.purpose,
        sampleProof.proofHash,
        sampleProof.proofType
      );

      await expect(
        contract.recordProof(
          sampleProof.donationId,
          sampleProof.allocationId,
          sampleProof.beneficiaryId,
          sampleProof.amount,
          sampleProof.currency,
          sampleProof.purpose,
          sampleProof.proofHash,
          sampleProof.proofType
        )
      ).to.be.revertedWith("DonationProof: proof already recorded for this donation");
    });

    it("Should NOT allow zero amount", async function () {
      const { contract } = await deployContract();

      await expect(
        contract.recordProof(
          sampleProof.donationId,
          sampleProof.allocationId,
          sampleProof.beneficiaryId,
          0n,
          sampleProof.currency,
          sampleProof.purpose,
          sampleProof.proofHash,
          sampleProof.proofType
        )
      ).to.be.revertedWith("DonationProof: amount must be greater than zero");
    });

    it("Should NOT allow empty donation ID", async function () {
      const { contract } = await deployContract();

      await expect(
        contract.recordProof(
          "",
          sampleProof.allocationId,
          sampleProof.beneficiaryId,
          sampleProof.amount,
          sampleProof.currency,
          sampleProof.purpose,
          sampleProof.proofHash,
          sampleProof.proofType
        )
      ).to.be.revertedWith("DonationProof: donation ID required");
    });
  });

  describe("Access Control", function () {
    it("Should NOT allow non-owner to record proofs", async function () {
      const { contract, otherAccount } = await deployContract();

      await expect(
        contract.connect(otherAccount).recordProof(
          sampleProof.donationId,
          sampleProof.allocationId,
          sampleProof.beneficiaryId,
          sampleProof.amount,
          sampleProof.currency,
          sampleProof.purpose,
          sampleProof.proofHash,
          sampleProof.proofType
        )
      ).to.be.revertedWith("DonationProof: caller is not the owner");
    });

    it("Should allow ownership transfer", async function () {
      const { contract, owner, otherAccount } = await deployContract();

      await contract.transferOwnership(otherAccount.address);
      expect(await contract.owner()).to.equal(otherAccount.address);

      // Old owner can no longer record
      await expect(
        contract.recordProof(
          sampleProof.donationId,
          sampleProof.allocationId,
          sampleProof.beneficiaryId,
          sampleProof.amount,
          sampleProof.currency,
          sampleProof.purpose,
          sampleProof.proofHash,
          sampleProof.proofType
        )
      ).to.be.revertedWith("DonationProof: caller is not the owner");

      // New owner CAN record
      await contract.connect(otherAccount).recordProof(
        sampleProof.donationId,
        sampleProof.allocationId,
        sampleProof.beneficiaryId,
        sampleProof.amount,
        sampleProof.currency,
        sampleProof.purpose,
        sampleProof.proofHash,
        sampleProof.proofType
      );

      expect(await contract.totalProofs()).to.equal(1n);
    });
  });

  describe("Batch Recording", function () {
    it("Should record multiple proofs in a single transaction", async function () {
      const { contract } = await deployContract();

      const donationIds = ["DON-001", "DON-002", "DON-003"];
      const allocationIds = ["ALLOC-001", "ALLOC-002", "ALLOC-003"];
      const beneficiaryIds = ["BEN-001", "BEN-002", "BEN-003"];
      const amounts = [10000n, 20000n, 30000n];
      const currencies = ["PHP", "PHP", "PHP"];
      const purposes = ["Books", "Uniform", "Tuition"];
      const proofHashes = ["QmHash1", "QmHash2", "QmHash3"];
      const proofTypes = ["receipt", "receipt", "liquidation_report"];

      await contract.recordProofBatch(
        donationIds,
        allocationIds,
        beneficiaryIds,
        amounts,
        currencies,
        purposes,
        proofHashes,
        proofTypes
      );

      expect(await contract.totalProofs()).to.equal(3n);

      // Verify each proof was stored
      for (let i = 0; i < donationIds.length; i++) {
        expect(await contract.hasProof(donationIds[i])).to.equal(true);
        const proof = await contract.getProof(donationIds[i]);
        expect(proof.amount).to.equal(amounts[i]);
        expect(proof.purpose).to.equal(purposes[i]);
      }
    });

    it("Should skip already-recorded proofs in batch (no revert)", async function () {
      const { contract } = await deployContract();

      // Record one first
      await contract.recordProof(
        "DON-001",
        "ALLOC-001",
        "BEN-001",
        10000n,
        "PHP",
        "Books",
        "QmHash1",
        "receipt"
      );

      // Batch includes the already-recorded DON-001 — should skip it
      await contract.recordProofBatch(
        ["DON-001", "DON-002"],
        ["ALLOC-001", "ALLOC-002"],
        ["BEN-001", "BEN-002"],
        [10000n, 20000n],
        ["PHP", "PHP"],
        ["Books", "Uniform"],
        ["QmHash1", "QmHash2"],
        ["receipt", "receipt"]
      );

      // Should be 2 total (not 3)
      expect(await contract.totalProofs()).to.equal(2n);
    });
  });

  describe("Enumeration", function () {
    it("Should allow enumerating all proof IDs by index", async function () {
      const { contract } = await deployContract();

      await contract.recordProof(
        "DON-A",
        "ALLOC-A",
        "BEN-A",
        10000n,
        "PHP",
        "Purpose A",
        "QmHashA",
        "receipt"
      );
      await contract.recordProof(
        "DON-B",
        "ALLOC-B",
        "BEN-B",
        20000n,
        "PHP",
        "Purpose B",
        "QmHashB",
        "receipt"
      );

      expect(await contract.getProofIdByIndex(0)).to.equal("DON-A");
      expect(await contract.getProofIdByIndex(1)).to.equal("DON-B");
      expect(await contract.getProofCount()).to.equal(2n);
    });
  });
});
