import { z } from 'zod';
import { BlockchainRecordType } from '@prisma/client';

export const anchorRecordSchema = z.object({
  body: z.object({
    patientId: z.string({
      required_error: 'Patient ID is required',
    }).cuid('Invalid patient ID'),

    medicalRecordId: z.string().cuid('Invalid medical record ID').optional().nullable(),

    recordType: z.nativeEnum(BlockchainRecordType, {
      required_error: 'Record type is required',
    }),

    data: z.any({
      required_error: 'Data is required',
    }),

    metadata: z.record(z.any()).optional().nullable(),
  }),
});

export const verifyRecordSchema = z.object({
  body: z.object({
    recordId: z.string().cuid().optional(),
    dataHash: z.string().min(64).max(64).optional(),
    txHash: z.string().min(66).max(66).optional(),
  }).refine((data) => data.recordId || data.dataHash || data.txHash, {
    message: 'At least one of recordId, dataHash, or txHash is required',
  }),
});

export const consentSchema = z.object({
  body: z.object({
    patientId: z.string().cuid('Invalid patient ID'),
    providerId: z.string().cuid('Invalid provider ID').optional().nullable(),
    recordType: z.string().min(1, 'Record type is required'),
    accessLevel: z.enum(['READ', 'WRITE', 'FULL']),
    expiresAt: z.string().datetime().optional().nullable(),
    purpose: z.string().max(500).optional().nullable(),
  }),
});

export const revokeConsentSchema = z.object({
  params: z.object({
    id: z.string().cuid('Invalid consent ID'),
  }),
  body: z.object({
    reason: z.string().max(500).optional().nullable(),
  }),
});

export const blockchainIdSchema = z.object({
  params: z.object({
    id: z.string().cuid('Invalid record ID'),
  }),
});

export const blockchainQuerySchema = z.object({
  query: z.object({
    page: z.string().transform(Number).pipe(z.number().min(1)).optional().default('1'),
    limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional().default('10'),
    patientId: z.string().cuid().optional(),
    medicalRecordId: z.string().cuid().optional(),
    recordType: z.nativeEnum(BlockchainRecordType).optional(),
    status: z.string().optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
  }),
});

export type AnchorRecordInput = z.infer<typeof anchorRecordSchema>['body'];
export type VerifyRecordInput = z.infer<typeof verifyRecordSchema>['body'];
export type ConsentInput = z.infer<typeof consentSchema>['body'];
export type RevokeConsentInput = z.infer<typeof revokeConsentSchema>['body'];
export type BlockchainQueryInput = z.infer<typeof blockchainQuerySchema>['query'];