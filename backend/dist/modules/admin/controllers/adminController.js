"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const adminService_1 = require("../services/adminService");
const errorMiddleware_1 = require("../../../middleware/errorMiddleware");
const errors_1 = require("../../../utils/errors");
class AdminController {
}
exports.AdminController = AdminController;
_a = AdminController;
// ============================================
// ORGANIZATIONS
// ============================================
AdminController.createOrg = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const dto = req.body;
    const userId = req.user?.userId;
    if (!userId)
        throw new errors_1.UnauthorizedError();
    const org = await adminService_1.AdminService.createOrganization(dto, userId, req.ip || '', req.headers['user-agent'] || '');
    res.status(201).json({ success: true, status: 201, message: 'Organization created', data: org });
});
AdminController.listOrgs = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const query = req.query;
    const result = await adminService_1.AdminService.listOrganizations(query);
    res.status(200).json({ success: true, status: 200, ...result });
});
AdminController.getOrg = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const { id } = req.params;
    const org = await adminService_1.AdminService.getOrganizationById(id);
    res.status(200).json({ success: true, status: 200, data: org });
});
AdminController.updateOrg = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const { id } = req.params;
    const dto = req.body;
    const userId = req.user?.userId;
    if (!userId)
        throw new errors_1.UnauthorizedError();
    const org = await adminService_1.AdminService.updateOrganization(id, dto, userId);
    res.status(200).json({ success: true, status: 200, message: 'Organization updated', data: org });
});
AdminController.createBranch = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const dto = req.body;
    const userId = req.user?.userId;
    if (!userId)
        throw new errors_1.UnauthorizedError();
    const branch = await adminService_1.AdminService.createBranch(dto, userId, req.ip || '', req.headers['user-agent'] || '');
    res.status(201).json({ success: true, status: 201, message: 'Branch created', data: branch });
});
// ============================================
// USER MANAGEMENT
// ============================================
AdminController.createUser = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const dto = req.body;
    const userId = req.user?.userId;
    if (!userId)
        throw new errors_1.UnauthorizedError();
    const user = await adminService_1.AdminService.createUser(dto, userId, req.ip || '', req.headers['user-agent'] || '');
    res.status(201).json({ success: true, status: 201, message: 'User created', data: user });
});
AdminController.listUsers = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const query = req.query;
    const result = await adminService_1.AdminService.listUsers(query);
    res.status(200).json({ success: true, status: 200, ...result });
});
AdminController.updateUser = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const { id } = req.params;
    const dto = req.body;
    const userId = req.user?.userId;
    if (!userId)
        throw new errors_1.UnauthorizedError();
    const user = await adminService_1.AdminService.updateUser(id, dto, userId);
    res.status(200).json({ success: true, status: 200, message: 'User updated', data: user });
});
AdminController.bulkUserOp = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const dto = req.body;
    const userId = req.user?.userId;
    if (!userId)
        throw new errors_1.UnauthorizedError();
    const result = await adminService_1.AdminService.bulkUserOperation(dto, userId);
    res.status(200).json({ success: true, status: 200, data: result });
});
// ============================================
// SYSTEM
// ============================================
AdminController.systemHealth = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const health = await adminService_1.AdminService.getSystemHealth();
    res.status(200).json({ success: true, status: 200, data: health });
});
AdminController.platformStats = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const stats = await adminService_1.AdminService.getPlatformStats();
    res.status(200).json({ success: true, status: 200, data: stats });
});
//# sourceMappingURL=adminController.js.map