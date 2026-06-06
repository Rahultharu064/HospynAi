import { Router } from 'express';
import { OcrController } from '../controllers/ocrController';
import { authenticate, authorize } from '../../../middleware/authMiddleware';
import { upload } from '../../../middleware/uploadMiddleware';
import { validate } from '../../../middleware/validateMiddleware';
import { UserRole } from '@prisma/client';
import {
  scanDocumentSchema,
  scanPrescriptionSchema,
  verifyOcrDataSchema,
  ocrIdSchema,
  ocrQuerySchema,
} from '../validators/ocrValidators';

const router = Router();
router.use(authenticate);

// Scan generic document
router.post(
  '/scan',
  upload.single('document'),
  validate({ body: scanDocumentSchema.shape.body }),
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST),
  OcrController.scanDocument
);

// Scan prescription specifically
router.post(
  '/prescription',
  upload.single('prescription'),
  validate({ body: scanPrescriptionSchema.shape.body }),
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DOCTOR, UserRole.PHARMACIST),
  OcrController.scanPrescription
);

// Verify/correct OCR data
router.patch(
  '/:id/verify',
  validate({ params: ocrIdSchema.shape.params, body: verifyOcrDataSchema.shape.body }),
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DOCTOR),
  OcrController.verifyData
);

// List OCR results
router.get(
  '/results',
  validate({ query: ocrQuerySchema.shape.query }),
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DOCTOR),
  OcrController.listResults
);

// OCR stats
router.get(
  '/stats',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  OcrController.stats
);

export default router;