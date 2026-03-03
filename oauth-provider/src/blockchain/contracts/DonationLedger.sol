// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title DonationLedger
 * @dev This contract acts as an immutable transparent ledger for donation tracking.
 */
contract DonationLedger {
    
    // This is the structure of a single transparent donation record.
    // It maps exactly to the data we want the public to see.
    struct DonationRecord {
        string donationId;      // ID from your database (e.g. PayMongo reference)
        string beneficiaryId;   // ID or Name of the beneficiary
        uint256 amount;         // Amount donated (can be in PHP, usually stored in cents/smallest unit)
        string purpose;         // The budget allocation request / purpose
        string receiptUrl;      // IPFS URL linking to the uploaded receipt/proof
        uint256 timestamp;      // When this record was permanently added to the blockchain
    }

    // A "mapping" is like a dictionary. It allows us to look up a DonationRecord
    // instantly using its unique donationId.
    mapping(string => DonationRecord) public donations;

    // We keep track of how many donations have been recorded in total.
    uint256 public totalDonationsRecorded;

    // Events are broadcasted to the blockchain when something happens.
    // This allows our Next.js frontend to easily "listen" for new records being added.
    event DonationRecorded(
        string indexed donationId,
        string indexed beneficiaryId,
        uint256 amount,
        string purpose,
        string receiptUrl,
        uint256 timestamp
    );

    /**
     * @dev This function is called by your Next.js backend when a beneficiary 
     *      uploads their proof of purchase/receipt.
     */
    function recordDationLifecycle(
        string memory _donationId,
        string memory _beneficiaryId,
        uint256 _amount,
        string memory _purpose,
        string memory _receiptUrl
    ) public {
        
        // Safety Check: Prevent recording the exact same donation ID twice!
        // We check if the ID string length is 0 (meaning it doesn't exist yet).
        require(bytes(donations[_donationId].donationId).length == 0, "Donation ID already recorded!");

        // 1. Create the new immutable record
        DonationRecord memory newRecord = DonationRecord({
            donationId: _donationId,
            beneficiaryId: _beneficiaryId,
            amount: _amount,
            purpose: _purpose,
            receiptUrl: _receiptUrl,
            timestamp: block.timestamp // 'block.timestamp' is the current blockchain time
        });

        // 2. Save it permanently into our mapping
        donations[_donationId] = newRecord;

        // 3. Increment our total counter
        totalDonationsRecorded++;

        // 4. Broadcast the event so the public/frontend knows it was added!
        emit DonationRecorded(
            _donationId, 
            _beneficiaryId, 
            _amount, 
            _purpose, 
            _receiptUrl, 
            block.timestamp
        );
    }

    /**
     * @dev A helper function to fetch a specific donation's details using its ID.
     */
    function getDonationDetails(string memory _donationId) public view returns (
        string memory beneficiaryId,
        uint256 amount,
        string memory purpose,
        string memory receiptUrl,
        uint256 timestamp
    ) {
        // Ensure the record actually exists
        require(bytes(donations[_donationId].donationId).length != 0, "Donation record not found!");
        
        // Fetch the record from the blockchain
        DonationRecord memory record = donations[_donationId];
        
        // Return its data
        return (
            record.beneficiaryId, 
            record.amount, 
            record.purpose, 
            record.receiptUrl, 
            record.timestamp
        );
    }
}
