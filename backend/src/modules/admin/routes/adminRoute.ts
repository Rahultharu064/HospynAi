import { Router } from 'express';
import { AdminController } from '../controllers/adminController';
import { authenticate, authorize } from '../../../middleware/authMiddleware';
import { validate } from '../../../middleware/validateMiddleware';
import { UserRole } from '@prisma/client';
import {
  createOrganizationSchema, updateOrganizationSchema, createBranchSchema,
  createUserSchema, updateUserSchema, bulkUserOperationSchema,
  organizationQuerySchema, userQuerySchema,
} from '../validators/adminValidators';

const router = Router();
router.use(authenticate);
router.use(authorize(UserRole.SUPER_ADMIN));

// Organizations
router.post('/organizations', validate({ body: createOrganizationSchema.shape.body }), AdminController.createOrg);
router.get('/organizations', validate({ query: organizationQuerySchema.shape.query }), AdminController.listOrgs);
router.get('/organizations/:id', AdminController.getOrg);
router.patch('/organizations/:id', validate({ params: updateOrganizationSchema.shape.params, body: updateOrganizationSchema.shape.body }), AdminController.updateOrg);
router.post('/branches', validate({ body: createBranchSchema.shape.body }), AdminController.createBranch);

// Users
router.post('/users', validate({ body: createUserSchema.shape.body }), AdminController.createUser);
router.get('/users', validate({ query: userQuerySchema.shape.query }), AdminController.listUsers);
router.patch('/users/:id', validate({ params: updateUserSchema.shape.params, body: updateUserSchema.shape.body }), AdminController.updateUser);
router.post('/users/bulk', validate({ body: bulkUserOperationSchema.shape.body }), AdminController.bulkUserOp);

// System
router.get('/health', AdminController.systemHealth);
router.get('/stats', AdminController.platformStats);

export default router;