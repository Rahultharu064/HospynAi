import { Router } from 'express';
import { AnalyticsController } from '../controllers/analyticsController';
import { authenticate, authorize } from '../../../middleware/authMiddleware';
import { validate } from '../../../middleware/validateMiddleware';
import { UserRole } from '@prisma/client';
import { analyticsFilterSchema, exportAnalyticsSchema } from '../validators/analyticsValidator';

const router = Router();

router.use(authenticate);

// Dashboard stats
router.get(
  '/dashboard',
  validate({ query: analyticsFilterSchema.shape.query }),
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DOCTOR),
  AnalyticsController.dashboard
);

// Export analytics
router.post(
  '/export',
  validate({ body: exportAnalyticsSchema.shape.body }),
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  AnalyticsController.export
);

export default router;