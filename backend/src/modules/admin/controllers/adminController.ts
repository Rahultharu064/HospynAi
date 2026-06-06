import { Request, Response } from 'express';
import { AdminService } from '../services/adminService';
import { AsyncHandler } from '../../../middleware/errorMiddleware';
import { UnauthorizedError } from '../../../utils/errors';
import {
  CreateOrganizationInput, UpdateOrganizationInput, CreateBranchInput,
  CreateUserInput, UpdateUserInput, BulkUserOperationInput,
  OrganizationQueryInput, UserQueryInput,
} from '../validators/adminValidators';

export class AdminController {
  // ============================================
  // ORGANIZATIONS
  // ============================================
  static createOrg = AsyncHandler.handle(async (req: Request, res: Response) => {
    const dto: CreateOrganizationInput = req.body;
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();

    const org = await AdminService.createOrganization(dto, userId, req.ip || '', req.headers['user-agent'] || '');
    res.status(201).json({ success: true, status: 201, message: 'Organization created', data: org });
  });

  static listOrgs = AsyncHandler.handle(async (req: Request, res: Response) => {
    const query: OrganizationQueryInput = req.query as any;
    const result = await AdminService.listOrganizations(query);
    res.status(200).json({ success: true, status: 200, ...result });
  });

  static getOrg = AsyncHandler.handle(async (req: Request, res: Response) => {
    const { id } = req.params;
    const org = await AdminService.getOrganizationById(id);
    res.status(200).json({ success: true, status: 200, data: org });
  });

  static updateOrg = AsyncHandler.handle(async (req: Request, res: Response) => {
    const { id } = req.params;
    const dto: UpdateOrganizationInput = req.body;
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();

    const org = await AdminService.updateOrganization(id, dto, userId);
    res.status(200).json({ success: true, status: 200, message: 'Organization updated', data: org });
  });

  static createBranch = AsyncHandler.handle(async (req: Request, res: Response) => {
    const dto: CreateBranchInput = req.body;
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();

    const branch = await AdminService.createBranch(dto, userId, req.ip || '', req.headers['user-agent'] || '');
    res.status(201).json({ success: true, status: 201, message: 'Branch created', data: branch });
  });

  // ============================================
  // USER MANAGEMENT
  // ============================================
  static createUser = AsyncHandler.handle(async (req: Request, res: Response) => {
    const dto: CreateUserInput = req.body;
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();

    const user = await AdminService.createUser(dto, userId, req.ip || '', req.headers['user-agent'] || '');
    res.status(201).json({ success: true, status: 201, message: 'User created', data: user });
  });

  static listUsers = AsyncHandler.handle(async (req: Request, res: Response) => {
    const query: UserQueryInput = req.query as any;
    const result = await AdminService.listUsers(query);
    res.status(200).json({ success: true, status: 200, ...result });
  });

  static updateUser = AsyncHandler.handle(async (req: Request, res: Response) => {
    const { id } = req.params;
    const dto: UpdateUserInput = req.body;
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();

    const user = await AdminService.updateUser(id, dto, userId);
    res.status(200).json({ success: true, status: 200, message: 'User updated', data: user });
  });

  static bulkUserOp = AsyncHandler.handle(async (req: Request, res: Response) => {
    const dto: BulkUserOperationInput = req.body;
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();

    const result = await AdminService.bulkUserOperation(dto, userId);
    res.status(200).json({ success: true, status: 200, data: result });
  });

  // ============================================
  // SYSTEM
  // ============================================
  static systemHealth = AsyncHandler.handle(async (req: Request, res: Response) => {
    const health = await AdminService.getSystemHealth();
    res.status(200).json({ success: true, status: 200, data: health });
  });

  static platformStats = AsyncHandler.handle(async (req: Request, res: Response) => {
    const stats = await AdminService.getPlatformStats();
    res.status(200).json({ success: true, status: 200, data: stats });
  });
}