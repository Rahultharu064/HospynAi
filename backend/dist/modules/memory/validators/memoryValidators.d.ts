import { z } from 'zod';
export declare const saveMemorySchema: z.ZodObject<{
    body: z.ZodEffects<z.ZodObject<{
        userId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        patientId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        memoryType: z.ZodEnum<["PREFERENCE", "INTERACTION", "MEDICAL", "CONTEXT", "BEHAVIOR", "CLINICAL_DECISION", "PATIENT_HISTORY", "APPOINTMENT_PATTERN"]>;
        content: z.ZodString;
        importance: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        metadata: z.ZodNullable<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>>;
        tags: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
        expiresAt: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        sessionId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        source: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        content: string;
        memoryType: "PREFERENCE" | "INTERACTION" | "MEDICAL" | "CONTEXT" | "BEHAVIOR" | "CLINICAL_DECISION" | "PATIENT_HISTORY" | "APPOINTMENT_PATTERN";
        importance: number;
        tags: string[];
        metadata?: Record<string, any> | null | undefined;
        userId?: string | null | undefined;
        expiresAt?: string | null | undefined;
        patientId?: string | null | undefined;
        sessionId?: string | null | undefined;
        source?: string | null | undefined;
    }, {
        content: string;
        memoryType: "PREFERENCE" | "INTERACTION" | "MEDICAL" | "CONTEXT" | "BEHAVIOR" | "CLINICAL_DECISION" | "PATIENT_HISTORY" | "APPOINTMENT_PATTERN";
        metadata?: Record<string, any> | null | undefined;
        userId?: string | null | undefined;
        expiresAt?: string | null | undefined;
        patientId?: string | null | undefined;
        sessionId?: string | null | undefined;
        importance?: number | undefined;
        tags?: string[] | undefined;
        source?: string | null | undefined;
    }>, {
        content: string;
        memoryType: "PREFERENCE" | "INTERACTION" | "MEDICAL" | "CONTEXT" | "BEHAVIOR" | "CLINICAL_DECISION" | "PATIENT_HISTORY" | "APPOINTMENT_PATTERN";
        importance: number;
        tags: string[];
        metadata?: Record<string, any> | null | undefined;
        userId?: string | null | undefined;
        expiresAt?: string | null | undefined;
        patientId?: string | null | undefined;
        sessionId?: string | null | undefined;
        source?: string | null | undefined;
    }, {
        content: string;
        memoryType: "PREFERENCE" | "INTERACTION" | "MEDICAL" | "CONTEXT" | "BEHAVIOR" | "CLINICAL_DECISION" | "PATIENT_HISTORY" | "APPOINTMENT_PATTERN";
        metadata?: Record<string, any> | null | undefined;
        userId?: string | null | undefined;
        expiresAt?: string | null | undefined;
        patientId?: string | null | undefined;
        sessionId?: string | null | undefined;
        importance?: number | undefined;
        tags?: string[] | undefined;
        source?: string | null | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        content: string;
        memoryType: "PREFERENCE" | "INTERACTION" | "MEDICAL" | "CONTEXT" | "BEHAVIOR" | "CLINICAL_DECISION" | "PATIENT_HISTORY" | "APPOINTMENT_PATTERN";
        importance: number;
        tags: string[];
        metadata?: Record<string, any> | null | undefined;
        userId?: string | null | undefined;
        expiresAt?: string | null | undefined;
        patientId?: string | null | undefined;
        sessionId?: string | null | undefined;
        source?: string | null | undefined;
    };
}, {
    body: {
        content: string;
        memoryType: "PREFERENCE" | "INTERACTION" | "MEDICAL" | "CONTEXT" | "BEHAVIOR" | "CLINICAL_DECISION" | "PATIENT_HISTORY" | "APPOINTMENT_PATTERN";
        metadata?: Record<string, any> | null | undefined;
        userId?: string | null | undefined;
        expiresAt?: string | null | undefined;
        patientId?: string | null | undefined;
        sessionId?: string | null | undefined;
        importance?: number | undefined;
        tags?: string[] | undefined;
        source?: string | null | undefined;
    };
}>;
export declare const updateMemorySchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
    }, {
        id: string;
    }>;
    body: z.ZodObject<{
        content: z.ZodOptional<z.ZodString>;
        importance: z.ZodOptional<z.ZodNumber>;
        metadata: z.ZodNullable<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        expiresAt: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        metadata?: Record<string, any> | null | undefined;
        expiresAt?: string | null | undefined;
        content?: string | undefined;
        importance?: number | undefined;
        tags?: string[] | undefined;
    }, {
        metadata?: Record<string, any> | null | undefined;
        expiresAt?: string | null | undefined;
        content?: string | undefined;
        importance?: number | undefined;
        tags?: string[] | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        id: string;
    };
    body: {
        metadata?: Record<string, any> | null | undefined;
        expiresAt?: string | null | undefined;
        content?: string | undefined;
        importance?: number | undefined;
        tags?: string[] | undefined;
    };
}, {
    params: {
        id: string;
    };
    body: {
        metadata?: Record<string, any> | null | undefined;
        expiresAt?: string | null | undefined;
        content?: string | undefined;
        importance?: number | undefined;
        tags?: string[] | undefined;
    };
}>;
export declare const searchMemorySchema: z.ZodObject<{
    body: z.ZodObject<{
        query: z.ZodString;
        userId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        patientId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        memoryType: z.ZodOptional<z.ZodEnum<["PREFERENCE", "INTERACTION", "MEDICAL", "CONTEXT", "BEHAVIOR", "CLINICAL_DECISION", "PATIENT_HISTORY", "APPOINTMENT_PATTERN"]>>;
        limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        minRelevance: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        dateFrom: z.ZodOptional<z.ZodString>;
        dateTo: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        query: string;
        limit: number;
        minRelevance: number;
        userId?: string | null | undefined;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
        patientId?: string | null | undefined;
        memoryType?: "PREFERENCE" | "INTERACTION" | "MEDICAL" | "CONTEXT" | "BEHAVIOR" | "CLINICAL_DECISION" | "PATIENT_HISTORY" | "APPOINTMENT_PATTERN" | undefined;
        tags?: string[] | undefined;
    }, {
        query: string;
        userId?: string | null | undefined;
        limit?: number | undefined;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
        patientId?: string | null | undefined;
        memoryType?: "PREFERENCE" | "INTERACTION" | "MEDICAL" | "CONTEXT" | "BEHAVIOR" | "CLINICAL_DECISION" | "PATIENT_HISTORY" | "APPOINTMENT_PATTERN" | undefined;
        tags?: string[] | undefined;
        minRelevance?: number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        query: string;
        limit: number;
        minRelevance: number;
        userId?: string | null | undefined;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
        patientId?: string | null | undefined;
        memoryType?: "PREFERENCE" | "INTERACTION" | "MEDICAL" | "CONTEXT" | "BEHAVIOR" | "CLINICAL_DECISION" | "PATIENT_HISTORY" | "APPOINTMENT_PATTERN" | undefined;
        tags?: string[] | undefined;
    };
}, {
    body: {
        query: string;
        userId?: string | null | undefined;
        limit?: number | undefined;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
        patientId?: string | null | undefined;
        memoryType?: "PREFERENCE" | "INTERACTION" | "MEDICAL" | "CONTEXT" | "BEHAVIOR" | "CLINICAL_DECISION" | "PATIENT_HISTORY" | "APPOINTMENT_PATTERN" | undefined;
        tags?: string[] | undefined;
        minRelevance?: number | undefined;
    };
}>;
export declare const memoryIdSchema: z.ZodObject<{
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
export declare const memoryQuerySchema: z.ZodObject<{
    query: z.ZodObject<{
        page: z.ZodDefault<z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>>>;
        limit: z.ZodDefault<z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>>>;
        userId: z.ZodOptional<z.ZodString>;
        patientId: z.ZodOptional<z.ZodString>;
        memoryType: z.ZodOptional<z.ZodEnum<["PREFERENCE", "INTERACTION", "MEDICAL", "CONTEXT", "BEHAVIOR", "CLINICAL_DECISION", "PATIENT_HISTORY", "APPOINTMENT_PATTERN"]>>;
        tags: z.ZodOptional<z.ZodEffects<z.ZodString, string[], string>>;
        dateFrom: z.ZodOptional<z.ZodString>;
        dateTo: z.ZodOptional<z.ZodString>;
        sortBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<["createdAt", "importance", "accessCount", "updatedAt"]>>>;
        sortOrder: z.ZodDefault<z.ZodOptional<z.ZodEnum<["asc", "desc"]>>>;
    }, "strip", z.ZodTypeAny, {
        page: number;
        limit: number;
        sortBy: "createdAt" | "updatedAt" | "importance" | "accessCount";
        sortOrder: "asc" | "desc";
        userId?: string | undefined;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
        patientId?: string | undefined;
        memoryType?: "PREFERENCE" | "INTERACTION" | "MEDICAL" | "CONTEXT" | "BEHAVIOR" | "CLINICAL_DECISION" | "PATIENT_HISTORY" | "APPOINTMENT_PATTERN" | undefined;
        tags?: string[] | undefined;
    }, {
        userId?: string | undefined;
        page?: string | undefined;
        limit?: string | undefined;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
        sortBy?: "createdAt" | "updatedAt" | "importance" | "accessCount" | undefined;
        sortOrder?: "asc" | "desc" | undefined;
        patientId?: string | undefined;
        memoryType?: "PREFERENCE" | "INTERACTION" | "MEDICAL" | "CONTEXT" | "BEHAVIOR" | "CLINICAL_DECISION" | "PATIENT_HISTORY" | "APPOINTMENT_PATTERN" | undefined;
        tags?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    query: {
        page: number;
        limit: number;
        sortBy: "createdAt" | "updatedAt" | "importance" | "accessCount";
        sortOrder: "asc" | "desc";
        userId?: string | undefined;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
        patientId?: string | undefined;
        memoryType?: "PREFERENCE" | "INTERACTION" | "MEDICAL" | "CONTEXT" | "BEHAVIOR" | "CLINICAL_DECISION" | "PATIENT_HISTORY" | "APPOINTMENT_PATTERN" | undefined;
        tags?: string[] | undefined;
    };
}, {
    query: {
        userId?: string | undefined;
        page?: string | undefined;
        limit?: string | undefined;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
        sortBy?: "createdAt" | "updatedAt" | "importance" | "accessCount" | undefined;
        sortOrder?: "asc" | "desc" | undefined;
        patientId?: string | undefined;
        memoryType?: "PREFERENCE" | "INTERACTION" | "MEDICAL" | "CONTEXT" | "BEHAVIOR" | "CLINICAL_DECISION" | "PATIENT_HISTORY" | "APPOINTMENT_PATTERN" | undefined;
        tags?: string | undefined;
    };
}>;
export declare const consolidateMemoriesSchema: z.ZodObject<{
    body: z.ZodObject<{
        userId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        patientId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        memoryType: z.ZodOptional<z.ZodEnum<["PREFERENCE", "INTERACTION", "MEDICAL", "CONTEXT", "BEHAVIOR", "CLINICAL_DECISION", "PATIENT_HISTORY", "APPOINTMENT_PATTERN"]>>;
        timeRange: z.ZodDefault<z.ZodOptional<z.ZodEnum<["day", "week", "month"]>>>;
    }, "strip", z.ZodTypeAny, {
        timeRange: "week" | "day" | "month";
        userId?: string | null | undefined;
        patientId?: string | null | undefined;
        memoryType?: "PREFERENCE" | "INTERACTION" | "MEDICAL" | "CONTEXT" | "BEHAVIOR" | "CLINICAL_DECISION" | "PATIENT_HISTORY" | "APPOINTMENT_PATTERN" | undefined;
    }, {
        userId?: string | null | undefined;
        patientId?: string | null | undefined;
        memoryType?: "PREFERENCE" | "INTERACTION" | "MEDICAL" | "CONTEXT" | "BEHAVIOR" | "CLINICAL_DECISION" | "PATIENT_HISTORY" | "APPOINTMENT_PATTERN" | undefined;
        timeRange?: "week" | "day" | "month" | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        timeRange: "week" | "day" | "month";
        userId?: string | null | undefined;
        patientId?: string | null | undefined;
        memoryType?: "PREFERENCE" | "INTERACTION" | "MEDICAL" | "CONTEXT" | "BEHAVIOR" | "CLINICAL_DECISION" | "PATIENT_HISTORY" | "APPOINTMENT_PATTERN" | undefined;
    };
}, {
    body: {
        userId?: string | null | undefined;
        patientId?: string | null | undefined;
        memoryType?: "PREFERENCE" | "INTERACTION" | "MEDICAL" | "CONTEXT" | "BEHAVIOR" | "CLINICAL_DECISION" | "PATIENT_HISTORY" | "APPOINTMENT_PATTERN" | undefined;
        timeRange?: "week" | "day" | "month" | undefined;
    };
}>;
export declare const patientMemorySchema: z.ZodObject<{
    params: z.ZodObject<{
        patientId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        patientId: string;
    }, {
        patientId: string;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        patientId: string;
    };
}, {
    params: {
        patientId: string;
    };
}>;
export type SaveMemoryInput = z.infer<typeof saveMemorySchema>['body'];
export type UpdateMemoryInput = z.infer<typeof updateMemorySchema>['body'];
export type SearchMemoryInput = z.infer<typeof searchMemorySchema>['body'];
export type MemoryQueryInput = z.infer<typeof memoryQuerySchema>['query'];
export type ConsolidateMemoriesInput = z.infer<typeof consolidateMemoriesSchema>['body'];
//# sourceMappingURL=memoryValidators.d.ts.map