import { z } from 'zod';

export const chatMessageSchema = z.object({
  body: z.object({
    message: z.string({
      required_error: 'Message is required',
    }).min(1, 'Message cannot be empty').max(10000, 'Message too long'),

    sessionId: z.string().optional().nullable(),
    patientId: z.string().cuid('Invalid patient ID').optional().nullable(),
    context: z.enum(['GENERAL', 'DOCTOR', 'PATIENT', 'TRIAGE']).optional().default('GENERAL'),
    language: z.string().length(2).optional().default('en'),
    stream: z.boolean().optional().default(false),

    attachments: z.array(z.object({
      type: z.enum(['image', 'document', 'audio']),
      url: z.string().url(),
      name: z.string().max(200),
      mimeType: z.string(),
      size: z.number().optional(),
    })).optional(),
  }),
});

export const audioMessageSchema = z.object({
  body: z.object({
    language: z.string().length(2).optional().default('en'),
    format: z.enum(['webm', 'mp3', 'wav', 'm4a']).optional().default('webm'),
    sessionId: z.string().optional().nullable(),
    patientId: z.string().cuid().optional().nullable(),
    context: z.enum(['GENERAL', 'DOCTOR', 'PATIENT', 'TRIAGE']).optional().default('GENERAL'),
  }),
});

export const chatHistorySchema = z.object({
  query: z.object({
    sessionId: z.string().optional(),
    patientId: z.string().cuid().optional(),
    page: z.string().transform(Number).pipe(z.number().min(1)).optional().default('1'),
    limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional().default('50'),
  }),
});

export const clearHistorySchema = z.object({
  body: z.object({
    sessionId: z.string().optional(),
    patientId: z.string().cuid().optional(),
  }),
});

export type ChatMessageInput = z.infer<typeof chatMessageSchema>['body'];
export type AudioMessageInput = z.infer<typeof audioMessageSchema>['body'];
export type ChatHistoryInput = z.infer<typeof chatHistorySchema>['query'];
export type ClearHistoryInput = z.infer<typeof clearHistorySchema>['body'];