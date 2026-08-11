"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MEDICAL_DATA_REGISTRY_ABI = exports.PATIENT_CONSENT_ABI = exports.MEDICAL_RECORD_ANCHOR_ABI = void 0;
exports.MEDICAL_RECORD_ANCHOR_ABI = [
    'function anchorHash(string dataHash, string recordType, string patientId) external returns (bytes32)',
    'function verifyHash(string dataHash) external view returns (bool exists, uint256 timestamp, address anchoredBy, bool isRevoked)',
    'function authorizeProvider(address provider) external',
    'event HashAnchored(bytes32 indexed txId, string dataHash, string recordType, string patientId, address indexed anchoredBy, uint256 timestamp)',
];
exports.PATIENT_CONSENT_ABI = [
    'function grantConsent(string patientId, address provider, string recordType, string accessLevel, uint256 expiresAt) external returns (bytes32)',
    'function revokeConsent(bytes32 consentId, string reason) external',
    'function checkConsent(string patientId, address provider, string recordType) external view returns (bool)',
    'event ConsentGranted(bytes32 indexed consentId, string patientId, address provider, string recordType, string accessLevel, uint256 expiresAt)',
    'event ConsentRevoked(bytes32 indexed consentId, string patientId, address provider, string reason)',
];
exports.MEDICAL_DATA_REGISTRY_ABI = [
    'function recordTransaction(string dataHash, string dataType, string operation, string patientId, address targetProvider, string metadata) external returns (bytes32)',
];
//# sourceMappingURL=contractAbis.js.map