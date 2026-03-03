// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title DonationProof
 * @dev Immutable, transparent ledger for donation lifecycle proofs on Polygon.
 *
 * Flow: Donation (PayMongo) → Allocation (Admin) → Proof (Beneficiary) → Blockchain (this contract)
 *
 * This contract is called AFTER the beneficiary uploads their receipt/proof.
 * It creates a permanent, publicly verifiable record that a donation was
 * properly allocated and utilized for its intended purpose.
 *
 * Only the contract owner (your backend wallet) can record proofs,
 * but ANYONE can read/verify them — that's the transparency.
 */
contract DonationProof {
    // ============================================
    // STATE
    // ============================================

    /// @notice The address authorized to record proofs (your backend wallet)
    address public owner;

    /// @notice Total number of proofs recorded on-chain
    uint256 public totalProofs;

    /// @notice Structure representing an immutable proof record
    struct Proof {
        // Identifiers (from your database)
        string donationId;       // Donation reference code (e.g., "DON-ABC123")
        string allocationId;     // Allocation ID linking donation to beneficiary request
        string beneficiaryId;    // Beneficiary identifier

        // Financial
        uint256 amount;          // Amount in centavos (PHP * 100 to avoid decimals)
        string currency;         // "PHP"

        // Purpose & proof
        string purpose;          // What the funds were allocated for
        string proofHash;        // IPFS hash or URL of the uploaded receipt/proof document
        string proofType;        // "receipt", "liquidation_report", "thank_you_letter"

        // Metadata
        uint256 recordedAt;      // Block timestamp when this was permanently recorded
        address recordedBy;      // Address that submitted this record
    }

    /// @notice Lookup a proof by its donation ID
    mapping(string => Proof) public proofs;

    /// @notice Check if a donation ID already has a proof recorded
    mapping(string => bool) public hasProof;

    /// @notice Ordered list of all donation IDs for enumeration
    string[] public proofIndex;

    // ============================================
    // EVENTS
    // ============================================

    /// @notice Emitted when a new proof is permanently recorded
    event ProofRecorded(
        string indexed donationId,
        string indexed beneficiaryId,
        uint256 amount,
        string purpose,
        string proofHash,
        uint256 timestamp
    );

    /// @notice Emitted when ownership is transferred
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    // ============================================
    // MODIFIERS
    // ============================================

    modifier onlyOwner() {
        require(msg.sender == owner, "DonationProof: caller is not the owner");
        _;
    }

    // ============================================
    // CONSTRUCTOR
    // ============================================

    constructor() {
        owner = msg.sender;
    }

    // ============================================
    // WRITE FUNCTIONS (only owner / your backend)
    // ============================================

    /**
     * @notice Record an immutable proof that a donation was properly utilized.
     * @dev Called by your Next.js backend after a beneficiary uploads proof.
     *
     * @param _donationId     Your database donation reference code
     * @param _allocationId   The allocation ID linking donation → beneficiary request
     * @param _beneficiaryId  The beneficiary's identifier
     * @param _amount         Amount in centavos (e.g., 50000 = ₱500.00)
     * @param _currency       Currency code (e.g., "PHP")
     * @param _purpose        What the funds were used for
     * @param _proofHash      IPFS hash or URL of the receipt/proof document
     * @param _proofType      Type of proof: "receipt", "liquidation_report", etc.
     */
    function recordProof(
        string calldata _donationId,
        string calldata _allocationId,
        string calldata _beneficiaryId,
        uint256 _amount,
        string calldata _currency,
        string calldata _purpose,
        string calldata _proofHash,
        string calldata _proofType
    ) external onlyOwner {
        require(!hasProof[_donationId], "DonationProof: proof already recorded for this donation");
        require(_amount > 0, "DonationProof: amount must be greater than zero");
        require(bytes(_donationId).length > 0, "DonationProof: donation ID required");
        require(bytes(_proofHash).length > 0, "DonationProof: proof hash required");

        Proof memory newProof = Proof({
            donationId: _donationId,
            allocationId: _allocationId,
            beneficiaryId: _beneficiaryId,
            amount: _amount,
            currency: _currency,
            purpose: _purpose,
            proofHash: _proofHash,
            proofType: _proofType,
            recordedAt: block.timestamp,
            recordedBy: msg.sender
        });

        proofs[_donationId] = newProof;
        hasProof[_donationId] = true;
        proofIndex.push(_donationId);
        totalProofs++;

        emit ProofRecorded(
            _donationId,
            _beneficiaryId,
            _amount,
            _purpose,
            _proofHash,
            block.timestamp
        );
    }

    /**
     * @notice Record multiple proofs in a single transaction (saves gas).
     * @dev Useful for batch processing when multiple allocations are disbursed at once.
     */
    function recordProofBatch(
        string[] calldata _donationIds,
        string[] calldata _allocationIds,
        string[] calldata _beneficiaryIds,
        uint256[] calldata _amounts,
        string[] calldata _currencies,
        string[] calldata _purposes,
        string[] calldata _proofHashes,
        string[] calldata _proofTypes
    ) external onlyOwner {
        uint256 length = _donationIds.length;
        require(length > 0, "DonationProof: empty batch");
        require(
            length == _allocationIds.length &&
            length == _beneficiaryIds.length &&
            length == _amounts.length &&
            length == _currencies.length &&
            length == _purposes.length &&
            length == _proofHashes.length &&
            length == _proofTypes.length,
            "DonationProof: array length mismatch"
        );

        for (uint256 i = 0; i < length; i++) {
            // Skip already-recorded (don't revert the whole batch)
            if (hasProof[_donationIds[i]]) continue;
            if (_amounts[i] == 0) continue;

            Proof memory newProof = Proof({
                donationId: _donationIds[i],
                allocationId: _allocationIds[i],
                beneficiaryId: _beneficiaryIds[i],
                amount: _amounts[i],
                currency: _currencies[i],
                purpose: _purposes[i],
                proofHash: _proofHashes[i],
                proofType: _proofTypes[i],
                recordedAt: block.timestamp,
                recordedBy: msg.sender
            });

            proofs[_donationIds[i]] = newProof;
            hasProof[_donationIds[i]] = true;
            proofIndex.push(_donationIds[i]);
            totalProofs++;

            emit ProofRecorded(
                _donationIds[i],
                _beneficiaryIds[i],
                _amounts[i],
                _purposes[i],
                _proofHashes[i],
                block.timestamp
            );
        }
    }

    // ============================================
    // READ FUNCTIONS (anyone can call — transparency!)
    // ============================================

    /**
     * @notice Get the full proof details for a donation.
     * @dev This is what donors call to verify their contribution was used properly.
     */
    function getProof(string calldata _donationId) external view returns (
        string memory allocationId,
        string memory beneficiaryId,
        uint256 amount,
        string memory currency,
        string memory purpose,
        string memory proofHash,
        string memory proofType,
        uint256 recordedAt
    ) {
        require(hasProof[_donationId], "DonationProof: no proof found for this donation");

        Proof memory p = proofs[_donationId];
        return (
            p.allocationId,
            p.beneficiaryId,
            p.amount,
            p.currency,
            p.purpose,
            p.proofHash,
            p.proofType,
            p.recordedAt
        );
    }

    /**
     * @notice Get the total number of proofs recorded.
     */
    function getProofCount() external view returns (uint256) {
        return totalProofs;
    }

    /**
     * @notice Get a donation ID by its index (for pagination/enumeration).
     */
    function getProofIdByIndex(uint256 index) external view returns (string memory) {
        require(index < proofIndex.length, "DonationProof: index out of bounds");
        return proofIndex[index];
    }

    // ============================================
    // ADMIN
    // ============================================

    /**
     * @notice Transfer ownership to a new address.
     * @dev Use this if you need to rotate your backend wallet.
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "DonationProof: new owner is the zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}
