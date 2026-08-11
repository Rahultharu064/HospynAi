import { AuditLogEntry, AuditQueryInput, ExportAuditInput } from '../validators/auditValidator';
import { AuditListResponse, AuditStats } from '../../../types/auditTypes';
export declare class AuditService {
    /**
     * Log an audit event
     */
    static log(entry: AuditLogEntry): Promise<void>;
    /**
     * Query audit logs with filtering
     */
    static queryLogs(query: AuditQueryInput): Promise<AuditListResponse>;
    /**
     * Get user audit trail
     */
    static getUserAuditTrail(userId: string, page?: number, limit?: number): Promise<AuditListResponse>;
    /**
     * Get resource audit trail
     */
    static getResourceAuditTrail(resource: string, resourceId: string, page?: number, limit?: number): Promise<AuditListResponse>;
    /**
     * Get audit statistics
     */
    static getStats(organizationId?: string): Promise<AuditStats>;
    /**
     * Detect suspicious activity
     */
    private static detectSuspiciousActivity;
    /**
     * Clean up old audit logs
     */
    static cleanupOldLogs(retentionDays?: number): Promise<number>;
    /**
     * Export audit logs
     */
    static exportLogs(query: ExportAuditInput, format?: 'csv' | 'json'): Promise<{
        data: any;
        filename: string;
    }>;
    private static formatAuditResponse;
}
//# sourceMappingURL=auditService.d.ts.map