import { Router } from 'express';
import { TelemedicineController } from '../controllers/telemedicineController';
import { authenticate, authorize } from '../../../middleware/authMiddleware';
import { validate } from '../../../middleware/validateMiddleware';
import { UserRole } from '@prisma/client';
import {
  createSessionSchema,
  endSessionSchema,
  sessionQuerySchema,
} from '../validators/telemedicineValidators';

const router = Router();
router.use(authenticate);

// Create session
router.post(
  '/sessions',
  validate({ body: createSessionSchema.shape.body }),
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DOCTOR, UserRole.PATIENT),
  TelemedicineController.createSession
);

// End session
router.patch(
  '/sessions/:sessionId/end',
  validate({ params: endSessionSchema.shape.params, body: endSessionSchema.shape.body }),
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DOCTOR),
  TelemedicineController.endSession
);

// List sessions
router.get(
  '/sessions',
  validate({ query: sessionQuerySchema.shape.query }),
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DOCTOR, UserRole.PATIENT),
  TelemedicineController.listSessions
);

// Stats
router.get(
  '/stats',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  TelemedicineController.stats
);

export default router;