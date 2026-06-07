import { z } from 'zod';
import { CallOutcome } from '@prisma/client';

export const initiateCallSchema = z.object({
  body: z.object({
    patientId: z.string({
      required_error: 'Patient ID is required',
    }).cuid('Invalid patient ID'),

    phoneNumber: z.string({
      required_error: 'Phone number is required',
    }).regex(/^\+?[1-9]\d{6,14}$/, 'Invalid phone number format'),

    callType: z.enum(['REMINDER', 'FOLLOW_UP', 'APPOINTMENT_CONFIRMATION', 'GENERAL'], {
      required_error: 'Call type is required',
    }),

    appointmentId: z.string().cuid().optional().nullable(),
    message: z.string().max(1000).optional().nullable(),
    callbackUrl: z.string().url().optional().nullable(),
  }),
});

export const transferToHumanSchema = z.object({
  body: z.object({
    callSid: z.string({
      required_error: 'Call SID is required',
    }).min(1),
    reason: z.string().min(1, 'Reason is required').max(500),
    priority: z.enum(['normal', 'urgent']).optional().default('normal'),
    department: z.string().max(100).optional().nullable(),
  }),
});

export const updateCallStatusSchema = z.object({
  body: z.object({
    callSid: z.string().min(1),
    status: z.string().min(1),
    duration: z.number().optional(),
    recordingUrl: z.string().url().optional().nullable(),
  }),
});

export const callQuerySchema = z.object({
  query: z.object({
    page: z.string().transform(Number).pipe(z.number().min(1)).optional().default('1'),
    limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional().default('20'),
    patientId: z.string().cuid().optional(),
    outcome: z.nativeEnum(CallOutcome).optional(),
    direction: z.enum(['INBOUND', 'OUTBOUND']).optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
    aiHandled: z.string().transform((v) => v === 'true').optional(),
    search: z.string().max(200).optional(),
    sortBy: z.enum(['startedAt', 'duration', 'outcome', 'createdAt']).optional().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  }),
});

export const callSidSchema = z.object({
  params: z.object({
    callSid: z.string().min(1, 'Call SID is required'),
  }),
});

export type InitiateCallInput = z.infer<typeof initiateCallSchema>['body'];
export type TransferToHumanInput = z.infer<typeof transferToHumanSchema>['body'];
export type UpdateCallStatusInput = z.infer<typeof updateCallStatusSchema>['body'];
export type CallQueryInput = z.infer<typeof callQuerySchema>['query'];