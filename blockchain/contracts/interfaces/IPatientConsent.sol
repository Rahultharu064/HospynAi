// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IPatientConsent
 * @notice Interface for patient consent management on blockchain
 */
interface IPatientConsent {
    struct ConsentRecord {
        bytes32 consentId;
        string patientId;
        address provider;
        string recordType;
        string accessLevel;  // READ, WRITE, FULL
        uint256 grantedAt;
        uint256 expiresAt;
        bool isActive;
        bool isRevoked;
        uint256 revokedAt;
        string revokeReason;
    }

    event ConsentGranted(
        bytes32 indexed consentId,
        string patientId,
        address indexed provider,
        string recordType,
        string accessLevel,
        uint256 expiresAt
    );

    event ConsentRevoked(
        bytes32 indexed consentId,
        string patientId,
        address indexed provider,
        string reason,
        uint256 timestamp
    );

    event ConsentUpdated(
        bytes32 indexed consentId,
        string newAccessLevel,
        uint256 newExpiresAt
    );

    function grantConsent(
        string memory patientId,
        address provider,
        string memory recordType,
        string memory accessLevel,
        uint256 expiresAt
    ) external returns (bytes32);

    function revokeConsent(bytes32 consentId, string memory reason) external;

    function updateConsent(
        bytes32 consentId,
        string memory accessLevel,
        uint256 expiresAt
    ) external;

    function checkConsent(
        string memory patientId,
        address provider,
        string memory recordType
    ) external view returns (bool hasAccess, string memory accessLevel, uint256 expiresAt);

    function getPatientConsents(
        string memory patientId,
        uint256 offset,
        uint256 limit
    ) external view returns (ConsentRecord[] memory records, uint256 total);

    function getProviderConsents(
        address provider,
        uint256 offset,
        uint256 limit
    ) external view returns (ConsentRecord[] memory records, uint256 total);

    function hasActiveConsent(
        string memory patientId,
        address provider,
        string memory recordType
    ) external view returns (bool);
}