"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ocrController_1 = require("../controllers/ocrController");
const authMiddleware_1 = require("../../../middleware/authMiddleware");
const uploadMiddleware_1 = require("../../../middleware/uploadMiddleware");
const validateMiddleware_1 = require("../../../middleware/validateMiddleware");
const client_1 = require("@prisma/client");
const ocrValidators_1 = require("../validators/ocrValidators");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authenticate);
// Scan generic document
router.post('/scan', uploadMiddleware_1.upload.single('document'), (0, validateMiddleware_1.validate)({ body: ocrValidators_1.scanDocumentSchema.shape.body }), (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.DOCTOR, client_1.UserRole.RECEPTIONIST), ocrController_1.OcrController.scanDocument);
// Scan prescription specifically
router.post('/prescription', uploadMiddleware_1.upload.single('prescription'), (0, validateMiddleware_1.validate)({ body: ocrValidators_1.scanPrescriptionSchema.shape.body }), (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.DOCTOR, client_1.UserRole.PHARMACIST), ocrController_1.OcrController.scanPrescription);
// Verify/correct OCR data
router.patch('/:id/verify', (0, validateMiddleware_1.validate)({ params: ocrValidators_1.ocrIdSchema.shape.params, body: ocrValidators_1.verifyOcrDataSchema.shape.body }), (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.DOCTOR), ocrController_1.OcrController.verifyData);
// List OCR results
router.get('/results', (0, validateMiddleware_1.validate)({ query: ocrValidators_1.ocrQuerySchema.shape.query }), (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.DOCTOR), ocrController_1.OcrController.listResults);
// OCR stats
router.get('/stats', (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), ocrController_1.OcrController.stats);
exports.default = router;
//# sourceMappingURL=ocrRoute.js.map