"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const telemedicineController_1 = require("../controllers/telemedicineController");
const authMiddleware_1 = require("../../../middleware/authMiddleware");
const validateMiddleware_1 = require("../../../middleware/validateMiddleware");
const client_1 = require("@prisma/client");
const telemedicineValidators_1 = require("../validators/telemedicineValidators");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authenticate);
// Create session
router.post('/sessions', (0, validateMiddleware_1.validate)({ body: telemedicineValidators_1.createSessionSchema.shape.body }), (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.DOCTOR, client_1.UserRole.PATIENT), telemedicineController_1.TelemedicineController.createSession);
// End session
router.patch('/sessions/:sessionId/end', (0, validateMiddleware_1.validate)({ params: telemedicineValidators_1.endSessionSchema.shape.params, body: telemedicineValidators_1.endSessionSchema.shape.body }), (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.DOCTOR), telemedicineController_1.TelemedicineController.endSession);
// List sessions
router.get('/sessions', (0, validateMiddleware_1.validate)({ query: telemedicineValidators_1.sessionQuerySchema.shape.query }), (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.DOCTOR, client_1.UserRole.PATIENT), telemedicineController_1.TelemedicineController.listSessions);
// Stats
router.get('/stats', (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), telemedicineController_1.TelemedicineController.stats);
exports.default = router;
//# sourceMappingURL=telemedicineRoute.js.map