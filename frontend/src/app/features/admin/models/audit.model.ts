/**
 * Mirrors backend/src/types/auditTypes.ts (AuditResponse) and the auditQuerySchema
 * validator. Severity and status live inside the log's metadata JSON server-side but
 * are flattened onto the response, so they arrive as plain strings.
 */

export type AuditSeverity = 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
export type AuditStatus = 'SUCCESS' | 'FAILURE' | 'ATTEMPT';

export interface AuditLogResponse {
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
  metadata: Record<string, unknown> | null;
  geoLocation: {
    country: string | null;
    city: string | null;
    region: string | null;
  } | null;
  createdAt: string;
}

export interface AuditQuery {
  page?: number;
  /** Server caps this at 100. */
  limit?: number;
  userId?: string;
  organizationId?: string;
  action?: string;
  resource?: string;
  severity?: AuditSeverity;
  status?: AuditStatus;
  /** Full ISO-8601 datetime — a bare YYYY-MM-DD is rejected. */
  dateFrom?: string;
  dateTo?: string;
  ipAddress?: string;
  search?: string;
  sortBy?: 'createdAt' | 'action' | 'resource' | 'severity' | 'status' | 'ipAddress';
  sortOrder?: 'asc' | 'desc';
}

export interface AuditStats {
  totalLogs: number;
  [key: string]: unknown;
}
