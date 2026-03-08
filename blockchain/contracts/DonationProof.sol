// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title DonationProof
 * @dev Immutable, transparent ledger for donation lifecycle proofs.
 *
 * Flow: Donation (PayMongo) → Allocation (Admin) → Disbursement → Receipt (Beneficiary) → Blockchain
 *
 * This contract is called AFTER the admin marks a beneficiary's receipt as COMPLETED.
 * It creates a permanent, publicly verifiable record that donations were
 * properly allocated and utilized for their intended purpose.
 *
 * Key change: One proof per ALLOCATION (not per donation), because multiple
 * donations can fund a single beneficiary request/allocation.
 *
 * Only the contract owner (your backend wallet) can record proofs,
 * but ANYONE can read/verify them — that's the transparency.
 */
contract DonationProof {
    // ============================================
    // STATE
    // ============================================

    address public owner;
    uint256 public totalProofs;

    /// @notice Structure representing an immutable proof record
    struct Proof {
        // Identifiers
        string[] donationIds;           // All donation reference codes that funded this allocation
        string allocationId;            // Allocation ID (primary key for this proof)
        string beneficiaryId;           // Beneficiary identifier

        // Donor tracking
        uint256[] registeredDonorIds;   // DB IDs of registered donors (empty if none)
        uint256[] guestDonorIds;        // DB IDs of guest donors (empty if none)

        // Financial
        uint256 amount;                 // Total amount in centavos (PHP * 100)
        string currency;                // "PHP"

        // Purpose & proof documents
        string purpose;                 // What the funds were allocated for
        string disbursementReceiptUrl;  // URL of the disbursement receipt (admin side)
        string proofUrl;                // URL of the beneficiary's uploaded proof/receipt
        string proofHash;               // SHA-256 hash of the proof document for integrity
        string proofType;               // "receipt", "liquidation_report", "thank_you_letter"

        // Metadata
        uint256 recordedAt;             // Block timestamp when permanently recorded
        address recordedBy;             // Wallet address that submitted this record
    }

    /// @notice Lookup a proof by its allocation ID
    mapping(string => Proof) private _proofs;

    /// @notice Check if an allocation already has a proof recorded
    mapping(string => bool) public hasProof;

    /// @notice Ordered list of all allocation IDs for enumeration
    string[] public proofIndex;

    // ============================================
    // EVENTS
    // ============================================

    event ProofRecorded(
        string indexed allocationId,
        string indexed beneficiaryId,
        uint256 amount,
        string purpose,
        string proofHash,
        uint256 timestamp
    );

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
     * @notice Record an immutable proof that an allocation was properly utilized.
     * @dev Called by your Next.js backend when admin marks receipt_status = COMPLETED.
     *
     * @param _donationIds            Array of donation reference codes that funded this
     * @param _allocationId           The allocation ID (unique key for this proof)
     * @param _beneficiaryId          The beneficiary's identifier
     * @param _registeredDonorIds     Array of registered donor DB IDs
     * @param _guestDonorIds          Array of guest donor DB IDs
     * @param _amount                 Total amount in centavos (e.g., 50000 = ₱500.00)
     * @param _currency               Currency code (e.g., "PHP")
     * @param _purpose                What the funds were used for
     * @param _disbursementReceiptUrl URL of the disbursement receipt
     * @param _proofUrl               URL of the beneficiary's proof/receipt document
     * @param _proofHash              SHA-256 hash of the proof document
     * @param _proofType              Type: "receipt", "liquidation_report", "thank_you_letter"
     */
    function recordProof(
        string[] calldata _donationIds,
        string calldata _allocationId,
        string calldata _beneficiaryId,
        uint256[] calldata _registeredDonorIds,
        uint256[] calldata _guestDonorIds,
        uint256 _amount,
        string calldata _currency,
        string calldata _purpose,
        string calldata _disbursementReceiptUrl,
        string calldata _proofUrl,
        string calldata _proofHash,
        string calldata _proofType
    ) external onlyOwner {
        require(!hasProof[_allocationId], "DonationProof: proof already recorded for this allocation");
        require(_amount > 0, "DonationProof: amount must be greater than zero");
        require(bytes(_allocationId).length > 0, "DonationProof: allocation ID required");
        require(_donationIds.length > 0, "DonationProof: at least one donation ID required");

        Proof storage newProof = _proofs[_allocationId];
        newProof.allocationId = _allocationId;
        newProof.beneficiaryId = _beneficiaryId;
        newProof.amount = _amount;
        newProof.currency = _currency;
        newProof.purpose = _purpose;
        newProof.disbursementReceiptUrl = _disbursementReceiptUrl;
        newProof.proofUrl = _proofUrl;
        newProof.proofHash = _proofHash;
        newProof.proofType = _proofType;
        newProof.recordedAt = block.timestamp;
        newProof.recordedBy = msg.sender;

        // Copy arrays into storage
        for (uint256 i = 0; i < _donationIds.length; i++) {
            newProof.donationIds.push(_donationIds[i]);
        }
        for (uint256 i = 0; i < _registeredDonorIds.length; i++) {
            newProof.registeredDonorIds.push(_registeredDonorIds[i]);
        }
        for (uint256 i = 0; i < _guestDonorIds.length; i++) {
            newProof.guestDonorIds.push(_guestDonorIds[i]);
        }

        hasProof[_allocationId] = true;
        proofIndex.push(_allocationId);
        totalProofs++;

        emit ProofRecorded(
            _allocationId,
            _beneficiaryId,
            _amount,
            _purpose,
            _proofHash,
            block.timestamp
        );
    }

    // ============================================
    // READ FUNCTIONS (anyone can call — transparency!)
    // ============================================

    /**
     * @notice Get the full proof details for an allocation.
     * @dev This is what donors/public call to verify funds were used properly.
     */
    function getProof(string calldata _allocationId) external view returns (
        string[] memory donationIds,
        string memory beneficiaryId,
        uint256[] memory registeredDonorIds,
        uint256[] memory guestDonorIds,
        uint256 amount,
        string memory currency,
        string memory purpose,
        string memory disbursementReceiptUrl,
        string memory proofUrl,
        string memory proofHash,
        string memory proofType,
        uint256 recordedAt
    ) {
        require(hasProof[_allocationId], "DonationProof: no proof found for this allocation");

        Proof storage p = _proofs[_allocationId];
        return (
            p.donationIds,
            p.beneficiaryId,
            p.registeredDonorIds,
            p.guestDonorIds,
            p.amount,
            p.currency,
            p.purpose,
            p.disbursementReceiptUrl,
            p.proofUrl,
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
     * @notice Get an allocation ID by its index (for pagination/enumeration).
     */
    function getProofIdByIndex(uint256 index) external view returns (string memory) {
        require(index < proofIndex.length, "DonationProof: index out of bounds");
        return proofIndex[index];
    }

    // ============================================
    // ADMIN
    // ============================================

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "DonationProof: new owner is the zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}
