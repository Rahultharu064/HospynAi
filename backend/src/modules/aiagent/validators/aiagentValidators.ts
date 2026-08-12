import { z } from 'zod';

export const agentChatSchema = z.object({
  body: z.object({
    message: z.string({
      required_error: 'Message is required',
    }).min(1).max(5000),

    sessionId: z.string().optional().nullable(),
    patientId: z.string().cuid().optional().nullable(),
    context: z.record(z.any()).optional().nullable(),
    stream: z.boolean().optional().default(false),
  }),
});

export const agentTaskSchema = z.object({
  body: z.object({
    taskType: z.enum([
      'SCHEDULE_APPOINTMENT', 'CREATE_PRESCRIPTION', 'ORDER_LAB_TEST',
      'ANALYZE_SYMPTOMS', 'GENERATE_REFERRAL', 'SUMMARIZE_RECORDS',
      'CHECK_DRUG_INTERACTIONS', 'TRIAGE_PATIENT', 'GENERATE_REPORT',
      'SEND_NOTIFICATION',
    ]),

    parameters: z.record(z.any()),

    patientId: z.string().cuid().optional().nullable(),
    priority: z.enum(['low', 'normal', 'high', 'urgent']).optional().default('normal'),
    callbackUrl: z.string().url().optional().nullable(),
  }),
});

export const toolExecutionSchema = z.object({
  body: z.object({
    toolName: z.string().min(1),
    parameters: z.record(z.any()),
    agentId: z.string().optional(),
  }),
});

export const agentQuerySchema = z.object({
  query: z.object({
    page: z.string().transform(Number).pipe(z.number().min(1)).optional().default('1'),
    limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional().default('20'),
    userId: z.string().cuid().optional(),
    taskType: z.string().optional(),
    status: z.enum(['STARTED', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED']).optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
    sortBy: z.enum(['createdAt', 'duration', 'tokensUsed']).optional().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  }),
});

export const ingestDocumentSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200),
    description: z.string().max(1000).optional().nullable(),
    sourceType: z.enum(['FAQ', 'MEDICAL_GUIDE', 'POLICY', 'RESEARCH', 'CUSTOM']),
    language: z.string().length(2).optional().default('en'),
    chunkSize: z.number().min(100).max(4000).optional().default(1000),
    chunkOverlap: z.number().min(0).max(500).optional().default(200),
  }),
});

export const ragQuerySchema = z.object({
  body: z.object({
    query: z.string().min(1).max(5000),
    sourceType: z.enum(['FAQ', 'MEDICAL_GUIDE', 'POLICY', 'RESEARCH', 'CUSTOM']).optional(),
    maxResults: z.number().min(1).max(20).optional().default(5),
    minRelevance: z.number().min(0).max(1).optional().default(0.7),
    includeCitations: z.boolean().optional().default(true),
    patientId: z.string().cuid().optional().nullable(),
    context: z.record(z.any()).optional().nullable(),
  }),
});

export const ragDocumentQuerySchema = z.object({
  query: z.object({
    page: z.string().transform(Number).pipe(z.number().min(1)).optional().default('1'),
    limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional().default('20'),
    sourceType: z.enum(['FAQ', 'MEDICAL_GUIDE', 'POLICY', 'RESEARCH', 'CUSTOM']).optional(),
    isActive: z.string().transform((v) => v === 'true').optional(),
    search: z.string().max(200).optional(),
  }),
});

export const saveMemorySchema = z.object({
  body: z.object({
    userId: z.string().cuid().optional().nullable(),
    patientId: z.string().cuid().optional().nullable(),
    memoryType: z.enum(['PREFERENCE', 'INTERACTION', 'MEDICAL', 'CONTEXT']),
    content: z.string().min(1).max(10000),
    metadata: z.record(z.any()).optional().nullable(),
  }),
});

export const memoryQuerySchema = z.object({
  query: z.object({
    userId: z.string().cuid().optional(),
    patientId: z.string().cuid().optional(),
    memoryType: z.enum(['PREFERENCE', 'INTERACTION', 'MEDICAL', 'CONTEXT']).optional(),
    limit: z.string().transform(Number).pipe(z.number().min(1).max(50)).optional().default('10'),
    minRelevance: z.string().transform(Number).pipe(z.number().min(0).max(1)).optional(),
  }),
});

export type AgentChatInput = z.infer<typeof agentChatSchema>['body'];
export type AgentTaskInput = z.infer<typeof agentTaskSchema>['body'];
export type ToolExecutionInput = z.infer<typeof toolExecutionSchema>['body'];
export type AgentQueryInput = z.infer<typeof agentQuerySchema>['query'];
export type IngestDocumentInput = z.infer<typeof ingestDocumentSchema>['body'];
export type RagQueryInput = z.infer<typeof ragQuerySchema>['body'];
export type RagDocumentQueryInput = z.infer<typeof ragDocumentQuerySchema>['query'];
export type SaveMemoryInput = z.infer<typeof saveMemorySchema>['body'];
export type MemoryQueryInput = z.infer<typeof memoryQuerySchema>['query'];