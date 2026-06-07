"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.memoryQuerySchema = exports.saveMemorySchema = exports.ragDocumentQuerySchema = exports.ragQuerySchema = exports.ingestDocumentSchema = exports.agentQuerySchema = exports.toolExecutionSchema = exports.agentTaskSchema = exports.agentChatSchema = void 0;
const zod_1 = require("zod");
exports.agentChatSchema = zod_1.z.object({
    body: zod_1.z.object({
        message: zod_1.z.string({
            required_error: 'Message is required',
        }).min(1).max(5000),
        sessionId: zod_1.z.string().optional().nullable(),
        patientId: zod_1.z.string().cuid().optional().nullable(),
        context: zod_1.z.record(zod_1.z.any()).optional().nullable(),
        stream: zod_1.z.boolean().optional().default(false),
    }),
});
exports.agentTaskSchema = zod_1.z.object({
    body: zod_1.z.object({
        taskType: zod_1.z.enum([
            'SCHEDULE_APPOINTMENT', 'CREATE_PRESCRIPTION', 'ORDER_LAB_TEST',
            'ANALYZE_SYMPTOMS', 'GENERATE_REFERRAL', 'SUMMARIZE_RECORDS',
            'CHECK_DRUG_INTERACTIONS', 'TRIAGE_PATIENT', 'GENERATE_REPORT',
            'SEND_NOTIFICATION',
        ]),
        parameters: zod_1.z.record(zod_1.z.any()),
        patientId: zod_1.z.string().cuid().optional().nullable(),
        priority: zod_1.z.enum(['low', 'normal', 'high', 'urgent']).optional().default('normal'),
        callbackUrl: zod_1.z.string().url().optional().nullable(),
    }),
});
exports.toolExecutionSchema = zod_1.z.object({
    body: zod_1.z.object({
        toolName: zod_1.z.string().min(1),
        parameters: zod_1.z.record(zod_1.z.any()),
        agentId: zod_1.z.string().optional(),
    }),
});
exports.agentQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(1)).optional().default('1'),
        limit: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(1).max(100)).optional().default('20'),
        userId: zod_1.z.string().cuid().optional(),
        taskType: zod_1.z.string().optional(),
        status: zod_1.z.enum(['STARTED', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED']).optional(),
        dateFrom: zod_1.z.string().datetime().optional(),
        dateTo: zod_1.z.string().datetime().optional(),
        sortBy: zod_1.z.enum(['createdAt', 'duration', 'tokensUsed']).optional().default('createdAt'),
        sortOrder: zod_1.z.enum(['asc', 'desc']).optional().default('desc'),
    }),
});
exports.ingestDocumentSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(1).max(200),
        description: zod_1.z.string().max(1000).optional().nullable(),
        sourceType: zod_1.z.enum(['FAQ', 'MEDICAL_GUIDE', 'POLICY', 'RESEARCH', 'CUSTOM']),
        language: zod_1.z.string().length(2).optional().default('en'),
        chunkSize: zod_1.z.number().min(100).max(4000).optional().default(1000),
        chunkOverlap: zod_1.z.number().min(0).max(500).optional().default(200),
    }),
});
exports.ragQuerySchema = zod_1.z.object({
    body: zod_1.z.object({
        query: zod_1.z.string().min(1).max(5000),
        sourceType: zod_1.z.enum(['FAQ', 'MEDICAL_GUIDE', 'POLICY', 'RESEARCH', 'CUSTOM']).optional(),
        maxResults: zod_1.z.number().min(1).max(20).optional().default(5),
        minRelevance: zod_1.z.number().min(0).max(1).optional().default(0.7),
        includeCitations: zod_1.z.boolean().optional().default(true),
        patientId: zod_1.z.string().cuid().optional().nullable(),
        context: zod_1.z.record(zod_1.z.any()).optional().nullable(),
    }),
});
exports.ragDocumentQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(1)).optional().default('1'),
        limit: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(1).max(100)).optional().default('20'),
        sourceType: zod_1.z.enum(['FAQ', 'MEDICAL_GUIDE', 'POLICY', 'RESEARCH', 'CUSTOM']).optional(),
        isActive: zod_1.z.string().transform((v) => v === 'true').optional(),
        search: zod_1.z.string().max(200).optional(),
    }),
});
exports.saveMemorySchema = zod_1.z.object({
    body: zod_1.z.object({
        userId: zod_1.z.string().cuid().optional().nullable(),
        patientId: zod_1.z.string().cuid().optional().nullable(),
        memoryType: zod_1.z.enum(['PREFERENCE', 'INTERACTION', 'MEDICAL', 'CONTEXT']),
        content: zod_1.z.string().min(1).max(10000),
        metadata: zod_1.z.record(zod_1.z.any()).optional().nullable(),
    }),
});
exports.memoryQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        userId: zod_1.z.string().cuid().optional(),
        patientId: zod_1.z.string().cuid().optional(),
        memoryType: zod_1.z.enum(['PREFERENCE', 'INTERACTION', 'MEDICAL', 'CONTEXT']).optional(),
        limit: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(1).max(50)).optional().default('10'),
        minRelevance: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(0).max(1)).optional(),
    }),
});
//# sourceMappingURL=aiagentValidators.js.map