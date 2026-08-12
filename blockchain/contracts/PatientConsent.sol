// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./interfaces/IPatientConsent.sol";

/**
 * @title PatientConsent
 * @notice Smart contract for managing patient consent on blockchain
 * @dev Provides immutable consent records for HIPAA compliance
 * @author VoiceMed Pro
 */
contract PatientConsent is IPatientConsent, Ownable, Pausable, ReentrancyGuard {

    // ============================================
    // STATE VARIABLES
    // ============================================

    // Mapping from consent ID to consent record
    mapping(bytes32 => ConsentRecord) private consents;
    
    // Mapping from patient ID to their consent IDs
    mapping(string => bytes32[]) private patientConsents;
    
    // Mapping from provider to their consent IDs
    mapping(address => bytes32[]) private providerConsents;
    
    // Mapping for quick consent lookup
    mapping(bytes32 => bool) private consentLookup;
    
    // Consent lookup key: keccak256(patientId, provider, recordType)
    mapping(bytes32 => bytes32) private activeConsentKeys;
    
    // Default consent expiry (1 year)
    uint256 public constant DEFAULT_EXPIRY = 365 days;
    
    // Maximum consent expiry (5 years)
    uint256 public constant MAX_EXPIRY = 1825 days;

    // ============================================
    // CONSTRUCTOR
    // ============================================

    constructor() {
        // Contract owner is set by Ownable
    }

    // ============================================
    // MODIFIERS
    // ============================================

    modifier consentExists(bytes32 consentId) {
        require(consentLookup[consentId], "Consent not found");
        _;
    }

    modifier consentActive(bytes32 consentId) {
        ConsentRecord storage record = consents[consentId];
        require(record.isActive && !record.isRevoked, "Consent not active");
        require(block.timestamp <= record.expiresAt, "Consent expired");
        _;
    }

    // ============================================
    // CORE FUNCTIONS
    // ============================================

    /**
     * @notice Grant consent for a provider to access patient records
     * @param patientId Anonymous patient identifier
     * @param provider Address of the healthcare provider
     * @param recordType Type of records being consented
     * @param accessLevel Level of access (READ, WRITE, FULL)
     * @param expiresAt Timestamp when consent expires (0 for default 1 year)
     * @return consentId Unique consent identifier
     */
    function grantConsent(
        string memory patientId,
        address provider,
        string memory recordType,
        string memory accessLevel,
        uint256 expiresAt
    ) 
        external 
        override 
        nonReentrant 
        whenNotPaused 
        returns (bytes32) 
    {
        require(bytes(patientId).length > 0, "Patient ID required");
        require(provider != address(0), "Provider address required");
        require(bytes(recordType).length > 0, "Record type required");
        require(
            keccak256(bytes(accessLevel)) == keccak256(bytes("READ")) ||
            keccak256(bytes(accessLevel)) == keccak256(bytes("WRITE")) ||
            keccak256(bytes(accessLevel)) == keccak256(bytes("FULL")),
            "Invalid access level"
        );

        // Check for existing active consent
        bytes32 lookupKey = keccak256(
            abi.encodePacked(patientId, provider, recordType)
        );
        bytes32 existingConsentId = activeConsentKeys[lookupKey];
        if (existingConsentId != bytes32(0) && consents[existingConsentId].isActive) {
            // Revoke old consent
            consents[existingConsentId].isActive = false;
            consents[existingConsentId].isRevoked = true;
            consents[existingConsentId].revokedAt = block.timestamp;
            consents[existingConsentId].revokeReason = "Replaced by new consent";
        }

        // Set expiry
        uint256 consentExpiry = expiresAt > 0 ? expiresAt : block.timestamp + DEFAULT_EXPIRY;
        require(consentExpiry > block.timestamp, "Expiry must be in future");
        require(consentExpiry <= block.timestamp + MAX_EXPIRY, "Expiry too far in future");

        // Generate consent ID
        bytes32 consentId = keccak256(
            abi.encodePacked(patientId, provider, recordType, block.timestamp, msg.sender)
        );

        // Create consent record
        consents[consentId] = ConsentRecord({
            consentId: consentId,
            patientId: patientId,
            provider: provider,
            recordType: recordType,
            accessLevel: accessLevel,
            grantedAt: block.timestamp,
            expiresAt: consentExpiry,
            isActive: true,
            isRevoked: false,
            revokedAt: 0,
            revokeReason: ""
        });

        // Update mappings
        consentLookup[consentId] = true;
        patientConsents[patientId].push(consentId);
        providerConsents[provider].push(consentId);
        activeConsentKeys[lookupKey] = consentId;

        emit ConsentGranted(consentId, patientId, provider, recordType, accessLevel, consentExpiry);

        return consentId;
    }

    /**
     * @notice Revoke a previously granted consent
     * @param consentId ID of the consent to revoke
     * @param reason Reason for revocation
     */
    function revokeConsent(
        bytes32 consentId,
        string memory reason
    ) 
        external 
        override 
        nonReentrant 
        whenNotPaused 
        consentExists(consentId) 
        consentActive(consentId) 
    {
        ConsentRecord storage record = consents[consentId];

        record.isActive = false;
        record.isRevoked = true;
        record.revokedAt = block.timestamp;
        record.revokeReason = reason;

        // Remove from active consent keys
        bytes32 lookupKey = keccak256(
            abi.encodePacked(record.patientId, record.provider, record.recordType)
        );
        delete activeConsentKeys[lookupKey];

        emit ConsentRevoked(
            consentId,
            record.patientId,
            record.provider,
            reason,
            block.timestamp
        );
    }

    /**
     * @notice Update an existing consent's access level or expiry
     * @param consentId ID of the consent to update
     * @param accessLevel New access level
     * @param expiresAt New expiry timestamp
     */
    function updateConsent(
        bytes32 consentId,
        string memory accessLevel,
        uint256 expiresAt
    ) 
        external 
        override 
        nonReentrant 
        whenNotPaused 
        consentExists(consentId) 
        consentActive(consentId) 
    {
        require(
            keccak256(bytes(accessLevel)) == keccak256(bytes("READ")) ||
            keccak256(bytes(accessLevel)) == keccak256(bytes("WRITE")) ||
            keccak256(bytes(accessLevel)) == keccak256(bytes("FULL")),
            "Invalid access level"
        );
        require(expiresAt > block.timestamp, "Expiry must be in future");

        ConsentRecord storage record = consents[consentId];
        record.accessLevel = accessLevel;
        record.expiresAt = expiresAt;

        emit ConsentUpdated(consentId, accessLevel, expiresAt);
    }

    /**
     * @notice Check if a provider has consent to access patient records
     * @param patientId Patient identifier
     * @param provider Provider address
     * @param recordType Type of record
     * @return hasAccess Whether access is granted
     * @return accessLevel Level of access
     * @return expiresAt When consent expires
     */
    function checkConsent(
        string memory patientId,
        address provider,
        string memory recordType
    ) 
        external 
        view 
        override 
        returns (bool hasAccess, string memory accessLevel, uint256 expiresAt) 
    {
        bytes32 lookupKey = keccak256(
            abi.encodePacked(patientId, provider, recordType)
        );
        bytes32 consentId = activeConsentKeys[lookupKey];

        if (consentId == bytes32(0)) {
            return (false, "", 0);
        }

        ConsentRecord storage record = consents[consentId];
        if (!record.isActive || record.isRevoked || block.timestamp > record.expiresAt) {
            return (false, "", 0);
        }

        return (true, record.accessLevel, record.expiresAt);
    }

    /**
     * @notice Check if active consent exists
     */
    function hasActiveConsent(
        string memory patientId,
        address provider,
        string memory recordType
    ) 
        external 
        view 
        override 
        returns (bool) 
    {
        (bool hasAccess, , ) = this.checkConsent(patientId, provider, recordType);
        return hasAccess;
    }

    // ============================================
    // QUERY FUNCTIONS
    // ============================================

    /**
     * @notice Get all consents for a patient
     */
    function getPatientConsents(
        string memory patientId,
        uint256 offset,
        uint256 limit
    ) 
        external 
        view 
        override 
        returns (ConsentRecord[] memory records, uint256 total) 
    {
        bytes32[] storage ids = patientConsents[patientId];
        total = ids.length;

        uint256 resultCount = limit;
        if (offset + limit > total) {
            resultCount = total > offset ? total - offset : 0;
        }

        records = new ConsentRecord[](resultCount);
        for (uint256 i = 0; i < resultCount; i++) {
            records[i] = consents[ids[offset + i]];
        }

        return (records, total);
    }

    /**
     * @notice Get all consents for a provider
     */
    function getProviderConsents(
        address provider,
        uint256 offset,
        uint256 limit
    ) 
        external 
        view 
        override 
        returns (ConsentRecord[] memory records, uint256 total) 
    {
        bytes32[] storage ids = providerConsents[provider];
        total = ids.length;

        uint256 resultCount = limit;
        if (offset + limit > total) {
            resultCount = total > offset ? total - offset : 0;
        }

        records = new ConsentRecord[](resultCount);
        for (uint256 i = 0; i < resultCount; i++) {
            records[i] = consents[ids[offset + i]];
        }

        return (records, total);
    }

    /**
     * @notice Get a specific consent record
     */
    function getConsent(bytes32 consentId) 
        external 
        view 
        consentExists(consentId) 
        returns (ConsentRecord memory) 
    {
        return consents[consentId];
    }

    // ============================================
    // ADMIN FUNCTIONS
    // ============================================

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}