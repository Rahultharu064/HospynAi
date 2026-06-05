import { Router } from 'express';
import { BlockchainController } from '../controllers/blockchainController';
import { authenticate, authorize } from '../../../middleware/authMiddleware';
import { validate } from '../../../middleware/validateMiddleware';
import { UserRole } from '@prisma/client';
import {
  anchorRecordSchema,
  verifyRecordSchema,
  consentSchema,
  revokeConsentSchema,
  blockchainIdSchema,
  blockchainQuerySchema,
} from '../validators/blockchainValidators';

const router = Router();
router.use(authenticate);

// Anchor hash
router.post(
  '/hash',
  validate({ body: anchorRecordSchema.shape.body }),
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DOCTOR),
  BlockchainController.anchorHash
);

// Verify hash
router.post(
  '/verify',
  validate({ body: verifyRecordSchema.shape.body }),
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DOCTOR, UserRole.PATIENT),
  BlockchainController.verify
);

// List records
router.get(
  '/records',
  validate({ query: blockchainQuerySchema.shape.query }),
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DOCTOR),
  BlockchainController.listRecords
);

// Get record by ID
router.get(
  '/records/:id',
  validate({ params: blockchainIdSchema.shape.params }),
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DOCTOR, UserRole.PATIENT),
  BlockchainController.getRecord
);

// Get patient audit trail
router.get(
  '/logs/:patientId',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DOCTOR, UserRole.PATIENT),
  BlockchainController.getPatientLogs
);

// Stats
router.get(
  '/stats',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  BlockchainController.stats
);

// Consent management
router.post(
  '/consent',
  validate({ body: consentSchema.shape.body }),
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PATIENT),
  BlockchainController.grantConsent
);

router.post(
  '/consent/:id/revoke',
  validate({ params: revokeConsentSchema.shape.params, body: revokeConsentSchema.shape.body }),
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PATIENT),
  BlockchainController.revokeConsent
);

export default router;