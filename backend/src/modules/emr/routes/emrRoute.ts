import { Router } from 'express';
import { EMRController } from '../controllers/emrController';
import { authenticate, authorize } from '../../../middleware/authMiddleware';
import { validate } from '../../../middleware/validateMiddleware';
import { UserRole } from '@prisma/client';
import {
  createEMRSchema,
  updateEMRSchema,
  emrIdSchema,
  emrQuerySchema,
  createPrescriptionSchema,
  createLabReportSchema,
  signEMRSchema,
} from '../validators/emrValidator';

const router = Router();
router.use(authenticate);

// EMR CRUD
router.post(
  '/',
  validate({ body: createEMRSchema.shape.body }),
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DOCTOR),
  EMRController.create
);

router.get(
  '/stats',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DOCTOR),
  EMRController.stats
);

router.get(
  '/patient/:patientId',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.PATIENT),
  EMRController.getPatientHistory
);

router.get(
  '/:id',
  validate({ params: emrIdSchema.shape.params }),
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.PATIENT),
  EMRController.getById
);

router.patch(
  '/:id',
  validate({ params: updateEMRSchema.shape.params, body: updateEMRSchema.shape.body }),
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DOCTOR),
  EMRController.update
);

router.post(
  '/:id/sign',
  validate({ params: signEMRSchema.shape.params }),
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DOCTOR),
  EMRController.sign
);

router.post(
  '/:id/version',
  validate({ params: emrIdSchema.shape.params }),
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DOCTOR),
  EMRController.newVersion
);

router.get(
  '/:id/pdf',
  validate({ params: emrIdSchema.shape.params }),
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DOCTOR, UserRole.PATIENT),
  EMRController.generatePDF
);

// Prescriptions
router.post(
  '/prescriptions',
  validate({ body: createPrescriptionSchema.shape.body }),
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DOCTOR),
  EMRController.createPrescription
);

// Lab Reports
router.post(
  '/lab-reports',
  validate({ body: createLabReportSchema.shape.body }),
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DOCTOR, UserRole.LAB_TECHNICIAN),
  EMRController.createLabReport
);

export default router;