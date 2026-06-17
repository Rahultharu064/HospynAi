import crypto from 'crypto';

/** Canonical SHA-256 hash for a signed EMR (used by EMR sign + blockchain verify). */
export function hashMedicalRecord(
  medicalRecordId: string,
  patientId: string,
  signedAt: string
): string {
  const payload = JSON.stringify({ medicalRecordId, patientId, signedAt });
  return crypto.createHash('sha256').update(payload).digest('hex');
}

/** Canonical SHA-256 hash for manual blockchain API anchoring. */
export function hashAnchorPayload(input: {
  patientId: string;
  medicalRecordId?: string | null;
  recordType: string;
  data: unknown;
  timestamp: string;
}): string {
  const payload = JSON.stringify({
    patientId: input.patientId,
    medicalRecordId: input.medicalRecordId ?? null,
    recordType: input.recordType,
    data: input.data,
    timestamp: input.timestamp,
  });
  return crypto.createHash('sha256').update(payload).digest('hex');
}

/** Hash for consent records stored on-chain + in DB metadata. */
export function hashConsentPayload(input: {
  patientId: string;
  providerAddress: string;
  recordType: string;
  accessLevel: string;
  grantedAt: string;
}): string {
  const payload = JSON.stringify(input);
  return crypto.createHash('sha256').update(payload).digest('hex');
}
