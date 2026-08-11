"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationPreferencesSchema = exports.notificationQuerySchema = exports.notificationIdSchema = exports.updateNotificationSchema = exports.bulkNotificationSchema = exports.createNotificationSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.createNotificationSchema = zod_1.z.object({
    body: zod_1.z.object({
        userId: zod_1.z.string({
            required_error: 'User ID is required',
        }).cuid('Invalid user ID'),
        title: zod_1.z.string({
            required_error: 'Title is required',
        }).min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
        message: zod_1.z.string({
            required_error: 'Message is required',
        }).min(1, 'Message is required').max(5000, 'Message must be less than 5000 characters'),
        type: zod_1.z.string({
            required_error: 'Type is required',
        }).min(1).max(50),
        channel: zod_1.z.nativeEnum(client_1.NotificationChannel).optional().default(client_1.NotificationChannel.EMAIL),
        templateId: zod_1.z.string().max(100).optional().nullable(),
        templateData: zod_1.z.record(zod_1.z.any()).optional(),
        metadata: zod_1.z.record(zod_1.z.any()).optional().nullable(),
        priority: zod_1.z.enum(['low', 'normal', 'high', 'urgent']).optional().default('normal'),
        scheduledFor: zod_1.z.string().datetime().optional().nullable(),
        ttl: zod_1.z.number().positive().optional(),
        sendImmediately: zod_1.z.boolean().optional().default(true),
    }),
});
exports.bulkNotificationSchema = zod_1.z.object({
    body: zod_1.z.object({
        userIds: zod_1.z.array(zod_1.z.string().cuid()).min(1, 'At least one user required').max(1000, 'Maximum 1000 users'),
        title: zod_1.z.string().min(1).max(200),
        message: zod_1.z.string().min(1).max(5000),
        type: zod_1.z.string().min(1).max(50),
        channel: zod_1.z.nativeEnum(client_1.NotificationChannel).optional().default(client_1.NotificationChannel.EMAIL),
        metadata: zod_1.z.record(zod_1.z.any()).optional().nullable(),
    }),
});
exports.updateNotificationSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('Invalid notification ID'),
    }),
    body: zod_1.z.object({
        status: zod_1.z.nativeEnum(client_1.NotificationStatus).optional(),
        readAt: zod_1.z.string().datetime().optional().nullable(),
    }),
});
exports.notificationIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('Invalid notification ID'),
    }),
});
exports.notificationQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(1)).optional().default('1'),
        limit: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(1).max(100)).optional().default('20'),
        userId: zod_1.z.string().cuid().optional(),
        type: zod_1.z.string().optional(),
        channel: zod_1.z.nativeEnum(client_1.NotificationChannel).optional(),
        status: zod_1.z.nativeEnum(client_1.NotificationStatus).optional(),
        dateFrom: zod_1.z.string().datetime().optional(),
        dateTo: zod_1.z.string().datetime().optional(),
        isRead: zod_1.z.string().transform((v) => v === 'true').optional(),
        sortBy: zod_1.z.enum(['createdAt', 'sentAt', 'readAt', 'status']).optional().default('createdAt'),
        sortOrder: zod_1.z.enum(['asc', 'desc']).optional().default('desc'),
    }),
});
exports.notificationPreferencesSchema = zod_1.z.object({
    body: zod_1.z.object({
        emailEnabled: zod_1.z.boolean().optional(),
        smsEnabled: zod_1.z.boolean().optional(),
        pushEnabled: zod_1.z.boolean().optional(),
        voiceCallEnabled: zod_1.z.boolean().optional(),
        appointmentReminders: zod_1.z.boolean().optional(),
        billingAlerts: zod_1.z.boolean().optional(),
        systemAlerts: zod_1.z.boolean().optional(),
        marketingEmails: zod_1.z.boolean().optional(),
        reminderIntervals: zod_1.z.array(zod_1.z.number().min(1).max(72)).optional(),
    }),
});
//# sourceMappingURL=notificationValidator.js.map