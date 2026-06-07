"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const callingController_1 = require("../controllers/callingController");
const authMiddleware_1 = require("../../../middleware/authMiddleware");
const validateMiddleware_1 = require("../../../middleware/validateMiddleware");
const express_rate_limit_1 = require("express-rate-limit");
const client_1 = require("@prisma/client");
const callingValidator_1 = require("../validators/callingValidator");
const twilioWebhook_1 = require("../../../integration/twilio/twilioWebhook");
const router = (0, express_1.Router)();
const callLimiter = (0, express_rate_limit_1.rateLimit)({ windowMs: 60 * 1000, max: 10, message: { success: false, message: 'Too many call requests' } });
// Authenticated routes
router.post('/outgoing', authMiddleware_1.authenticate, callLimiter, (0, validateMiddleware_1.validate)({ body: callingValidator_1.initiateCallSchema.shape.body }), (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.RECEPTIONIST, client_1.UserRole.DOCTOR), callingController_1.CallingController.initiateCall);
router.post('/transfer', authMiddleware_1.authenticate, (0, validateMiddleware_1.validate)({ body: callingValidator_1.transferToHumanSchema.shape.body }), (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.RECEPTIONIST), callingController_1.CallingController.transferToHuman);
router.get('/logs', authMiddleware_1.authenticate, (0, validateMiddleware_1.validate)({ query: callingValidator_1.callQuerySchema.shape.query }), (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.RECEPTIONIST), callingController_1.CallingController.callLogs);
router.get('/:callSid/transcript', authMiddleware_1.authenticate, (0, validateMiddleware_1.validate)({ params: callingValidator_1.callSidSchema.shape.params }), (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.RECEPTIONIST, client_1.UserRole.DOCTOR), callingController_1.CallingController.transcript);
router.get('/stats', authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), callingController_1.CallingController.stats);
router.get('/active', authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.RECEPTIONIST), callingController_1.CallingController.activeCalls);
// Twilio webhooks (no auth - secured by Twilio signature)
router.post('/webhook/incoming', (0, express_1.urlencoded)({ extended: false }), twilioWebhook_1.validateTwilioSignature, twilioWebhook_1.handleIncomingCallWebhook);
router.post('/webhook/voice', (0, express_1.urlencoded)({ extended: false }), twilioWebhook_1.validateTwilioSignature, twilioWebhook_1.handleVoiceInputWebhook);
router.post('/webhook/status', (0, express_1.urlencoded)({ extended: false }), twilioWebhook_1.validateTwilioSignature, twilioWebhook_1.handleStatusCallbackWebhook);
router.post('/webhook/voicemail', (0, express_1.urlencoded)({ extended: false }), twilioWebhook_1.validateTwilioSignature, twilioWebhook_1.handleVoicemailWebhook);
router.post('/webhook/transcription', (0, express_1.urlencoded)({ extended: false }), twilioWebhook_1.validateTwilioSignature, twilioWebhook_1.handleTranscriptionWebhook);
router.post('/webhook/recording', (0, express_1.urlencoded)({ extended: false }), twilioWebhook_1.validateTwilioSignature, twilioWebhook_1.handleRecordingWebhook);
router.post('/webhook/transfer', (0, express_1.urlencoded)({ extended: false }), twilioWebhook_1.validateTwilioSignature, twilioWebhook_1.handleTransferWebhook);
router.post('/webhook/emergency', (0, express_1.urlencoded)({ extended: false }), twilioWebhook_1.validateTwilioSignature, twilioWebhook_1.handleEmergencyWebhook);
router.post('/webhook/fallback', (0, express_1.urlencoded)({ extended: false }), twilioWebhook_1.validateTwilioSignature, twilioWebhook_1.handleGatherFallbackWebhook);
router.use('/webhook', twilioWebhook_1.twilioErrorHandler);
exports.default = router;
//# sourceMappingURL=calllingRoute.js.map