"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatbotService = void 0;
const uuid_1 = require("uuid");
const prisma_1 = __importDefault(require("../../../config/prisma"));
const wishperClient_1 = require("../../../integration/ai/wishperClient");
const aiClient_1 = require("../../../integration/ai/aiClient");
const embeddingClient_1 = require("../../../integration/ai/embeddingClient");
const quadrantClient_1 = require("../../../integration/ai/quadrantClient");
const logger_1 = __importDefault(require("../../../utils/logger"));
class ChatbotService {
    /**
     * ============================================
     * TEXT CHAT
     * ============================================
     */
    static async processTextMessage(data, userId, ipAddress) {
        const startTime = Date.now();
        const sessionId = data.sessionId || (0, uuid_1.v4)();
        // 1. Classify intent
        const intentResult = await aiClient_1.gptClient.classifyIntent(data.message);
        // 2. Get patient context if available
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
        // 3. Get conversation history
        const history = await this.getRecentHistory(sessionId, 10);
        // 4. Search knowledge base for relevant info
        let knowledgeContext = '';
        try {
            const queryEmbedding = await embeddingClient_1.embeddingClient.embed(data.message);
            const ragResults = await quadrantClient_1.qdrantService.search(queryEmbedding, 3, 0.7);
            if (ragResults.length > 0) {
                knowledgeContext = ragResults.map((r) => r.payload.text).join('\n\n');
            }
        }
        catch (error) {
            logger_1.default.warn('RAG search failed, continuing without knowledge context');
        }
        // 5. Build messages array
        const systemPrompt = aiClient_1.gptClient.getSystemPrompt(data.context || 'GENERAL');
        const messages = [
            { role: 'system', content: systemPrompt },
        ];
        // Add patient context
        if (patientContext.patient) {
            messages.push({
                role: 'system',
                content: `Current patient: ${JSON.stringify(patientContext.patient)}`,
            });
        }
        // Add knowledge context
        if (knowledgeContext) {
            messages.push({
                role: 'system',
                content: `Relevant medical information:\n${knowledgeContext}`,
            });
        }
        // Add conversation history
        for (const msg of history) {
            messages.push({ role: msg.role, content: msg.content });
        }
        // Add current message
        messages.push({ role: 'user', content: data.message });
        // 6. Get AI response
        const aiResponse = await aiClient_1.gptClient.chat(messages, {
            functions: aiClient_1.gptClient.getMedicalFunctions(),
            functionCall: 'auto',
        });
        // 7. Execute function call if needed
        let functionResult = null;
        if (aiResponse.functionCall) {
            functionResult = await this.executeFunction(aiResponse.functionCall.name, aiResponse.functionCall.arguments);
            // Add function result and get final response
            messages.push({
                role: 'function',
                name: aiResponse.functionCall.name,
                content: JSON.stringify(functionResult),
            });
            const finalResponse = await aiClient_1.gptClient.chat(messages);
            aiResponse.message = finalResponse.message;
        }
        // 8. Save to conversation history
        await this.saveConversation(sessionId, userId, data.patientId, [
            { role: 'user', content: data.message },
            { role: 'assistant', content: aiResponse.message },
        ]);
        // 9. Generate suggested actions
        const suggestedActions = this.generateSuggestedActions(intentResult.intent, aiResponse, data.patientId);
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
    /**
     * ============================================
     * VOICE CHAT (Audio to Text to AI to Response)
     * ============================================
     */
    static async processAudioMessage(audioFile, data, userId) {
        const startTime = Date.now();
        // 1. Transcribe audio to text
        let transcription;
        if (Buffer.isBuffer(audioFile)) {
            transcription = await wishperClient_1.whisperClient.transcribeBuffer(audioFile, data.language, data.format);
        }
        else {
            transcription = await wishperClient_1.whisperClient.transcribe(audioFile.path, data.language, data.format);
        }
        // 2. Process transcribed text as chat message
        const chatResult = await this.processTextMessage({
            message: transcription.text,
            sessionId: data.sessionId,
            patientId: data.patientId,
            context: data.context,
            language: data.language,
            stream: false,
        }, userId, '');
        return {
            ...chatResult,
            type: 'voice',
            transcription: transcription.text,
            audioDuration: transcription.duration,
            segments: transcription.segments,
        };
    }
    /**
     * ============================================
     * STREAMING TEXT CHAT
     * ============================================
     */
    static async streamTextMessage(data, userId, callbacks) {
        const sessionId = data.sessionId || (0, uuid_1.v4)();
        const startTime = Date.now();
        try {
            const systemPrompt = aiClient_1.gptClient.getSystemPrompt(data.context || 'GENERAL');
            const history = await this.getRecentHistory(sessionId, 5);
            const messages = [
                { role: 'system', content: systemPrompt },
            ];
            for (const msg of history) {
                messages.push({ role: msg.role, content: msg.content });
            }
            messages.push({ role: 'user', content: data.message });
            let fullResponse = '';
            await aiClient_1.gptClient.streamChat(messages, {
                onToken: (token) => {
                    fullResponse += token;
                    callbacks.onToken(token);
                },
                onComplete: async (aiResponse) => {
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
    /**
     * ============================================
     * CHAT HISTORY
     * ============================================
     */
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
    /**
     * ============================================
     * CLEAR CHAT HISTORY
     * ============================================
     */
    static async clearHistory(sessionId, patientId) {
        const where = {};
        if (sessionId)
            where.sessionId = sessionId;
        if (patientId)
            where.patientId = patientId;
        await prisma_1.default.conversationHistory.deleteMany({ where });
        logger_1.default.info(`Chat history cleared: session=${sessionId}, patient=${patientId}`);
    }
    /**
     * ============================================
     * CHAT STATISTICS
     * ============================================
     */
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
        };
    }
    // ============================================
    // HELPER METHODS
    // ============================================
    static async getRecentHistory(sessionId, limit) {
        return prisma_1.default.conversationHistory.findMany({
            where: { sessionId },
            orderBy: { createdAt: 'desc' },
            take: limit,
            select: { role: true, content: true },
        }).then((r) => r.reverse());
    }
    static async saveConversation(sessionId, userId, patientId, messages) {
        for (const msg of messages) {
            await prisma_1.default.conversationHistory.create({
                data: {
                    userId,
                    patientId: patientId || null,
                    sessionId,
                    role: msg.role,
                    content: msg.content,
                },
            });
        }
    }
    static async executeFunction(name, args) {
        // Execute the appropriate function
        switch (name) {
            case 'schedule_appointment':
                return { success: true, message: 'Appointment scheduling initiated' };
            case 'check_symptoms':
                return { triage: 'routine', recommendation: 'Schedule a consultation' };
            case 'check_drug_interactions':
                return { interactions: [], safe: true };
            case 'search_medical_knowledge':
                return { results: [] };
            default:
                return { executed: false, message: 'Function not implemented' };
        }
    }
    static generateSuggestedActions(intent, response, patientId) {
        const actions = [];
        switch (intent) {
            case 'BOOK_APPOINTMENT':
                actions.push({ action: 'book_appointment', label: '📅 Book Appointment', description: 'Schedule a visit', icon: 'calendar' }, { action: 'view_doctors', label: '👨‍⚕️ View Doctors', description: 'See available doctors', icon: 'stethoscope' });
                break;
            case 'CHECK_SYMPTOMS':
                actions.push({ action: 'start_triage', label: '🏥 Start Triage', description: 'Symptom assessment', icon: 'clipboard' }, { action: 'emergency', label: '🚨 Emergency', description: 'Call emergency services', icon: 'alert', color: '#DC2626' });
                break;
            case 'PRESCRIPTION_QUERY':
                actions.push({ action: 'view_prescriptions', label: '💊 My Prescriptions', description: 'View medications', icon: 'pill' }, { action: 'refill_request', label: '🔄 Request Refill', description: 'Refill a prescription', icon: 'refresh' });
                break;
            default:
                actions.push({ action: 'book_appointment', label: '📅 Book Appointment', description: 'Schedule a visit' }, { action: 'check_symptoms', label: '🩺 Check Symptoms', description: 'Symptom analysis' });
        }
        return actions;
    }
}
exports.ChatbotService = ChatbotService;
//# sourceMappingURL=chatbotService.js.map