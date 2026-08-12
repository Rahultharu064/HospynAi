import { Router } from 'express';
import { MemoryController } from '../controllers/memoryController';
import { authenticate, authorize } from '../../../middleware/authMiddleware';
import { validate } from '../../../middleware/validateMiddleware';
import { UserRole } from '@prisma/client';
import {
  saveMemorySchema, updateMemorySchema, searchMemorySchema,
  memoryIdSchema, memoryQuerySchema, consolidateMemoriesSchema,
  patientMemorySchema,
} from '../validators/memoryValidators';

const router = Router();
router.use(authenticate);

// Save memory
router.post('/', validate({ body: saveMemorySchema.shape.body }),
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE),
  MemoryController.save);

// Search memories
router.post('/search', validate({ body: searchMemorySchema.shape.body }),
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE),
  MemoryController.search);

// List memories
router.get('/', validate({ query: memoryQuerySchema.shape.query }),
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DOCTOR),
  MemoryController.list);

// Stats
router.get('/stats', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), MemoryController.stats);

// Patient context
router.get('/patient/:patientId/context',
  validate({ params: patientMemorySchema.shape.params }),
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE),
  MemoryController.patientContext);

// Consolidate memories
router.post('/consolidate', validate({ body: consolidateMemoriesSchema.shape.body }),
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DOCTOR),
  MemoryController.consolidate);

// Get by ID
router.get('/:id', validate({ params: memoryIdSchema.shape.params }),
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE),
  MemoryController.getById);

// Update
router.patch('/:id', validate({ params: updateMemorySchema.shape.params, body: updateMemorySchema.shape.body }),
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DOCTOR),
  MemoryController.update);

// Delete
router.delete('/:id', validate({ params: memoryIdSchema.shape.params }),
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  MemoryController.delete);

export default router;