<<<<<<< Updated upstream
import { z } from 'zod';

// ============================================
// AUDIT LOG VALIDATORS
// ============================================

export const auditLogEntrySchema = z.object({
  userId: z.string().cuid('Invalid user ID').optional().nullable(),
  organizationId: z.string().cuid('Invalid organization ID').optional().nullable(),
  
  action: z.string({
    required_error: 'Action is required',
  }).min(1, 'Action cannot be empty').max(100, 'Action must be less than 100 characters'),
  
  resource: z.string({
    required_error: 'Resource is required',
  }).min(1, 'Resource cannot be empty').max(100, 'Resource must be less than 100 characters'),
  
  resourceId: z.string().max(100).optional().nullable(),
  ipAddress: z.string().max(45, 'IP address too long').optional().default('unknown'),
  userAgent: z.string().max(500).optional().default('unknown'),
  metadata: z.record(z.any()).optional().nullable(),
  
  severity: z.enum(['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL']).optional().default('INFO'),
  status: z.enum(['SUCCESS', 'FAILURE', 'ATTEMPT']).optional().default('SUCCESS'),
});

export const auditQuerySchema = z.object({
  query: z.object({
    page: z.string().transform(Number).pipe(z.number().min(1, 'Page must be at least 1')).optional().default('1'),
    limit: z.string().transform(Number).pipe(z.number().min(1, 'Limit must be at least 1').max(100, 'Limit must be at most 100')).optional().default('50'),
    
    userId: z.string().cuid('Invalid user ID').optional(),
    organizationId: z.string().cuid('Invalid organization ID').optional(),
    
    action: z.string().max(100).optional(),
    resource: z.string().max(100).optional(),
    severity: z.enum(['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL']).optional(),
    status: z.enum(['SUCCESS', 'FAILURE', 'ATTEMPT']).optional(),
    
    dateFrom: z.string().datetime('Invalid date format').optional(),
    dateTo: z.string().datetime('Invalid date format').optional(),
    ipAddress: z.string().max(45).optional(),
    
    search: z.string().max(200, 'Search query too long').optional(),
    
    sortBy: z.enum([
      'createdAt', 'action', 'resource', 'severity', 'status', 'ipAddress'
    ]).optional().default('createdAt'),
    
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  }),
});

export const auditIdSchema = z.object({
  params: z.object({
    id: z.string().cuid('Invalid audit log ID'),
  }),
});

export const userAuditTrailSchema = z.object({
  params: z.object({
    userId: z.string().cuid('Invalid user ID'),
  }),
  query: z.object({
    page: z.string().transform(Number).pipe(z.number().min(1)).optional().default('1'),
    limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional().default('50'),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
  }),
});

export const resourceAuditTrailSchema = z.object({
  params: z.object({
    resource: z.string().min(1, 'Resource is required').max(100),
    resourceId: z.string().min(1, 'Resource ID is required').max(100),
  }),
  query: z.object({
    page: z.string().transform(Number).pipe(z.number().min(1)).optional().default('1'),
    limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional().default('50'),
  }),
});

export const exportAuditSchema = z.object({
  query: z.object({
    format: z.enum(['csv', 'json']).optional().default('json'),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
    action: z.string().optional(),
    resource: z.string().optional(),
    userId: z.string().cuid().optional(),
    organizationId: z.string().cuid().optional(),
    severity: z.enum(['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL']).optional(),
  }),
});

// ============================================
// SECURITY VALIDATORS
// ============================================

export const blockIpSchema = z.object({
  body: z.object({
    ip: z.string({
      required_error: 'IP address is required',
    }).regex(
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/,
      'Invalid IP address format'
    ),
    reason: z.string().min(1, 'Reason is required').max(500, 'Reason must be less than 500 characters'),
  }),
});

export const unblockIpSchema = z.object({
  body: z.object({
    ip: z.string({
      required_error: 'IP address is required',
    }).regex(
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/,
      'Invalid IP address format'
    ),
  }),
});

export const securityConfigSchema = z.object({
  body: z.object({
    passwordPolicy: z.object({
      minLength: z.number().min(6).max(32).optional(),
      requireUppercase: z.boolean().optional(),
      requireLowercase: z.boolean().optional(),
      requireNumbers: z.boolean().optional(),
      requireSpecialChars: z.boolean().optional(),
      maxAge: z.number().min(1).max(365).optional(),
      preventReuse: z.number().min(0).max(20).optional(),
      maxAttempts: z.number().min(1).max(20).optional(),
      lockoutDuration: z.number().min(1).max(1440).optional(),
    }).optional(),
    
    sessionPolicy: z.object({
      maxConcurrentSessions: z.number().min(1).max(20).optional(),
      sessionTimeout: z.number().min(5).max(1440).optional(),
      extendOnActivity: z.boolean().optional(),
      requireReauthForSensitive: z.boolean().optional(),
    }).optional(),
    
    rateLimitPolicy: z.object({
      enabled: z.boolean().optional(),
      windowMs: z.number().min(1000).max(3600000).optional(),
      maxRequests: z.number().min(1).max(10000).optional(),
    }).optional(),
    
    mfaRequired: z.boolean().optional(),
    
    ipWhitelist: z.array(z.string()).optional(),
    ipBlacklist: z.array(z.string()).optional(),
    
    encryptionSettings: z.object({
      algorithm: z.string().optional(),
      keyRotationDays: z.number().min(1).max(365).optional(),
      dataAtRest: z.boolean().optional(),
      dataInTransit: z.boolean().optional(),
    }).optional(),
  }),
});

export const validatePasswordSchema = z.object({
  body: z.object({
    password: z.string({
      required_error: 'Password is required',
    }).min(1, 'Password cannot be empty'),
  }),
});

export const encryptDataSchema = z.object({
  body: z.object({
    data: z.string({
      required_error: 'Data is required',
    }).min(1, 'Data cannot be empty').max(100000, 'Data too large'),
  }),
});

export const decryptDataSchema = z.object({
  body: z.object({
    encrypted: z.string({
      required_error: 'Encrypted data is required',
    }).min(1),
    iv: z.string({
      required_error: 'IV is required',
    }).min(1),
    tag: z.string({
      required_error: 'Auth tag is required',
    }).min(1),
  }),
});

// ============================================
// COMPLIANCE VALIDATORS
// ============================================

export const complianceReportSchema = z.object({
  params: z.object({
    type: z.enum(['HIPAA', 'GDPR', 'PCI', 'SOC2'], {
      required_error: 'Compliance type is required',
    }),
  }),
  query: z.object({
    periodStart: z.string().datetime().optional(),
    periodEnd: z.string().datetime().optional(),
  }),
});

export const securityScanSchema = z.object({
  body: z.object({
    scanType: z.enum(['FULL', 'QUICK', 'OWASP', 'PENETRATION']).optional().default('QUICK'),
    targetUrl: z.string().url().optional(),
    includeDatabase: z.boolean().optional().default(true),
    includeNetwork: z.boolean().optional().default(false),
  }),
});

export const dataRetentionSchema = z.object({
  body: z.object({
    resource: z.string().min(1).max(100),
    retentionDays: z.number().min(1).max(3650),
  }),
});

export const anonymizeDataSchema = z.object({
  body: z.object({
    patientId: z.string().cuid('Invalid patient ID'),
    fields: z.array(z.string()).optional(),
  }),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type AuditLogEntry = z.input<typeof auditLogEntrySchema>;
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
=======
import { z } from 'zod';

// ============================================
// AUDIT LOG VALIDATORS
// ============================================

export const auditLogEntrySchema = z.object({
  userId: z.string().cuid('Invalid user ID').optional().nullable(),
  organizationId: z.string().cuid('Invalid organization ID').optional().nullable(),
  
  action: z.string({
    required_error: 'Action is required',
  }).min(1, 'Action cannot be empty').max(100, 'Action must be less than 100 characters'),
  
  resource: z.string({
    required_error: 'Resource is required',
  }).min(1, 'Resource cannot be empty').max(100, 'Resource must be less than 100 characters'),
  
  resourceId: z.string().max(100).optional().nullable(),
  ipAddress: z.string().max(45, 'IP address too long').optional().default('unknown'),
  userAgent: z.string().max(500).optional().default('unknown'),
  metadata: z.record(z.any()).optional().nullable(),
  
  severity: z.enum(['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL']).optional().default('INFO'),
  status: z.enum(['SUCCESS', 'FAILURE', 'ATTEMPT']).optional().default('SUCCESS'),
});

export const auditQuerySchema = z.object({
  query: z.object({
    page: z.string().transform(Number).pipe(z.number().min(1, 'Page must be at least 1')).optional().default('1'),
    limit: z.string().transform(Number).pipe(z.number().min(1, 'Limit must be at least 1').max(100, 'Limit must be at most 100')).optional().default('50'),
    
    userId: z.string().cuid('Invalid user ID').optional(),
    organizationId: z.string().cuid('Invalid organization ID').optional(),
    
    action: z.string().max(100).optional(),
    resource: z.string().max(100).optional(),
    severity: z.enum(['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL']).optional(),
    status: z.enum(['SUCCESS', 'FAILURE', 'ATTEMPT']).optional(),
    
    dateFrom: z.string().datetime('Invalid date format').optional(),
    dateTo: z.string().datetime('Invalid date format').optional(),
    ipAddress: z.string().max(45).optional(),
    
    search: z.string().max(200, 'Search query too long').optional(),
    
    sortBy: z.enum([
      'createdAt', 'action', 'resource', 'severity', 'status', 'ipAddress'
    ]).optional().default('createdAt'),
    
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  }),
});

export const auditIdSchema = z.object({
  params: z.object({
    id: z.string().cuid('Invalid audit log ID'),
  }),
});

export const userAuditTrailSchema = z.object({
  params: z.object({
    userId: z.string().cuid('Invalid user ID'),
  }),
  query: z.object({
    page: z.string().transform(Number).pipe(z.number().min(1)).optional().default('1'),
    limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional().default('50'),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
  }),
});

export const resourceAuditTrailSchema = z.object({
  params: z.object({
    resource: z.string().min(1, 'Resource is required').max(100),
    resourceId: z.string().min(1, 'Resource ID is required').max(100),
  }),
  query: z.object({
    page: z.string().transform(Number).pipe(z.number().min(1)).optional().default('1'),
    limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional().default('50'),
  }),
});

export const exportAuditSchema = z.object({
  query: z.object({
    format: z.enum(['csv', 'json']).optional().default('json'),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
    action: z.string().optional(),
    resource: z.string().optional(),
    userId: z.string().cuid().optional(),
    organizationId: z.string().cuid().optional(),
    severity: z.enum(['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL']).optional(),
  }),
});

// ============================================
// SECURITY VALIDATORS
// ============================================

export const blockIpSchema = z.object({
  body: z.object({
    ip: z.string({
      required_error: 'IP address is required',
    }).regex(
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/,
      'Invalid IP address format'
    ),
    reason: z.string().min(1, 'Reason is required').max(500, 'Reason must be less than 500 characters'),
  }),
});

export const unblockIpSchema = z.object({
  body: z.object({
    ip: z.string({
      required_error: 'IP address is required',
    }).regex(
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/,
      'Invalid IP address format'
    ),
  }),
});

export const securityConfigSchema = z.object({
  body: z.object({
    passwordPolicy: z.object({
      minLength: z.number().min(6).max(32).optional(),
      requireUppercase: z.boolean().optional(),
      requireLowercase: z.boolean().optional(),
      requireNumbers: z.boolean().optional(),
      requireSpecialChars: z.boolean().optional(),
      maxAge: z.number().min(1).max(365).optional(),
      preventReuse: z.number().min(0).max(20).optional(),
      maxAttempts: z.number().min(1).max(20).optional(),
      lockoutDuration: z.number().min(1).max(1440).optional(),
    }).optional(),
    
    sessionPolicy: z.object({
      maxConcurrentSessions: z.number().min(1).max(20).optional(),
      sessionTimeout: z.number().min(5).max(1440).optional(),
      extendOnActivity: z.boolean().optional(),
      requireReauthForSensitive: z.boolean().optional(),
    }).optional(),
    
    rateLimitPolicy: z.object({
      enabled: z.boolean().optional(),
      windowMs: z.number().min(1000).max(3600000).optional(),
      maxRequests: z.number().min(1).max(10000).optional(),
    }).optional(),
    
    mfaRequired: z.boolean().optional(),
    
    ipWhitelist: z.array(z.string()).optional(),
    ipBlacklist: z.array(z.string()).optional(),
    
    encryptionSettings: z.object({
      algorithm: z.string().optional(),
      keyRotationDays: z.number().min(1).max(365).optional(),
      dataAtRest: z.boolean().optional(),
      dataInTransit: z.boolean().optional(),
    }).optional(),
  }),
});

export const validatePasswordSchema = z.object({
  body: z.object({
    password: z.string({
      required_error: 'Password is required',
    }).min(1, 'Password cannot be empty'),
  }),
});

export const encryptDataSchema = z.object({
  body: z.object({
    data: z.string({
      required_error: 'Data is required',
    }).min(1, 'Data cannot be empty').max(100000, 'Data too large'),
  }),
});

export const decryptDataSchema = z.object({
  body: z.object({
    encrypted: z.string({
      required_error: 'Encrypted data is required',
    }).min(1),
    iv: z.string({
      required_error: 'IV is required',
    }).min(1),
    tag: z.string({
      required_error: 'Auth tag is required',
    }).min(1),
  }),
});

// ============================================
// COMPLIANCE VALIDATORS
// ============================================

export const complianceReportSchema = z.object({
  params: z.object({
    type: z.enum(['HIPAA', 'GDPR', 'PCI', 'SOC2'], {
      required_error: 'Compliance type is required',
    }),
  }),
  query: z.object({
    periodStart: z.string().datetime().optional(),
    periodEnd: z.string().datetime().optional(),
  }),
});

export const securityScanSchema = z.object({
  body: z.object({
    scanType: z.enum(['FULL', 'QUICK', 'OWASP', 'PENETRATION']).optional().default('QUICK'),
    targetUrl: z.string().url().optional(),
    includeDatabase: z.boolean().optional().default(true),
    includeNetwork: z.boolean().optional().default(false),
  }),
});

export const dataRetentionSchema = z.object({
  body: z.object({
    resource: z.string().min(1).max(100),
    retentionDays: z.number().min(1).max(3650),
  }),
});

export const anonymizeDataSchema = z.object({
  body: z.object({
    patientId: z.string().cuid('Invalid patient ID'),
    fields: z.array(z.string()).optional(),
  }),
});

// ============================================
// TYPE EXPORTS
// ============================================

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
>>>>>>> Stashed changes
export type AnonymizeDataInput = z.infer<typeof anonymizeDataSchema>['body'];