"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminController_1 = require("../controllers/adminController");
const authMiddleware_1 = require("../../../middleware/authMiddleware");
const validateMiddleware_1 = require("../../../middleware/validateMiddleware");
const client_1 = require("@prisma/client");
const adminValidators_1 = require("../validators/adminValidators");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authenticate);
router.use((0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN));
// Organizations
router.post('/organizations', (0, validateMiddleware_1.validate)({ body: adminValidators_1.createOrganizationSchema.shape.body }), adminController_1.AdminController.createOrg);
router.get('/organizations', (0, validateMiddleware_1.validate)({ query: adminValidators_1.organizationQuerySchema.shape.query }), adminController_1.AdminController.listOrgs);
router.get('/organizations/:id', adminController_1.AdminController.getOrg);
router.patch('/organizations/:id', (0, validateMiddleware_1.validate)({ params: adminValidators_1.updateOrganizationSchema.shape.params, body: adminValidators_1.updateOrganizationSchema.shape.body }), adminController_1.AdminController.updateOrg);
router.post('/branches', (0, validateMiddleware_1.validate)({ body: adminValidators_1.createBranchSchema.shape.body }), adminController_1.AdminController.createBranch);
// Users
router.post('/users', (0, validateMiddleware_1.validate)({ body: adminValidators_1.createUserSchema.shape.body }), adminController_1.AdminController.createUser);
router.get('/users', (0, validateMiddleware_1.validate)({ query: adminValidators_1.userQuerySchema.shape.query }), adminController_1.AdminController.listUsers);
router.patch('/users/:id', (0, validateMiddleware_1.validate)({ params: adminValidators_1.updateUserSchema.shape.params, body: adminValidators_1.updateUserSchema.shape.body }), adminController_1.AdminController.updateUser);
router.post('/users/bulk', (0, validateMiddleware_1.validate)({ body: adminValidators_1.bulkUserOperationSchema.shape.body }), adminController_1.AdminController.bulkUserOp);
// System
router.get('/health', adminController_1.AdminController.systemHealth);
router.get('/stats', adminController_1.AdminController.platformStats);
exports.default = router;
//# sourceMappingURL=adminRoute.js.map