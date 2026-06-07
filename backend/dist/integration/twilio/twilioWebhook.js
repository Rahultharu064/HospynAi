"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateTwilioSignature = validateTwilioSignature;
exports.handleIncomingCallWebhook = handleIncomingCallWebhook;
exports.handleVoiceInputWebhook = handleVoiceInputWebhook;
exports.handleStatusCallbackWebhook = handleStatusCallbackWebhook;
exports.handleVoicemailWebhook = handleVoicemailWebhook;
exports.handleTranscriptionWebhook = handleTranscriptionWebhook;
exports.handleRecordingWebhook = handleRecordingWebhook;
exports.handleTransferWebhook = handleTransferWebhook;
exports.handleEmergencyWebhook = handleEmergencyWebhook;
exports.handleGatherFallbackWebhook = handleGatherFallbackWebhook;
exports.twilioErrorHandler = twilioErrorHandler;
const twilio_1 = __importDefault(require("twilio"));
const config_1 = require("../../config");
const callingService_1 = require("../../modules/callingAgent/services/callingService");
const auditService_1 = require("../../modules/auth/services/auditService");
const logger_1 = __importDefault(require("../../utils/logger"));
function validateTwilioSignature(req, res, next) {
    if (config_1.config.nodeEnv === 'development' || config_1.config.nodeEnv === 'test') {
        return next();
    }
    const twilioSignature = req.headers['x-twilio-signature'];
    if (!twilioSignature) {
        return res.status(403).json({ success: false, status: 403, message: 'Missing Twilio signature' });
    }
    const fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
    const isValid = twilio_1.default.validateRequest(config_1.config.twilio.authToken, twilioSignature, fullUrl, req.body || {});
    if (!isValid) {
        auditService_1.AuditService.log({
            action: 'SUSPICIOUS_ACTIVITY',
            resource: 'TWILIO_WEBHOOK',
            ipAddress: req.ip || '',
            userAgent: req.headers['user-agent'] || '',
            metadata: { reason: 'INVALID_TWILIO_SIGNATURE', url: fullUrl },
            severity: 'WARNING',
            status: 'FAILURE',
        }).catch(() => { });
        return res.status(403).json({ success: false, status: 403, message: 'Invalid Twilio signature' });
    }
    next();
}
async function handleIncomingCallWebhook(req, res) {
    const { CallSid, From, To, CallerName, FromCity, FromState, FromCountry } = req.body;
    logger_1.default.info(`📞 Incoming call: ${CallSid} from ${From}`);
    try {
        await auditService_1.AuditService.log({
            action: 'INCOMING_CALL_RECEIVED',
            resource: 'CALL',
            resourceId: CallSid,
            ipAddress: req.ip || '',
            userAgent: req.headers['user-agent'] || '',
            metadata: { callSid: CallSid, from: From, to: To, callerName: CallerName, city: FromCity, state: FromState, country: FromCountry },
            severity: 'INFO',
            status: 'SUCCESS',
        });
        const twiml = await callingService_1.CallingService.handleIncomingCall(req.body);
        res.type('text/xml').status(200).send(twiml);
    }
    catch (error) {
        logger_1.default.error(`Failed to handle incoming call ${CallSid}:`, error);
        const VoiceResponse = twilio_1.default.twiml.VoiceResponse;
        const response = new VoiceResponse();
        response.say({ voice: 'Polly.Joanna' }, 'We apologize for the technical difficulty. Please try again later.');
        response.hangup();
        res.type('text/xml').status(200).send(response.toString());
    }
}
async function handleVoiceInputWebhook(req, res) {
    const { CallSid, SpeechResult, Confidence, Digits, CallStatus } = req.body;
    const userInput = SpeechResult || Digits || '';
    const fallback = req.query.fallback === 'true';
    const callType = req.query.type || 'inbound';
    const patientId = req.query.patientId;
    logger_1.default.info(`🎤 Voice input for call ${CallSid}: "${userInput.substring(0, 50)}..."`);
    try {
        if (CallStatus === 'completed' || CallStatus === 'failed') {
            const VoiceResponse = twilio_1.default.twiml.VoiceResponse;
            const response = new VoiceResponse();
            response.hangup();
            return res.type('text/xml').status(200).send(response.toString());
        }
        const twiml = await callingService_1.CallingService.processVoiceInput({
            CallSid, SpeechResult, Confidence, Digits, CallStatus,
            query: { fallback, type: callType, patientId },
        });
        res.type('text/xml').status(200).send(twiml);
    }
    catch (error) {
        logger_1.default.error(`Failed to process voice input for call ${CallSid}:`, error);
        const VoiceResponse = twilio_1.default.twiml.VoiceResponse;
        const response = new VoiceResponse();
        const gather = response.gather({
            input: ['speech'], timeout: 5, speechTimeout: 'auto', language: 'en-US',
            action: `${process.env.API_URL}/api/v1/calling/webhook/voice`, method: 'POST',
        });
        gather.say({ voice: 'Polly.Joanna' }, 'I\'m sorry, I didn\'t catch that. Could you please repeat?');
        response.say({ voice: 'Polly.Joanna' }, 'I\'m having trouble understanding. Please call back later.');
        response.hangup();
        res.type('text/xml').status(200).send(response.toString());
    }
}
async function handleStatusCallbackWebhook(req, res) {
    const { CallSid, CallStatus, CallDuration, RecordingUrl, RecordingDuration, Timestamp } = req.body;
    logger_1.default.info(`📊 Call status: ${CallSid} -> ${CallStatus} (${CallDuration || 0}s)`);
    try {
        await callingService_1.CallingService.handleStatusCallback({ CallSid, CallStatus, CallDuration, RecordingUrl, RecordingDuration, Timestamp });
        const importantStatuses = ['completed', 'no-answer', 'failed', 'busy', 'canceled'];
        if (importantStatuses.includes(CallStatus)) {
            await auditService_1.AuditService.log({
                action: `CALL_${CallStatus.toUpperCase().replace(/-/g, '_')}`,
                resource: 'CALL', resourceId: CallSid,
                ipAddress: req.ip || '', userAgent: req.headers['user-agent'] || '',
                metadata: { callSid: CallSid, status: CallStatus, duration: CallDuration, recordingUrl: RecordingUrl, timestamp: Timestamp },
                severity: CallStatus === 'failed' ? 'ERROR' : 'INFO',
                status: CallStatus === 'completed' ? 'SUCCESS' : 'FAILURE',
            });
        }
        res.status(200).send('OK');
    }
    catch (error) {
        logger_1.default.error(`Failed to process status callback for ${CallSid}:`, error);
        res.status(200).send('OK');
    }
}
async function handleVoicemailWebhook(req, res) {
    const { CallSid, RecordingUrl, RecordingDuration, TranscriptionText, TranscriptionStatus } = req.body;
    logger_1.default.info(`📼 Voicemail for call ${CallSid}`);
    try {
        await auditService_1.AuditService.log({
            action: 'VOICEMAIL_RECEIVED', resource: 'CALL', resourceId: CallSid,
            ipAddress: req.ip || '', userAgent: req.headers['user-agent'] || '',
            metadata: { callSid: CallSid, recordingUrl: RecordingUrl, duration: RecordingDuration, transcription: TranscriptionText },
            severity: 'INFO', status: 'SUCCESS',
        });
        await callingService_1.CallingService.handleVoicemail({ CallSid, RecordingUrl, RecordingDuration, TranscriptionText, TranscriptionStatus });
        const VoiceResponse = twilio_1.default.twiml.VoiceResponse;
        const response = new VoiceResponse();
        response.say({ voice: 'Polly.Joanna' }, 'Thank you for your message. We will get back to you soon.');
        response.hangup();
        res.type('text/xml').status(200).send(response.toString());
    }
    catch (error) {
        res.status(200).send('<Response><Hangup/></Response>');
    }
}
async function handleTranscriptionWebhook(req, res) {
    const { CallSid, RecordingSid, TranscriptionText, TranscriptionStatus, Confidence } = req.body;
    logger_1.default.info(`📝 Transcription ready for call ${CallSid}`);
    try {
        if (TranscriptionStatus === 'completed' && TranscriptionText) {
            await callingService_1.CallingService.handleTranscription({ CallSid, RecordingSid, TranscriptionText, Confidence });
            await auditService_1.AuditService.log({
                action: 'CALL_TRANSCRIPTION_COMPLETED', resource: 'CALL', resourceId: CallSid,
                ipAddress: req.ip || '', userAgent: req.headers['user-agent'] || '',
                metadata: { callSid: CallSid, confidence: Confidence }, severity: 'INFO', status: 'SUCCESS',
            });
        }
        res.status(200).send('OK');
    }
    catch (error) {
        res.status(200).send('OK');
    }
}
async function handleRecordingWebhook(req, res) {
    const { CallSid, RecordingSid, RecordingUrl, RecordingDuration, RecordingStatus } = req.body;
    logger_1.default.info(`🎬 Recording ready for call ${CallSid}`);
    try {
        if (RecordingStatus === 'completed') {
            await callingService_1.CallingService.handleRecording({ CallSid, RecordingSid, RecordingUrl, RecordingDuration });
            await auditService_1.AuditService.log({
                action: 'CALL_RECORDING_COMPLETED', resource: 'CALL', resourceId: CallSid,
                ipAddress: req.ip || '', userAgent: req.headers['user-agent'] || '',
                metadata: { callSid: CallSid, recordingUrl: RecordingUrl, duration: RecordingDuration },
                severity: 'INFO', status: 'SUCCESS',
            });
        }
        res.status(200).send('OK');
    }
    catch (error) {
        res.status(200).send('OK');
    }
}
async function handleTransferWebhook(req, res) {
    const { CallSid, transferTo, reason, priority } = req.body;
    logger_1.default.info(`🔄 Transfer: ${CallSid} -> ${transferTo}`);
    try {
        await auditService_1.AuditService.log({
            action: 'CALL_TRANSFERRED_TO_HUMAN', resource: 'CALL', resourceId: CallSid,
            ipAddress: req.ip || '', userAgent: req.headers['user-agent'] || '',
            metadata: { callSid: CallSid, transferTo, reason, priority }, severity: 'INFO', status: 'SUCCESS',
        });
        const VoiceResponse = twilio_1.default.twiml.VoiceResponse;
        const response = new VoiceResponse();
        response.say({ voice: 'Polly.Joanna' }, 'Please hold while I transfer you to a human agent.');
        response.dial({ timeout: 30, action: `${process.env.API_URL}/api/v1/calling/webhook/status`, method: 'POST' }, transferTo);
        res.type('text/xml').status(200).send(response.toString());
    }
    catch (error) {
        res.type('text/xml').status(200).send('<Response><Say>Unable to transfer. Please try again later.</Say><Hangup/></Response>');
    }
}
async function handleEmergencyWebhook(req, res) {
    const { CallSid, reason } = req.body;
    logger_1.default.warn(`🚨 Emergency detected in call ${CallSid}: ${reason}`);
    try {
        await auditService_1.AuditService.log({
            action: 'EMERGENCY_DETECTED', resource: 'CALL', resourceId: CallSid,
            ipAddress: req.ip || '', userAgent: req.headers['user-agent'] || '',
            metadata: { callSid: CallSid, reason }, severity: 'CRITICAL', status: 'SUCCESS',
        });
        const VoiceResponse = twilio_1.default.twiml.VoiceResponse;
        const response = new VoiceResponse();
        response.say({ voice: 'Polly.Joanna' }, 'I understand this may be an emergency. Transferring to emergency services now. Please stay on the line.');
        response.dial({ timeout: 60, action: `${process.env.API_URL}/api/v1/calling/webhook/status`, method: 'POST' }, process.env.EMERGENCY_NUMBER || '911');
        res.type('text/xml').status(200).send(response.toString());
    }
    catch (error) {
        res.type('text/xml').status(200).send('<Response><Say>Please call 911 immediately.</Say><Hangup/></Response>');
    }
}
async function handleGatherFallbackWebhook(req, res) {
    const { CallSid } = req.body;
    logger_1.default.info(`⏰ Gather fallback for call ${CallSid}`);
    try {
        const VoiceResponse = twilio_1.default.twiml.VoiceResponse;
        const response = new VoiceResponse();
        const gather = response.gather({
            input: ['speech', 'dtmf'], timeout: 5, speechTimeout: 'auto', language: 'en-US', numDigits: 1,
            action: `${process.env.API_URL}/api/v1/calling/webhook/voice`, method: 'POST',
        });
        gather.say({ voice: 'Polly.Joanna' }, 'I didn\'t receive any input. You can say things like "book an appointment" or press 1 for an agent.');
        response.say({ voice: 'Polly.Joanna' }, 'Transferring you to an agent. Please hold.');
        response.dial({ timeout: 30, action: `${process.env.API_URL}/api/v1/calling/webhook/status`, method: 'POST' }, process.env.HUMAN_AGENT_NUMBER || '+1234567890');
        res.type('text/xml').status(200).send(response.toString());
    }
    catch (error) {
        res.type('text/xml').status(200).send('<Response><Say>Thank you for calling. Please try again later.</Say><Hangup/></Response>');
    }
}
function twilioErrorHandler(err, req, res, next) {
    logger_1.default.error('Twilio webhook error:', err);
    const VoiceResponse = twilio_1.default.twiml.VoiceResponse;
    const response = new VoiceResponse();
    response.say({ voice: 'Polly.Joanna' }, 'We apologize for the technical difficulty. Please call back later.');
    response.hangup();
    res.type('text/xml').status(200).send(response.toString());
}
exports.default = {
    validateTwilioSignature,
    handleIncomingCallWebhook,
    handleVoiceInputWebhook,
    handleStatusCallbackWebhook,
    handleVoicemailWebhook,
    handleTranscriptionWebhook,
    handleRecordingWebhook,
    handleTransferWebhook,
    handleEmergencyWebhook,
    handleGatherFallbackWebhook,
    twilioErrorHandler,
};
//# sourceMappingURL=twilioWebhook.js.map