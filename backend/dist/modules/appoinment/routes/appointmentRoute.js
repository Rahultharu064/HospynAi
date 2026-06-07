"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const appointmentController_1 = require("../controllers/appointmentController");
const authMiddleware_1 = require("../../../middleware/authMiddleware");
const validateMiddleware_1 = require("../../../middleware/validateMiddleware");
const express_rate_limit_1 = require("express-rate-limit");
const client_1 = require("@prisma/client");
const appointmentValidator_1 = require("../validators/appointmentValidator");
const router = (0, express_1.Router)();
// Rate limiters
const createAppointmentLimiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 60 * 1000, // 1 minute
    max: 20,
    message: { success: false, message: 'Too many appointment requests' },
});
const queueLimiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 10 * 1000, // 10 seconds
    max: 30,
    message: { success: false, message: 'Too many queue requests' },
});
// All routes require authentication
router.use(authMiddleware_1.authenticate);
// ============================================
// APPOINTMENT CRUD ROUTES
// ============================================
// Create appointment
router.post('/', createAppointmentLimiter, (0, validateMiddleware_1.validate)({ body: appointmentValidator_1.createAppointmentSchema.shape.body }), (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.RECEPTIONIST, client_1.UserRole.DOCTOR, client_1.UserRole.PATIENT), appointmentController_1.AppointmentController.create);
// List appointments with filtering
router.get('/', (0, validateMiddleware_1.validate)({ query: appointmentValidator_1.appointmentQuerySchema.shape.query }), (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.DOCTOR, client_1.UserRole.NURSE, client_1.UserRole.RECEPTIONIST, client_1.UserRole.PATIENT), appointmentController_1.AppointmentController.list);
// Get availability slots
router.get('/availability', (0, validateMiddleware_1.validate)({ query: appointmentValidator_1.availabilityQuerySchema.shape.query }), (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.RECEPTIONIST, client_1.UserRole.DOCTOR, client_1.UserRole.PATIENT), appointmentController_1.AppointmentController.getAvailability);
// Get appointment statistics
router.get('/stats', (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.DOCTOR), appointmentController_1.AppointmentController.stats);
// Bulk status update
router.post('/bulk-status', (0, validateMiddleware_1.validate)({ body: appointmentValidator_1.bulkStatusUpdateSchema.shape.body }), (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.RECEPTIONIST), appointmentController_1.AppointmentController.bulkUpdateStatus);
// Send reminders (Admin only)
router.post('/send-reminders', (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), appointmentController_1.AppointmentController.sendReminders);
// Get appointment by ID
router.get('/:id', (0, validateMiddleware_1.validate)({ params: appointmentValidator_1.appointmentIdSchema.shape.params }), (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.DOCTOR, client_1.UserRole.NURSE, client_1.UserRole.RECEPTIONIST, client_1.UserRole.PATIENT), appointmentController_1.AppointmentController.getById);
// Update appointment
router.patch('/:id', (0, validateMiddleware_1.validate)({
    params: appointmentValidator_1.updateAppointmentSchema.shape.params,
    body: appointmentValidator_1.updateAppointmentSchema.shape.body,
}), (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.RECEPTIONIST, client_1.UserRole.DOCTOR), appointmentController_1.AppointmentController.update);
// Reschedule appointment
router.patch('/:id/reschedule', (0, validateMiddleware_1.validate)({
    params: appointmentValidator_1.rescheduleAppointmentSchema.shape.params,
    body: appointmentValidator_1.rescheduleAppointmentSchema.shape.body,
}), (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.RECEPTIONIST, client_1.UserRole.DOCTOR, client_1.UserRole.PATIENT), appointmentController_1.AppointmentController.reschedule);
// Cancel appointment
router.patch('/:id/cancel', (0, validateMiddleware_1.validate)({
    params: appointmentValidator_1.cancelAppointmentSchema.shape.params,
    body: appointmentValidator_1.cancelAppointmentSchema.shape.body,
}), (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.RECEPTIONIST, client_1.UserRole.DOCTOR, client_1.UserRole.PATIENT), appointmentController_1.AppointmentController.cancel);
// Mark as no-show
router.patch('/:id/no-show', (0, validateMiddleware_1.validate)({ params: appointmentValidator_1.appointmentIdSchema.shape.params }), (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.RECEPTIONIST, client_1.UserRole.DOCTOR), appointmentController_1.AppointmentController.markNoShow);
// Complete appointment
router.patch('/:id/complete', (0, validateMiddleware_1.validate)({ params: appointmentValidator_1.appointmentIdSchema.shape.params }), (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.DOCTOR, client_1.UserRole.NURSE), appointmentController_1.AppointmentController.complete);
// ============================================
// QUEUE MANAGEMENT ROUTES
// ============================================
// Generate queue token (walk-in)
router.post('/queue/token', queueLimiter, (0, validateMiddleware_1.validate)({ body: appointmentValidator_1.queueTokenSchema.shape.body }), (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.RECEPTIONIST, client_1.UserRole.NURSE), appointmentController_1.AppointmentController.generateToken);
// Get live queue status
router.get('/queue/live', queueLimiter, (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.DOCTOR, client_1.UserRole.NURSE, client_1.UserRole.RECEPTIONIST), appointmentController_1.AppointmentController.getLiveQueue);
// Get doctor's queue
router.get('/queue/:doctorId', queueLimiter, (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.DOCTOR, client_1.UserRole.NURSE, client_1.UserRole.RECEPTIONIST), appointmentController_1.AppointmentController.getDoctorQueue);
// Call next patient
router.post('/queue/call-next', queueLimiter, (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.DOCTOR, client_1.UserRole.NURSE, client_1.UserRole.RECEPTIONIST), appointmentController_1.AppointmentController.callNext);
// Recalculate queue
router.post('/queue/recalculate', (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.RECEPTIONIST), appointmentController_1.AppointmentController.recalculateQueue);
exports.default = router;
//# sourceMappingURL=appointmentRoute.js.map