"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.anonymizeDataSchema = exports.dataRetentionSchema = exports.securityScanSchema = exports.complianceReportSchema = exports.decryptDataSchema = exports.encryptDataSchema = exports.validatePasswordSchema = exports.securityConfigSchema = exports.unblockIpSchema = exports.blockIpSchema = exports.exportAuditSchema = exports.resourceAuditTrailSchema = exports.userAuditTrailSchema = exports.auditIdSchema = exports.auditQuerySchema = exports.auditLogEntrySchema = void 0;
const zod_1 = require("zod");
// ============================================
// AUDIT LOG VALIDATORS
// ============================================
exports.auditLogEntrySchema = zod_1.z.object({
    userId: zod_1.z.string().cuid('Invalid user ID').optional().nullable(),
    organizationId: zod_1.z.string().cuid('Invalid organization ID').optional().nullable(),
    action: zod_1.z.string({
        required_error: 'Action is required',
    }).min(1, 'Action cannot be empty').max(100, 'Action must be less than 100 characters'),
    resource: zod_1.z.string({
        required_error: 'Resource is required',
    }).min(1, 'Resource cannot be empty').max(100, 'Resource must be less than 100 characters'),
    resourceId: zod_1.z.string().max(100).optional().nullable(),
    ipAddress: zod_1.z.string().max(45, 'IP address too long').optional().default('unknown'),
    userAgent: zod_1.z.string().max(500).optional().default('unknown'),
    metadata: zod_1.z.record(zod_1.z.any()).optional().nullable(),
    severity: zod_1.z.enum(['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL']).optional().default('INFO'),
    status: zod_1.z.enum(['SUCCESS', 'FAILURE', 'ATTEMPT']).optional().default('SUCCESS'),
});
exports.auditQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(1, 'Page must be at least 1')).optional().default('1'),
        limit: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(1, 'Limit must be at least 1').max(100, 'Limit must be at most 100')).optional().default('50'),
        userId: zod_1.z.string().cuid('Invalid user ID').optional(),
        organizationId: zod_1.z.string().cuid('Invalid organization ID').optional(),
        action: zod_1.z.string().max(100).optional(),
        resource: zod_1.z.string().max(100).optional(),
        severity: zod_1.z.enum(['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL']).optional(),
        status: zod_1.z.enum(['SUCCESS', 'FAILURE', 'ATTEMPT']).optional(),
        dateFrom: zod_1.z.string().datetime('Invalid date format').optional(),
        dateTo: zod_1.z.string().datetime('Invalid date format').optional(),
        ipAddress: zod_1.z.string().max(45).optional(),
        search: zod_1.z.string().max(200, 'Search query too long').optional(),
        sortBy: zod_1.z.enum([
            'createdAt', 'action', 'resource', 'severity', 'status', 'ipAddress'
        ]).optional().default('createdAt'),
        sortOrder: zod_1.z.enum(['asc', 'desc']).optional().default('desc'),
    }),
});
exports.auditIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('Invalid audit log ID'),
    }),
});
exports.userAuditTrailSchema = zod_1.z.object({
    params: zod_1.z.object({
        userId: zod_1.z.string().cuid('Invalid user ID'),
    }),
    query: zod_1.z.object({
        page: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(1)).optional().default('1'),
        limit: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(1).max(100)).optional().default('50'),
        dateFrom: zod_1.z.string().datetime().optional(),
        dateTo: zod_1.z.string().datetime().optional(),
    }),
});
exports.resourceAuditTrailSchema = zod_1.z.object({
    params: zod_1.z.object({
        resource: zod_1.z.string().min(1, 'Resource is required').max(100),
        resourceId: zod_1.z.string().min(1, 'Resource ID is required').max(100),
    }),
    query: zod_1.z.object({
        page: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(1)).optional().default('1'),
        limit: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(1).max(100)).optional().default('50'),
    }),
});
exports.exportAuditSchema = zod_1.z.object({
    query: zod_1.z.object({
        format: zod_1.z.enum(['csv', 'json']).optional().default('json'),
        dateFrom: zod_1.z.string().datetime().optional(),
        dateTo: zod_1.z.string().datetime().optional(),
        action: zod_1.z.string().optional(),
        resource: zod_1.z.string().optional(),
        userId: zod_1.z.string().cuid().optional(),
        organizationId: zod_1.z.string().cuid().optional(),
        severity: zod_1.z.enum(['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL']).optional(),
    }),
});
// ============================================
// SECURITY VALIDATORS
// ============================================
exports.blockIpSchema = zod_1.z.object({
    body: zod_1.z.object({
        ip: zod_1.z.string({
            required_error: 'IP address is required',
        }).regex(/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/, 'Invalid IP address format'),
        reason: zod_1.z.string().min(1, 'Reason is required').max(500, 'Reason must be less than 500 characters'),
    }),
});
exports.unblockIpSchema = zod_1.z.object({
    body: zod_1.z.object({
        ip: zod_1.z.string({
            required_error: 'IP address is required',
        }).regex(/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/, 'Invalid IP address format'),
    }),
});
exports.securityConfigSchema = zod_1.z.object({
    body: zod_1.z.object({
        passwordPolicy: zod_1.z.object({
            minLength: zod_1.z.number().min(6).max(32).optional(),
            requireUppercase: zod_1.z.boolean().optional(),
            requireLowercase: zod_1.z.boolean().optional(),
            requireNumbers: zod_1.z.boolean().optional(),
            requireSpecialChars: zod_1.z.boolean().optional(),
            maxAge: zod_1.z.number().min(1).max(365).optional(),
            preventReuse: zod_1.z.number().min(0).max(20).optional(),
            maxAttempts: zod_1.z.number().min(1).max(20).optional(),
            lockoutDuration: zod_1.z.number().min(1).max(1440).optional(),
        }).optional(),
        sessionPolicy: zod_1.z.object({
            maxConcurrentSessions: zod_1.z.number().min(1).max(20).optional(),
            sessionTimeout: zod_1.z.number().min(5).max(1440).optional(),
            extendOnActivity: zod_1.z.boolean().optional(),
            requireReauthForSensitive: zod_1.z.boolean().optional(),
        }).optional(),
        rateLimitPolicy: zod_1.z.object({
            enabled: zod_1.z.boolean().optional(),
            windowMs: zod_1.z.number().min(1000).max(3600000).optional(),
            maxRequests: zod_1.z.number().min(1).max(10000).optional(),
        }).optional(),
        mfaRequired: zod_1.z.boolean().optional(),
        ipWhitelist: zod_1.z.array(zod_1.z.string()).optional(),
        ipBlacklist: zod_1.z.array(zod_1.z.string()).optional(),
        encryptionSettings: zod_1.z.object({
            algorithm: zod_1.z.string().optional(),
            keyRotationDays: zod_1.z.number().min(1).max(365).optional(),
            dataAtRest: zod_1.z.boolean().optional(),
            dataInTransit: zod_1.z.boolean().optional(),
        }).optional(),
    }),
});
exports.validatePasswordSchema = zod_1.z.object({
    body: zod_1.z.object({
        password: zod_1.z.string({
            required_error: 'Password is required',
        }).min(1, 'Password cannot be empty'),
    }),
});
exports.encryptDataSchema = zod_1.z.object({
    body: zod_1.z.object({
        data: zod_1.z.string({
            required_error: 'Data is required',
        }).min(1, 'Data cannot be empty').max(100000, 'Data too large'),
    }),
});
exports.decryptDataSchema = zod_1.z.object({
    body: zod_1.z.object({
        encrypted: zod_1.z.string({
            required_error: 'Encrypted data is required',
        }).min(1),
        iv: zod_1.z.string({
            required_error: 'IV is required',
        }).min(1),
        tag: zod_1.z.string({
            required_error: 'Auth tag is required',
        }).min(1),
    }),
});
// ============================================
// COMPLIANCE VALIDATORS
// ============================================
exports.complianceReportSchema = zod_1.z.object({
    params: zod_1.z.object({
        type: zod_1.z.enum(['HIPAA', 'GDPR', 'PCI', 'SOC2'], {
            required_error: 'Compliance type is required',
        }),
    }),
    query: zod_1.z.object({
        periodStart: zod_1.z.string().datetime().optional(),
        periodEnd: zod_1.z.string().datetime().optional(),
    }),
});
exports.securityScanSchema = zod_1.z.object({
    body: zod_1.z.object({
        scanType: zod_1.z.enum(['FULL', 'QUICK', 'OWASP', 'PENETRATION']).optional().default('QUICK'),
        targetUrl: zod_1.z.string().url().optional(),
        includeDatabase: zod_1.z.boolean().optional().default(true),
        includeNetwork: zod_1.z.boolean().optional().default(false),
    }),
});
exports.dataRetentionSchema = zod_1.z.object({
    body: zod_1.z.object({
        resource: zod_1.z.string().min(1).max(100),
        retentionDays: zod_1.z.number().min(1).max(3650),
    }),
});
exports.anonymizeDataSchema = zod_1.z.object({
    body: zod_1.z.object({
        patientId: zod_1.z.string().cuid('Invalid patient ID'),
        fields: zod_1.z.array(zod_1.z.string()).optional(),
    }),
});
//# sourceMappingURL=auditValidator.js.map