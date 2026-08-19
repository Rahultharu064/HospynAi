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
// VoiceLog.interactionType is a fixed Prisma enum (APPOINTMENT_BOOKING, SYMPTOM_CHECK,
// PRESCRIPTION_QUERY, GENERAL_INQUIRY, EMERGENCY). The LLM's classified `intent` string
// uses a different vocabulary (BOOK_APPOINTMENT, CHECK_SYMPTOMS, ...), so it must be
// mapped rather than cast directly — a raw cast produces values Prisma will reject at
// write time (e.g. "GENERAL_INQUIRY" from intent is fine, but "BOOK_APPOINTMENT" is not
// a valid enum member).
const INTENT_TO_INTERACTION_TYPE = {
    BOOK_APPOINTMENT: client_1.VoiceInteractionType.APPOINTMENT_BOOKING,
    CHECK_SYMPTOMS: client_1.VoiceInteractionType.SYMPTOM_CHECK,
    PRESCRIPTION_QUERY: client_1.VoiceInteractionType.PRESCRIPTION_QUERY,
    GENERAL_INQUIRY: client_1.VoiceInteractionType.GENERAL_INQUIRY,
    EMERGENCY: client_1.VoiceInteractionType.EMERGENCY,
    MEDICAL_ADVICE: client_1.VoiceInteractionType.GENERAL_INQUIRY,
    BILLING: client_1.VoiceInteractionType.GENERAL_INQUIRY,
    OTHER: client_1.VoiceInteractionType.GENERAL_INQUIRY,
};
class CallingService {
    static async initiateOutboundCall(data, userId) {
        const patient = await prisma_1.default.patient.findUnique({ where: { id: data.patientId } });
        if (!patient || patient.deletedAt)
            throw new errors_1.NotFoundError('Patient not found');
        let message = data.message;
        if (!message) {
            const messages = {
                REMINDER: `Hello ${patient.firstName}, this is HospynAI reminding you about your upcoming appointment. Please say confirm to confirm, or reschedule to change the date.`,
                FOLLOW_UP: `Hello ${patient.firstName}, this is HospynAI following up on your recent visit. How are you feeling today? Please speak freely.`,
                APPOINTMENT_CONFIRMATION: `Hello ${patient.firstName}, this is HospynAI confirming your upcoming appointment. Please say confirm to proceed, or cancel to cancel.`,
                GENERAL: `Hello ${patient.firstName}, this is HospynAI calling. How can we help you today?`,
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
            ? twilioClient_1.twilioClient.generateResponseTwiML(`Hello ${patient.firstName}! Welcome back to HospynAI. How can I help you today?`)
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
        if (intentResult.intent === 'EMERGENCY' || intentResult.urgency === 'emergency') {
            return this.handleEmergency(CallSid, userInput);
        }
        const callLog = await prisma_1.default.callLog.findUnique({ where: { callSid: CallSid } });
        // Build multi-turn context: prior voice turns on this call, plus patient info when known,
        // so the agent doesn't lose the thread of the conversation between webhook round-trips.
        const priorTurns = await prisma_1.default.voiceLog.findMany({
            where: { metadata: { path: ['callSid'], equals: CallSid } },
            orderBy: { createdAt: 'asc' },
            take: 12,
        });
        const patient = callLog?.patientId
            ? await prisma_1.default.patient.findUnique({
                where: { id: callLog.patientId },
                select: { firstName: true, lastName: true, allergies: true, chronicConditions: true, currentMedications: true },
            })
            : null;
        const systemPrompt = patient
            ? `${aiClient_1.llmClient.getSystemPrompt('PATIENT')}\n\nYou are speaking with ${patient.firstName} ${patient.lastName} over the phone. Known context — allergies: ${patient.allergies?.join(', ') || 'none recorded'}; chronic conditions: ${patient.chronicConditions?.join(', ') || 'none recorded'}; current medications: ${patient.currentMedications?.join(', ') || 'none recorded'}. Keep responses short and natural for a voice call — this will be read aloud.`
            : `${aiClient_1.llmClient.getSystemPrompt('PATIENT')}\n\nKeep responses short and natural for a voice call — this will be read aloud.`;
        const messages = [{ role: 'system', content: systemPrompt }];
        for (const turn of priorTurns) {
            if (turn.transcript)
                messages.push({ role: 'user', content: turn.transcript });
            if (turn.aiResponse)
                messages.push({ role: 'assistant', content: turn.aiResponse });
        }
        messages.push({ role: 'user', content: userInput });
        const chatResp = await aiClient_1.llmClient.chat(messages, { maxTokens: 300, temperature: 0.6 });
        const responseText = chatResp.message || "I'm sorry, could you say that again?";
        const shouldEscalate = intentResult.urgency === 'urgent';
        if (callLog) {
            await prisma_1.default.voiceLog.create({
                data: {
                    patientId: callLog.patientId,
                    interactionType: INTENT_TO_INTERACTION_TYPE[intentResult.intent] || client_1.VoiceInteractionType.GENERAL_INQUIRY,
                    transcript: userInput, aiResponse: responseText,
                    confidence: parseFloat(Confidence || '0.8'), intent: intentResult.intent,
                    metadata: { callSid: CallSid, entities: intentResult.entities },
                },
            });
        }
        if (shouldEscalate || parseFloat(Confidence || '0.8') < 0.4) {
            return twilioClient_1.twilioClient.generateTransferTwiML(process.env.HUMAN_AGENT_NUMBER || '+1234567890', 'Let me transfer you to a human agent.');
        }
        return twilioClient_1.twilioClient.generateResponseTwiML(responseText);
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
        const { CallSid, RecordingUrl, RecordingDuration, TranscriptionText } = data;
        await prisma_1.default.callLog.update({
            where: { callSid: CallSid },
            data: {
                outcome: client_1.CallOutcome.VOICEMAIL,
                recordingUrl: RecordingUrl || undefined,
                duration: RecordingDuration ? parseInt(RecordingDuration, 10) : undefined,
                transcript: TranscriptionText || undefined,
                endedAt: new Date(),
            },
        }).catch((error) => {
            logger_1.default.warn(`Could not update call log for voicemail ${CallSid}:`, error);
        });
        logger_1.default.info(`Voicemail handled for ${CallSid}`);
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
        // Voice logs are stored per-turn with the callSid in their metadata JSON.
        // Filter at the database level via a JSONB path match instead of scanning the whole table.
        const voiceLogs = await prisma_1.default.voiceLog.findMany({
            where: { metadata: { path: ['callSid'], equals: callSid } },
            orderBy: { createdAt: 'asc' },
        });
        const callStart = callLog.startedAt.getTime();
        const segments = [];
        for (const v of voiceLogs) {
            const offsetSec = Math.max(0, Math.round((v.createdAt.getTime() - callStart) / 1000));
            if (v.transcript) {
                segments.push({ speaker: 'PATIENT', text: v.transcript, startTime: offsetSec, endTime: offsetSec, confidence: v.confidence ?? 0.8 });
            }
            if (v.aiResponse) {
                segments.push({ speaker: 'AI', text: v.aiResponse, startTime: offsetSec, endTime: offsetSec, confidence: 1 });
            }
        }
        const transcript = callLog.transcript || segments.map((s) => `${s.speaker}: ${s.text}`).join('\n');
        return { callSid: callLog.callSid, transcript, segments, duration: callLog.duration || 0 };
    }
    static async getCallStats() {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const [totalCalls, inboundCalls, outboundCalls, aiResolved, handedOff, missed, durationAgg, handoffDurationAgg, outcomeGroups, recentCalls,] = await Promise.all([
            prisma_1.default.callLog.count(),
            prisma_1.default.callLog.count({ where: { direction: 'INBOUND' } }),
            prisma_1.default.callLog.count({ where: { direction: 'OUTBOUND' } }),
            prisma_1.default.callLog.count({ where: { outcome: 'AI_RESOLVED' } }),
            prisma_1.default.callLog.count({ where: { outcome: 'HANDED_OFF' } }),
            prisma_1.default.callLog.count({ where: { outcome: 'MISSED' } }),
            prisma_1.default.callLog.aggregate({ _avg: { duration: true }, where: { duration: { not: null } } }),
            prisma_1.default.callLog.aggregate({
                _avg: { duration: true },
                where: { duration: { not: null }, handoffReason: { not: null } },
            }),
            prisma_1.default.callLog.groupBy({ by: ['outcome'], _count: { _all: true } }),
            prisma_1.default.callLog.findMany({
                where: { startedAt: { gte: thirtyDaysAgo } },
                select: { startedAt: true },
            }),
        ]);
        const hourCounts = new Map();
        const dayCounts = new Map();
        for (const call of recentCalls) {
            const hour = call.startedAt.getHours();
            hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
            const day = call.startedAt.toISOString().slice(0, 10);
            dayCounts.set(day, (dayCounts.get(day) || 0) + 1);
        }
        const peakHours = Array.from(hourCounts.entries())
            .map(([hour, count]) => ({ hour, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
        const dailyVolume = Array.from(dayCounts.entries())
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => a.date.localeCompare(b.date));
        const outcomes = {};
        for (const group of outcomeGroups) {
            outcomes[group.outcome] = group._count._all;
        }
        return {
            totalCalls, inboundCalls, outboundCalls, aiResolved, handedOff, missed,
            averageDuration: Math.round(durationAgg._avg.duration || 0),
            aiResolutionRate: totalCalls > 0 ? (aiResolved / totalCalls) * 100 : 0,
            missedCallRate: totalCalls > 0 ? (missed / totalCalls) * 100 : 0,
            // Proxy: average total duration of calls that were handed off to a human
            // (per-event handoff-latency isn't tracked separately from call duration).
            averageHandoffTime: Math.round(handoffDurationAgg._avg.duration || 0),
            peakHours, dailyVolume, outcomes,
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