import { z } from 'zod';

export const createSessionSchema = z.object({
  body: z.object({
    appointmentId: z.string({
      required_error: 'Appointment ID is required',
    }).cuid('Invalid appointment ID'),

    patientId: z.string().cuid('Invalid patient ID'),
    doctorId: z.string().cuid('Invalid doctor ID'),

    scheduledAt: z.string().datetime().optional().nullable(),
    duration: z.number().min(5).max(180).optional().default(30),
    recordSession: z.boolean().optional().default(false),
  }),
});

export const joinSessionSchema = z.object({
  params: z.object({
    sessionId: z.string().min(1, 'Session ID is required'),
  }),
  body: z.object({
    userId: z.string().cuid('Invalid user ID'),
    role: z.enum(['DOCTOR', 'PATIENT']),
  }),
});

export const signalSchema = z.object({
  params: z.object({
    sessionId: z.string().min(1),
  }),
  body: z.object({
    signal: z.any(),
    type: z.enum(['offer', 'answer', 'ice-candidate']),
  }),
});

export const messageSchema = z.object({
  params: z.object({
    sessionId: z.string().min(1),
  }),
  body: z.object({
    message: z.string().min(1).max(5000),
    type: z.enum(['text', 'file', 'image']).optional().default('text'),
    fileUrl: z.string().url().optional().nullable(),
  }),
});

export const endSessionSchema = z.object({
  params: z.object({
    sessionId: z.string().min(1),
  }),
  body: z.object({
    reason: z.string().max(500).optional().nullable(),
    notes: z.string().max(2000).optional().nullable(),
  }),
});

export const sessionQuerySchema = z.object({
  query: z.object({
    page: z.string().transform(Number).pipe(z.number().min(1)).optional().default('1'),
    limit: z.string().transform(Number).pipe(z.number().min(1).max(50)).optional().default('20'),
    patientId: z.string().cuid().optional(),
    doctorId: z.string().cuid().optional(),
    appointmentId: z.string().cuid().optional(),
    status: z.enum(['WAITING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'FAILED', 'DISCONNECTED']).optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
    sortBy: z.enum(['createdAt', 'startedAt', 'duration']).optional().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  }),
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>['body'];
export type JoinSessionInput = z.infer<typeof joinSessionSchema>['body'];
export type SignalInput = z.infer<typeof signalSchema>['body'];
export type MessageInput = z.infer<typeof messageSchema>['body'];
export type EndSessionInput = z.infer<typeof endSessionSchema>['body'];
export type SessionQueryInput = z.infer<typeof sessionQuerySchema>['query'];