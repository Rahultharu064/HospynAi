"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const doctor_controller_1 = require("../controllers/doctor.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const express_rate_limit_1 = require("express-rate-limit");
const client_1 = require("@prisma/client");
const doctor_validator_1 = require("../validators/doctor.validator");
const router = (0, express_1.Router)();
const createDoctorLimiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 60 * 1000,
    max: 5,
    message: { success: false, message: 'Too many doctor creation requests' },
});
// All routes require authentication
router.use(auth_middleware_1.authenticate);
// ============================================
// DOCTOR CRUD ROUTES
// ============================================
// Create doctor
router.post('/', createDoctorLimiter, (0, validate_middleware_1.validate)({ body: doctor_validator_1.createDoctorSchema.shape.body }), (0, auth_middleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), doctor_controller_1.DoctorController.create);
// List doctors
router.get('/', (0, validate_middleware_1.validate)({ query: doctor_validator_1.doctorQuerySchema.shape.query }), (0, auth_middleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.RECEPTIONIST, client_1.UserRole.PATIENT), doctor_controller_1.DoctorController.list);
// Get doctor availability
router.get('/availability', (0, validate_middleware_1.validate)({ query: doctor_validator_1.availabilityQuerySchema.shape.query }), (0, auth_middleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.RECEPTIONIST, client_1.UserRole.PATIENT), doctor_controller_1.DoctorController.getAvailability);
// Get doctor by ID
router.get('/:id', (0, validate_middleware_1.validate)({ params: doctor_validator_1.doctorIdSchema.shape.params }), (0, auth_middleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.DOCTOR, client_1.UserRole.NURSE, client_1.UserRole.RECEPTIONIST, client_1.UserRole.PATIENT), doctor_controller_1.DoctorController.getById);
// Update doctor
router.patch('/:id', (0, validate_middleware_1.validate)({
    params: doctor_validator_1.updateDoctorSchema.shape.params,
    body: doctor_validator_1.updateDoctorSchema.shape.body,
}), (0, auth_middleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), doctor_controller_1.DoctorController.update);
// Update doctor schedule
router.put('/:id/schedule', (0, validate_middleware_1.validate)({
    params: doctor_validator_1.updateScheduleSchema.shape.params,
    body: doctor_validator_1.updateScheduleSchema.shape.body,
}), (0, auth_middleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), doctor_controller_1.DoctorController.updateSchedule);
// Get doctor schedule
router.get('/:id/schedule', (0, validate_middleware_1.validate)({ params: doctor_validator_1.doctorIdSchema.shape.params }), (0, auth_middleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.DOCTOR, client_1.UserRole.RECEPTIONIST, client_1.UserRole.PATIENT), doctor_controller_1.DoctorController.getSchedule);
// Delete doctor
router.delete('/:id', (0, validate_middleware_1.validate)({ params: doctor_validator_1.doctorIdSchema.shape.params }), (0, auth_middleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), doctor_controller_1.DoctorController.delete);
exports.default = router;
//# sourceMappingURL=doctorRoute.js.map