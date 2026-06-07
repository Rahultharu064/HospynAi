import { z } from 'zod';
export declare const createSessionSchema: z.ZodObject<{
    body: z.ZodObject<{
        appointmentId: z.ZodString;
        patientId: z.ZodString;
        doctorId: z.ZodString;
        scheduledAt: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        duration: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        recordSession: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    }, "strip", z.ZodTypeAny, {
        patientId: string;
        doctorId: string;
        duration: number;
        appointmentId: string;
        recordSession: boolean;
        scheduledAt?: string | null | undefined;
    }, {
        patientId: string;
        doctorId: string;
        appointmentId: string;
        duration?: number | undefined;
        scheduledAt?: string | null | undefined;
        recordSession?: boolean | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        patientId: string;
        doctorId: string;
        duration: number;
        appointmentId: string;
        recordSession: boolean;
        scheduledAt?: string | null | undefined;
    };
}, {
    body: {
        patientId: string;
        doctorId: string;
        appointmentId: string;
        duration?: number | undefined;
        scheduledAt?: string | null | undefined;
        recordSession?: boolean | undefined;
    };
}>;
export declare const joinSessionSchema: z.ZodObject<{
    params: z.ZodObject<{
        sessionId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        sessionId: string;
    }, {
        sessionId: string;
    }>;
    body: z.ZodObject<{
        userId: z.ZodString;
        role: z.ZodEnum<["DOCTOR", "PATIENT"]>;
    }, "strip", z.ZodTypeAny, {
        role: "DOCTOR" | "PATIENT";
        userId: string;
    }, {
        role: "DOCTOR" | "PATIENT";
        userId: string;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        sessionId: string;
    };
    body: {
        role: "DOCTOR" | "PATIENT";
        userId: string;
    };
}, {
    params: {
        sessionId: string;
    };
    body: {
        role: "DOCTOR" | "PATIENT";
        userId: string;
    };
}>;
export declare const signalSchema: z.ZodObject<{
    params: z.ZodObject<{
        sessionId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        sessionId: string;
    }, {
        sessionId: string;
    }>;
    body: z.ZodObject<{
        signal: z.ZodAny;
        type: z.ZodEnum<["offer", "answer", "ice-candidate"]>;
    }, "strip", z.ZodTypeAny, {
        type: "answer" | "offer" | "ice-candidate";
        signal?: any;
    }, {
        type: "answer" | "offer" | "ice-candidate";
        signal?: any;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        sessionId: string;
    };
    body: {
        type: "answer" | "offer" | "ice-candidate";
        signal?: any;
    };
}, {
    params: {
        sessionId: string;
    };
    body: {
        type: "answer" | "offer" | "ice-candidate";
        signal?: any;
    };
}>;
export declare const messageSchema: z.ZodObject<{
    params: z.ZodObject<{
        sessionId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        sessionId: string;
    }, {
        sessionId: string;
    }>;
    body: z.ZodObject<{
        message: z.ZodString;
        type: z.ZodDefault<z.ZodOptional<z.ZodEnum<["text", "file", "image"]>>>;
        fileUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        message: string;
        type: "text" | "image" | "file";
        fileUrl?: string | null | undefined;
    }, {
        message: string;
        type?: "text" | "image" | "file" | undefined;
        fileUrl?: string | null | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        sessionId: string;
    };
    body: {
        message: string;
        type: "text" | "image" | "file";
        fileUrl?: string | null | undefined;
    };
}, {
    params: {
        sessionId: string;
    };
    body: {
        message: string;
        type?: "text" | "image" | "file" | undefined;
        fileUrl?: string | null | undefined;
    };
}>;
export declare const endSessionSchema: z.ZodObject<{
    params: z.ZodObject<{
        sessionId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        sessionId: string;
    }, {
        sessionId: string;
    }>;
    body: z.ZodObject<{
        reason: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        reason?: string | null | undefined;
        notes?: string | null | undefined;
    }, {
        reason?: string | null | undefined;
        notes?: string | null | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        sessionId: string;
    };
    body: {
        reason?: string | null | undefined;
        notes?: string | null | undefined;
    };
}, {
    params: {
        sessionId: string;
    };
    body: {
        reason?: string | null | undefined;
        notes?: string | null | undefined;
    };
}>;
export declare const sessionQuerySchema: z.ZodObject<{
    query: z.ZodObject<{
        page: z.ZodDefault<z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>>>;
        limit: z.ZodDefault<z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>>>;
        patientId: z.ZodOptional<z.ZodString>;
        doctorId: z.ZodOptional<z.ZodString>;
        appointmentId: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodEnum<["WAITING", "IN_PROGRESS", "COMPLETED", "CANCELLED", "FAILED", "DISCONNECTED"]>>;
        dateFrom: z.ZodOptional<z.ZodString>;
        dateTo: z.ZodOptional<z.ZodString>;
        sortBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<["createdAt", "startedAt", "duration"]>>>;
        sortOrder: z.ZodDefault<z.ZodOptional<z.ZodEnum<["asc", "desc"]>>>;
    }, "strip", z.ZodTypeAny, {
        page: number;
        limit: number;
        sortBy: "createdAt" | "duration" | "startedAt";
        sortOrder: "asc" | "desc";
        status?: "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "FAILED" | "WAITING" | "DISCONNECTED" | undefined;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
        patientId?: string | undefined;
        doctorId?: string | undefined;
        appointmentId?: string | undefined;
    }, {
        status?: "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "FAILED" | "WAITING" | "DISCONNECTED" | undefined;
        page?: string | undefined;
        limit?: string | undefined;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
        sortBy?: "createdAt" | "duration" | "startedAt" | undefined;
        sortOrder?: "asc" | "desc" | undefined;
        patientId?: string | undefined;
        doctorId?: string | undefined;
        appointmentId?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    query: {
        page: number;
        limit: number;
        sortBy: "createdAt" | "duration" | "startedAt";
        sortOrder: "asc" | "desc";
        status?: "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "FAILED" | "WAITING" | "DISCONNECTED" | undefined;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
        patientId?: string | undefined;
        doctorId?: string | undefined;
        appointmentId?: string | undefined;
    };
}, {
    query: {
        status?: "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "FAILED" | "WAITING" | "DISCONNECTED" | undefined;
        page?: string | undefined;
        limit?: string | undefined;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
        sortBy?: "createdAt" | "duration" | "startedAt" | undefined;
        sortOrder?: "asc" | "desc" | undefined;
        patientId?: string | undefined;
        doctorId?: string | undefined;
        appointmentId?: string | undefined;
    };
}>;
export type CreateSessionInput = z.infer<typeof createSessionSchema>['body'];
export type JoinSessionInput = z.infer<typeof joinSessionSchema>['body'];
export type SignalInput = z.infer<typeof signalSchema>['body'];
export type MessageInput = z.infer<typeof messageSchema>['body'];
export type EndSessionInput = z.infer<typeof endSessionSchema>['body'];
export type SessionQueryInput = z.infer<typeof sessionQuerySchema>['query'];
//# sourceMappingURL=telemedicineValidators.d.ts.map