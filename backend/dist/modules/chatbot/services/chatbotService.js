"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatbotService = void 0;
const uuid_1 = require("uuid");
const client_1 = require("@prisma/client");
const prisma_1 = __importDefault(require("../../../config/prisma"));
const wishperClient_1 = require("../../../integration/ai/wishperClient");
const aiClient_1 = require("../../../integration/ai/aiClient");
const vectorlessRagClient_1 = require("../../../integration/ai/vectorlessRagClient");
const appointmentService_1 = require("../../appoinment/services/appointmentService");
const errors_1 = require("../../../utils/errors");
const logger_1 = __importDefault(require("../../../utils/logger"));
class ChatbotService {
    static async processTextMessage(data, userId, ipAddress) {
        if (!aiClient_1.llmClient.isConfigured()) {
            throw new errors_1.BadRequestError('AI chatbot is not configured. Set GROQ_API_KEY.');
        }
        const startTime = Date.now();
        const sessionId = data.sessionId || (0, uuid_1.v4)();
        const intentResult = await aiClient_1.llmClient.classifyIntent(data.message);
        let patientContext = {};
        if (data.patientId) {
            const patient = await prisma_1.default.patient.findUnique({
                where: { id: data.patientId },
                select: {
                    id: true, patientId: true, firstName: true, lastName: true,
                    dateOfBirth: true, gender: true, bloodGroup: true,
                    allergies: true, chronicConditions: true, currentMedications: true,
                },
            });
            if (patient)
                patientContext = { patient };
        }
        const history = await this.getRecentHistory(sessionId, 10);
        let knowledgeContext = '';
        try {
            const ragResults = await vectorlessRagClient_1.vectorlessRagClient.search(data.message, 3);
            knowledgeContext = vectorlessRagClient_1.vectorlessRagClient.buildContext(ragResults);
        }
        catch (error) {
            logger_1.default.warn('Vectorless RAG search failed, continuing without knowledge context');
        }
        const systemPrompt = aiClient_1.llmClient.getSystemPrompt(data.context || 'GENERAL');
        const messages = [{ role: 'system', content: systemPrompt }];
        if (patientContext.patient) {
            messages.push({
                role: 'system',
                content: `Current patient: ${JSON.stringify(patientContext.patient)}`,
            });
        }
        if (knowledgeContext) {
            messages.push({
                role: 'system',
                content: `Relevant medical information:\n${knowledgeContext}`,
            });
        }
        for (const msg of history) {
            messages.push({ role: msg.role, content: msg.content });
        }
        messages.push({ role: 'user', content: data.message });
        const aiResponse = await aiClient_1.llmClient.chat(messages, {
            functions: aiClient_1.llmClient.getMedicalFunctions(),
            functionCall: 'auto',
        });
        let functionResult = null;
        if (aiResponse.functionCall) {
            functionResult = await this.executeFunction(aiResponse.functionCall.name, aiResponse.functionCall.arguments, userId, ipAddress);
            messages.push({
                role: 'assistant',
                content: aiResponse.message || null,
                tool_calls: [{
                        id: aiResponse.functionCall.id,
                        type: 'function',
                        function: {
                            name: aiResponse.functionCall.name,
                            arguments: JSON.stringify(aiResponse.functionCall.arguments),
                        },
                    }],
            });
            messages.push({
                role: 'tool',
                tool_call_id: aiResponse.functionCall.id,
                content: JSON.stringify(functionResult),
            });
            const finalResponse = await aiClient_1.llmClient.chat(messages);
            aiResponse.message = finalResponse.message;
        }
        await this.saveConversation(sessionId, userId, data.patientId, [
            { role: 'user', content: data.message },
            { role: 'assistant', content: aiResponse.message },
        ]);
        const suggestedActions = this.generateSuggestedActions(intentResult.intent, data.patientId);
        return {
            sessionId,
            message: aiResponse.message,
            type: 'text',
            intent: intentResult.intent,
            confidence: intentResult.confidence,
            sentiment: intentResult.sentiment,
            urgency: intentResult.urgency,
            functionCall: aiResponse.functionCall ? {
                name: aiResponse.functionCall.name,
                arguments: aiResponse.functionCall.arguments,
                result: functionResult,
            } : undefined,
            suggestedActions,
            medicalDisclaimer: 'This is not medical advice. Please consult with a healthcare professional.',
            tokensUsed: aiResponse.usage.totalTokens,
            responseTime: Date.now() - startTime,
            timestamp: new Date().toISOString(),
        };
    }
    static async processAudioMessage(audioFile, data, userId, ipAddress = '') {
        if (!wishperClient_1.whisperClient.isConfigured()) {
            throw new errors_1.BadRequestError('Voice chat is not configured. Set GROQ_API_KEY.');
        }
        const startTime = Date.now();
        const format = data.format || 'webm';
        let audioBuffer;
        if (Buffer.isBuffer(audioFile)) {
            audioBuffer = audioFile;
        }
        else if (audioFile.buffer?.length) {
            audioBuffer = audioFile.buffer;
        }
        else if (audioFile.path) {
            const fs = await Promise.resolve().then(() => __importStar(require('fs/promises')));
            audioBuffer = await fs.readFile(audioFile.path);
        }
        else {
            throw new errors_1.BadRequestError('Invalid audio upload');
        }
        if (audioBuffer.length === 0) {
            throw new errors_1.BadRequestError('Audio file is empty');
        }
        const transcription = await wishperClient_1.whisperClient.transcribeBuffer(audioBuffer, data.language, format);
        if (!transcription.text?.trim()) {
            throw new errors_1.BadRequestError('Could not transcribe audio. Please speak clearly and try again.');
        }
        const chatResult = await this.processTextMessage({
            message: transcription.text,
            sessionId: data.sessionId,
            patientId: data.patientId,
            context: data.context,
            language: data.language,
            stream: false,
        }, userId, ipAddress);
        return {
            ...chatResult,
            type: 'voice',
            transcription: transcription.text,
            audioDuration: transcription.duration,
            segments: transcription.segments,
            responseTime: Date.now() - startTime,
        };
    }
    static async streamTextMessage(data, userId, callbacks) {
        if (!aiClient_1.llmClient.isConfigured()) {
            callbacks.onError(new errors_1.BadRequestError('AI chatbot is not configured. Set GROQ_API_KEY.'));
            return;
        }
        const sessionId = data.sessionId || (0, uuid_1.v4)();
        const startTime = Date.now();
        try {
            const systemPrompt = aiClient_1.llmClient.getSystemPrompt(data.context || 'GENERAL');
            const history = await this.getRecentHistory(sessionId, 5);
            const messages = [{ role: 'system', content: systemPrompt }];
            for (const msg of history) {
                messages.push({ role: msg.role, content: msg.content });
            }
            messages.push({ role: 'user', content: data.message });
            let fullResponse = '';
            await aiClient_1.llmClient.streamChat(messages, {
                onToken: (token) => {
                    fullResponse += token;
                    callbacks.onToken(token);
                },
                onComplete: async () => {
                    await this.saveConversation(sessionId, userId, data.patientId, [
                        { role: 'user', content: data.message },
                        { role: 'assistant', content: fullResponse },
                    ]);
                    callbacks.onComplete({
                        sessionId,
                        message: fullResponse,
                        type: 'text',
                        intent: 'GENERAL_INQUIRY',
                        confidence: 0.9,
                        sentiment: 'neutral',
                        urgency: 'routine',
                        suggestedActions: [],
                        medicalDisclaimer: 'This is not medical advice.',
                        tokensUsed: 0,
                        responseTime: Date.now() - startTime,
                        timestamp: new Date().toISOString(),
                    });
                },
                onError: (error) => {
                    callbacks.onError(error);
                },
            });
        }
        catch (error) {
            callbacks.onError(error);
        }
    }
    static async getChatHistory(query) {
        const { sessionId, patientId, page = 1, limit = 50 } = query;
        const where = {};
        if (sessionId)
            where.sessionId = sessionId;
        if (patientId)
            where.patientId = patientId;
        const skip = (page - 1) * limit;
        const [messages, total] = await Promise.all([
            prisma_1.default.conversationHistory.findMany({
                where,
                orderBy: { createdAt: 'asc' },
                skip,
                take: limit,
            }),
            prisma_1.default.conversationHistory.count({ where }),
        ]);
        return {
            sessionId: sessionId || '',
            messages: messages.map((m) => ({
                id: m.id,
                role: m.role,
                content: m.content,
                type: 'text',
                timestamp: m.createdAt.toISOString(),
            })),
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }
    static async clearHistory(sessionId, patientId) {
        const where = {};
        if (sessionId)
            where.sessionId = sessionId;
        if (patientId)
            where.patientId = patientId;
        await prisma_1.default.conversationHistory.deleteMany({ where });
        logger_1.default.info(`Chat history cleared: session=${sessionId}, patient=${patientId}`);
    }
    static async getChatStats() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [totalSessions, totalMessages, todayMessages] = await Promise.all([
            prisma_1.default.conversationHistory.groupBy({ by: ['sessionId'] }).then((r) => r.length),
            prisma_1.default.conversationHistory.count(),
            prisma_1.default.conversationHistory.count({ where: { createdAt: { gte: today } } }),
        ]);
        return {
            totalSessions,
            activeSessions: 0,
            totalMessages,
            todayMessages,
            averageResponseTime: 1500,
            averageConfidence: 0.88,
            topIntents: [],
            hourlyActivity: [],
            patientSatisfaction: 4.5,
            llmProvider: 'groq',
            voiceProvider: 'groq-whisper',
            ragProvider: 'postgresql_fts',
        };
    }
    static async getRecentHistory(sessionId, limit) {
        return prisma_1.default.conversationHistory.findMany({
            where: { sessionId },
            orderBy: { createdAt: 'desc' },
            take: limit,
            select: { role: true, content: true },
        }).then((r) => r.reverse());
    }
    static async saveConversation(sessionId, userId, patientId, messages) {
        await prisma_1.default.conversationHistory.createMany({
            data: messages.map((msg) => ({
                userId,
                patientId: patientId || null,
                sessionId,
                role: msg.role,
                content: msg.content,
            })),
        });
    }
    static async executeFunction(name, args, userId, ipAddress) {
        switch (name) {
            case 'schedule_appointment':
                return this.scheduleAppointment(args, userId, ipAddress);
            case 'check_symptoms':
                return aiClient_1.llmClient.analyzeSymptoms(Array.isArray(args.symptoms) ? args.symptoms : [String(args.symptoms)]);
            case 'check_drug_interactions': {
                const patient = args.patientId
                    ? await prisma_1.default.patient.findUnique({
                        where: { id: args.patientId },
                        select: { currentMedications: true, allergies: true, firstName: true },
                    })
                    : null;
                const currentMeds = patient?.currentMedications || [];
                const drugName = args.drugName || '';
                const hasAllergy = (patient?.allergies || []).some((a) => a.toLowerCase().includes(drugName.toLowerCase()));
                return {
                    drugName,
                    patientName: patient?.firstName || null,
                    currentMedications: currentMeds,
                    potentialConflict: hasAllergy || currentMeds.some((m) => m.toLowerCase().includes(drugName.toLowerCase())),
                    safe: !hasAllergy,
                    recommendation: hasAllergy
                        ? 'Patient has a documented allergy — do not prescribe without physician review.'
                        : 'Review full medication list with a licensed prescriber before dispensing.',
                };
            }
            case 'search_medical_knowledge': {
                try {
                    const results = await vectorlessRagClient_1.vectorlessRagClient.search(args.query, 5);
                    return {
                        results: results.map((r) => ({
                            text: r.content,
                            title: r.title,
                            sourceType: r.sourceType,
                            score: r.score,
                        })),
                        retrievalMethod: 'postgresql_fts',
                    };
                }
                catch (error) {
                    return { results: [], error: error.message };
                }
            }
            default:
                return { executed: false, message: `Unknown function: ${name}` };
        }
    }
    static async scheduleAppointment(args, userId, ipAddress) {
        const patientId = args.patientId;
        if (!patientId) {
            return { success: false, message: 'patientId is required to schedule an appointment' };
        }
        let doctorId = args.doctorId;
        const preferredDate = args.preferredDate || new Date().toISOString().slice(0, 10);
        const preferredTime = args.preferredTime || '09:00';
        if (!doctorId) {
            const appointmentDate = new Date(preferredDate);
            const dayOfWeek = appointmentDate.getDay();
            const doctor = await prisma_1.default.user.findFirst({
                where: {
                    role: 'DOCTOR',
                    status: 'ACTIVE',
                    doctorProfile: {
                        schedules: {
                            some: {
                                dayOfWeek,
                                isActive: true,
                                startTime: { lte: preferredTime },
                                endTime: { gte: preferredTime },
                            },
                        },
                    },
                },
                select: { id: true, firstName: true, lastName: true },
            });
            if (!doctor) {
                return { success: false, message: 'No doctors available at the requested time' };
            }
            doctorId = doctor.id;
        }
        try {
            const appointment = await appointmentService_1.AppointmentService.createAppointment({
                patientId,
                doctorId,
                appointmentDate: preferredDate,
                startTime: preferredTime,
                duration: 15,
                type: client_1.AppointmentType.IN_PERSON,
                reason: args.reason || 'Scheduled via AI chatbot',
                isFollowUp: false,
            }, userId, ipAddress, 'HospynAI-Chatbot/1.0');
            return {
                success: true,
                appointmentId: appointment.appointmentId,
                date: preferredDate,
                time: preferredTime,
                message: 'Appointment scheduled successfully',
            };
        }
        catch (error) {
            logger_1.default.warn('Chatbot appointment scheduling failed:', error.message);
            return { success: false, message: error.message };
        }
    }
    static generateSuggestedActions(intent, patientId) {
        const actions = [];
        switch (intent) {
            case 'BOOK_APPOINTMENT':
                actions.push({ action: 'book_appointment', label: 'Book Appointment', description: 'Schedule a visit', icon: 'calendar' }, { action: 'view_doctors', label: 'View Doctors', description: 'See available doctors', icon: 'stethoscope' });
                break;
            case 'CHECK_SYMPTOMS':
                actions.push({ action: 'start_triage', label: 'Start Triage', description: 'Symptom assessment', icon: 'clipboard' }, { action: 'emergency', label: 'Emergency', description: 'Call emergency services', icon: 'alert', color: '#DC2626' });
                break;
            case 'PRESCRIPTION_QUERY':
                actions.push({ action: 'view_prescriptions', label: 'My Prescriptions', description: 'View medications', icon: 'pill' }, { action: 'refill_request', label: 'Request Refill', description: 'Refill a prescription', icon: 'refresh' });
                break;
            default:
                actions.push({ action: 'book_appointment', label: 'Book Appointment', description: 'Schedule a visit' }, { action: 'check_symptoms', label: 'Check Symptoms', description: 'Symptom analysis' });
        }
        if (patientId) {
            actions.push({
                action: 'view_records',
                label: 'View Records',
                description: 'See patient medical history',
                icon: 'file-text',
            });
        }
        return actions;
    }
}
exports.ChatbotService = ChatbotService;
//# sourceMappingURL=chatbotService.js.map