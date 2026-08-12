import { Router } from 'express';
import { AppointmentController } from '../controllers/appointmentController';
import { authenticate, authorize } from '../../../middleware/authMiddleware';
import { validate } from '../../../middleware/validateMiddleware';
import { rateLimit } from 'express-rate-limit';
import { UserRole } from '@prisma/client';
import {
  createAppointmentSchema,
  updateAppointmentSchema,
  rescheduleAppointmentSchema,
  cancelAppointmentSchema,
  appointmentIdSchema,
  appointmentQuerySchema,
  queueTokenSchema,
  availabilityQuerySchema,
  bulkStatusUpdateSchema,
} from '../validators/appointmentValidator';

const router = Router();

// Rate limiters
const createAppointmentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  message: { success: false, message: 'Too many appointment requests' },
});

const queueLimiter = rateLimit({
  windowMs: 10 * 1000, // 10 seconds
  max: 30,
  message: { success: false, message: 'Too many queue requests' },
});

// All routes require authentication
router.use(authenticate);

// ============================================
// APPOINTMENT CRUD ROUTES
// ============================================

// Create appointment
router.post(
  '/',
  createAppointmentLimiter,
  validate({ body: createAppointmentSchema.shape.body }),
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.RECEPTIONIST,
    UserRole.DOCTOR,
    UserRole.PATIENT
  ),
  AppointmentController.create
);

// List appointments with filtering
router.get(
  '/',
  validate({ query: appointmentQuerySchema.shape.query }),
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.DOCTOR,
    UserRole.NURSE,
    UserRole.RECEPTIONIST,
    UserRole.PATIENT
  ),
  AppointmentController.list
);

// Get availability slots
router.get(
  '/availability',
  validate({ query: availabilityQuerySchema.shape.query }),
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.RECEPTIONIST,
    UserRole.DOCTOR,
    UserRole.PATIENT
  ),
  AppointmentController.getAvailability
);

// Get appointment statistics
router.get(
  '/stats',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DOCTOR),
  AppointmentController.stats
);

// Bulk status update
router.post(
  '/bulk-status',
  validate({ body: bulkStatusUpdateSchema.shape.body }),
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RECEPTIONIST),
  AppointmentController.bulkUpdateStatus
);

// Send reminders (Admin only)
router.post(
  '/send-reminders',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  AppointmentController.sendReminders
);

// Get appointment by ID
router.get(
  '/:id',
  validate({ params: appointmentIdSchema.shape.params }),
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.DOCTOR,
    UserRole.NURSE,
    UserRole.RECEPTIONIST,
    UserRole.PATIENT
  ),
  AppointmentController.getById
);

// Update appointment
router.patch(
  '/:id',
  validate({
    params: updateAppointmentSchema.shape.params,
    body: updateAppointmentSchema.shape.body,
  }),
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.RECEPTIONIST,
    UserRole.DOCTOR
  ),
  AppointmentController.update
);

// Reschedule appointment
router.patch(
  '/:id/reschedule',
  validate({
    params: rescheduleAppointmentSchema.shape.params,
    body: rescheduleAppointmentSchema.shape.body,
  }),
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.RECEPTIONIST,
    UserRole.DOCTOR,
    UserRole.PATIENT
  ),
  AppointmentController.reschedule
);

// Cancel appointment
router.patch(
  '/:id/cancel',
  validate({
    params: cancelAppointmentSchema.shape.params,
    body: cancelAppointmentSchema.shape.body,
  }),
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.RECEPTIONIST,
    UserRole.DOCTOR,
    UserRole.PATIENT
  ),
  AppointmentController.cancel
);

// Mark as no-show
router.patch(
  '/:id/no-show',
  validate({ params: appointmentIdSchema.shape.params }),
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.RECEPTIONIST,
    UserRole.DOCTOR
  ),
  AppointmentController.markNoShow
);

// Complete appointment
router.patch(
  '/:id/complete',
  validate({ params: appointmentIdSchema.shape.params }),
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.DOCTOR,
    UserRole.NURSE
  ),
  AppointmentController.complete
);

// ============================================
// QUEUE MANAGEMENT ROUTES
// ============================================

// Generate queue token (walk-in)
router.post(
  '/queue/token',
  queueLimiter,
  validate({ body: queueTokenSchema.shape.body }),
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.RECEPTIONIST,
    UserRole.NURSE
  ),
  AppointmentController.generateToken
);

// Get live queue status
router.get(
  '/queue/live',
  queueLimiter,
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.DOCTOR,
    UserRole.NURSE,
    UserRole.RECEPTIONIST
  ),
  AppointmentController.getLiveQueue
);

// Get doctor's queue
router.get(
  '/queue/:doctorId',
  queueLimiter,
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.DOCTOR,
    UserRole.NURSE,
    UserRole.RECEPTIONIST
  ),
  AppointmentController.getDoctorQueue
);

// Call next patient
router.post(
  '/queue/call-next',
  queueLimiter,
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.DOCTOR,
    UserRole.NURSE,
    UserRole.RECEPTIONIST
  ),
  AppointmentController.callNext
);

// Recalculate queue
router.post(
  '/queue/recalculate',
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.RECEPTIONIST
  ),
  AppointmentController.recalculateQueue
);

export default router;