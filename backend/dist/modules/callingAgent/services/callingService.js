"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CallingService = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = __importDefault(require("../../../config/prisma"));
const config_1 = require("../../../config");
const twilioClient_1 = require("../../../integration/twilio/twilioClient");
const aiClient_1 = require("../../../integration/ai/aiClient");
const errors_1 = require("../../../utils/errors");
const logger_1 = __importDefault(require("../../../utils/logger"));
class CallingService {
    static async initiateOutboundCall(data, userId) {
        const patient = await prisma_1.default.patient.findUnique({ where: { id: data.patientId } });
        if (!patient || patient.deletedAt)
            throw new errors_1.NotFoundError('Patient not found');
        let message = data.message;
        if (!message) {
            const messages = {
                REMINDER: `Hello ${patient.firstName}, this is VoiceMed Pro reminding you about your upcoming appointment.`,
                FOLLOW_UP: `Hello ${patient.firstName}, this is VoiceMed Pro following up on your recent visit.`,
                APPOINTMENT_CONFIRMATION: `Hello ${patient.firstName}, this is VoiceMed Pro confirming your appointment.`,
                GENERAL: `Hello ${patient.firstName}, this is VoiceMed Pro calling. How can we help?`,
            };
            message = messages[data.callType] || messages.GENERAL;
        }
        const twimlUrl = `${process.env.API_URL}/api/v1/calling/webhook/voice?type=outbound&patientId=${data.patientId}`;
        const result = await twilioClient_1.twilioClient.makeCall(data.phoneNumber, config_1.config.twilio.phoneNumber, twimlUrl);
        await prisma_1.default.callLog.create({
            data: {
                callSid: result.callSid, patientId: data.patientId,
                fromNumber: config_1.config.twilio.phoneNumber, toNumber: data.phoneNumber,
                direction: 'OUTBOUND', outcome: client_1.CallOutcome.MISSED, aiHandled: true,
                metadata: { callType: data.callType, appointmentId: data.appointmentId, initiatedBy: userId, message },
                startedAt: new Date(),
            },
        });
        return { success: true, callSid: result.callSid, status: result.status, message: 'Call initiated' };
    }
    static async handleIncomingCall(twilioRequest) {
        const { CallSid, From, To, FromCity, FromState, FromCountry } = twilioRequest;
        const patient = await prisma_1.default.patient.findFirst({ where: { phone: From } });
        await prisma_1.default.callLog.create({
            data: {
                callSid: CallSid, patientId: patient?.id || null,
                fromNumber: From, toNumber: To, direction: 'INBOUND',
                outcome: client_1.CallOutcome.MISSED, aiHandled: true,
                metadata: { callerInfo: { city: FromCity, state: FromState, country: FromCountry } },
                startedAt: new Date(),
            },
        });
        return patient
            ? twilioClient_1.twilioClient.generateResponseTwiML(`Hello ${patient.firstName}! Welcome back to VoiceMed Pro. How can I help you today?`)
            : twilioClient_1.twilioClient.generateIncomingTwiML();
    }
    static async processVoiceInput(twilioRequest) {
        const { CallSid, SpeechResult, Confidence, Digits } = twilioRequest;
        const userInput = SpeechResult || Digits || '';
        const fallback = twilioRequest.query?.fallback === 'true';
        if (fallback || !userInput) {
            await prisma_1.default.callLog.update({ where: { callSid: CallSid }, data: { outcome: client_1.CallOutcome.MISSED, endedAt: new Date() } });
            return twilioClient_1.twilioClient.generateEndCallTwiML('I didn\'t hear anything. Please call back when ready.');
        }
        const intentResult = await aiClient_1.gptClient.classifyIntent(userInput);
        if (intentResult.intent === 'EMERGENCY' || intentResult.entities?.urgency === 'emergency') {
            return this.handleEmergency(CallSid, userInput);
        }
        const aiResponse = await aiClient_1.gptClient.generateResponse(userInput, intentResult.intent, {});
        const callLog = await prisma_1.default.callLog.findUnique({ where: { callSid: CallSid } });
        if (callLog) {
            await prisma_1.default.voiceLog.create({
                data: {
                    patientId: callLog.patientId, interactionType: intentResult.interactionType,
                    transcript: userInput, aiResponse: aiResponse.response,
                    confidence: parseFloat(Confidence || '0.8'), intent: intentResult.intent,
                    metadata: { callSid: CallSid, entities: intentResult.entities },
                },
            });
        }
        if (aiResponse.action === 'ESCALATE' || parseFloat(Confidence || '0.8') < 0.5) {
            return twilioClient_1.twilioClient.generateTransferTwiML(process.env.HUMAN_AGENT_NUMBER || '+1234567890', 'Let me transfer you to a human agent.');
        }
        return twilioClient_1.twilioClient.generateResponseTwiML(aiResponse.response);
    }
    static async handleEmergency(callSid, input) {
        await prisma_1.default.callLog.update({
            where: { callSid },
            data: { outcome: client_1.CallOutcome.ESCALATED, handoffReason: 'EMERGENCY_DETECTED', metadata: { emergencyInput: input } },
        });
        return twilioClient_1.twilioClient.generateTransferTwiML(process.env.EMERGENCY_NUMBER || '911', 'I understand this may be an emergency. Transferring to emergency services now.');
    }
    static async transferToHuman(data, userId) {
        const callLog = await prisma_1.default.callLog.findUnique({ where: { callSid: data.callSid } });
        if (!callLog)
            throw new errors_1.NotFoundError('Call not found');
        await prisma_1.default.callLog.update({
            where: { callSid: data.callSid },
            data: {
                aiHandled: false, handoffReason: data.reason, handoffTo: data.department || 'Human Agent',
                metadata: { ...(callLog.metadata || {}), transferredBy: userId, transferredAt: new Date().toISOString(), priority: data.priority },
            },
        });
        return { twiml: twilioClient_1.twilioClient.generateTransferTwiML(process.env.HUMAN_AGENT_NUMBER || '+1234567890', 'Let me transfer you to a human agent.') };
    }
    static async handleStatusCallback(statusData) {
        const { CallSid, CallStatus, CallDuration, RecordingUrl } = statusData;
        const callLog = await prisma_1.default.callLog.findUnique({ where: { callSid: CallSid } });
        if (!callLog)
            return;
        const updateData = {};
        if (CallStatus === 'completed') {
            updateData.endedAt = new Date();
            updateData.duration = CallDuration ? parseInt(CallDuration) : null;
            updateData.recordingUrl = RecordingUrl || null;
            updateData.outcome = callLog.handoffReason ? client_1.CallOutcome.HANDED_OFF : callLog.aiHandled ? client_1.CallOutcome.AI_RESOLVED : callLog.outcome;
        }
        else if (['no-answer', 'busy'].includes(CallStatus)) {
            updateData.outcome = client_1.CallOutcome.MISSED;
            updateData.endedAt = new Date();
        }
        else if (CallStatus === 'failed') {
            updateData.outcome = client_1.CallOutcome.MISSED;
            updateData.endedAt = new Date();
        }
        await prisma_1.default.callLog.update({ where: { callSid: CallSid }, data: updateData });
        logger_1.default.info(`Call ${CallSid} status: ${CallStatus}`);
    }
    static async handleVoicemail(data) {
        logger_1.default.info(`Voicemail handled for ${data.CallSid}`);
    }
    static async handleTranscription(data) {
        await prisma_1.default.callLog.update({
            where: { callSid: data.CallSid },
            data: { transcript: data.TranscriptionText },
        });
    }
    static async handleRecording(data) {
        await prisma_1.default.callLog.update({
            where: { callSid: data.CallSid },
            data: { recordingUrl: data.RecordingUrl },
        });
    }
    static async getCallLogs(query) {
        const { page = 1, limit = 20, patientId, outcome, direction, aiHandled, search, sortBy = 'createdAt', sortOrder = 'desc' } = query;
        const where = {};
        if (patientId)
            where.patientId = patientId;
        if (outcome)
            where.outcome = outcome;
        if (direction)
            where.direction = direction;
        if (aiHandled !== undefined)
            where.aiHandled = aiHandled;
        if (search)
            where.OR = [{ callSid: { contains: search } }, { fromNumber: { contains: search } }, { toNumber: { contains: search } }];
        const skip = (page - 1) * limit;
        const [calls, total] = await Promise.all([
            prisma_1.default.callLog.findMany({ where, include: { patient: { select: { id: true, patientId: true, firstName: true, lastName: true } } }, orderBy: { [sortBy]: sortOrder }, skip, take: limit }),
            prisma_1.default.callLog.count({ where }),
        ]);
        return { calls: calls.map((c) => this.formatCallResponse(c)), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }
    static async getCallTranscript(callSid) {
        const callLog = await prisma_1.default.callLog.findUnique({ where: { callSid } });
        if (!callLog)
            throw new errors_1.NotFoundError('Call not found');
        // Voice logs are stored separately and may contain callSid in metadata.
        // Query voice logs that reference this callSid in their metadata JSON.
        // Prisma JSON filters vary by version and typings; to avoid incompatible JSON filters
        // fetch recent voice logs and filter in JS by checking metadata.callSid.
        const allVoiceLogs = await prisma_1.default.voiceLog.findMany({ orderBy: { createdAt: 'asc' } });
        const voiceLogs = allVoiceLogs.filter((v) => v.metadata?.callSid === callSid);
        const transcript = voiceLogs.map((v) => v.transcript).filter(Boolean).join('\n') || '';
        return { callSid: callLog.callSid, transcript, segments: [], duration: callLog.duration || 0 };
    }
    static async getCallStats() {
        const [totalCalls, inboundCalls, outboundCalls, aiResolved, handedOff, missed] = await Promise.all([
            prisma_1.default.callLog.count(),
            prisma_1.default.callLog.count({ where: { direction: 'INBOUND' } }),
            prisma_1.default.callLog.count({ where: { direction: 'OUTBOUND' } }),
            prisma_1.default.callLog.count({ where: { outcome: 'AI_RESOLVED' } }),
            prisma_1.default.callLog.count({ where: { outcome: 'HANDED_OFF' } }),
            prisma_1.default.callLog.count({ where: { outcome: 'MISSED' } }),
        ]);
        return {
            totalCalls, inboundCalls, outboundCalls, aiResolved, handedOff, missed,
            averageDuration: 120,
            aiResolutionRate: totalCalls > 0 ? (aiResolved / totalCalls) * 100 : 0,
            missedCallRate: totalCalls > 0 ? (missed / totalCalls) * 100 : 0,
            averageHandoffTime: 45, peakHours: [], dailyVolume: [], outcomes: {},
        };
    }
    static async getActiveCalls() {
        const calls = await twilioClient_1.twilioClient.getActiveCalls();
        return calls.map((call) => ({
            callSid: call.sid, patientName: null, phoneNumber: call.to || call.from,
            status: call.status, duration: call.duration || 0, aiHandling: true,
            startedAt: call.startTime?.toISOString() || new Date().toISOString(),
        }));
    }
    static formatCallResponse(call) {
        return {
            id: call.id, callSid: call.callSid, patient: call.patient,
            fromNumber: call.fromNumber, toNumber: call.toNumber, direction: call.direction,
            outcome: call.outcome, duration: call.duration, transcript: call.transcript,
            recordingUrl: call.recordingUrl, aiHandled: call.aiHandled,
            handoffReason: call.handoffReason, handoffTo: call.handoffTo, metadata: call.metadata,
            startedAt: call.startedAt.toISOString(), endedAt: call.endedAt?.toISOString() || null,
            createdAt: call.createdAt.toISOString(),
        };
    }
}
exports.CallingService = CallingService;
//# sourceMappingURL=callingService.js.map