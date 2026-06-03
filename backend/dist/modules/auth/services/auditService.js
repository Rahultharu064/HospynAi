"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
// src/services/audit.service.ts
const prisma_1 = __importDefault(require("../../../config/prisma"));
const logger_1 = __importDefault(require("../../../utils/logger"));
class AuditService {
    static async log(data) {
        try {
            await prisma_1.default.auditLog.create({
                data: {
                    userId: data.userId,
                    organizationId: data.organizationId,
                    action: data.action,
                    resource: data.resource,
                    resourceId: data.resourceId,
                    ipAddress: data.ipAddress,
                    userAgent: data.userAgent,
                    metadata: data.metadata || {},
                },
            });
        }
        catch (error) {
            logger_1.default.error('Failed to create audit log:', error);
        }
    }
    static async getUserAuditLogs(userId, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [logs, total] = await Promise.all([
            prisma_1.default.auditLog.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma_1.default.auditLog.count({ where: { userId } }),
        ]);
        return {
            logs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
}
exports.AuditService = AuditService;
//# sourceMappingURL=auditService.js.map