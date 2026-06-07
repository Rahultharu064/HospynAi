"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const blockchainController_1 = require("../controllers/blockchainController");
const authMiddleware_1 = require("../../../middleware/authMiddleware");
const validateMiddleware_1 = require("../../../middleware/validateMiddleware");
const client_1 = require("@prisma/client");
const blockchainValidators_1 = require("../validators/blockchainValidators");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authenticate);
// Anchor hash
router.post('/hash', (0, validateMiddleware_1.validate)({ body: blockchainValidators_1.anchorRecordSchema.shape.body }), (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.DOCTOR), blockchainController_1.BlockchainController.anchorHash);
// Verify hash
router.post('/verify', (0, validateMiddleware_1.validate)({ body: blockchainValidators_1.verifyRecordSchema.shape.body }), (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.DOCTOR, client_1.UserRole.PATIENT), blockchainController_1.BlockchainController.verify);
// List records
router.get('/records', (0, validateMiddleware_1.validate)({ query: blockchainValidators_1.blockchainQuerySchema.shape.query }), (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.DOCTOR), blockchainController_1.BlockchainController.listRecords);
// Get record by ID
router.get('/records/:id', (0, validateMiddleware_1.validate)({ params: blockchainValidators_1.blockchainIdSchema.shape.params }), (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.DOCTOR, client_1.UserRole.PATIENT), blockchainController_1.BlockchainController.getRecord);
// Get patient audit trail
router.get('/logs/:patientId', (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.DOCTOR, client_1.UserRole.PATIENT), blockchainController_1.BlockchainController.getPatientLogs);
// Stats
router.get('/stats', (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), blockchainController_1.BlockchainController.stats);
// Consent management
router.post('/consent', (0, validateMiddleware_1.validate)({ body: blockchainValidators_1.consentSchema.shape.body }), (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.PATIENT), blockchainController_1.BlockchainController.grantConsent);
router.post('/consent/:id/revoke', (0, validateMiddleware_1.validate)({ params: blockchainValidators_1.revokeConsentSchema.shape.params, body: blockchainValidators_1.revokeConsentSchema.shape.body }), (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.PATIENT), blockchainController_1.BlockchainController.revokeConsent);
exports.default = router;
//# sourceMappingURL=blockchainRoute.js.map