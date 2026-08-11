"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const prisma_1 = __importDefault(require("../../../config/prisma"));
const logger_1 = __importDefault(require("../../../utils/logger"));
class AuditService {
    /**
     * Log an audit event
     */
    static async log(entry) {
        try {
            await prisma_1.default.auditLog.create({
                data: {
                    userId: entry.userId,
                    organizationId: entry.organizationId,
                    action: entry.action,
                    resource: entry.resource,
                    resourceId: entry.resourceId,
                    ipAddress: entry.ipAddress || 'unknown',
                    userAgent: entry.userAgent || 'unknown',
                    metadata: {
                        ...entry.metadata,
                        severity: entry.severity || 'INFO',
                        status: entry.status || 'SUCCESS',
                        timestamp: new Date().toISOString(),
                    },
                },
            });
            // Check for suspicious activity
            if (entry.severity === 'WARNING' || entry.severity === 'ERROR' || entry.severity === 'CRITICAL') {
                await this.detectSuspiciousActivity(entry);
            }
        }
        catch (error) {
            logger_1.default.error('Failed to create audit log:', error);
        }
    }
    /**
     * Query audit logs with filtering
     */
    static async queryLogs(query) {
        const { page = 1, limit = 50, userId, organizationId, action, resource, severity, status, dateFrom, dateTo, ipAddress, search, sortBy = 'createdAt', sortOrder = 'desc', } = query;
        const where = {};
        if (userId)
            where.userId = userId;
        if (organizationId)
            where.organizationId = organizationId;
        if (action)
            where.action = action;
        if (resource)
            where.resource = resource;
        if (ipAddress)
            where.ipAddress = ipAddress;
        if (dateFrom || dateTo) {
            where.createdAt = {};
            if (dateFrom)
                where.createdAt.gte = new Date(dateFrom);
            if (dateTo)
                where.createdAt.lte = new Date(dateTo);
        }
        if (search) {
            where.OR = [
                { action: { contains: search, mode: 'insensitive' } },
                { resource: { contains: search, mode: 'insensitive' } },
                { metadata: { path: ['$'], string_contains: search } },
            ];
        }
        const skip = (page - 1) * limit;
        const [logs, total] = await Promise.all([
            prisma_1.default.auditLog.findMany({
                where,
                include: {
                    user: {
                        select: { id: true, firstName: true, lastName: true, email: true, role: true },
                    },
                },
                orderBy: { [sortBy]: sortOrder },
                skip,
                take: limit,
            }),
            prisma_1.default.auditLog.count({ where }),
        ]);
        return {
            logs: logs.map((l) => this.formatAuditResponse(l)),
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }
    /**
     * Get user audit trail
     */
    static async getUserAuditTrail(userId, page = 1, limit = 50) {
        return this.queryLogs({
            userId,
            page,
            limit,
            sortBy: 'createdAt',
            sortOrder: 'desc',
        });
    }
    /**
     * Get resource audit trail
     */
    static async getResourceAuditTrail(resource, resourceId, page = 1, limit = 50) {
        const where = { resource, resourceId };
        const skip = (page - 1) * limit;
        const [logs, total] = await Promise.all([
            prisma_1.default.auditLog.findMany({
                where,
                include: {
                    user: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma_1.default.auditLog.count({ where }),
        ]);
        return {
            logs: logs.map((l) => this.formatAuditResponse(l)),
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }
    /**
     * Get audit statistics
     */
    static async getStats(organizationId) {
        const where = {};
        if (organizationId)
            where.organizationId = organizationId;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [totalLogs, todayLogs, byAction, byResource, topUsers, topIPs,] = await Promise.all([
            prisma_1.default.auditLog.count({ where }),
            prisma_1.default.auditLog.count({ where: { ...where, createdAt: { gte: today } } }),
            prisma_1.default.auditLog.groupBy({ by: ['action'], where, _count: true, orderBy: { _count: { action: 'desc' } }, take: 20 }),
            prisma_1.default.auditLog.groupBy({ by: ['resource'], where, _count: true }),
            prisma_1.default.auditLog.groupBy({
                by: ['userId'],
                where: { ...where, userId: { not: null } },
                _count: true,
                orderBy: { _count: { userId: 'desc' } },
                take: 10,
            }),
            prisma_1.default.auditLog.groupBy({
                by: ['ipAddress'],
                where,
                _count: true,
                orderBy: { _count: { ipAddress: 'desc' } },
                take: 10,
            }),
        ]);
        const byActionMap = {};
        byAction.forEach((a) => { byActionMap[a.action] = a._count; });
        const byResourceMap = {};
        byResource.forEach((r) => { byResourceMap[r.resource] = r._count; });
        // Get user names for top users
        const userIds = topUsers.map((u) => u.userId).filter(Boolean);
        const users = userIds.length > 0
            ? await prisma_1.default.user.findMany({
                where: { id: { in: userIds } },
                select: { id: true, firstName: true, lastName: true },
            })
            : [];
        const userMap = new Map(users.map((u) => [u.id, `${u.firstName} ${u.lastName}`]));
        return {
            totalLogs,
            todayLogs,
            byAction: byActionMap,
            byResource: byResourceMap,
            bySeverity: {},
            byStatus: {},
            topUsers: topUsers.map((u) => ({
                userId: u.userId || '',
                name: userMap.get(u.userId || '') || 'Unknown',
                count: u._count,
            })),
            topIPs: topIPs.map((ip) => ({
                ip: ip.ipAddress,
                count: ip._count,
                location: 'Unknown',
            })),
            hourlyActivity: [],
            suspiciousActivities: [],
        };
    }
    /**
     * Detect suspicious activity
     */
    static async detectSuspiciousActivity(entry) {
        const alerts = [];
        // Check for brute force attempts
        if (entry.action === 'LOGIN_FAILED') {
            const recentFailures = await prisma_1.default.auditLog.count({
                where: {
                    userId: entry.userId,
                    action: 'LOGIN_FAILED',
                    createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) },
                },
            });
            if (recentFailures >= 5) {
                alerts.push({
                    type: 'BRUTE_FORCE_ATTEMPT',
                    description: `Multiple failed login attempts (${recentFailures}) for user ${entry.userId}`,
                });
            }
        }
        // Check for token reuse
        if (entry.action === 'TOKEN_REUSE') {
            alerts.push({
                type: 'TOKEN_REUSE',
                description: 'Refresh token reuse detected - possible token theft',
            });
        }
        // Check for unusual access patterns
        if (entry.ipAddress && entry.userId) {
            const recentIPs = await prisma_1.default.auditLog.groupBy({
                by: ['ipAddress'],
                where: {
                    userId: entry.userId,
                    createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
                },
            });
            if (recentIPs.length >= 5) {
                alerts.push({
                    type: 'SUSPICIOUS_LOGIN',
                    description: `User accessed from ${recentIPs.length} different IPs in the last hour`,
                });
            }
        }
        // Log security alerts
        for (const alert of alerts) {
            logger_1.default.warn(`Security alert: ${alert.type} - ${alert.description}`);
        }
    }
    /**
     * Clean up old audit logs
     */
    static async cleanupOldLogs(retentionDays = 365) {
        const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
        const result = await prisma_1.default.auditLog.deleteMany({
            where: {
                createdAt: { lt: cutoffDate },
                action: { notIn: ['ACCOUNT_DELETED', 'BLOCKCHAIN_RECORD_ANCHORED', 'EMR_SIGNED'] },
            },
        });
        logger_1.default.info(`Cleaned up ${result.count} old audit logs`);
        return result.count;
    }
    /**
     * Export audit logs
     */
    static async exportLogs(query, format = 'json') {
        const { logs } = await this.queryLogs({
            ...query,
            page: 1,
            limit: 10000,
            sortBy: 'createdAt',
            sortOrder: 'desc',
        });
        const filename = `audit-logs-${new Date().toISOString().split('T')[0]}.${format}`;
        return { data: logs, filename };
    }
    // ============================================
    // HELPER METHODS
    // ============================================
    static formatAuditResponse(log) {
        return {
            id: log.id,
            userId: log.userId,
            user: log.user,
            organizationId: log.organizationId,
            action: log.action,
            resource: log.resource,
            resourceId: log.resourceId,
            ipAddress: log.ipAddress,
            userAgent: log.userAgent,
            severity: log.metadata?.severity || 'INFO',
            status: log.metadata?.status || 'SUCCESS',
            metadata: log.metadata,
            geoLocation: {
                country: null,
                city: null,
                region: null,
            },
            createdAt: log.createdAt.toISOString(),
        };
    }
}
exports.AuditService = AuditService;
//# sourceMappingURL=auditService.js.map