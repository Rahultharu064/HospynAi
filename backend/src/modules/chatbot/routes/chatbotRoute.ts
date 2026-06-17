import { Router } from 'express';
import { ChatbotController } from '../controllers/chatbotController'
import { authenticate, optionalAuth } from '../../../middleware/authMiddleware';
import { uploadAudio } from '../../../middleware/uploadMiddleware';
import { validate } from '../../../middleware/validateMiddleware';
import { rateLimit } from 'express-rate-limit';
import {
  chatMessageSchema, audioMessageSchema,
  chatHistorySchema, clearHistorySchema,
} from '../validators/chatbotValidator';

const router = Router();

const chatbotLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { success: false, message: 'Too many chatbot requests' },
});

// Text message
router.post('/message',
  chatbotLimiter,
  authenticate,
  validate({ body: chatMessageSchema.shape.body }),
  ChatbotController.sendMessage
);

// Stream message (SSE)
router.post('/stream',
  authenticate,
  validate({ body: chatMessageSchema.shape.body }),
  ChatbotController.streamMessage
);

// Audio message
router.post('/audio',
  chatbotLimiter,
  authenticate,
  uploadAudio,
  validate({ body: audioMessageSchema.shape.body }),
  ChatbotController.sendAudio
);

// Chat history
router.get('/history',
  authenticate,
  validate({ query: chatHistorySchema.shape.query }),
  ChatbotController.getHistory
);

// Clear history
router.delete('/history',
  authenticate,
  validate({ body: clearHistorySchema.shape.body }),
  ChatbotController.clearHistory
);

// Stats
router.get('/stats',
  authenticate,
  ChatbotController.getStats
);

export default router;