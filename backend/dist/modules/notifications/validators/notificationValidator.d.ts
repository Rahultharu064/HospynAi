import { z } from 'zod';
export declare const createNotificationSchema: z.ZodObject<{
    body: z.ZodObject<{
        userId: z.ZodString;
        title: z.ZodString;
        message: z.ZodString;
        type: z.ZodString;
        channel: z.ZodDefault<z.ZodOptional<z.ZodNativeEnum<{
            EMAIL: "EMAIL";
            SMS: "SMS";
            PUSH: "PUSH";
            VOICE_CALL: "VOICE_CALL";
        }>>>;
        templateId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        templateData: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        metadata: z.ZodNullable<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>>;
        priority: z.ZodDefault<z.ZodOptional<z.ZodEnum<["low", "normal", "high", "urgent"]>>>;
        scheduledFor: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        ttl: z.ZodOptional<z.ZodNumber>;
        sendImmediately: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    }, "strip", z.ZodTypeAny, {
        message: string;
        userId: string;
        priority: "urgent" | "low" | "normal" | "high";
        type: string;
        channel: "EMAIL" | "SMS" | "PUSH" | "VOICE_CALL";
        title: string;
        sendImmediately: boolean;
        metadata?: Record<string, any> | null | undefined;
        templateId?: string | null | undefined;
        templateData?: Record<string, any> | undefined;
        scheduledFor?: string | null | undefined;
        ttl?: number | undefined;
    }, {
        message: string;
        userId: string;
        type: string;
        title: string;
        metadata?: Record<string, any> | null | undefined;
        priority?: "urgent" | "low" | "normal" | "high" | undefined;
        templateId?: string | null | undefined;
        channel?: "EMAIL" | "SMS" | "PUSH" | "VOICE_CALL" | undefined;
        templateData?: Record<string, any> | undefined;
        scheduledFor?: string | null | undefined;
        ttl?: number | undefined;
        sendImmediately?: boolean | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        message: string;
        userId: string;
        priority: "urgent" | "low" | "normal" | "high";
        type: string;
        channel: "EMAIL" | "SMS" | "PUSH" | "VOICE_CALL";
        title: string;
        sendImmediately: boolean;
        metadata?: Record<string, any> | null | undefined;
        templateId?: string | null | undefined;
        templateData?: Record<string, any> | undefined;
        scheduledFor?: string | null | undefined;
        ttl?: number | undefined;
    };
}, {
    body: {
        message: string;
        userId: string;
        type: string;
        title: string;
        metadata?: Record<string, any> | null | undefined;
        priority?: "urgent" | "low" | "normal" | "high" | undefined;
        templateId?: string | null | undefined;
        channel?: "EMAIL" | "SMS" | "PUSH" | "VOICE_CALL" | undefined;
        templateData?: Record<string, any> | undefined;
        scheduledFor?: string | null | undefined;
        ttl?: number | undefined;
        sendImmediately?: boolean | undefined;
    };
}>;
export declare const bulkNotificationSchema: z.ZodObject<{
    body: z.ZodObject<{
        userIds: z.ZodArray<z.ZodString, "many">;
        title: z.ZodString;
        message: z.ZodString;
        type: z.ZodString;
        channel: z.ZodDefault<z.ZodOptional<z.ZodNativeEnum<{
            EMAIL: "EMAIL";
            SMS: "SMS";
            PUSH: "PUSH";
            VOICE_CALL: "VOICE_CALL";
        }>>>;
        metadata: z.ZodNullable<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>>;
    }, "strip", z.ZodTypeAny, {
        message: string;
        type: string;
        channel: "EMAIL" | "SMS" | "PUSH" | "VOICE_CALL";
        title: string;
        userIds: string[];
        metadata?: Record<string, any> | null | undefined;
    }, {
        message: string;
        type: string;
        title: string;
        userIds: string[];
        metadata?: Record<string, any> | null | undefined;
        channel?: "EMAIL" | "SMS" | "PUSH" | "VOICE_CALL" | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        message: string;
        type: string;
        channel: "EMAIL" | "SMS" | "PUSH" | "VOICE_CALL";
        title: string;
        userIds: string[];
        metadata?: Record<string, any> | null | undefined;
    };
}, {
    body: {
        message: string;
        type: string;
        title: string;
        userIds: string[];
        metadata?: Record<string, any> | null | undefined;
        channel?: "EMAIL" | "SMS" | "PUSH" | "VOICE_CALL" | undefined;
    };
}>;
export declare const updateNotificationSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
    }, {
        id: string;
    }>;
    body: z.ZodObject<{
        status: z.ZodOptional<z.ZodNativeEnum<{
            PENDING: "PENDING";
            SENT: "SENT";
            DELIVERED: "DELIVERED";
            READ: "READ";
            FAILED: "FAILED";
        }>>;
        readAt: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        status?: "PENDING" | "FAILED" | "SENT" | "DELIVERED" | "READ" | undefined;
        readAt?: string | null | undefined;
    }, {
        status?: "PENDING" | "FAILED" | "SENT" | "DELIVERED" | "READ" | undefined;
        readAt?: string | null | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        id: string;
    };
    body: {
        status?: "PENDING" | "FAILED" | "SENT" | "DELIVERED" | "READ" | undefined;
        readAt?: string | null | undefined;
    };
}, {
    params: {
        id: string;
    };
    body: {
        status?: "PENDING" | "FAILED" | "SENT" | "DELIVERED" | "READ" | undefined;
        readAt?: string | null | undefined;
    };
}>;
export declare const notificationIdSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
    }, {
        id: string;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        id: string;
    };
}, {
    params: {
        id: string;
    };
}>;
export declare const notificationQuerySchema: z.ZodObject<{
    query: z.ZodObject<{
        page: z.ZodDefault<z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>>>;
        limit: z.ZodDefault<z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>>>;
        userId: z.ZodOptional<z.ZodString>;
        type: z.ZodOptional<z.ZodString>;
        channel: z.ZodOptional<z.ZodNativeEnum<{
            EMAIL: "EMAIL";
            SMS: "SMS";
            PUSH: "PUSH";
            VOICE_CALL: "VOICE_CALL";
        }>>;
        status: z.ZodOptional<z.ZodNativeEnum<{
            PENDING: "PENDING";
            SENT: "SENT";
            DELIVERED: "DELIVERED";
            READ: "READ";
            FAILED: "FAILED";
        }>>;
        dateFrom: z.ZodOptional<z.ZodString>;
        dateTo: z.ZodOptional<z.ZodString>;
        isRead: z.ZodOptional<z.ZodEffects<z.ZodString, boolean, string>>;
        sortBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<["createdAt", "sentAt", "readAt", "status"]>>>;
        sortOrder: z.ZodDefault<z.ZodOptional<z.ZodEnum<["asc", "desc"]>>>;
    }, "strip", z.ZodTypeAny, {
        page: number;
        limit: number;
        sortBy: "status" | "createdAt" | "sentAt" | "readAt";
        sortOrder: "asc" | "desc";
        status?: "PENDING" | "FAILED" | "SENT" | "DELIVERED" | "READ" | undefined;
        userId?: string | undefined;
        type?: string | undefined;
        channel?: "EMAIL" | "SMS" | "PUSH" | "VOICE_CALL" | undefined;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
        isRead?: boolean | undefined;
    }, {
        status?: "PENDING" | "FAILED" | "SENT" | "DELIVERED" | "READ" | undefined;
        userId?: string | undefined;
        type?: string | undefined;
        channel?: "EMAIL" | "SMS" | "PUSH" | "VOICE_CALL" | undefined;
        page?: string | undefined;
        limit?: string | undefined;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
        sortBy?: "status" | "createdAt" | "sentAt" | "readAt" | undefined;
        sortOrder?: "asc" | "desc" | undefined;
        isRead?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    query: {
        page: number;
        limit: number;
        sortBy: "status" | "createdAt" | "sentAt" | "readAt";
        sortOrder: "asc" | "desc";
        status?: "PENDING" | "FAILED" | "SENT" | "DELIVERED" | "READ" | undefined;
        userId?: string | undefined;
        type?: string | undefined;
        channel?: "EMAIL" | "SMS" | "PUSH" | "VOICE_CALL" | undefined;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
        isRead?: boolean | undefined;
    };
}, {
    query: {
        status?: "PENDING" | "FAILED" | "SENT" | "DELIVERED" | "READ" | undefined;
        userId?: string | undefined;
        type?: string | undefined;
        channel?: "EMAIL" | "SMS" | "PUSH" | "VOICE_CALL" | undefined;
        page?: string | undefined;
        limit?: string | undefined;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
        sortBy?: "status" | "createdAt" | "sentAt" | "readAt" | undefined;
        sortOrder?: "asc" | "desc" | undefined;
        isRead?: string | undefined;
    };
}>;
export declare const notificationPreferencesSchema: z.ZodObject<{
    body: z.ZodObject<{
        emailEnabled: z.ZodOptional<z.ZodBoolean>;
        smsEnabled: z.ZodOptional<z.ZodBoolean>;
        pushEnabled: z.ZodOptional<z.ZodBoolean>;
        voiceCallEnabled: z.ZodOptional<z.ZodBoolean>;
        appointmentReminders: z.ZodOptional<z.ZodBoolean>;
        billingAlerts: z.ZodOptional<z.ZodBoolean>;
        systemAlerts: z.ZodOptional<z.ZodBoolean>;
        marketingEmails: z.ZodOptional<z.ZodBoolean>;
        reminderIntervals: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    }, "strip", z.ZodTypeAny, {
        emailEnabled?: boolean | undefined;
        smsEnabled?: boolean | undefined;
        pushEnabled?: boolean | undefined;
        voiceCallEnabled?: boolean | undefined;
        appointmentReminders?: boolean | undefined;
        billingAlerts?: boolean | undefined;
        systemAlerts?: boolean | undefined;
        marketingEmails?: boolean | undefined;
        reminderIntervals?: number[] | undefined;
    }, {
        emailEnabled?: boolean | undefined;
        smsEnabled?: boolean | undefined;
        pushEnabled?: boolean | undefined;
        voiceCallEnabled?: boolean | undefined;
        appointmentReminders?: boolean | undefined;
        billingAlerts?: boolean | undefined;
        systemAlerts?: boolean | undefined;
        marketingEmails?: boolean | undefined;
        reminderIntervals?: number[] | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        emailEnabled?: boolean | undefined;
        smsEnabled?: boolean | undefined;
        pushEnabled?: boolean | undefined;
        voiceCallEnabled?: boolean | undefined;
        appointmentReminders?: boolean | undefined;
        billingAlerts?: boolean | undefined;
        systemAlerts?: boolean | undefined;
        marketingEmails?: boolean | undefined;
        reminderIntervals?: number[] | undefined;
    };
}, {
    body: {
        emailEnabled?: boolean | undefined;
        smsEnabled?: boolean | undefined;
        pushEnabled?: boolean | undefined;
        voiceCallEnabled?: boolean | undefined;
        appointmentReminders?: boolean | undefined;
        billingAlerts?: boolean | undefined;
        systemAlerts?: boolean | undefined;
        marketingEmails?: boolean | undefined;
        reminderIntervals?: number[] | undefined;
    };
}>;
export type CreateNotificationInput = z.input<typeof createNotificationSchema>['body'];
export type BulkNotificationInput = z.infer<typeof bulkNotificationSchema>['body'];
export type UpdateNotificationInput = z.infer<typeof updateNotificationSchema>['body'];
export type NotificationQueryInput = z.infer<typeof notificationQuerySchema>['query'];
export type NotificationPreferencesInput = z.infer<typeof notificationPreferencesSchema>['body'];
//# sourceMappingURL=notificationValidator.d.ts.map