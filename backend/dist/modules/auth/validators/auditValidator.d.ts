import { z } from 'zod';
export declare const auditLogEntrySchema: z.ZodObject<{
    userId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    organizationId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    action: z.ZodString;
    resource: z.ZodString;
    resourceId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    ipAddress: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    userAgent: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    metadata: z.ZodNullable<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>>;
    severity: z.ZodDefault<z.ZodOptional<z.ZodEnum<["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]>>>;
    status: z.ZodDefault<z.ZodOptional<z.ZodEnum<["SUCCESS", "FAILURE", "ATTEMPT"]>>>;
}, "strip", z.ZodTypeAny, {
    status: "SUCCESS" | "FAILURE" | "ATTEMPT";
    ipAddress: string;
    userAgent: string;
    action: string;
    resource: string;
    severity: "DEBUG" | "INFO" | "WARNING" | "ERROR" | "CRITICAL";
    metadata?: Record<string, any> | null | undefined;
    organizationId?: string | null | undefined;
    userId?: string | null | undefined;
    resourceId?: string | null | undefined;
}, {
    action: string;
    resource: string;
    metadata?: Record<string, any> | null | undefined;
    status?: "SUCCESS" | "FAILURE" | "ATTEMPT" | undefined;
    organizationId?: string | null | undefined;
    userId?: string | null | undefined;
    ipAddress?: string | undefined;
    userAgent?: string | undefined;
    resourceId?: string | null | undefined;
    severity?: "DEBUG" | "INFO" | "WARNING" | "ERROR" | "CRITICAL" | undefined;
}>;
export declare const auditQuerySchema: z.ZodObject<{
    query: z.ZodObject<{
        page: z.ZodDefault<z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>>>;
        limit: z.ZodDefault<z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>>>;
        userId: z.ZodOptional<z.ZodString>;
        organizationId: z.ZodOptional<z.ZodString>;
        action: z.ZodOptional<z.ZodString>;
        resource: z.ZodOptional<z.ZodString>;
        severity: z.ZodOptional<z.ZodEnum<["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]>>;
        status: z.ZodOptional<z.ZodEnum<["SUCCESS", "FAILURE", "ATTEMPT"]>>;
        dateFrom: z.ZodOptional<z.ZodString>;
        dateTo: z.ZodOptional<z.ZodString>;
        ipAddress: z.ZodOptional<z.ZodString>;
        search: z.ZodOptional<z.ZodString>;
        sortBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<["createdAt", "action", "resource", "severity", "status", "ipAddress"]>>>;
        sortOrder: z.ZodDefault<z.ZodOptional<z.ZodEnum<["asc", "desc"]>>>;
    }, "strip", z.ZodTypeAny, {
        page: number;
        limit: number;
        sortBy: "status" | "createdAt" | "ipAddress" | "action" | "resource" | "severity";
        sortOrder: "asc" | "desc";
        search?: string | undefined;
        status?: "SUCCESS" | "FAILURE" | "ATTEMPT" | undefined;
        organizationId?: string | undefined;
        userId?: string | undefined;
        ipAddress?: string | undefined;
        action?: string | undefined;
        resource?: string | undefined;
        severity?: "DEBUG" | "INFO" | "WARNING" | "ERROR" | "CRITICAL" | undefined;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
    }, {
        search?: string | undefined;
        status?: "SUCCESS" | "FAILURE" | "ATTEMPT" | undefined;
        organizationId?: string | undefined;
        userId?: string | undefined;
        ipAddress?: string | undefined;
        action?: string | undefined;
        resource?: string | undefined;
        severity?: "DEBUG" | "INFO" | "WARNING" | "ERROR" | "CRITICAL" | undefined;
        page?: string | undefined;
        limit?: string | undefined;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
        sortBy?: "status" | "createdAt" | "ipAddress" | "action" | "resource" | "severity" | undefined;
        sortOrder?: "asc" | "desc" | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    query: {
        page: number;
        limit: number;
        sortBy: "status" | "createdAt" | "ipAddress" | "action" | "resource" | "severity";
        sortOrder: "asc" | "desc";
        search?: string | undefined;
        status?: "SUCCESS" | "FAILURE" | "ATTEMPT" | undefined;
        organizationId?: string | undefined;
        userId?: string | undefined;
        ipAddress?: string | undefined;
        action?: string | undefined;
        resource?: string | undefined;
        severity?: "DEBUG" | "INFO" | "WARNING" | "ERROR" | "CRITICAL" | undefined;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
    };
}, {
    query: {
        search?: string | undefined;
        status?: "SUCCESS" | "FAILURE" | "ATTEMPT" | undefined;
        organizationId?: string | undefined;
        userId?: string | undefined;
        ipAddress?: string | undefined;
        action?: string | undefined;
        resource?: string | undefined;
        severity?: "DEBUG" | "INFO" | "WARNING" | "ERROR" | "CRITICAL" | undefined;
        page?: string | undefined;
        limit?: string | undefined;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
        sortBy?: "status" | "createdAt" | "ipAddress" | "action" | "resource" | "severity" | undefined;
        sortOrder?: "asc" | "desc" | undefined;
    };
}>;
export declare const auditIdSchema: z.ZodObject<{
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
export declare const userAuditTrailSchema: z.ZodObject<{
    params: z.ZodObject<{
        userId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        userId: string;
    }, {
        userId: string;
    }>;
    query: z.ZodObject<{
        page: z.ZodDefault<z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>>>;
        limit: z.ZodDefault<z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>>>;
        dateFrom: z.ZodOptional<z.ZodString>;
        dateTo: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        page: number;
        limit: number;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
    }, {
        page?: string | undefined;
        limit?: string | undefined;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    query: {
        page: number;
        limit: number;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
    };
    params: {
        userId: string;
    };
}, {
    query: {
        page?: string | undefined;
        limit?: string | undefined;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
    };
    params: {
        userId: string;
    };
}>;
export declare const resourceAuditTrailSchema: z.ZodObject<{
    params: z.ZodObject<{
        resource: z.ZodString;
        resourceId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        resource: string;
        resourceId: string;
    }, {
        resource: string;
        resourceId: string;
    }>;
    query: z.ZodObject<{
        page: z.ZodDefault<z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>>>;
        limit: z.ZodDefault<z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>>>;
    }, "strip", z.ZodTypeAny, {
        page: number;
        limit: number;
    }, {
        page?: string | undefined;
        limit?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    query: {
        page: number;
        limit: number;
    };
    params: {
        resource: string;
        resourceId: string;
    };
}, {
    query: {
        page?: string | undefined;
        limit?: string | undefined;
    };
    params: {
        resource: string;
        resourceId: string;
    };
}>;
export declare const exportAuditSchema: z.ZodObject<{
    query: z.ZodObject<{
        format: z.ZodDefault<z.ZodOptional<z.ZodEnum<["csv", "json"]>>>;
        dateFrom: z.ZodOptional<z.ZodString>;
        dateTo: z.ZodOptional<z.ZodString>;
        action: z.ZodOptional<z.ZodString>;
        resource: z.ZodOptional<z.ZodString>;
        userId: z.ZodOptional<z.ZodString>;
        organizationId: z.ZodOptional<z.ZodString>;
        severity: z.ZodOptional<z.ZodEnum<["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]>>;
    }, "strip", z.ZodTypeAny, {
        format: "csv" | "json";
        organizationId?: string | undefined;
        userId?: string | undefined;
        action?: string | undefined;
        resource?: string | undefined;
        severity?: "DEBUG" | "INFO" | "WARNING" | "ERROR" | "CRITICAL" | undefined;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
    }, {
        format?: "csv" | "json" | undefined;
        organizationId?: string | undefined;
        userId?: string | undefined;
        action?: string | undefined;
        resource?: string | undefined;
        severity?: "DEBUG" | "INFO" | "WARNING" | "ERROR" | "CRITICAL" | undefined;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    query: {
        format: "csv" | "json";
        organizationId?: string | undefined;
        userId?: string | undefined;
        action?: string | undefined;
        resource?: string | undefined;
        severity?: "DEBUG" | "INFO" | "WARNING" | "ERROR" | "CRITICAL" | undefined;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
    };
}, {
    query: {
        format?: "csv" | "json" | undefined;
        organizationId?: string | undefined;
        userId?: string | undefined;
        action?: string | undefined;
        resource?: string | undefined;
        severity?: "DEBUG" | "INFO" | "WARNING" | "ERROR" | "CRITICAL" | undefined;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
    };
}>;
export declare const blockIpSchema: z.ZodObject<{
    body: z.ZodObject<{
        ip: z.ZodString;
        reason: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        ip: string;
        reason: string;
    }, {
        ip: string;
        reason: string;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        ip: string;
        reason: string;
    };
}, {
    body: {
        ip: string;
        reason: string;
    };
}>;
export declare const unblockIpSchema: z.ZodObject<{
    body: z.ZodObject<{
        ip: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        ip: string;
    }, {
        ip: string;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        ip: string;
    };
}, {
    body: {
        ip: string;
    };
}>;
export declare const securityConfigSchema: z.ZodObject<{
    body: z.ZodObject<{
        passwordPolicy: z.ZodOptional<z.ZodObject<{
            minLength: z.ZodOptional<z.ZodNumber>;
            requireUppercase: z.ZodOptional<z.ZodBoolean>;
            requireLowercase: z.ZodOptional<z.ZodBoolean>;
            requireNumbers: z.ZodOptional<z.ZodBoolean>;
            requireSpecialChars: z.ZodOptional<z.ZodBoolean>;
            maxAge: z.ZodOptional<z.ZodNumber>;
            preventReuse: z.ZodOptional<z.ZodNumber>;
            maxAttempts: z.ZodOptional<z.ZodNumber>;
            lockoutDuration: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            minLength?: number | undefined;
            requireUppercase?: boolean | undefined;
            requireLowercase?: boolean | undefined;
            requireNumbers?: boolean | undefined;
            requireSpecialChars?: boolean | undefined;
            maxAge?: number | undefined;
            preventReuse?: number | undefined;
            maxAttempts?: number | undefined;
            lockoutDuration?: number | undefined;
        }, {
            minLength?: number | undefined;
            requireUppercase?: boolean | undefined;
            requireLowercase?: boolean | undefined;
            requireNumbers?: boolean | undefined;
            requireSpecialChars?: boolean | undefined;
            maxAge?: number | undefined;
            preventReuse?: number | undefined;
            maxAttempts?: number | undefined;
            lockoutDuration?: number | undefined;
        }>>;
        sessionPolicy: z.ZodOptional<z.ZodObject<{
            maxConcurrentSessions: z.ZodOptional<z.ZodNumber>;
            sessionTimeout: z.ZodOptional<z.ZodNumber>;
            extendOnActivity: z.ZodOptional<z.ZodBoolean>;
            requireReauthForSensitive: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            maxConcurrentSessions?: number | undefined;
            sessionTimeout?: number | undefined;
            extendOnActivity?: boolean | undefined;
            requireReauthForSensitive?: boolean | undefined;
        }, {
            maxConcurrentSessions?: number | undefined;
            sessionTimeout?: number | undefined;
            extendOnActivity?: boolean | undefined;
            requireReauthForSensitive?: boolean | undefined;
        }>>;
        rateLimitPolicy: z.ZodOptional<z.ZodObject<{
            enabled: z.ZodOptional<z.ZodBoolean>;
            windowMs: z.ZodOptional<z.ZodNumber>;
            maxRequests: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            enabled?: boolean | undefined;
            windowMs?: number | undefined;
            maxRequests?: number | undefined;
        }, {
            enabled?: boolean | undefined;
            windowMs?: number | undefined;
            maxRequests?: number | undefined;
        }>>;
        mfaRequired: z.ZodOptional<z.ZodBoolean>;
        ipWhitelist: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        ipBlacklist: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        encryptionSettings: z.ZodOptional<z.ZodObject<{
            algorithm: z.ZodOptional<z.ZodString>;
            keyRotationDays: z.ZodOptional<z.ZodNumber>;
            dataAtRest: z.ZodOptional<z.ZodBoolean>;
            dataInTransit: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            algorithm?: string | undefined;
            keyRotationDays?: number | undefined;
            dataAtRest?: boolean | undefined;
            dataInTransit?: boolean | undefined;
        }, {
            algorithm?: string | undefined;
            keyRotationDays?: number | undefined;
            dataAtRest?: boolean | undefined;
            dataInTransit?: boolean | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        passwordPolicy?: {
            minLength?: number | undefined;
            requireUppercase?: boolean | undefined;
            requireLowercase?: boolean | undefined;
            requireNumbers?: boolean | undefined;
            requireSpecialChars?: boolean | undefined;
            maxAge?: number | undefined;
            preventReuse?: number | undefined;
            maxAttempts?: number | undefined;
            lockoutDuration?: number | undefined;
        } | undefined;
        sessionPolicy?: {
            maxConcurrentSessions?: number | undefined;
            sessionTimeout?: number | undefined;
            extendOnActivity?: boolean | undefined;
            requireReauthForSensitive?: boolean | undefined;
        } | undefined;
        rateLimitPolicy?: {
            enabled?: boolean | undefined;
            windowMs?: number | undefined;
            maxRequests?: number | undefined;
        } | undefined;
        mfaRequired?: boolean | undefined;
        ipWhitelist?: string[] | undefined;
        ipBlacklist?: string[] | undefined;
        encryptionSettings?: {
            algorithm?: string | undefined;
            keyRotationDays?: number | undefined;
            dataAtRest?: boolean | undefined;
            dataInTransit?: boolean | undefined;
        } | undefined;
    }, {
        passwordPolicy?: {
            minLength?: number | undefined;
            requireUppercase?: boolean | undefined;
            requireLowercase?: boolean | undefined;
            requireNumbers?: boolean | undefined;
            requireSpecialChars?: boolean | undefined;
            maxAge?: number | undefined;
            preventReuse?: number | undefined;
            maxAttempts?: number | undefined;
            lockoutDuration?: number | undefined;
        } | undefined;
        sessionPolicy?: {
            maxConcurrentSessions?: number | undefined;
            sessionTimeout?: number | undefined;
            extendOnActivity?: boolean | undefined;
            requireReauthForSensitive?: boolean | undefined;
        } | undefined;
        rateLimitPolicy?: {
            enabled?: boolean | undefined;
            windowMs?: number | undefined;
            maxRequests?: number | undefined;
        } | undefined;
        mfaRequired?: boolean | undefined;
        ipWhitelist?: string[] | undefined;
        ipBlacklist?: string[] | undefined;
        encryptionSettings?: {
            algorithm?: string | undefined;
            keyRotationDays?: number | undefined;
            dataAtRest?: boolean | undefined;
            dataInTransit?: boolean | undefined;
        } | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        passwordPolicy?: {
            minLength?: number | undefined;
            requireUppercase?: boolean | undefined;
            requireLowercase?: boolean | undefined;
            requireNumbers?: boolean | undefined;
            requireSpecialChars?: boolean | undefined;
            maxAge?: number | undefined;
            preventReuse?: number | undefined;
            maxAttempts?: number | undefined;
            lockoutDuration?: number | undefined;
        } | undefined;
        sessionPolicy?: {
            maxConcurrentSessions?: number | undefined;
            sessionTimeout?: number | undefined;
            extendOnActivity?: boolean | undefined;
            requireReauthForSensitive?: boolean | undefined;
        } | undefined;
        rateLimitPolicy?: {
            enabled?: boolean | undefined;
            windowMs?: number | undefined;
            maxRequests?: number | undefined;
        } | undefined;
        mfaRequired?: boolean | undefined;
        ipWhitelist?: string[] | undefined;
        ipBlacklist?: string[] | undefined;
        encryptionSettings?: {
            algorithm?: string | undefined;
            keyRotationDays?: number | undefined;
            dataAtRest?: boolean | undefined;
            dataInTransit?: boolean | undefined;
        } | undefined;
    };
}, {
    body: {
        passwordPolicy?: {
            minLength?: number | undefined;
            requireUppercase?: boolean | undefined;
            requireLowercase?: boolean | undefined;
            requireNumbers?: boolean | undefined;
            requireSpecialChars?: boolean | undefined;
            maxAge?: number | undefined;
            preventReuse?: number | undefined;
            maxAttempts?: number | undefined;
            lockoutDuration?: number | undefined;
        } | undefined;
        sessionPolicy?: {
            maxConcurrentSessions?: number | undefined;
            sessionTimeout?: number | undefined;
            extendOnActivity?: boolean | undefined;
            requireReauthForSensitive?: boolean | undefined;
        } | undefined;
        rateLimitPolicy?: {
            enabled?: boolean | undefined;
            windowMs?: number | undefined;
            maxRequests?: number | undefined;
        } | undefined;
        mfaRequired?: boolean | undefined;
        ipWhitelist?: string[] | undefined;
        ipBlacklist?: string[] | undefined;
        encryptionSettings?: {
            algorithm?: string | undefined;
            keyRotationDays?: number | undefined;
            dataAtRest?: boolean | undefined;
            dataInTransit?: boolean | undefined;
        } | undefined;
    };
}>;
export declare const validatePasswordSchema: z.ZodObject<{
    body: z.ZodObject<{
        password: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        password: string;
    }, {
        password: string;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        password: string;
    };
}, {
    body: {
        password: string;
    };
}>;
export declare const encryptDataSchema: z.ZodObject<{
    body: z.ZodObject<{
        data: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        data: string;
    }, {
        data: string;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        data: string;
    };
}, {
    body: {
        data: string;
    };
}>;
export declare const decryptDataSchema: z.ZodObject<{
    body: z.ZodObject<{
        encrypted: z.ZodString;
        iv: z.ZodString;
        tag: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        encrypted: string;
        iv: string;
        tag: string;
    }, {
        encrypted: string;
        iv: string;
        tag: string;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        encrypted: string;
        iv: string;
        tag: string;
    };
}, {
    body: {
        encrypted: string;
        iv: string;
        tag: string;
    };
}>;
export declare const complianceReportSchema: z.ZodObject<{
    params: z.ZodObject<{
        type: z.ZodEnum<["HIPAA", "GDPR", "PCI", "SOC2"]>;
    }, "strip", z.ZodTypeAny, {
        type: "HIPAA" | "GDPR" | "PCI" | "SOC2";
    }, {
        type: "HIPAA" | "GDPR" | "PCI" | "SOC2";
    }>;
    query: z.ZodObject<{
        periodStart: z.ZodOptional<z.ZodString>;
        periodEnd: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        periodStart?: string | undefined;
        periodEnd?: string | undefined;
    }, {
        periodStart?: string | undefined;
        periodEnd?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    query: {
        periodStart?: string | undefined;
        periodEnd?: string | undefined;
    };
    params: {
        type: "HIPAA" | "GDPR" | "PCI" | "SOC2";
    };
}, {
    query: {
        periodStart?: string | undefined;
        periodEnd?: string | undefined;
    };
    params: {
        type: "HIPAA" | "GDPR" | "PCI" | "SOC2";
    };
}>;
export declare const securityScanSchema: z.ZodObject<{
    body: z.ZodObject<{
        scanType: z.ZodDefault<z.ZodOptional<z.ZodEnum<["FULL", "QUICK", "OWASP", "PENETRATION"]>>>;
        targetUrl: z.ZodOptional<z.ZodString>;
        includeDatabase: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        includeNetwork: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    }, "strip", z.ZodTypeAny, {
        scanType: "FULL" | "QUICK" | "OWASP" | "PENETRATION";
        includeDatabase: boolean;
        includeNetwork: boolean;
        targetUrl?: string | undefined;
    }, {
        scanType?: "FULL" | "QUICK" | "OWASP" | "PENETRATION" | undefined;
        targetUrl?: string | undefined;
        includeDatabase?: boolean | undefined;
        includeNetwork?: boolean | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        scanType: "FULL" | "QUICK" | "OWASP" | "PENETRATION";
        includeDatabase: boolean;
        includeNetwork: boolean;
        targetUrl?: string | undefined;
    };
}, {
    body: {
        scanType?: "FULL" | "QUICK" | "OWASP" | "PENETRATION" | undefined;
        targetUrl?: string | undefined;
        includeDatabase?: boolean | undefined;
        includeNetwork?: boolean | undefined;
    };
}>;
export declare const dataRetentionSchema: z.ZodObject<{
    body: z.ZodObject<{
        resource: z.ZodString;
        retentionDays: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        resource: string;
        retentionDays: number;
    }, {
        resource: string;
        retentionDays: number;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        resource: string;
        retentionDays: number;
    };
}, {
    body: {
        resource: string;
        retentionDays: number;
    };
}>;
export declare const anonymizeDataSchema: z.ZodObject<{
    body: z.ZodObject<{
        patientId: z.ZodString;
        fields: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        patientId: string;
        fields?: string[] | undefined;
    }, {
        patientId: string;
        fields?: string[] | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        patientId: string;
        fields?: string[] | undefined;
    };
}, {
    body: {
        patientId: string;
        fields?: string[] | undefined;
    };
}>;
export type AuditLogEntry = z.infer<typeof auditLogEntrySchema>;
export type AuditQueryInput = z.infer<typeof auditQuerySchema>['query'];
export type UserAuditTrailInput = z.infer<typeof userAuditTrailSchema>;
export type ResourceAuditTrailInput = z.infer<typeof resourceAuditTrailSchema>;
export type ExportAuditInput = z.infer<typeof exportAuditSchema>['query'];
export type BlockIpInput = z.infer<typeof blockIpSchema>['body'];
export type UnblockIpInput = z.infer<typeof unblockIpSchema>['body'];
export type SecurityConfigInput = z.infer<typeof securityConfigSchema>['body'];
export type ValidatePasswordInput = z.infer<typeof validatePasswordSchema>['body'];
export type EncryptDataInput = z.infer<typeof encryptDataSchema>['body'];
export type DecryptDataInput = z.infer<typeof decryptDataSchema>['body'];
export type ComplianceReportInput = z.infer<typeof complianceReportSchema>;
export type SecurityScanInput = z.infer<typeof securityScanSchema>['body'];
export type DataRetentionInput = z.infer<typeof dataRetentionSchema>['body'];
export type AnonymizeDataInput = z.infer<typeof anonymizeDataSchema>['body'];
//# sourceMappingURL=auditValidator.d.ts.map