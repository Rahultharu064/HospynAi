"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditController = void 0;
const auditService_1 = require("../services/auditService");
const securityService_1 = require("../services/securityService");
const errorMiddleware_1 = require("../../../middleware/errorMiddleware");
const errors_1 = require("../../../utils/errors");
class AuditController {
}
exports.AuditController = AuditController;
_a = AuditController;
// ============================================
// AUDIT LOGS
// ============================================
// GET /api/v1/audit/logs
AuditController.queryLogs = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const query = req.query;
    const result = await auditService_1.AuditService.queryLogs(query);
    res.status(200).json({
        success: true,
        status: 200,
        data: result.logs,
        pagination: result.pagination,
    });
});
// GET /api/v1/audit/logs/user/:userId
AuditController.getUserTrail = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const result = await auditService_1.AuditService.getUserAuditTrail(userId, page, limit);
    res.status(200).json({
        success: true,
        status: 200,
        data: result.logs,
        pagination: result.pagination,
    });
});
// GET /api/v1/audit/logs/resource/:resource/:resourceId
AuditController.getResourceTrail = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const { resource, resourceId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const result = await auditService_1.AuditService.getResourceAuditTrail(resource, resourceId, page, limit);
    res.status(200).json({
        success: true,
        status: 200,
        data: result.logs,
        pagination: result.pagination,
    });
});
// GET /api/v1/audit/stats
AuditController.stats = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const organizationId = req.query.organizationId;
    const stats = await auditService_1.AuditService.getStats(organizationId);
    res.status(200).json({
        success: true,
        status: 200,
        data: stats,
    });
});
// GET /api/v1/audit/export
AuditController.exportLogs = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const query = req.query;
    const result = await auditService_1.AuditService.exportLogs(query, query.format || 'json');
    if (query.format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
        res.status(200).send(result.data);
    }
    else {
        res.status(200).json({
            success: true,
            status: 200,
            filename: result.filename,
            data: result.data,
        });
    }
});
// ============================================
// SECURITY MANAGEMENT
// ============================================
// GET /api/v1/audit/security/config
AuditController.getSecurityConfig = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const config = securityService_1.SecurityService.getSecurityConfig();
    res.status(200).json({
        success: true,
        status: 200,
        data: config,
    });
});
// POST /api/v1/audit/security/block-ip
AuditController.blockIp = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const dto = req.body;
    const userId = req.user?.userId;
    if (!userId)
        throw new errors_1.UnauthorizedError();
    await securityService_1.SecurityService.blockIp(dto.ip, dto.reason, userId);
    res.status(200).json({
        success: true,
        status: 200,
        message: `IP ${dto.ip} has been blocked`,
    });
});
// POST /api/v1/audit/security/unblock-ip
AuditController.unblockIp = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const dto = req.body;
    const userId = req.user?.userId;
    if (!userId)
        throw new errors_1.UnauthorizedError();
    await securityService_1.SecurityService.unblockIp(dto.ip, userId);
    res.status(200).json({
        success: true,
        status: 200,
        message: `IP ${dto.ip} has been unblocked`,
    });
});
// POST /api/v1/audit/security/scan
AuditController.securityScan = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const dto = req.body;
    const breaches = await securityService_1.SecurityService.checkSecurityBreaches();
    res.status(200).json({
        success: true,
        status: 200,
        message: breaches.hasBreaches
            ? 'Security issues detected'
            : 'No security issues found',
        data: {
            scanType: dto.scanType,
            timestamp: new Date().toISOString(),
            hasBreaches: breaches.hasBreaches,
            alerts: breaches.alerts,
        },
    });
});
// GET /api/v1/audit/compliance/:type
AuditController.complianceReport = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const { type } = req.params;
    const report = await securityService_1.SecurityService.generateComplianceReport(type);
    res.status(200).json({
        success: true,
        status: 200,
        data: report,
    });
});
// POST /api/v1/audit/validate-password
AuditController.validatePassword = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const { password } = req.body;
    const validation = securityService_1.SecurityService.validatePassword(password);
    const strength = securityService_1.SecurityService.getPasswordStrength(password);
    res.status(200).json({
        success: true,
        status: 200,
        data: {
            valid: validation.valid,
            errors: validation.errors,
            strength,
        },
    });
});
// POST /api/v1/audit/encrypt
AuditController.encryptData = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const { data } = req.body;
    const result = securityService_1.SecurityService.encryptData(data);
    res.status(200).json({
        success: true,
        status: 200,
        data: result,
    });
});
// POST /api/v1/audit/decrypt
AuditController.decryptData = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const { encrypted, iv, tag } = req.body;
    const decrypted = securityService_1.SecurityService.decryptData(encrypted, iv, tag);
    res.status(200).json({
        success: true,
        status: 200,
        data: { decrypted },
    });
});
// GET /api/v1/audit/ip-status/:ip
AuditController.checkIpStatus = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const { ip } = req.params;
    const isBlocked = await securityService_1.SecurityService.isIpBlocked(ip);
    res.status(200).json({
        success: true,
        status: 200,
        data: {
            ip,
            isBlocked,
            checkedAt: new Date().toISOString(),
        },
    });
});
// GET /api/v1/audit/retention-policies
AuditController.getRetentionPolicies = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const policies = securityService_1.SecurityService.getDataRetentionPolicies();
    res.status(200).json({
        success: true,
        status: 200,
        data: policies,
    });
});
// POST /api/v1/audit/anonymize
AuditController.anonymizeData = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const { patientId } = req.body;
    const anonymized = securityService_1.SecurityService.anonymizePatientData(patientId);
    res.status(200).json({
        success: true,
        status: 200,
        data: anonymized,
    });
});
// POST /api/v1/audit/cleanup
AuditController.cleanupLogs = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const retentionDays = parseInt(req.body.retentionDays) || 365;
    const deletedCount = await auditService_1.AuditService.cleanupOldLogs(retentionDays);
    res.status(200).json({
        success: true,
        status: 200,
        message: `Cleaned up ${deletedCount} old audit logs`,
        data: { deletedCount, retentionDays },
    });
});
//# sourceMappingURL=auditController.js.map