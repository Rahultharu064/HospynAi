"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashMedicalRecord = hashMedicalRecord;
exports.hashAnchorPayload = hashAnchorPayload;
exports.hashConsentPayload = hashConsentPayload;
const crypto_1 = __importDefault(require("crypto"));
/** Canonical SHA-256 hash for a signed EMR (used by EMR sign + blockchain verify). */
function hashMedicalRecord(medicalRecordId, patientId, signedAt) {
    const payload = JSON.stringify({ medicalRecordId, patientId, signedAt });
    return crypto_1.default.createHash('sha256').update(payload).digest('hex');
}
/** Canonical SHA-256 hash for manual blockchain API anchoring. */
function hashAnchorPayload(input) {
    const payload = JSON.stringify({
        patientId: input.patientId,
        medicalRecordId: input.medicalRecordId ?? null,
        recordType: input.recordType,
        data: input.data,
        timestamp: input.timestamp,
    });
    return crypto_1.default.createHash('sha256').update(payload).digest('hex');
}
/** Hash for consent records stored on-chain + in DB metadata. */
function hashConsentPayload(input) {
    const payload = JSON.stringify(input);
    return crypto_1.default.createHash('sha256').update(payload).digest('hex');
}
//# sourceMappingURL=blockchainHash.js.map