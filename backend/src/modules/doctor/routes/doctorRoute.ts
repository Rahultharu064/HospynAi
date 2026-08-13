import { Router } from 'express';
import { DoctorController } from '../controllers/doctorController';
import { authenticate, authorize } from '../../../middleware/authMiddleware';
import { validate } from '../../../middleware/validateMiddleware';
import { rateLimit } from 'express-rate-limit';
import { UserRole } from '@prisma/client';
import {
  createDoctorSchema,
  updateDoctorSchema,
  updateScheduleSchema,
  doctorIdSchema,
  doctorQuerySchema,
  availabilityQuerySchema,
} from '../validators/doctorValidator';

const router = Router();

const createDoctorLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many doctor creation requests' },
});

// All routes require authentication
router.use(authenticate);

// ============================================
// DOCTOR CRUD ROUTES
// ============================================

// Create doctor
router.post(
  '/',
  createDoctorLimiter,
  validate({ body: createDoctorSchema.shape.body }),
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  DoctorController.create
);

// List doctors
router.get(
  '/',
  validate({ query: doctorQuerySchema.shape.query }),
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.DOCTOR,
    UserRole.NURSE,
    UserRole.RECEPTIONIST,
    UserRole.PATIENT
  ),
  DoctorController.list
);

// Get doctor availability
router.get(
  '/availability',
  validate({ query: availabilityQuerySchema.shape.query }),
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.DOCTOR,
    UserRole.NURSE,
    UserRole.RECEPTIONIST,
    UserRole.PATIENT
  ),
  DoctorController.getAvailability
);

// Get doctor by ID
router.get(
  '/:id',
  validate({ params: doctorIdSchema.shape.params }),
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.DOCTOR,
    UserRole.NURSE,
    UserRole.RECEPTIONIST,
    UserRole.PATIENT
  ),
  DoctorController.getById
);

// Update doctor
router.patch(
  '/:id',
  validate({
    params: updateDoctorSchema.shape.params,
    body: updateDoctorSchema.shape.body,
  }),
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  DoctorController.update
);

// Update doctor schedule
router.put(
  '/:id/schedule',
  validate({
    params: updateScheduleSchema.shape.params,
    body: updateScheduleSchema.shape.body,
  }),
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  DoctorController.updateSchedule
);

// Get doctor schedule
router.get(
  '/:id/schedule',
  validate({ params: doctorIdSchema.shape.params }),
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.DOCTOR,
    UserRole.RECEPTIONIST,
    UserRole.PATIENT
  ),
  DoctorController.getSchedule
);

// Delete doctor
router.delete(
  '/:id',
  validate({ params: doctorIdSchema.shape.params }),
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  DoctorController.delete
);

export default router;