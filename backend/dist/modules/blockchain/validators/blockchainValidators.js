"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.blockchainQuerySchema = exports.blockchainIdSchema = exports.revokeConsentSchema = exports.consentSchema = exports.verifyRecordSchema = exports.anchorRecordSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.anchorRecordSchema = zod_1.z.object({
    body: zod_1.z.object({
        patientId: zod_1.z.string({
            required_error: 'Patient ID is required',
        }).cuid('Invalid patient ID'),
        medicalRecordId: zod_1.z.string().cuid('Invalid medical record ID').optional().nullable(),
        recordType: zod_1.z.nativeEnum(client_1.BlockchainRecordType, {
            required_error: 'Record type is required',
        }),
        data: zod_1.z.any({
            required_error: 'Data is required',
        }),
        metadata: zod_1.z.record(zod_1.z.any()).optional().nullable(),
    }),
});
exports.verifyRecordSchema = zod_1.z.object({
    body: zod_1.z.object({
        recordId: zod_1.z.string().cuid().optional(),
        dataHash: zod_1.z.string().min(64).max(64).optional(),
        txHash: zod_1.z.string().min(66).max(66).optional(),
    }).refine((data) => data.recordId || data.dataHash || data.txHash, {
        message: 'At least one of recordId, dataHash, or txHash is required',
    }),
});
exports.consentSchema = zod_1.z.object({
    body: zod_1.z.object({
        patientId: zod_1.z.string().cuid('Invalid patient ID'),
        providerId: zod_1.z.string().cuid('Invalid provider ID').optional().nullable(),
        recordType: zod_1.z.string().min(1, 'Record type is required'),
        accessLevel: zod_1.z.enum(['READ', 'WRITE', 'FULL']),
        expiresAt: zod_1.z.string().datetime().optional().nullable(),
        purpose: zod_1.z.string().max(500).optional().nullable(),
    }),
});
exports.revokeConsentSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('Invalid consent ID'),
    }),
    body: zod_1.z.object({
        reason: zod_1.z.string().max(500).optional().nullable(),
    }),
});
exports.blockchainIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('Invalid record ID'),
    }),
});
exports.blockchainQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(1)).optional().default('1'),
        limit: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(1).max(100)).optional().default('10'),
        patientId: zod_1.z.string().cuid().optional(),
        medicalRecordId: zod_1.z.string().cuid().optional(),
        recordType: zod_1.z.nativeEnum(client_1.BlockchainRecordType).optional(),
        status: zod_1.z.string().optional(),
        dateFrom: zod_1.z.string().datetime().optional(),
        dateTo: zod_1.z.string().datetime().optional(),
    }),
});
//# sourceMappingURL=blockchainValidators.js.map