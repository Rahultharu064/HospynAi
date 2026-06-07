"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auditController_1 = require("../controllers/auditController");
const authMiddleware_1 = require("../../../middleware/authMiddleware");
const validateMiddleware_1 = require("../../../middleware/validateMiddleware");
const client_1 = require("@prisma/client");
const auditValidator_1 = require("../validators/auditValidator");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authenticate);
// Audit logs
router.get('/logs', (0, validateMiddleware_1.validate)({ query: auditValidator_1.auditQuerySchema.shape.query }), (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), auditController_1.AuditController.queryLogs);
// User audit trail
router.get('/logs/user/:userId', (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), auditController_1.AuditController.getUserTrail);
// Resource audit trail
router.get('/logs/resource/:resource/:resourceId', (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), auditController_1.AuditController.getResourceTrail);
// Audit stats
router.get('/stats', (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), auditController_1.AuditController.stats);
// Export logs
router.get('/export', (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), auditController_1.AuditController.exportLogs);
// Security config
router.get('/security/config', (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN), auditController_1.AuditController.getSecurityConfig);
// Compliance report
router.get('/compliance/:type', (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), auditController_1.AuditController.complianceReport);
// Security scan
router.post('/security/scan', (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN), auditController_1.AuditController.securityScan);
// Block IP
router.post('/security/block-ip', (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN), auditController_1.AuditController.blockIp);
// Unblock IP
router.post('/security/unblock-ip', (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN), auditController_1.AuditController.unblockIp);
exports.default = router;
//# sourceMappingURL=auditRoute.js.map