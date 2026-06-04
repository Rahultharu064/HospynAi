import { Router } from 'express';
import { PatientController } from '../controllers/patient.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { uploadDocument } from '../middleware/upload.middleware';
import { validate } from '../middleware/validate.middleware';
import { rateLimit } from 'express-rate-limit';
import {
  createPatientSchema,
  updatePatientSchema,
  patientIdSchema,
  patientQuerySchema,
  bulkImportSchema,
  uploadDocumentSchema,
} from '../validators/patient.validator';
import { UserRole } from '@prisma/client';

const router = Router();

// Rate limiters
const createPatientLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: { success: false, message: 'Too many patients created. Please slow down.' },
});

const bulkImportLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3,
  message: { success: false, message: 'Too many bulk imports. Please try again later.' },
});

// All routes require authentication
router.use(authenticate);

// ===== PATIENT CRUD ROUTES =====

// Create patient
router.post(
  '/',
  createPatientLimiter,
  validate({ body: createPatientSchema.shape.body }),
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.DOCTOR),
  PatientController.create
);

// List patients with filtering
router.get(
  '/',
  validate({ query: patientQuerySchema.shape.query }),
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.DOCTOR,
    UserRole.NURSE,
    UserRole.RECEPTIONIST
  ),
  PatientController.list
);

// Get patient statistics
router.get(
  '/stats',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  PatientController.stats
);

// Bulk import patients
router.post(
  '/bulk',
  bulkImportLimiter,
  validate({ body: bulkImportSchema.shape.body }),
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  PatientController.bulkImport
);

// Get patient by public patient ID (must be before :id route)
router.get(
  '/pid/:patientId',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.DOCTOR,
    UserRole.NURSE,
    UserRole.RECEPTIONIST,
    UserRole.PHARMACIST,
    UserRole.LAB_TECHNICIAN
  ),
  PatientController.getByPatientId
);

// Get patient by internal ID
router.get(
  '/:id',
  validate({ params: patientIdSchema.shape.params }),
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.DOCTOR,
    UserRole.NURSE,
    UserRole.RECEPTIONIST,
    UserRole.PHARMACIST,
    UserRole.LAB_TECHNICIAN,
    UserRole.PATIENT
  ),
  PatientController.getById
);

// Update patient
router.patch(
  '/:id',
  validate({
    params: updatePatientSchema.shape.params,
    body: updatePatientSchema.shape.body,
  }),
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.DOCTOR),
  PatientController.update
);

// Delete patient (soft delete)
router.delete(
  '/:id',
  validate({ params: patientIdSchema.shape.params }),
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  PatientController.delete
);

// ===== PATIENT DOCUMENT ROUTES =====

// Upload document for patient
router.post(
  '/:id/documents',
  validate({
    params: uploadDocumentSchema.shape.params,
    body: uploadDocumentSchema.shape.body,
  }),
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST),
  uploadDocument,
  PatientController.uploadDocument
);

// Get patient documents
router.get(
  '/:id/documents',
  validate({ params: patientIdSchema.shape.params }),
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.DOCTOR,
    UserRole.NURSE,
    UserRole.RECEPTIONIST,
    UserRole.PATIENT
  ),
  PatientController.getDocuments
);

export default router;