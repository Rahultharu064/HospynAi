import { z } from 'zod';
export declare const agentChatSchema: z.ZodObject<{
    body: z.ZodObject<{
        message: z.ZodString;
        sessionId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        patientId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        context: z.ZodNullable<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>>;
        stream: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    }, "strip", z.ZodTypeAny, {
        message: string;
        stream: boolean;
        sessionId?: string | null | undefined;
        patientId?: string | null | undefined;
        context?: Record<string, any> | null | undefined;
    }, {
        message: string;
        sessionId?: string | null | undefined;
        patientId?: string | null | undefined;
        context?: Record<string, any> | null | undefined;
        stream?: boolean | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        message: string;
        stream: boolean;
        sessionId?: string | null | undefined;
        patientId?: string | null | undefined;
        context?: Record<string, any> | null | undefined;
    };
}, {
    body: {
        message: string;
        sessionId?: string | null | undefined;
        patientId?: string | null | undefined;
        context?: Record<string, any> | null | undefined;
        stream?: boolean | undefined;
    };
}>;
export declare const agentTaskSchema: z.ZodObject<{
    body: z.ZodObject<{
        taskType: z.ZodEnum<["SCHEDULE_APPOINTMENT", "CREATE_PRESCRIPTION", "ORDER_LAB_TEST", "ANALYZE_SYMPTOMS", "GENERATE_REFERRAL", "SUMMARIZE_RECORDS", "CHECK_DRUG_INTERACTIONS", "TRIAGE_PATIENT", "GENERATE_REPORT", "SEND_NOTIFICATION"]>;
        parameters: z.ZodRecord<z.ZodString, z.ZodAny>;
        patientId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        priority: z.ZodDefault<z.ZodOptional<z.ZodEnum<["low", "normal", "high", "urgent"]>>>;
        callbackUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        priority: "low" | "normal" | "high" | "urgent";
        taskType: "SUMMARIZE_RECORDS" | "SCHEDULE_APPOINTMENT" | "CREATE_PRESCRIPTION" | "ORDER_LAB_TEST" | "ANALYZE_SYMPTOMS" | "GENERATE_REFERRAL" | "CHECK_DRUG_INTERACTIONS" | "TRIAGE_PATIENT" | "GENERATE_REPORT" | "SEND_NOTIFICATION";
        parameters: Record<string, any>;
        patientId?: string | null | undefined;
        callbackUrl?: string | null | undefined;
    }, {
        taskType: "SUMMARIZE_RECORDS" | "SCHEDULE_APPOINTMENT" | "CREATE_PRESCRIPTION" | "ORDER_LAB_TEST" | "ANALYZE_SYMPTOMS" | "GENERATE_REFERRAL" | "CHECK_DRUG_INTERACTIONS" | "TRIAGE_PATIENT" | "GENERATE_REPORT" | "SEND_NOTIFICATION";
        parameters: Record<string, any>;
        priority?: "low" | "normal" | "high" | "urgent" | undefined;
        patientId?: string | null | undefined;
        callbackUrl?: string | null | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        priority: "low" | "normal" | "high" | "urgent";
        taskType: "SUMMARIZE_RECORDS" | "SCHEDULE_APPOINTMENT" | "CREATE_PRESCRIPTION" | "ORDER_LAB_TEST" | "ANALYZE_SYMPTOMS" | "GENERATE_REFERRAL" | "CHECK_DRUG_INTERACTIONS" | "TRIAGE_PATIENT" | "GENERATE_REPORT" | "SEND_NOTIFICATION";
        parameters: Record<string, any>;
        patientId?: string | null | undefined;
        callbackUrl?: string | null | undefined;
    };
}, {
    body: {
        taskType: "SUMMARIZE_RECORDS" | "SCHEDULE_APPOINTMENT" | "CREATE_PRESCRIPTION" | "ORDER_LAB_TEST" | "ANALYZE_SYMPTOMS" | "GENERATE_REFERRAL" | "CHECK_DRUG_INTERACTIONS" | "TRIAGE_PATIENT" | "GENERATE_REPORT" | "SEND_NOTIFICATION";
        parameters: Record<string, any>;
        priority?: "low" | "normal" | "high" | "urgent" | undefined;
        patientId?: string | null | undefined;
        callbackUrl?: string | null | undefined;
    };
}>;
export declare const toolExecutionSchema: z.ZodObject<{
    body: z.ZodObject<{
        toolName: z.ZodString;
        parameters: z.ZodRecord<z.ZodString, z.ZodAny>;
        agentId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        parameters: Record<string, any>;
        toolName: string;
        agentId?: string | undefined;
    }, {
        parameters: Record<string, any>;
        toolName: string;
        agentId?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        parameters: Record<string, any>;
        toolName: string;
        agentId?: string | undefined;
    };
}, {
    body: {
        parameters: Record<string, any>;
        toolName: string;
        agentId?: string | undefined;
    };
}>;
export declare const agentQuerySchema: z.ZodObject<{
    query: z.ZodObject<{
        page: z.ZodDefault<z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>>>;
        limit: z.ZodDefault<z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>>>;
        userId: z.ZodOptional<z.ZodString>;
        taskType: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodEnum<["STARTED", "IN_PROGRESS", "COMPLETED", "FAILED", "CANCELLED"]>>;
        dateFrom: z.ZodOptional<z.ZodString>;
        dateTo: z.ZodOptional<z.ZodString>;
        sortBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<["createdAt", "duration", "tokensUsed"]>>>;
        sortOrder: z.ZodDefault<z.ZodOptional<z.ZodEnum<["asc", "desc"]>>>;
    }, "strip", z.ZodTypeAny, {
        page: number;
        limit: number;
        sortBy: "createdAt" | "duration" | "tokensUsed";
        sortOrder: "asc" | "desc";
        status?: "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "FAILED" | "STARTED" | undefined;
        userId?: string | undefined;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
        taskType?: string | undefined;
    }, {
        status?: "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "FAILED" | "STARTED" | undefined;
        userId?: string | undefined;
        page?: string | undefined;
        limit?: string | undefined;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
        sortBy?: "createdAt" | "duration" | "tokensUsed" | undefined;
        sortOrder?: "asc" | "desc" | undefined;
        taskType?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    query: {
        page: number;
        limit: number;
        sortBy: "createdAt" | "duration" | "tokensUsed";
        sortOrder: "asc" | "desc";
        status?: "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "FAILED" | "STARTED" | undefined;
        userId?: string | undefined;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
        taskType?: string | undefined;
    };
}, {
    query: {
        status?: "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "FAILED" | "STARTED" | undefined;
        userId?: string | undefined;
        page?: string | undefined;
        limit?: string | undefined;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
        sortBy?: "createdAt" | "duration" | "tokensUsed" | undefined;
        sortOrder?: "asc" | "desc" | undefined;
        taskType?: string | undefined;
    };
}>;
export declare const ingestDocumentSchema: z.ZodObject<{
    body: z.ZodObject<{
        title: z.ZodString;
        description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        sourceType: z.ZodEnum<["FAQ", "MEDICAL_GUIDE", "POLICY", "RESEARCH", "CUSTOM"]>;
        language: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        chunkSize: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        chunkOverlap: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    }, "strip", z.ZodTypeAny, {
        title: string;
        language: string;
        sourceType: "CUSTOM" | "FAQ" | "MEDICAL_GUIDE" | "POLICY" | "RESEARCH";
        chunkSize: number;
        chunkOverlap: number;
        description?: string | null | undefined;
    }, {
        title: string;
        sourceType: "CUSTOM" | "FAQ" | "MEDICAL_GUIDE" | "POLICY" | "RESEARCH";
        description?: string | null | undefined;
        language?: string | undefined;
        chunkSize?: number | undefined;
        chunkOverlap?: number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        title: string;
        language: string;
        sourceType: "CUSTOM" | "FAQ" | "MEDICAL_GUIDE" | "POLICY" | "RESEARCH";
        chunkSize: number;
        chunkOverlap: number;
        description?: string | null | undefined;
    };
}, {
    body: {
        title: string;
        sourceType: "CUSTOM" | "FAQ" | "MEDICAL_GUIDE" | "POLICY" | "RESEARCH";
        description?: string | null | undefined;
        language?: string | undefined;
        chunkSize?: number | undefined;
        chunkOverlap?: number | undefined;
    };
}>;
export declare const ragQuerySchema: z.ZodObject<{
    body: z.ZodObject<{
        query: z.ZodString;
        sourceType: z.ZodOptional<z.ZodEnum<["FAQ", "MEDICAL_GUIDE", "POLICY", "RESEARCH", "CUSTOM"]>>;
        maxResults: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        minRelevance: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        includeCitations: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        patientId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        context: z.ZodNullable<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>>;
    }, "strip", z.ZodTypeAny, {
        query: string;
        minRelevance: number;
        maxResults: number;
        includeCitations: boolean;
        patientId?: string | null | undefined;
        context?: Record<string, any> | null | undefined;
        sourceType?: "CUSTOM" | "FAQ" | "MEDICAL_GUIDE" | "POLICY" | "RESEARCH" | undefined;
    }, {
        query: string;
        patientId?: string | null | undefined;
        minRelevance?: number | undefined;
        context?: Record<string, any> | null | undefined;
        sourceType?: "CUSTOM" | "FAQ" | "MEDICAL_GUIDE" | "POLICY" | "RESEARCH" | undefined;
        maxResults?: number | undefined;
        includeCitations?: boolean | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        query: string;
        minRelevance: number;
        maxResults: number;
        includeCitations: boolean;
        patientId?: string | null | undefined;
        context?: Record<string, any> | null | undefined;
        sourceType?: "CUSTOM" | "FAQ" | "MEDICAL_GUIDE" | "POLICY" | "RESEARCH" | undefined;
    };
}, {
    body: {
        query: string;
        patientId?: string | null | undefined;
        minRelevance?: number | undefined;
        context?: Record<string, any> | null | undefined;
        sourceType?: "CUSTOM" | "FAQ" | "MEDICAL_GUIDE" | "POLICY" | "RESEARCH" | undefined;
        maxResults?: number | undefined;
        includeCitations?: boolean | undefined;
    };
}>;
export declare const ragDocumentQuerySchema: z.ZodObject<{
    query: z.ZodObject<{
        page: z.ZodDefault<z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>>>;
        limit: z.ZodDefault<z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>>>;
        sourceType: z.ZodOptional<z.ZodEnum<["FAQ", "MEDICAL_GUIDE", "POLICY", "RESEARCH", "CUSTOM"]>>;
        isActive: z.ZodOptional<z.ZodEffects<z.ZodString, boolean, string>>;
        search: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        page: number;
        limit: number;
        search?: string | undefined;
        isActive?: boolean | undefined;
        sourceType?: "CUSTOM" | "FAQ" | "MEDICAL_GUIDE" | "POLICY" | "RESEARCH" | undefined;
    }, {
        search?: string | undefined;
        page?: string | undefined;
        limit?: string | undefined;
        isActive?: string | undefined;
        sourceType?: "CUSTOM" | "FAQ" | "MEDICAL_GUIDE" | "POLICY" | "RESEARCH" | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    query: {
        page: number;
        limit: number;
        search?: string | undefined;
        isActive?: boolean | undefined;
        sourceType?: "CUSTOM" | "FAQ" | "MEDICAL_GUIDE" | "POLICY" | "RESEARCH" | undefined;
    };
}, {
    query: {
        search?: string | undefined;
        page?: string | undefined;
        limit?: string | undefined;
        isActive?: string | undefined;
        sourceType?: "CUSTOM" | "FAQ" | "MEDICAL_GUIDE" | "POLICY" | "RESEARCH" | undefined;
    };
}>;
export declare const saveMemorySchema: z.ZodObject<{
    body: z.ZodObject<{
        userId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        patientId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        memoryType: z.ZodEnum<["PREFERENCE", "INTERACTION", "MEDICAL", "CONTEXT"]>;
        content: z.ZodString;
        metadata: z.ZodNullable<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>>;
    }, "strip", z.ZodTypeAny, {
        content: string;
        memoryType: "PREFERENCE" | "INTERACTION" | "MEDICAL" | "CONTEXT";
        metadata?: Record<string, any> | null | undefined;
        userId?: string | null | undefined;
        patientId?: string | null | undefined;
    }, {
        content: string;
        memoryType: "PREFERENCE" | "INTERACTION" | "MEDICAL" | "CONTEXT";
        metadata?: Record<string, any> | null | undefined;
        userId?: string | null | undefined;
        patientId?: string | null | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        content: string;
        memoryType: "PREFERENCE" | "INTERACTION" | "MEDICAL" | "CONTEXT";
        metadata?: Record<string, any> | null | undefined;
        userId?: string | null | undefined;
        patientId?: string | null | undefined;
    };
}, {
    body: {
        content: string;
        memoryType: "PREFERENCE" | "INTERACTION" | "MEDICAL" | "CONTEXT";
        metadata?: Record<string, any> | null | undefined;
        userId?: string | null | undefined;
        patientId?: string | null | undefined;
    };
}>;
export declare const memoryQuerySchema: z.ZodObject<{
    query: z.ZodObject<{
        userId: z.ZodOptional<z.ZodString>;
        patientId: z.ZodOptional<z.ZodString>;
        memoryType: z.ZodOptional<z.ZodEnum<["PREFERENCE", "INTERACTION", "MEDICAL", "CONTEXT"]>>;
        limit: z.ZodDefault<z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>>>;
        minRelevance: z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>>;
    }, "strip", z.ZodTypeAny, {
        limit: number;
        userId?: string | undefined;
        patientId?: string | undefined;
        memoryType?: "PREFERENCE" | "INTERACTION" | "MEDICAL" | "CONTEXT" | undefined;
        minRelevance?: number | undefined;
    }, {
        userId?: string | undefined;
        limit?: string | undefined;
        patientId?: string | undefined;
        memoryType?: "PREFERENCE" | "INTERACTION" | "MEDICAL" | "CONTEXT" | undefined;
        minRelevance?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    query: {
        limit: number;
        userId?: string | undefined;
        patientId?: string | undefined;
        memoryType?: "PREFERENCE" | "INTERACTION" | "MEDICAL" | "CONTEXT" | undefined;
        minRelevance?: number | undefined;
    };
}, {
    query: {
        userId?: string | undefined;
        limit?: string | undefined;
        patientId?: string | undefined;
        memoryType?: "PREFERENCE" | "INTERACTION" | "MEDICAL" | "CONTEXT" | undefined;
        minRelevance?: string | undefined;
    };
}>;
export type AgentChatInput = z.infer<typeof agentChatSchema>['body'];
export type AgentTaskInput = z.infer<typeof agentTaskSchema>['body'];
export type ToolExecutionInput = z.infer<typeof toolExecutionSchema>['body'];
export type AgentQueryInput = z.infer<typeof agentQuerySchema>['query'];
export type IngestDocumentInput = z.infer<typeof ingestDocumentSchema>['body'];
export type RagQueryInput = z.infer<typeof ragQuerySchema>['body'];
export type RagDocumentQueryInput = z.infer<typeof ragDocumentQuerySchema>['query'];
export type SaveMemoryInput = z.infer<typeof saveMemorySchema>['body'];
export type MemoryQueryInput = z.infer<typeof memoryQuerySchema>['query'];
//# sourceMappingURL=aiagentValidators.d.ts.map