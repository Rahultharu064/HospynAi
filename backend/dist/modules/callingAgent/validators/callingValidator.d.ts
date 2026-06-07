import { z } from 'zod';
export declare const initiateCallSchema: z.ZodObject<{
    body: z.ZodObject<{
        patientId: z.ZodString;
        phoneNumber: z.ZodString;
        callType: z.ZodEnum<["REMINDER", "FOLLOW_UP", "APPOINTMENT_CONFIRMATION", "GENERAL"]>;
        appointmentId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        message: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        callbackUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        patientId: string;
        phoneNumber: string;
        callType: "FOLLOW_UP" | "APPOINTMENT_CONFIRMATION" | "GENERAL" | "REMINDER";
        message?: string | null | undefined;
        appointmentId?: string | null | undefined;
        callbackUrl?: string | null | undefined;
    }, {
        patientId: string;
        phoneNumber: string;
        callType: "FOLLOW_UP" | "APPOINTMENT_CONFIRMATION" | "GENERAL" | "REMINDER";
        message?: string | null | undefined;
        appointmentId?: string | null | undefined;
        callbackUrl?: string | null | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        patientId: string;
        phoneNumber: string;
        callType: "FOLLOW_UP" | "APPOINTMENT_CONFIRMATION" | "GENERAL" | "REMINDER";
        message?: string | null | undefined;
        appointmentId?: string | null | undefined;
        callbackUrl?: string | null | undefined;
    };
}, {
    body: {
        patientId: string;
        phoneNumber: string;
        callType: "FOLLOW_UP" | "APPOINTMENT_CONFIRMATION" | "GENERAL" | "REMINDER";
        message?: string | null | undefined;
        appointmentId?: string | null | undefined;
        callbackUrl?: string | null | undefined;
    };
}>;
export declare const transferToHumanSchema: z.ZodObject<{
    body: z.ZodObject<{
        callSid: z.ZodString;
        reason: z.ZodString;
        priority: z.ZodDefault<z.ZodOptional<z.ZodEnum<["normal", "urgent"]>>>;
        department: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        priority: "normal" | "urgent";
        reason: string;
        callSid: string;
        department?: string | null | undefined;
    }, {
        reason: string;
        callSid: string;
        priority?: "normal" | "urgent" | undefined;
        department?: string | null | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        priority: "normal" | "urgent";
        reason: string;
        callSid: string;
        department?: string | null | undefined;
    };
}, {
    body: {
        reason: string;
        callSid: string;
        priority?: "normal" | "urgent" | undefined;
        department?: string | null | undefined;
    };
}>;
export declare const updateCallStatusSchema: z.ZodObject<{
    body: z.ZodObject<{
        callSid: z.ZodString;
        status: z.ZodString;
        duration: z.ZodOptional<z.ZodNumber>;
        recordingUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        status: string;
        callSid: string;
        duration?: number | undefined;
        recordingUrl?: string | null | undefined;
    }, {
        status: string;
        callSid: string;
        duration?: number | undefined;
        recordingUrl?: string | null | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        status: string;
        callSid: string;
        duration?: number | undefined;
        recordingUrl?: string | null | undefined;
    };
}, {
    body: {
        status: string;
        callSid: string;
        duration?: number | undefined;
        recordingUrl?: string | null | undefined;
    };
}>;
export declare const callQuerySchema: z.ZodObject<{
    query: z.ZodObject<{
        page: z.ZodDefault<z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>>>;
        limit: z.ZodDefault<z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>>>;
        patientId: z.ZodOptional<z.ZodString>;
        outcome: z.ZodOptional<z.ZodNativeEnum<{
            AI_RESOLVED: "AI_RESOLVED";
            HANDED_OFF: "HANDED_OFF";
            MISSED: "MISSED";
            VOICEMAIL: "VOICEMAIL";
            ESCALATED: "ESCALATED";
        }>>;
        direction: z.ZodOptional<z.ZodEnum<["INBOUND", "OUTBOUND"]>>;
        dateFrom: z.ZodOptional<z.ZodString>;
        dateTo: z.ZodOptional<z.ZodString>;
        aiHandled: z.ZodOptional<z.ZodEffects<z.ZodString, boolean, string>>;
        search: z.ZodOptional<z.ZodString>;
        sortBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<["startedAt", "duration", "outcome", "createdAt"]>>>;
        sortOrder: z.ZodDefault<z.ZodOptional<z.ZodEnum<["asc", "desc"]>>>;
    }, "strip", z.ZodTypeAny, {
        page: number;
        limit: number;
        sortBy: "createdAt" | "duration" | "outcome" | "startedAt";
        sortOrder: "asc" | "desc";
        search?: string | undefined;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
        patientId?: string | undefined;
        outcome?: "AI_RESOLVED" | "HANDED_OFF" | "MISSED" | "VOICEMAIL" | "ESCALATED" | undefined;
        direction?: "INBOUND" | "OUTBOUND" | undefined;
        aiHandled?: boolean | undefined;
    }, {
        search?: string | undefined;
        page?: string | undefined;
        limit?: string | undefined;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
        sortBy?: "createdAt" | "duration" | "outcome" | "startedAt" | undefined;
        sortOrder?: "asc" | "desc" | undefined;
        patientId?: string | undefined;
        outcome?: "AI_RESOLVED" | "HANDED_OFF" | "MISSED" | "VOICEMAIL" | "ESCALATED" | undefined;
        direction?: "INBOUND" | "OUTBOUND" | undefined;
        aiHandled?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    query: {
        page: number;
        limit: number;
        sortBy: "createdAt" | "duration" | "outcome" | "startedAt";
        sortOrder: "asc" | "desc";
        search?: string | undefined;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
        patientId?: string | undefined;
        outcome?: "AI_RESOLVED" | "HANDED_OFF" | "MISSED" | "VOICEMAIL" | "ESCALATED" | undefined;
        direction?: "INBOUND" | "OUTBOUND" | undefined;
        aiHandled?: boolean | undefined;
    };
}, {
    query: {
        search?: string | undefined;
        page?: string | undefined;
        limit?: string | undefined;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
        sortBy?: "createdAt" | "duration" | "outcome" | "startedAt" | undefined;
        sortOrder?: "asc" | "desc" | undefined;
        patientId?: string | undefined;
        outcome?: "AI_RESOLVED" | "HANDED_OFF" | "MISSED" | "VOICEMAIL" | "ESCALATED" | undefined;
        direction?: "INBOUND" | "OUTBOUND" | undefined;
        aiHandled?: string | undefined;
    };
}>;
export declare const callSidSchema: z.ZodObject<{
    params: z.ZodObject<{
        callSid: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        callSid: string;
    }, {
        callSid: string;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        callSid: string;
    };
}, {
    params: {
        callSid: string;
    };
}>;
export type InitiateCallInput = z.infer<typeof initiateCallSchema>['body'];
export type TransferToHumanInput = z.infer<typeof transferToHumanSchema>['body'];
export type UpdateCallStatusInput = z.infer<typeof updateCallStatusSchema>['body'];
export type CallQueryInput = z.infer<typeof callQuerySchema>['query'];
//# sourceMappingURL=callingValidator.d.ts.map