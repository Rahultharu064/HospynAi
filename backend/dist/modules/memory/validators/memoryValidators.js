"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.patientMemorySchema = exports.consolidateMemoriesSchema = exports.memoryQuerySchema = exports.memoryIdSchema = exports.searchMemorySchema = exports.updateMemorySchema = exports.saveMemorySchema = void 0;
const zod_1 = require("zod");
exports.saveMemorySchema = zod_1.z.object({
    body: zod_1.z.object({
        userId: zod_1.z.string().cuid('Invalid user ID').optional().nullable(),
        patientId: zod_1.z.string().cuid('Invalid patient ID').optional().nullable(),
        memoryType: zod_1.z.enum([
            'PREFERENCE', 'INTERACTION', 'MEDICAL', 'CONTEXT',
            'BEHAVIOR', 'CLINICAL_DECISION', 'PATIENT_HISTORY', 'APPOINTMENT_PATTERN',
        ], {
            required_error: 'Memory type is required',
        }),
        content: zod_1.z.string({
            required_error: 'Content is required',
        }).min(1, 'Content cannot be empty').max(50000, 'Content too long'),
        importance: zod_1.z.number().min(0).max(1).optional().default(0.5),
        metadata: zod_1.z.record(zod_1.z.any()).optional().nullable(),
        tags: zod_1.z.array(zod_1.z.string().max(50)).max(20).optional().default([]),
        expiresAt: zod_1.z.string().datetime().optional().nullable(),
        sessionId: zod_1.z.string().optional().nullable(),
        source: zod_1.z.string().max(100).optional().nullable(),
    }).refine((data) => data.userId || data.patientId, {
        message: 'Either userId or patientId must be provided',
    }),
});
exports.updateMemorySchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('Invalid memory ID'),
    }),
    body: zod_1.z.object({
        content: zod_1.z.string().min(1).max(50000).optional(),
        importance: zod_1.z.number().min(0).max(1).optional(),
        metadata: zod_1.z.record(zod_1.z.any()).optional().nullable(),
        tags: zod_1.z.array(zod_1.z.string().max(50)).max(20).optional(),
        expiresAt: zod_1.z.string().datetime().optional().nullable(),
    }),
});
exports.searchMemorySchema = zod_1.z.object({
    body: zod_1.z.object({
        query: zod_1.z.string({
            required_error: 'Search query is required',
        }).min(1).max(1000),
        userId: zod_1.z.string().cuid().optional().nullable(),
        patientId: zod_1.z.string().cuid().optional().nullable(),
        memoryType: zod_1.z.enum([
            'PREFERENCE', 'INTERACTION', 'MEDICAL', 'CONTEXT',
            'BEHAVIOR', 'CLINICAL_DECISION', 'PATIENT_HISTORY', 'APPOINTMENT_PATTERN',
        ]).optional(),
        limit: zod_1.z.number().min(1).max(50).optional().default(10),
        minRelevance: zod_1.z.number().min(0).max(1).optional().default(0.5),
        tags: zod_1.z.array(zod_1.z.string().max(50)).optional(),
        dateFrom: zod_1.z.string().datetime().optional(),
        dateTo: zod_1.z.string().datetime().optional(),
    }),
});
exports.memoryIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('Invalid memory ID'),
    }),
});
exports.memoryQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(1)).optional().default('1'),
        limit: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(1).max(100)).optional().default('20'),
        userId: zod_1.z.string().cuid().optional(),
        patientId: zod_1.z.string().cuid().optional(),
        memoryType: zod_1.z.enum([
            'PREFERENCE', 'INTERACTION', 'MEDICAL', 'CONTEXT',
            'BEHAVIOR', 'CLINICAL_DECISION', 'PATIENT_HISTORY', 'APPOINTMENT_PATTERN',
        ]).optional(),
        tags: zod_1.z.string().transform((v) => v.split(',')).optional(),
        dateFrom: zod_1.z.string().datetime().optional(),
        dateTo: zod_1.z.string().datetime().optional(),
        sortBy: zod_1.z.enum(['createdAt', 'importance', 'accessCount', 'updatedAt']).optional().default('createdAt'),
        sortOrder: zod_1.z.enum(['asc', 'desc']).optional().default('desc'),
    }),
});
exports.consolidateMemoriesSchema = zod_1.z.object({
    body: zod_1.z.object({
        userId: zod_1.z.string().cuid().optional().nullable(),
        patientId: zod_1.z.string().cuid().optional().nullable(),
        memoryType: zod_1.z.enum([
            'PREFERENCE', 'INTERACTION', 'MEDICAL', 'CONTEXT',
            'BEHAVIOR', 'CLINICAL_DECISION', 'PATIENT_HISTORY', 'APPOINTMENT_PATTERN',
        ]).optional(),
        timeRange: zod_1.z.enum(['day', 'week', 'month']).optional().default('week'),
    }),
});
exports.patientMemorySchema = zod_1.z.object({
    params: zod_1.z.object({
        patientId: zod_1.z.string().cuid('Invalid patient ID'),
    }),
});
//# sourceMappingURL=memoryValidators.js.map