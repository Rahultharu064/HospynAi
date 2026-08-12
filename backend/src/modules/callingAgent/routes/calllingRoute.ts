import { Router, urlencoded } from 'express';
import { CallingController } from '../controllers/callingController';
import { authenticate, authorize } from '../../../middleware/authMiddleware';
import { validate } from '../../../middleware/validateMiddleware';
import { rateLimit } from 'express-rate-limit';
import { UserRole } from '@prisma/client';
import {
  initiateCallSchema, transferToHumanSchema, callQuerySchema, callSidSchema,
} from '../validators/callingValidator';
import {
  validateTwilioSignature, handleIncomingCallWebhook, handleVoiceInputWebhook,
  handleStatusCallbackWebhook, handleVoicemailWebhook, handleTranscriptionWebhook,
  handleRecordingWebhook, handleTransferWebhook, handleEmergencyWebhook,
  handleGatherFallbackWebhook, twilioErrorHandler,
} from '../../../integration/twilio/twilioWebhook';

const router = Router();
const callLimiter = rateLimit({ windowMs: 60 * 1000, max: 10, message: { success: false, message: 'Too many call requests' } });

// Authenticated routes
router.post('/outgoing', authenticate, callLimiter, validate({ body: initiateCallSchema.shape.body }),
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.DOCTOR), CallingController.initiateCall);

router.post('/transfer', authenticate, validate({ body: transferToHumanSchema.shape.body }),
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RECEPTIONIST), CallingController.transferToHuman);

router.get('/logs', authenticate, validate({ query: callQuerySchema.shape.query }),
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RECEPTIONIST), CallingController.callLogs);

router.get('/:callSid/transcript', authenticate, validate({ params: callSidSchema.shape.params }),
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.DOCTOR), CallingController.transcript);

router.get('/stats', authenticate, authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), CallingController.stats);
router.get('/active', authenticate, authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RECEPTIONIST), CallingController.activeCalls);

// Twilio webhooks (no auth - secured by Twilio signature)
router.post('/webhook/incoming', urlencoded({ extended: false }), validateTwilioSignature, handleIncomingCallWebhook);
router.post('/webhook/voice', urlencoded({ extended: false }), validateTwilioSignature, handleVoiceInputWebhook);
router.post('/webhook/status', urlencoded({ extended: false }), validateTwilioSignature, handleStatusCallbackWebhook);
router.post('/webhook/voicemail', urlencoded({ extended: false }), validateTwilioSignature, handleVoicemailWebhook);
router.post('/webhook/transcription', urlencoded({ extended: false }), validateTwilioSignature, handleTranscriptionWebhook);
router.post('/webhook/recording', urlencoded({ extended: false }), validateTwilioSignature, handleRecordingWebhook);
router.post('/webhook/transfer', urlencoded({ extended: false }), validateTwilioSignature, handleTransferWebhook);
router.post('/webhook/emergency', urlencoded({ extended: false }), validateTwilioSignature, handleEmergencyWebhook);
router.post('/webhook/fallback', urlencoded({ extended: false }), validateTwilioSignature, handleGatherFallbackWebhook);
router.use('/webhook', twilioErrorHandler);

export default router;