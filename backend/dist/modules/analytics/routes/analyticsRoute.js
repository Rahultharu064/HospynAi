"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const analyticsController_1 = require("../controllers/analyticsController");
const authMiddleware_1 = require("../../../middleware/authMiddleware");
const validateMiddleware_1 = require("../../../middleware/validateMiddleware");
const client_1 = require("@prisma/client");
const analyticsValidator_1 = require("../validators/analyticsValidator");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authenticate);
// Dashboard stats
router.get('/dashboard', (0, validateMiddleware_1.validate)({ query: analyticsValidator_1.analyticsFilterSchema.shape.query }), (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.DOCTOR), analyticsController_1.AnalyticsController.dashboard);
// Export analytics
router.post('/export', (0, validateMiddleware_1.validate)({ body: analyticsValidator_1.exportAnalyticsSchema.shape.body }), (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), analyticsController_1.AnalyticsController.export);
exports.default = router;
//# sourceMappingURL=analyticsRoute.js.map