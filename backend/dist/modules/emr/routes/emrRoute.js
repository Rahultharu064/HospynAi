"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const emrController_1 = require("../controllers/emrController");
const authMiddleware_1 = require("../../../middleware/authMiddleware");
const validateMiddleware_1 = require("../../../middleware/validateMiddleware");
const client_1 = require("@prisma/client");
const emrValidator_1 = require("../validators/emrValidator");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authenticate);
// EMR CRUD
router.post('/', (0, validateMiddleware_1.validate)({ body: emrValidator_1.createEMRSchema.shape.body }), (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.DOCTOR), emrController_1.EMRController.create);
router.get('/stats', (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.DOCTOR), emrController_1.EMRController.stats);
router.get('/patient/:patientId', (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.DOCTOR, client_1.UserRole.NURSE, client_1.UserRole.PATIENT), emrController_1.EMRController.getPatientHistory);
router.get('/:id', (0, validateMiddleware_1.validate)({ params: emrValidator_1.emrIdSchema.shape.params }), (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.DOCTOR, client_1.UserRole.NURSE, client_1.UserRole.PATIENT), emrController_1.EMRController.getById);
router.patch('/:id', (0, validateMiddleware_1.validate)({ params: emrValidator_1.updateEMRSchema.shape.params, body: emrValidator_1.updateEMRSchema.shape.body }), (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.DOCTOR), emrController_1.EMRController.update);
router.post('/:id/sign', (0, validateMiddleware_1.validate)({ params: emrValidator_1.signEMRSchema.shape.params }), (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.DOCTOR), emrController_1.EMRController.sign);
router.post('/:id/version', (0, validateMiddleware_1.validate)({ params: emrValidator_1.emrIdSchema.shape.params }), (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.DOCTOR), emrController_1.EMRController.newVersion);
router.get('/:id/pdf', (0, validateMiddleware_1.validate)({ params: emrValidator_1.emrIdSchema.shape.params }), (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.DOCTOR, client_1.UserRole.PATIENT), emrController_1.EMRController.generatePDF);
// Prescriptions
router.post('/prescriptions', (0, validateMiddleware_1.validate)({ body: emrValidator_1.createPrescriptionSchema.shape.body }), (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.DOCTOR), emrController_1.EMRController.createPrescription);
// Lab Reports
router.post('/lab-reports', (0, validateMiddleware_1.validate)({ body: emrValidator_1.createLabReportSchema.shape.body }), (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.DOCTOR, client_1.UserRole.LAB_TECHNICIAN), emrController_1.EMRController.createLabReport);
exports.default = router;
//# sourceMappingURL=emrRoute.js.map