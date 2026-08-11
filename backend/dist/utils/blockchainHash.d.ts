/** Canonical SHA-256 hash for a signed EMR (used by EMR sign + blockchain verify). */
export declare function hashMedicalRecord(medicalRecordId: string, patientId: string, signedAt: string): string;
/** Canonical SHA-256 hash for manual blockchain API anchoring. */
export declare function hashAnchorPayload(input: {
    patientId: string;
    medicalRecordId?: string | null;
    recordType: string;
    data: unknown;
    timestamp: string;
}): string;
/** Hash for consent records stored on-chain + in DB metadata. */
export declare function hashConsentPayload(input: {
    patientId: string;
    providerAddress: string;
    recordType: string;
    accessLevel: string;
    grantedAt: string;
}): string;
//# sourceMappingURL=blockchainHash.d.ts.map