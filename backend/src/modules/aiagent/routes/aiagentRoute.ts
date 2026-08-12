import { Router } from 'express';
import { AiController } from '../controllers/aiagentController';
import { authenticate, authorize } from '../../../middleware/authMiddleware';
import { upload } from '../../../middleware/uploadMiddleware';
import { validate } from '../../../middleware/validateMiddleware';
import { rateLimit } from 'express-rate-limit';
import { UserRole } from '@prisma/client';
import {
  agentChatSchema, agentTaskSchema, toolExecutionSchema, agentQuerySchema,
  ingestDocumentSchema, ragQuerySchema, ragDocumentQuerySchema,
} from '../validators/aiagentValidators';

const router = Router();
const aiLimiter = rateLimit({ windowMs: 60 * 1000, max: 30 });
router.use(authenticate);

// Agent chat
router.post('/chat', aiLimiter, validate({ body: agentChatSchema.shape.body }), AiController.agentChat);

// Agent task
router.post('/task', validate({ body: agentTaskSchema.shape.body }),
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DOCTOR), AiController.agentTask);

// Execute tool
router.post('/tool', validate({ body: toolExecutionSchema.shape.body }),
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DOCTOR), AiController.executeTool);

// Agent history
router.get('/history', validate({ query: agentQuerySchema.shape.query }),
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), AiController.agentHistory);

// RAG - Upload document
router.post('/rag/upload', upload.single('document'),
  validate({ body: ingestDocumentSchema.shape.body }),
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), AiController.uploadDocument);

// RAG - Query
router.post('/rag/query', validate({ body: ragQuerySchema.shape.body }),
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DOCTOR, UserRole.PATIENT), AiController.ragQuery);

// RAG - List documents
router.get('/rag/documents', validate({ query: ragDocumentQuerySchema.shape.query }),
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), AiController.listDocuments);

// RAG - Delete document
router.delete('/rag/documents/:id', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), AiController.deleteDocument);

export default router;