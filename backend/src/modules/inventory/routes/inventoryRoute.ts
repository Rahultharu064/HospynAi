import { Router } from 'express';
import { InventoryController } from '../controllers/inventoryController';
import { authenticate, authorize } from '../../../middleware/authMiddleware';
import { validate } from '../../../middleware/validateMiddleware';
import { rateLimit } from 'express-rate-limit';
import { UserRole } from '@prisma/client';
import {
  addInventoryItemSchema, updateInventoryItemSchema,
  stockInSchema, stockOutSchema, dispenseMedicationSchema,
  inventoryIdSchema, inventoryQuerySchema, stockMovementQuerySchema,
} from '../validators/inventoryValidators';

const router = Router();
router.use(authenticate);

const inventoryLimiter = rateLimit({ windowMs: 60 * 1000, max: 50 });

// CRUD
router.post('/', inventoryLimiter,
  validate({ body: addInventoryItemSchema.shape.body }),
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PHARMACIST),
  InventoryController.addItem);

router.get('/', validate({ query: inventoryQuerySchema.shape.query }),
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PHARMACIST, UserRole.DOCTOR, UserRole.NURSE),
  InventoryController.listItems);

router.get('/stats', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PHARMACIST),
  InventoryController.stats);

router.get('/expiry-alerts', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PHARMACIST),
  InventoryController.expiryAlerts);

router.get('/reorder-recommendations', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PHARMACIST),
  InventoryController.reorderRecommendations);

router.get('/movements', validate({ query: stockMovementQuerySchema.shape.query }),
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PHARMACIST),
  InventoryController.movements);

router.get('/:id', validate({ params: inventoryIdSchema.shape.params }),
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PHARMACIST, UserRole.DOCTOR),
  InventoryController.getItem);

router.patch('/:id', validate({ params: updateInventoryItemSchema.shape.params, body: updateInventoryItemSchema.shape.body }),
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PHARMACIST),
  InventoryController.updateItem);

// Stock operations
router.post('/stock-in', validate({ body: stockInSchema.shape.body }),
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PHARMACIST),
  InventoryController.stockIn);

router.post('/stock-out', validate({ body: stockOutSchema.shape.body }),
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PHARMACIST),
  InventoryController.stockOut);

router.post('/dispense', validate({ body: dispenseMedicationSchema.shape.body }),
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PHARMACIST),
  InventoryController.dispense);

export default router;