import { z } from 'zod';

export const saveMemorySchema = z.object({
  body: z.object({
    userId: z.string().cuid('Invalid user ID').optional().nullable(),
    patientId: z.string().cuid('Invalid patient ID').optional().nullable(),

    memoryType: z.enum([
      'PREFERENCE', 'INTERACTION', 'MEDICAL', 'CONTEXT',
      'BEHAVIOR', 'CLINICAL_DECISION', 'PATIENT_HISTORY', 'APPOINTMENT_PATTERN',
    ], {
      required_error: 'Memory type is required',
    }),

    content: z.string({
      required_error: 'Content is required',
    }).min(1, 'Content cannot be empty').max(50000, 'Content too long'),

    importance: z.number().min(0).max(1).optional().default(0.5),
    metadata: z.record(z.any()).optional().nullable(),
    tags: z.array(z.string().max(50)).max(20).optional().default([]),
    expiresAt: z.string().datetime().optional().nullable(),
    sessionId: z.string().optional().nullable(),
    source: z.string().max(100).optional().nullable(),
  }).refine((data) => data.userId || data.patientId, {
    message: 'Either userId or patientId must be provided',
  }),
});

export const updateMemorySchema = z.object({
  params: z.object({
    id: z.string().cuid('Invalid memory ID'),
  }),
  body: z.object({
    content: z.string().min(1).max(50000).optional(),
    importance: z.number().min(0).max(1).optional(),
    metadata: z.record(z.any()).optional().nullable(),
    tags: z.array(z.string().max(50)).max(20).optional(),
    expiresAt: z.string().datetime().optional().nullable(),
  }),
});

export const searchMemorySchema = z.object({
  body: z.object({
    query: z.string({
      required_error: 'Search query is required',
    }).min(1).max(1000),

    userId: z.string().cuid().optional().nullable(),
    patientId: z.string().cuid().optional().nullable(),
    memoryType: z.enum([
      'PREFERENCE', 'INTERACTION', 'MEDICAL', 'CONTEXT',
      'BEHAVIOR', 'CLINICAL_DECISION', 'PATIENT_HISTORY', 'APPOINTMENT_PATTERN',
    ]).optional(),
    limit: z.number().min(1).max(50).optional().default(10),
    minRelevance: z.number().min(0).max(1).optional().default(0.5),
    tags: z.array(z.string().max(50)).optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
  }),
});

export const memoryIdSchema = z.object({
  params: z.object({
    id: z.string().cuid('Invalid memory ID'),
  }),
});

export const memoryQuerySchema = z.object({
  query: z.object({
    page: z.string().transform(Number).pipe(z.number().min(1)).optional().default('1'),
    limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional().default('20'),
    userId: z.string().cuid().optional(),
    patientId: z.string().cuid().optional(),
    memoryType: z.enum([
      'PREFERENCE', 'INTERACTION', 'MEDICAL', 'CONTEXT',
      'BEHAVIOR', 'CLINICAL_DECISION', 'PATIENT_HISTORY', 'APPOINTMENT_PATTERN',
    ]).optional(),
    tags: z.string().transform((v) => v.split(',')).optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
    sortBy: z.enum(['createdAt', 'importance', 'accessCount', 'updatedAt']).optional().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  }),
});

export const consolidateMemoriesSchema = z.object({
  body: z.object({
    userId: z.string().cuid().optional().nullable(),
    patientId: z.string().cuid().optional().nullable(),
    memoryType: z.enum([
      'PREFERENCE', 'INTERACTION', 'MEDICAL', 'CONTEXT',
      'BEHAVIOR', 'CLINICAL_DECISION', 'PATIENT_HISTORY', 'APPOINTMENT_PATTERN',
    ]).optional(),
    timeRange: z.enum(['day', 'week', 'month']).optional().default('week'),
  }),
});

export const patientMemorySchema = z.object({
  params: z.object({
    patientId: z.string().cuid('Invalid patient ID'),
  }),
});

export type SaveMemoryInput = z.infer<typeof saveMemorySchema>['body'];
export type UpdateMemoryInput = z.infer<typeof updateMemorySchema>['body'];
export type SearchMemoryInput = z.infer<typeof searchMemorySchema>['body'];
export type MemoryQueryInput = z.infer<typeof memoryQuerySchema>['query'];
export type ConsolidateMemoriesInput = z.infer<typeof consolidateMemoriesSchema>['body'];