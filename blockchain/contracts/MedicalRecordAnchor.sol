// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./interfaces/IMedicalRecordAnchor.sol";

/**
 * @title MedicalRecordAnchor
 * @notice Smart contract for anchoring medical record hashes on Polygon
 * @dev Provides immutable, timestamped proof of medical record existence
 * @author VoiceMed Pro
 */
contract MedicalRecordAnchor is IMedicalRecordAnchor, Ownable, Pausable, ReentrancyGuard {
    using ECDSA for bytes32;

    // ============================================
    // STATE VARIABLES
    // ============================================

    // Mapping from data hash to anchored record
    mapping(string => AnchoredRecord) private records;
    
    // Mapping from transaction ID to data hash
    mapping(bytes32 => string) private txToHash;
    
    // Array of all data hashes for enumeration
    string[] private allHashes;
    
    // Mapping from patient ID to their hashes
    mapping(string => string[]) private patientRecords;
    
    // Mapping from provider address to authorization status
    mapping(address => bool) private authorizedProviders;
    
    // Platform wallet for fees
    address public platformWallet;
    
    // Fee for anchoring (in wei)
    uint256 public anchorFee;
    
    // Batch limit
    uint256 public constant MAX_BATCH_SIZE = 50;
    
    // Version
    string public constant VERSION = "2.0.0";

    // ============================================
    // CONSTRUCTOR
    // ============================================

    constructor(address _platformWallet) {
        require(_platformWallet != address(0), "Invalid platform wallet");
        platformWallet = _platformWallet;
        anchorFee = 0; // Free for now, can be updated
        authorizedProviders[msg.sender] = true;
    }

    // ============================================
    // MODIFIERS
    // ============================================

    modifier onlyAuthorizedProvider() {
        require(
            authorizedProviders[msg.sender] || msg.sender == owner(),
            "Not authorized provider"
        );
        _;
    }

    modifier validHash(string memory dataHash) {
        require(bytes(dataHash).length == 64, "Invalid hash length (must be 64 chars)");
        _;
    }

    modifier recordExists(string memory dataHash) {
        require(records[dataHash].exists, "Record not found");
        _;
    }

    modifier recordNotRevoked(string memory dataHash) {
        require(!records[dataHash].isRevoked, "Record is revoked");
        _;
    }

    // ============================================
    // CORE FUNCTIONS
    // ============================================

    /**
     * @notice Anchor a medical record hash on the blockchain
     * @param dataHash SHA-256 hash of the medical record data (64 char hex)
     * @param recordType Type of medical record (e.g., "EMR", "PRESCRIPTION", "LAB_REPORT")
     * @param patientId Anonymous patient identifier
     * @return txId Unique transaction identifier
     */
    function anchorHash(
        string memory dataHash,
        string memory recordType,
        string memory patientId
    ) 
        external 
        override 
        nonReentrant 
        whenNotPaused 
        onlyAuthorizedProvider 
        validHash(dataHash) 
        returns (bytes32) 
    {
        require(!records[dataHash].exists, "Record already anchored");

        bytes32 txId = keccak256(
            abi.encodePacked(dataHash, block.timestamp, msg.sender, block.number)
        );

        records[dataHash] = AnchoredRecord({
            dataHash: dataHash,
            recordType: recordType,
            patientId: patientId,
            anchoredBy: msg.sender,
            timestamp: block.timestamp,
            exists: true,
            isRevoked: false
        });

        txToHash[txId] = dataHash;
        allHashes.push(dataHash);
        patientRecords[patientId].push(dataHash);

        emit HashAnchored(txId, dataHash, recordType, patientId, msg.sender, block.timestamp);

        return txId;
    }

    /**
     * @notice Verify if a hash exists and is valid on the blockchain
     * @param dataHash SHA-256 hash to verify
     * @return exists Whether the hash exists
     * @return timestamp When it was anchored
     * @return anchoredBy Who anchored it
     * @return isRevoked Whether it has been revoked
     */
    function verifyHash(
        string memory dataHash
    ) 
        external 
        view 
        override 
        returns (bool exists, uint256 timestamp, address anchoredBy, bool isRevoked) 
    {
        AnchoredRecord memory record = records[dataHash];
        return (
            record.exists,
            record.timestamp,
            record.anchoredBy,
            record.isRevoked
        );
    }

    /**
     * @notice Revoke a previously anchored hash
     * @param dataHash Hash to revoke
     * @param reason Reason for revocation
     */
    function revokeHash(
        string memory dataHash,
        string memory reason
    ) 
        external 
        override 
        nonReentrant 
        whenNotPaused 
        onlyAuthorizedProvider 
        recordExists(dataHash) 
        recordNotRevoked(dataHash) 
    {
        require(
            records[dataHash].anchoredBy == msg.sender || msg.sender == owner(),
            "Only original anchorer or owner can revoke"
        );

        records[dataHash].isRevoked = true;

        bytes32 txId = keccak256(
            abi.encodePacked(dataHash, "revoke", block.timestamp, msg.sender)
        );

        emit HashRevoked(txId, dataHash, msg.sender, block.timestamp);
    }

    /**
     * @notice Batch anchor multiple hashes
     * @param dataHashes Array of data hashes
     * @param recordTypes Array of record types
     * @param patientIds Array of patient IDs
     * @return batchId Batch transaction identifier
     */
    function batchAnchorHash(
        string[] memory dataHashes,
        string[] memory recordTypes,
        string[] memory patientIds
    ) 
        external 
        override 
        nonReentrant 
        whenNotPaused 
        onlyAuthorizedProvider 
        returns (bytes32) 
    {
        require(
            dataHashes.length == recordTypes.length && 
            dataHashes.length == patientIds.length,
            "Arrays must be same length"
        );
        require(dataHashes.length <= MAX_BATCH_SIZE, "Batch too large");
        require(dataHashes.length > 0, "Empty batch");

        bytes32 batchId = keccak256(
            abi.encodePacked(
                // Use abi.encode for arrays (abi.encodePacked doesn't support dynamic array types)
                keccak256(abi.encode(dataHashes)),
                block.timestamp,
                msg.sender
            )
        );

        uint256 anchoredCount = 0;
        for (uint256 i = 0; i < dataHashes.length; i++) {
            if (!records[dataHashes[i]].exists) {
                require(bytes(dataHashes[i]).length == 64, "Invalid hash in batch");
                
                records[dataHashes[i]] = AnchoredRecord({
                    dataHash: dataHashes[i],
                    recordType: recordTypes[i],
                    patientId: patientIds[i],
                    anchoredBy: msg.sender,
                    timestamp: block.timestamp,
                    exists: true,
                    isRevoked: false
                });

                allHashes.push(dataHashes[i]);
                patientRecords[patientIds[i]].push(dataHashes[i]);
                anchoredCount++;
            }
        }

        require(anchoredCount > 0, "All hashes already anchored");

        emit BatchAnchored(batchId, anchoredCount, msg.sender, block.timestamp);

        return batchId;
    }

    // ============================================
    // QUERY FUNCTIONS
    // ============================================

    /**
     * @notice Get record by hash
     */
    function getRecordByHash(
        string memory dataHash
    ) 
        external 
        view 
        override 
        recordExists(dataHash) 
        returns (AnchoredRecord memory) 
    {
        return records[dataHash];
    }

    /**
     * @notice Get records by patient ID with pagination
     */
    function getRecordsByPatient(
        string memory patientId,
        uint256 offset,
        uint256 limit
    ) 
        external 
        view 
        override 
        returns (string[] memory hashes, uint256 total) 
    {
        string[] storage patientHashes = patientRecords[patientId];
        total = patientHashes.length;

        uint256 resultCount = limit;
        if (offset + limit > total) {
            resultCount = total > offset ? total - offset : 0;
        }

        hashes = new string[](resultCount);
        for (uint256 i = 0; i < resultCount; i++) {
            hashes[i] = patientHashes[offset + i];
        }

        return (hashes, total);
    }

    /**
     * @notice Get total number of anchored records
     */
    function getTotalRecords() external view override returns (uint256) {
        return allHashes.length;
    }

    /**
     * @notice Get record count for a patient
     */
    function getPatientRecordCount(string memory patientId) external view returns (uint256) {
        return patientRecords[patientId].length;
    }

    /**
     * @notice Check if a provider is authorized
     */
    function isAuthorizedProvider(address provider) external view override returns (bool) {
        return authorizedProviders[provider];
    }

    // ============================================
    // ADMIN FUNCTIONS
    // ============================================

    /**
     * @notice Add authorized provider
     */
    function addAuthorizedProvider(address provider) external onlyOwner {
        require(provider != address(0), "Invalid address");
        require(!authorizedProviders[provider], "Already authorized");
        authorizedProviders[provider] = true;
    }

    /**
     * @notice Remove authorized provider
     */
    function removeAuthorizedProvider(address provider) external onlyOwner {
        require(provider != address(0), "Invalid address");
        require(authorizedProviders[provider], "Not authorized");
        require(provider != owner(), "Cannot remove owner");
        authorizedProviders[provider] = false;
    }

    /**
     * @notice Update anchor fee
     */
    function setAnchorFee(uint256 _fee) external onlyOwner {
        anchorFee = _fee;
    }

    /**
     * @notice Update platform wallet
     */
    function setPlatformWallet(address _wallet) external onlyOwner {
        require(_wallet != address(0), "Invalid wallet");
        platformWallet = _wallet;
    }

    /**
     * @notice Pause contract
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Withdraw accumulated fees
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        payable(platformWallet).transfer(balance);
    }

    // ============================================
    // RECEIVE
    // ============================================

    receive() external payable {}
    fallback() external payable {}
}
