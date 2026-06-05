import { v4 as uuidv4 } from 'uuid';
import prisma from '../../../config/prisma';
import { whisperClient } from '../../../integration/ai/wishperClient';
import { gptClient, ChatMessage } from '../../../integration/ai/aiClient';
import { embeddingClient } from '../../../integration/ai/embeddingClient';
import { qdrantService } from '../../../integration/ai/';
import { ChatMessageInput, AudioMessageInput, ChatHistoryInput } from '../validators/chatbot.validator';
import { NotFoundError } from '../utils/errors';
import {
  ChatResponse, AudioChatResponse, ChatHistoryResponse,
  ChatHistoryMessage, ChatSession, ChatStats, SuggestedAction,
} from '../types/chatbot.types';
import logger from '../utils/logger';

export class ChatbotService {
  /**
   * ============================================
   * TEXT CHAT
   * ============================================
   */
  static async processTextMessage(
    data: ChatMessageInput,
    userId: string,
    ipAddress: string
  ): Promise<ChatResponse> {
    const startTime = Date.now();
    const sessionId = data.sessionId || uuidv4();

    // 1. Classify intent
    const intentResult = await gptClient.classifyIntent(data.message);

    // 2. Get patient context if available
    let patientContext: any = {};
    if (data.patientId) {
      const patient = await prisma.patient.findUnique({
        where: { id: data.patientId },
        select: {
          id: true, patientId: true, firstName: true, lastName: true,
          dateOfBirth: true, gender: true, bloodGroup: true,
          allergies: true, chronicConditions: true, currentMedications: true,
        },
      });
      if (patient) patientContext = { patient };
    }

    // 3. Get conversation history
    const history = await this.getRecentHistory(sessionId, 10);

    // 4. Search knowledge base for relevant info
    let knowledgeContext = '';
    try {
      const queryEmbedding = await embeddingClient.embed(data.message);
      const ragResults = await qdrantService.search(queryEmbedding, 3, 0.7);
      if (ragResults.length > 0) {
        knowledgeContext = ragResults.map((r) => r.payload.text).join('\n\n');
      }
    } catch (error) {
      logger.warn('RAG search failed, continuing without knowledge context');
    }

    // 5. Build messages array
    const systemPrompt = gptClient.getSystemPrompt(data.context || 'GENERAL');
    const messages: ChatMessage[] = [
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
      messages.push({ role: msg.role as any, content: msg.content });
    }

    // Add current message
    messages.push({ role: 'user', content: data.message });

    // 6. Get AI response
    const aiResponse = await gptClient.chat(messages, {
      functions: gptClient.getMedicalFunctions(),
      functionCall: 'auto',
    });

    // 7. Execute function call if needed
    let functionResult: any = null;
    if (aiResponse.functionCall) {
      functionResult = await this.executeFunction(
        aiResponse.functionCall.name,
        aiResponse.functionCall.arguments
      );

      // Add function result and get final response
      messages.push({
        role: 'function',
        name: aiResponse.functionCall.name,
        content: JSON.stringify(functionResult),
      });

      const finalResponse = await gptClient.chat(messages);
      aiResponse.message = finalResponse.message;
    }

    // 8. Save to conversation history
    await this.saveConversation(sessionId, userId, data.patientId, [
      { role: 'user', content: data.message },
      { role: 'assistant', content: aiResponse.message },
    ]);

    // 9. Generate suggested actions
    const suggestedActions = this.generateSuggestedActions(
      intentResult.intent,
      aiResponse,
      data.patientId
    );

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
  static async processAudioMessage(
    audioFile: Express.Multer.File | Buffer,
    data: AudioMessageInput,
    userId: string
  ): Promise<AudioChatResponse> {
    const startTime = Date.now();

    // 1. Transcribe audio to text
    let transcription;
    if (Buffer.isBuffer(audioFile)) {
      transcription = await whisperClient.transcribeBuffer(
        audioFile,
        data.language,
        data.format
      );
    } else {
      transcription = await whisperClient.transcribe(
        audioFile.path,
        data.language,
        data.format
      );
    }

    // 2. Process transcribed text as chat message
    const chatResult = await this.processTextMessage(
      {
        message: transcription.text,
        sessionId: data.sessionId,
        patientId: data.patientId,
        context: data.context,
        language: data.language,
      },
      userId,
      ''
    );

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
  static async streamTextMessage(
    data: ChatMessageInput,
    userId: string,
    callbacks: {
      onToken: (token: string) => void;
      onComplete: (response: ChatResponse) => void;
      onError: (error: Error) => void;
    }
  ): Promise<void> {
    const sessionId = data.sessionId || uuidv4();
    const startTime = Date.now();

    try {
      const systemPrompt = gptClient.getSystemPrompt(data.context || 'GENERAL');
      const history = await this.getRecentHistory(sessionId, 5);

      const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
      ];

      for (const msg of history) {
        messages.push({ role: msg.role as any, content: msg.content });
      }
      messages.push({ role: 'user', content: data.message });

      let fullResponse = '';

      await gptClient.streamChat(messages, {
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
    } catch (error: any) {
      callbacks.onError(error);
    }
  }

  /**
   * ============================================
   * CHAT HISTORY
   * ============================================
   */
  static async getChatHistory(query: ChatHistoryInput): Promise<ChatHistoryResponse> {
    const { sessionId, patientId, page = 1, limit = 50 } = query;

    const where: any = {};
    if (sessionId) where.sessionId = sessionId;
    if (patientId) where.patientId = patientId;

    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      prisma.conversationHistory.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
      }),
      prisma.conversationHistory.count({ where }),
    ]);

    return {
      sessionId: sessionId || '',
      messages: messages.map((m) => ({
        id: m.id,
        role: m.role as any,
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
  static async clearHistory(sessionId?: string, patientId?: string): Promise<void> {
    const where: any = {};
    if (sessionId) where.sessionId = sessionId;
    if (patientId) where.patientId = patientId;

    await prisma.conversationHistory.deleteMany({ where });
    logger.info(`Chat history cleared: session=${sessionId}, patient=${patientId}`);
  }

  /**
   * ============================================
   * CHAT STATISTICS
   * ============================================
   */
  static async getChatStats(): Promise<ChatStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalSessions, totalMessages, todayMessages] = await Promise.all([
      prisma.conversationHistory.groupBy({ by: ['sessionId'] }).then((r) => r.length),
      prisma.conversationHistory.count(),
      prisma.conversationHistory.count({ where: { createdAt: { gte: today } } }),
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

  private static async getRecentHistory(sessionId: string, limit: number): Promise<any[]> {
    return prisma.conversationHistory.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: { role: true, content: true },
    }).then((r) => r.reverse());
  }

  private static async saveConversation(
    sessionId: string,
    userId: string,
    patientId: string | null | undefined,
    messages: Array<{ role: string; content: string }>
  ): Promise<void> {
    for (const msg of messages) {
      await prisma.conversationHistory.create({
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

  private static async executeFunction(name: string, args: any): Promise<any> {
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

  private static generateSuggestedActions(
    intent: string,
    response: any,
    patientId?: string | null
  ): SuggestedAction[] {
    const actions: SuggestedAction[] = [];

    switch (intent) {
      case 'BOOK_APPOINTMENT':
        actions.push(
          { action: 'book_appointment', label: '📅 Book Appointment', description: 'Schedule a visit', icon: 'calendar' },
          { action: 'view_doctors', label: '👨‍⚕️ View Doctors', description: 'See available doctors', icon: 'stethoscope' }
        );
        break;
      case 'CHECK_SYMPTOMS':
        actions.push(
          { action: 'start_triage', label: '🏥 Start Triage', description: 'Symptom assessment', icon: 'clipboard' },
          { action: 'emergency', label: '🚨 Emergency', description: 'Call emergency services', icon: 'alert', color: '#DC2626' }
        );
        break;
      case 'PRESCRIPTION_QUERY':
        actions.push(
          { action: 'view_prescriptions', label: '💊 My Prescriptions', description: 'View medications', icon: 'pill' },
          { action: 'refill_request', label: '🔄 Request Refill', description: 'Refill a prescription', icon: 'refresh' }
        );
        break;
      default:
        actions.push(
          { action: 'book_appointment', label: '📅 Book Appointment', description: 'Schedule a visit' },
          { action: 'check_symptoms', label: '🩺 Check Symptoms', description: 'Symptom analysis' }
        );
    }

    return actions;
  }
}