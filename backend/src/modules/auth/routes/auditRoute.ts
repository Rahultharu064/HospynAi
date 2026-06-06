import { Router } from 'express';
import { AuditController } from '../controllers/auditController';
import { authenticate, authorize } from '../../../middleware/authMiddleware';
import { validate } from '../../../middleware/validateMiddleware';
import { UserRole } from '@prisma/client';
import { auditQuerySchema } from '../validators/auditValidator';

const router = Router();
router.use(authenticate);

// Audit logs
router.get('/logs',
  validate({ query: auditQuerySchema.shape.query }),
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  AuditController.queryLogs);

// User audit trail
router.get('/logs/user/:userId',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  AuditController.getUserTrail);

// Resource audit trail
router.get('/logs/resource/:resource/:resourceId',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  AuditController.getResourceTrail);

// Audit stats
router.get('/stats',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  AuditController.stats);

// Export logs
router.get('/export',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  AuditController.exportLogs);

// Security config
router.get('/security/config',
  authorize(UserRole.SUPER_ADMIN),
  AuditController.getSecurityConfig);

// Compliance report
router.get('/compliance/:type',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  AuditController.complianceReport);

// Security scan
router.post('/security/scan',
  authorize(UserRole.SUPER_ADMIN),
  AuditController.securityScan);

// Block IP
router.post('/security/block-ip',
  authorize(UserRole.SUPER_ADMIN),
  AuditController.blockIp);

// Unblock IP
router.post('/security/unblock-ip',
  authorize(UserRole.SUPER_ADMIN),
  AuditController.unblockIp);

export default router;