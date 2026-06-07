import { SecurityConfig, ComplianceReport } from '../../../types/auditTypes';
export declare class SecurityService {
    /**
     * Get security configuration
     */
    static getSecurityConfig(): SecurityConfig;
    /**
     * Validate password against policy
     */
    static validatePassword(password: string): {
        valid: boolean;
        errors: string[];
    };
    /**
     * Check password strength score
     */
    static getPasswordStrength(password: string): {
        score: number;
        label: string;
        color: string;
    };
    /**
     * Encrypt sensitive data
     */
    static encryptData(data: string): {
        encrypted: string;
        iv: string;
        tag: string;
    };
    /**
     * Decrypt sensitive data
     */
    static decryptData(encrypted: string, iv: string, tag: string): string;
    /**
     * Generate secure token
     */
    static generateSecureToken(length?: number): string;
    /**
     * Hash data with SHA-256
     */
    static hashData(data: string): string;
    /**
     * Check if IP is blocked
     */
    static isIpBlocked(ip: string): Promise<boolean>;
    /**
     * Block an IP address
     */
    static blockIp(ip: string, reason: string, userId: string): Promise<void>;
    /**
     * Unblock an IP address
     */
    static unblockIp(ip: string, userId: string): Promise<void>;
    /**
     * Check for security breaches
     */
    static checkSecurityBreaches(): Promise<{
        hasBreaches: boolean;
        alerts: Array<{
            type: string;
            severity: string;
            description: string;
        }>;
    }>;
    /**
     * Generate compliance report
     */
    static generateComplianceReport(type: 'HIPAA' | 'GDPR'): Promise<ComplianceReport>;
    /**
     * Anonymize PHI data for GDPR compliance
     */
    static anonymizePatientData(patientId: string): Record<string, string>;
    /**
     * Get data retention policies
     */
    static getDataRetentionPolicies(): Record<string, number>;
}
//# sourceMappingURL=securityService.d.ts.map