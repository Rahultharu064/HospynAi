import { z } from 'zod';
export declare const chatMessageSchema: z.ZodObject<{
    body: z.ZodObject<{
        message: z.ZodString;
        sessionId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        patientId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        context: z.ZodDefault<z.ZodOptional<z.ZodEnum<["GENERAL", "DOCTOR", "PATIENT", "TRIAGE"]>>>;
        language: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        stream: z.ZodDefault<z.ZodBoolean>;
        attachments: z.ZodOptional<z.ZodArray<z.ZodObject<{
            type: z.ZodEnum<["image", "document", "audio"]>;
            url: z.ZodString;
            name: z.ZodString;
            mimeType: z.ZodString;
            size: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            url: string;
            name: string;
            type: "image" | "document" | "audio";
            mimeType: string;
            size?: number | undefined;
        }, {
            url: string;
            name: string;
            type: "image" | "document" | "audio";
            mimeType: string;
            size?: number | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        message: string;
        language: string;
        context: "DOCTOR" | "PATIENT" | "GENERAL" | "TRIAGE";
        stream: boolean;
        attachments?: {
            url: string;
            name: string;
            type: "image" | "document" | "audio";
            mimeType: string;
            size?: number | undefined;
        }[] | undefined;
        patientId?: string | null | undefined;
        sessionId?: string | null | undefined;
    }, {
        message: string;
        attachments?: {
            url: string;
            name: string;
            type: "image" | "document" | "audio";
            mimeType: string;
            size?: number | undefined;
        }[] | undefined;
        patientId?: string | null | undefined;
        sessionId?: string | null | undefined;
        language?: string | undefined;
        context?: "DOCTOR" | "PATIENT" | "GENERAL" | "TRIAGE" | undefined;
        stream?: boolean | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        message: string;
        language: string;
        context: "DOCTOR" | "PATIENT" | "GENERAL" | "TRIAGE";
        stream: boolean;
        attachments?: {
            url: string;
            name: string;
            type: "image" | "document" | "audio";
            mimeType: string;
            size?: number | undefined;
        }[] | undefined;
        patientId?: string | null | undefined;
        sessionId?: string | null | undefined;
    };
}, {
    body: {
        message: string;
        attachments?: {
            url: string;
            name: string;
            type: "image" | "document" | "audio";
            mimeType: string;
            size?: number | undefined;
        }[] | undefined;
        patientId?: string | null | undefined;
        sessionId?: string | null | undefined;
        language?: string | undefined;
        context?: "DOCTOR" | "PATIENT" | "GENERAL" | "TRIAGE" | undefined;
        stream?: boolean | undefined;
    };
}>;
export declare const audioMessageSchema: z.ZodObject<{
    body: z.ZodObject<{
        language: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        format: z.ZodDefault<z.ZodOptional<z.ZodEnum<["webm", "mp3", "wav", "m4a"]>>>;
        sessionId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        patientId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        context: z.ZodDefault<z.ZodOptional<z.ZodEnum<["GENERAL", "DOCTOR", "PATIENT", "TRIAGE"]>>>;
    }, "strip", z.ZodTypeAny, {
        format: "webm" | "mp3" | "wav" | "m4a";
        language: string;
        context: "DOCTOR" | "PATIENT" | "GENERAL" | "TRIAGE";
        patientId?: string | null | undefined;
        sessionId?: string | null | undefined;
    }, {
        format?: "webm" | "mp3" | "wav" | "m4a" | undefined;
        patientId?: string | null | undefined;
        sessionId?: string | null | undefined;
        language?: string | undefined;
        context?: "DOCTOR" | "PATIENT" | "GENERAL" | "TRIAGE" | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        format: "webm" | "mp3" | "wav" | "m4a";
        language: string;
        context: "DOCTOR" | "PATIENT" | "GENERAL" | "TRIAGE";
        patientId?: string | null | undefined;
        sessionId?: string | null | undefined;
    };
}, {
    body: {
        format?: "webm" | "mp3" | "wav" | "m4a" | undefined;
        patientId?: string | null | undefined;
        sessionId?: string | null | undefined;
        language?: string | undefined;
        context?: "DOCTOR" | "PATIENT" | "GENERAL" | "TRIAGE" | undefined;
    };
}>;
export declare const chatHistorySchema: z.ZodObject<{
    query: z.ZodObject<{
        sessionId: z.ZodOptional<z.ZodString>;
        patientId: z.ZodOptional<z.ZodString>;
        page: z.ZodDefault<z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>>>;
        limit: z.ZodDefault<z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>>>;
    }, "strip", z.ZodTypeAny, {
        page: number;
        limit: number;
        patientId?: string | undefined;
        sessionId?: string | undefined;
    }, {
        page?: string | undefined;
        limit?: string | undefined;
        patientId?: string | undefined;
        sessionId?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    query: {
        page: number;
        limit: number;
        patientId?: string | undefined;
        sessionId?: string | undefined;
    };
}, {
    query: {
        page?: string | undefined;
        limit?: string | undefined;
        patientId?: string | undefined;
        sessionId?: string | undefined;
    };
}>;
export declare const clearHistorySchema: z.ZodObject<{
    body: z.ZodObject<{
        sessionId: z.ZodOptional<z.ZodString>;
        patientId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        patientId?: string | undefined;
        sessionId?: string | undefined;
    }, {
        patientId?: string | undefined;
        sessionId?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        patientId?: string | undefined;
        sessionId?: string | undefined;
    };
}, {
    body: {
        patientId?: string | undefined;
        sessionId?: string | undefined;
    };
}>;
export type ChatMessageInput = z.infer<typeof chatMessageSchema>['body'];
export type AudioMessageInput = z.infer<typeof audioMessageSchema>['body'];
export type ChatHistoryInput = z.infer<typeof chatHistorySchema>['query'];
export type ClearHistoryInput = z.infer<typeof clearHistorySchema>['body'];
//# sourceMappingURL=chatbotValidator.d.ts.map