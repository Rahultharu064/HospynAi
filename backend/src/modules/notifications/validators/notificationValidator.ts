import { z } from 'zod';
import { NotificationChannel, NotificationStatus } from '@prisma/client';

export const createNotificationSchema = z.object({
  body: z.object({
    userId: z.string({
      required_error: 'User ID is required',
    }).cuid('Invalid user ID'),

    title: z.string({
      required_error: 'Title is required',
    }).min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),

    message: z.string({
      required_error: 'Message is required',
    }).min(1, 'Message is required').max(5000, 'Message must be less than 5000 characters'),

    type: z.string({
      required_error: 'Type is required',
    }).min(1).max(50),

    channel: z.nativeEnum(NotificationChannel).optional().default(NotificationChannel.EMAIL),

    templateId: z.string().max(100).optional().nullable(),
    templateData: z.record(z.any()).optional(),

    metadata: z.record(z.any()).optional().nullable(),

    priority: z.enum(['low', 'normal', 'high', 'urgent']).optional().default('normal'),
    scheduledFor: z.string().datetime().optional().nullable(),
    ttl: z.number().positive().optional(),

    sendImmediately: z.boolean().optional().default(true),
  }),
});

export const bulkNotificationSchema = z.object({
  body: z.object({
    userIds: z.array(z.string().cuid()).min(1, 'At least one user required').max(1000, 'Maximum 1000 users'),

    title: z.string().min(1).max(200),
    message: z.string().min(1).max(5000),
    type: z.string().min(1).max(50),

    channel: z.nativeEnum(NotificationChannel).optional().default(NotificationChannel.EMAIL),

    metadata: z.record(z.any()).optional().nullable(),
  }),
});

export const updateNotificationSchema = z.object({
  params: z.object({
    id: z.string().cuid('Invalid notification ID'),
  }),
  body: z.object({
    status: z.nativeEnum(NotificationStatus).optional(),
    readAt: z.string().datetime().optional().nullable(),
  }),
});

export const notificationIdSchema = z.object({
  params: z.object({
    id: z.string().cuid('Invalid notification ID'),
  }),
});

export const notificationQuerySchema = z.object({
  query: z.object({
    page: z.string().transform(Number).pipe(z.number().min(1)).optional().default('1'),
    limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional().default('20'),
    userId: z.string().cuid().optional(),
    type: z.string().optional(),
    channel: z.nativeEnum(NotificationChannel).optional(),
    status: z.nativeEnum(NotificationStatus).optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
    isRead: z.string().transform((v) => v === 'true').optional(),
    sortBy: z.enum(['createdAt', 'sentAt', 'readAt', 'status']).optional().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  }),
});

export const notificationPreferencesSchema = z.object({
  body: z.object({
    emailEnabled: z.boolean().optional(),
    smsEnabled: z.boolean().optional(),
    pushEnabled: z.boolean().optional(),
    voiceCallEnabled: z.boolean().optional(),
    appointmentReminders: z.boolean().optional(),
    billingAlerts: z.boolean().optional(),
    systemAlerts: z.boolean().optional(),
    marketingEmails: z.boolean().optional(),
    reminderIntervals: z.array(z.number().min(1).max(72)).optional(),
  }),
});

export type CreateNotificationInput = z.input<typeof createNotificationSchema>['body'];
export type BulkNotificationInput = z.infer<typeof bulkNotificationSchema>['body'];
export type UpdateNotificationInput = z.infer<typeof updateNotificationSchema>['body'];
export type NotificationQueryInput = z.infer<typeof notificationQuerySchema>['query'];

export type NotificationPreferencesInput = z.infer<typeof notificationPreferencesSchema>['body'];
