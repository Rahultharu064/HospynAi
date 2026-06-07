// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title MedicalRecordAnchor
 * @notice Smart contract for anchoring medical record hashes on Polygon
 * @dev Provides immutable, timestamped proof of medical record existence
 */
contract MedicalRecordAnchor {
    // ============================================
    // STRUCTS
    // ============================================

    struct AnchoredRecord {
        string dataHash;
        string recordType;
        string patientId;
        address anchoredBy;
        uint256 timestamp;
        bool exists;
    }

    // ============================================
    // STATE VARIABLES
    // ============================================

    // Mapping from data hash to anchored record
    mapping(string => AnchoredRecord) private records;
    
    // Mapping from transaction ID to data hash
    mapping(bytes32 => string) private txToHash;
    
    // Array of all data hashes (for enumeration)
    string[] private allHashes;
    
    // Owner of the contract
    address public owner;
    
    // Platform wallet for fees
    address public platformWallet;

    // ============================================
    // EVENTS
    // ============================================

    event HashAnchored(
        bytes32 indexed txId,
        string dataHash,
        string recordType,
        string patientId,
        address indexed anchoredBy,
        uint256 timestamp
    );

    event ConsentGranted(
        bytes32 indexed consentId,
        string patientId,
        address provider,
        string recordType,
        uint256 expiresAt
    );

    event ConsentRevoked(
        bytes32 indexed consentId,
        string reason
    );

    // ============================================
    // MODIFIERS
    // ============================================

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    // ============================================
    // CONSTRUCTOR
    // ============================================

    constructor(address _platformWallet) {
        owner = msg.sender;
        platformWallet = _platformWallet;
    }

    // ============================================
    // CORE FUNCTIONS
    // ============================================

    /**
     * @notice Anchor a medical record hash on the blockchain
     * @param dataHash SHA-256 hash of the medical record data
     * @param recordType Type of medical record
     * @param patientId Anonymous patient identifier
     * @return txId Transaction identifier
     */
    function anchorHash(
        string memory dataHash,
        string memory recordType,
        string memory patientId
    ) external returns (bytes32) {
        require(bytes(dataHash).length > 0, "Data hash cannot be empty");
        require(!records[dataHash].exists, "Record already anchored");

        bytes32 txId = keccak256(abi.encodePacked(dataHash, block.timestamp, msg.sender));

        records[dataHash] = AnchoredRecord({
            dataHash: dataHash,
            recordType: recordType,
            patientId: patientId,
            anchoredBy: msg.sender,
            timestamp: block.timestamp,
            exists: true
        });

        txToHash[txId] = dataHash;
        allHashes.push(dataHash);

        emit HashAnchored(txId, dataHash, recordType, patientId, msg.sender, block.timestamp);

        return txId;
    }

    /**
     * @notice Verify if a hash exists on the blockchain
     * @param dataHash SHA-256 hash to verify
     * @return exists Whether the hash exists
     * @return timestamp When it was anchored
     * @return anchoredBy Who anchored it
     * @return blockNumber Block number when anchored
     */
    function verifyHash(
        string memory dataHash
    ) external view returns (
        bool exists,
        uint256 timestamp,
        address anchoredBy,
        uint256 blockNumber
    ) {
        AnchoredRecord memory record = records[dataHash];
        return (
            record.exists,
            record.timestamp,
            record.anchoredBy,
            0 // Block number not directly available in view function
        );
    }

    /**
     * @notice Get a record by its data hash
     * @param dataHash SHA-256 hash
     * @return AnchoredRecord struct
     */
    function getRecordByHash(
        string memory dataHash
    ) external view returns (AnchoredRecord memory) {
        require(records[dataHash].exists, "Record not found");
        return records[dataHash];
    }

    /**
     * @notice Get total number of anchored records
     * @return count Total records
     */
    function getTotalRecords() external view returns (uint256) {
        return allHashes.length;
    }

    /**
     * @notice Get records by patient ID (returns array of hashes)
     * @param patientId Patient identifier
     * @param offset Pagination offset
     * @param limit Pagination limit
     * @return hashes Array of data hashes
     * @return total Total matching records
     */
    function getRecordsByPatient(
        string memory patientId,
        uint256 offset,
        uint256 limit
    ) external view returns (string[] memory hashes, uint256 total) {
        // Count matching records
        uint256 matchCount = 0;
        for (uint256 i = 0; i < allHashes.length; i++) {
            if (keccak256(abi.encodePacked(records[allHashes[i]].patientId)) == 
                keccak256(abi.encodePacked(patientId))) {
                matchCount++;
            }
        }

        // Get paginated results
        uint256 resultCount = 0;
        uint256 skipCount = 0;
        string[] memory result = new string[](limit);
        
        for (uint256 i = 0; i < allHashes.length && resultCount < limit; i++) {
            if (keccak256(abi.encodePacked(records[allHashes[i]].patientId)) == 
                keccak256(abi.encodePacked(patientId))) {
                if (skipCount >= offset) {
                    result[resultCount] = allHashes[i];
                    resultCount++;
                }
                skipCount++;
            }
        }

        // Resize array to actual result count
        assembly {
            mstore(result, resultCount)
        }

        return (result, matchCount);
    }

    /**
     * @notice Batch anchor multiple hashes
     * @param dataHashes Array of data hashes
     * @param recordTypes Array of record types
     * @param patientIds Array of patient IDs
     */
    function batchAnchorHash(
        string[] memory dataHashes,
        string[] memory recordTypes,
        string[] memory patientIds
    ) external {
        require(
            dataHashes.length == recordTypes.length && 
            dataHashes.length == patientIds.length,
            "Arrays must be same length"
        );
        require(dataHashes.length <= 50, "Batch limit is 50");

        for (uint256 i = 0; i < dataHashes.length; i++) {
            if (!records[dataHashes[i]].exists) {
                bytes32 txId = keccak256(
                    abi.encodePacked(dataHashes[i], block.timestamp, msg.sender, i)
                );

                records[dataHashes[i]] = AnchoredRecord({
                    dataHash: dataHashes[i],
                    recordType: recordTypes[i],
                    patientId: patientIds[i],
                    anchoredBy: msg.sender,
                    timestamp: block.timestamp,
                    exists: true
                });

                txToHash[txId] = dataHashes[i];
                allHashes.push(dataHashes[i]);

                emit HashAnchored(
                    txId,
                    dataHashes[i],
                    recordTypes[i],
                    patientIds[i],
                    msg.sender,
                    block.timestamp
                );
            }
        }
    }
}