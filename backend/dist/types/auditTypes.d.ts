export interface AuditLogEntry {
    userId?: string;
    organizationId?: string;
    action: AuditAction;
    resource: AuditResource;
    resourceId?: string;
    ipAddress: string;
    userAgent: string;
    metadata?: Record<string, any>;
    severity?: AuditSeverity;
    status?: 'SUCCESS' | 'FAILURE' | 'ATTEMPT';
}
export type AuditAction = 'USER_REGISTERED' | 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'LOGOUT' | 'LOGOUT_ALL' | 'PASSWORD_CHANGED' | 'PASSWORD_RESET' | 'PASSWORD_RESET_COMPLETE' | 'MFA_ENABLED' | 'MFA_DISABLED' | 'OTP_VERIFIED' | 'ACCOUNT_LOCKED' | 'ACCOUNT_UNLOCKED' | 'ACCOUNT_DEACTIVATED' | 'ACCOUNT_REACTIVATED' | 'ACCOUNT_DELETED' | 'PROFILE_UPDATED' | 'AVATAR_UPLOADED' | 'PATIENT_CREATED' | 'PATIENT_UPDATED' | 'PATIENT_DELETED' | 'PATIENT_HARD_DELETED' | 'PATIENT_DOCUMENT_UPLOADED' | 'PATIENT_CONSENT_GRANTED' | 'PATIENT_CONSENT_REVOKED' | 'APPOINTMENT_CREATED' | 'APPOINTMENT_UPDATED' | 'APPOINTMENT_CANCELLED' | 'APPOINTMENT_RESCHEDULED' | 'APPOINTMENT_COMPLETED' | 'PATIENT_NO_SHOW' | 'QUEUE_TOKEN_GENERATED' | 'PATIENT_CALLED' | 'EMR_CREATED' | 'EMR_UPDATED' | 'EMR_SIGNED' | 'EMR_VIEWED' | 'EMR_EXPORTED' | 'PRESCRIPTION_CREATED' | 'PRESCRIPTION_DISCONTINUED' | 'LAB_REPORT_CREATED' | 'LAB_REPORT_UPDATED' | 'PAYMENT_CREATED' | 'PAYMENT_PROCESSED' | 'PAYMENT_REFUNDED' | 'INVOICE_GENERATED' | 'DOCTOR_CREATED' | 'DOCTOR_UPDATED' | 'DOCTOR_DELETED' | 'DOCTOR_SCHEDULE_UPDATED' | 'BLOCKCHAIN_RECORD_ANCHORED' | 'BLOCKCHAIN_VERIFIED' | 'CONSENT_GRANTED' | 'CONSENT_REVOKED' | 'INVENTORY_ITEM_ADDED' | 'INVENTORY_ITEM_UPDATED' | 'STOCK_IN' | 'STOCK_OUT' | 'MEDICATION_DISPENSED' | 'AI_CHAT_INITIATED' | 'AI_TASK_EXECUTED' | 'AI_RECOMMENDATION_ACCEPTED' | 'AI_RECOMMENDATION_REJECTED' | 'SYSTEM_CONFIG_UPDATED' | 'BACKUP_CREATED' | 'BACKUP_RESTORED' | 'DATA_EXPORTED' | 'DATA_IMPORTED' | 'BULK_OPERATION' | 'API_KEY_CREATED' | 'API_KEY_REVOKED' | 'SECURITY_ALERT' | 'SUSPICIOUS_ACTIVITY' | 'RATE_LIMIT_EXCEEDED' | 'IP_BLOCKED' | 'IP_UNBLOCKED';
export type AuditResource = 'USER' | 'PATIENT' | 'DOCTOR' | 'APPOINTMENT' | 'EMR' | 'PRESCRIPTION' | 'LAB_REPORT' | 'PAYMENT' | 'BLOCKCHAIN_RECORD' | 'INVENTORY' | 'NOTIFICATION' | 'ORGANIZATION' | 'BRANCH' | 'AI_AGENT' | 'SYSTEM' | 'API_KEY' | 'AUTH';
export type AuditSeverity = 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
export interface AuditQueryDto {
    page?: number;
    limit?: number;
    userId?: string;
    organizationId?: string;
    action?: AuditAction;
    resource?: AuditResource;
    severity?: AuditSeverity;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    ipAddress?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export interface AuditResponse {
    id: string;
    userId: string | null;
    user: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        role: string;
    } | null;
    organizationId: string | null;
    action: string;
    resource: string;
    resourceId: string | null;
    ipAddress: string;
    userAgent: string;
    severity: string;
    status: string;
    metadata: Record<string, any> | null;
    geoLocation: {
        country: string | null;
        city: string | null;
        region: string | null;
    } | null;
    createdAt: string;
}
export interface AuditListResponse {
    logs: AuditResponse[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
export interface AuditStats {
    totalLogs: number;
    todayLogs: number;
    byAction: Record<string, number>;
    byResource: Record<string, number>;
    bySeverity: Record<string, number>;
    byStatus: Record<string, number>;
    topUsers: Array<{
        userId: string;
        name: string;
        count: number;
    }>;
    topIPs: Array<{
        ip: string;
        count: number;
        location: string;
    }>;
    hourlyActivity: Array<{
        hour: number;
        count: number;
    }>;
    suspiciousActivities: SuspiciousActivity[];
}
export interface SuspiciousActivity {
    id: string;
    userId: string | null;
    action: string;
    ipAddress: string;
    description: string;
    severity: string;
    detectedAt: string;
    metadata: any;
}
export interface SecurityConfig {
    passwordPolicy: PasswordPolicy;
    sessionPolicy: SessionPolicy;
    rateLimitPolicy: RateLimitPolicy;
    ipWhitelist: string[];
    ipBlacklist: string[];
    mfaRequired: boolean;
    encryptionSettings: EncryptionSettings;
}
export interface PasswordPolicy {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    maxAge: number;
    preventReuse: number;
    maxAttempts: number;
    lockoutDuration: number;
}
export interface SessionPolicy {
    maxConcurrentSessions: number;
    sessionTimeout: number;
    extendOnActivity: boolean;
    requireReauthForSensitive: boolean;
}
export interface RateLimitPolicy {
    enabled: boolean;
    windowMs: number;
    maxRequests: number;
    whitelistIPs: string[];
}
export interface EncryptionSettings {
    algorithm: string;
    keyRotationDays: number;
    dataAtRest: boolean;
    dataInTransit: boolean;
}
export interface SecurityAlert {
    id: string;
    type: SecurityAlertType;
    severity: AuditSeverity;
    description: string;
    source: string;
    sourceIp: string;
    userId: string | null;
    metadata: any;
    status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED';
    resolvedBy: string | null;
    resolvedAt: string | null;
    createdAt: string;
}
export type SecurityAlertType = 'BRUTE_FORCE_ATTEMPT' | 'SUSPICIOUS_LOGIN' | 'TOKEN_REUSE' | 'UNAUTHORIZED_ACCESS' | 'RATE_LIMIT_EXCEEDED' | 'DATA_EXFILTRATION' | 'MALICIOUS_ACTIVITY' | 'CONFIGURATION_CHANGE';
export interface ComplianceReport {
    id: string;
    type: 'HIPAA' | 'GDPR' | 'PCI' | 'SOC2';
    status: 'COMPLIANT' | 'NON_COMPLIANT' | 'PARTIALLY_COMPLIANT';
    score: number;
    findings: ComplianceFinding[];
    generatedAt: string;
    period: {
        start: string;
        end: string;
    };
}
export interface ComplianceFinding {
    id: string;
    category: string;
    severity: AuditSeverity;
    description: string;
    recommendation: string;
    status: 'OPEN' | 'RESOLVED' | 'ACCEPTED_RISK';
}
//# sourceMappingURL=auditTypes.d.ts.map