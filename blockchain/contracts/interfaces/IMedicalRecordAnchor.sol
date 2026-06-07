// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IMedicalRecordAnchor
 * @notice Interface for medical record anchoring on blockchain
 */
interface IMedicalRecordAnchor {
    struct AnchoredRecord {
        string dataHash;
        string recordType;
        string patientId;
        address anchoredBy;
        uint256 timestamp;
        bool exists;
        bool isRevoked;
    }

    event HashAnchored(
        bytes32 indexed txId,
        string dataHash,
        string recordType,
        string patientId,
        address indexed anchoredBy,
        uint256 timestamp
    );

    event HashRevoked(
        bytes32 indexed txId,
        string dataHash,
        address indexed revokedBy,
        uint256 timestamp
    );

    event BatchAnchored(
        bytes32 indexed batchId,
        uint256 count,
        address indexed anchoredBy,
        uint256 timestamp
    );

    function anchorHash(
        string memory dataHash,
        string memory recordType,
        string memory patientId
    ) external returns (bytes32);

    function verifyHash(
        string memory dataHash
    ) external view returns (bool exists, uint256 timestamp, address anchoredBy, bool isRevoked);

    function revokeHash(string memory dataHash, string memory reason) external;

    function batchAnchorHash(
        string[] memory dataHashes,
        string[] memory recordTypes,
        string[] memory patientIds
    ) external returns (bytes32);

    function getRecordByHash(
        string memory dataHash
    ) external view returns (AnchoredRecord memory);

    function getRecordsByPatient(
        string memory patientId,
        uint256 offset,
        uint256 limit
    ) external view returns (string[] memory hashes, uint256 total);

    function getTotalRecords() external view returns (uint256);

    function isAuthorizedProvider(address provider) external view returns (bool);
}