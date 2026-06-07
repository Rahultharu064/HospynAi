"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const patientController_1 = require("../controllers/patientController");
const authMiddleware_1 = require("../../../middleware/authMiddleware");
const uploadMiddleware_1 = require("../../../middleware/uploadMiddleware");
const validateMiddleware_1 = require("../../../middleware/validateMiddleware");
const express_rate_limit_1 = require("express-rate-limit");
const patientValidator_1 = require("../validators/patientValidator");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
// Rate limiters
const createPatientLimiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 60 * 1000, // 1 minute
    max: 10,
    message: { success: false, message: 'Too many patients created. Please slow down.' },
});
const bulkImportLimiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 3,
    message: { success: false, message: 'Too many bulk imports. Please try again later.' },
});
// All routes require authentication
router.use(authMiddleware_1.authenticate);
// ===== PATIENT CRUD ROUTES =====
// Create patient
router.post('/', createPatientLimiter, (0, validateMiddleware_1.validate)({ body: patientValidator_1.createPatientSchema.shape.body }), (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.RECEPTIONIST, client_1.UserRole.DOCTOR), patientController_1.PatientController.create);
// List patients with filtering
router.get('/', (0, validateMiddleware_1.validate)({ query: patientValidator_1.patientQuerySchema.shape.query }), (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.DOCTOR, client_1.UserRole.NURSE, client_1.UserRole.RECEPTIONIST), patientController_1.PatientController.list);
// Get patient statistics
router.get('/stats', (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), patientController_1.PatientController.stats);
// Bulk import patients
router.post('/bulk', bulkImportLimiter, (0, validateMiddleware_1.validate)({ body: patientValidator_1.bulkImportSchema.shape.body }), (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), patientController_1.PatientController.bulkImport);
// Get patient by public patient ID (must be before :id route)
router.get('/pid/:patientId', (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.DOCTOR, client_1.UserRole.NURSE, client_1.UserRole.RECEPTIONIST, client_1.UserRole.PHARMACIST, client_1.UserRole.LAB_TECHNICIAN), patientController_1.PatientController.getByPatientId);
// Get patient by internal ID
router.get('/:id', (0, validateMiddleware_1.validate)({ params: patientValidator_1.patientIdSchema.shape.params }), (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.DOCTOR, client_1.UserRole.NURSE, client_1.UserRole.RECEPTIONIST, client_1.UserRole.PHARMACIST, client_1.UserRole.LAB_TECHNICIAN, client_1.UserRole.PATIENT), patientController_1.PatientController.getById);
// Update patient
router.patch('/:id', (0, validateMiddleware_1.validate)({
    params: patientValidator_1.updatePatientSchema.shape.params,
    body: patientValidator_1.updatePatientSchema.shape.body,
}), (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.RECEPTIONIST, client_1.UserRole.DOCTOR), patientController_1.PatientController.update);
// Delete patient (soft delete)
router.delete('/:id', (0, validateMiddleware_1.validate)({ params: patientValidator_1.patientIdSchema.shape.params }), (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), patientController_1.PatientController.delete);
// ===== PATIENT DOCUMENT ROUTES =====
// Upload document for patient
router.post('/:id/documents', (0, validateMiddleware_1.validate)({
    params: patientValidator_1.uploadDocumentSchema.shape.params,
    body: patientValidator_1.uploadDocumentSchema.shape.body,
}), (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.DOCTOR, client_1.UserRole.NURSE, client_1.UserRole.RECEPTIONIST), uploadMiddleware_1.uploadDocument, patientController_1.PatientController.uploadDocument);
// Get patient documents
router.get('/:id/documents', (0, validateMiddleware_1.validate)({ params: patientValidator_1.patientIdSchema.shape.params }), (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.DOCTOR, client_1.UserRole.NURSE, client_1.UserRole.RECEPTIONIST, client_1.UserRole.PATIENT), patientController_1.PatientController.getDocuments);
exports.default = router;
//# sourceMappingURL=patientRoute.js.map