import { v4 as uuidv4 } from 'uuid';
import { AppointmentType, UserRole } from '@prisma/client';
import prisma from '../../../config/prisma';
import { whisperClient } from '../../../integration/ai/wishperClient';
import { llmClient, ChatMessage } from '../../../integration/ai/aiClient';
import { vectorlessRagClient } from '../../../integration/ai/vectorlessRagClient';
import { AppointmentService } from '../../appoinment/services/appointmentService';
import { ChatMessageInput, AudioMessageInput, ChatHistoryInput } from '../validators/chatbotValidator';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../../utils/errors';
import {
  ChatResponse, AudioChatResponse, ChatHistoryResponse,
  SuggestedAction,
} from '../../../types/chatbotTypes';
import logger from '../../../utils/logger';

/** Roles that may pull a patient's clinical context into a conversation. */
const CLINICAL_ROLES: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.DOCTOR,
  UserRole.NURSE,
  UserRole.RECEPTIONIST,
  UserRole.PHARMACIST,
  UserRole.LAB_TECHNICIAN,
];

export class ChatbotService {
  /**
   * `patientId` arrives from the caller (or from a tool argument the model inferred
   * out of user text), and the record behind it holds allergies, chronic conditions
   * and medications. Nothing about being signed in earns you a stranger's chart, so
   * every read of it goes through here first.
   */
  private static async assertPatientAccess(userId: string, patientId: string): Promise<void> {
    const [user, patient] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { role: true, email: true, organizationId: true },
      }),
      prisma.patient.findUnique({
        where: { id: patientId },
        select: { email: true, organizationId: true, deletedAt: true },
      }),
    ]);

    if (!user) throw new ForbiddenError('You do not have access to this patient record');
    if (!patient || patient.deletedAt) throw new NotFoundError('Patient not found');

    if (CLINICAL_ROLES.includes(user.role)) {
      // Staff stay inside their own tenant when both sides declare one.
      if (
        user.organizationId &&
        patient.organizationId &&
        user.organizationId !== patient.organizationId
      ) {
        throw new ForbiddenError('You do not have access to this patient record');
      }
      return;
    }

    // Patients reach exactly one chart: the one filed under their own address.
    // Email is the only identifier User and Patient share — see
    // PatientService.getPatientForUser for the same interim link.
    const sameEmail =
      !!user.email && !!patient.email && user.email.toLowerCase() === patient.email.toLowerCase();

    if (!sameEmail) {
      throw new ForbiddenError('You do not have access to this patient record');
    }
  }

  static async processTextMessage(
    data: ChatMessageInput,
    userId: string,
    ipAddress: string
  ): Promise<ChatResponse> {
    if (!llmClient.isConfigured()) {
      throw new BadRequestError('AI chatbot is not configured. Set GROQ_API_KEY.');
    }

    const startTime = Date.now();
    const sessionId = data.sessionId || uuidv4();

    const intentResult = await llmClient.classifyIntent(data.message);

    let patientContext: any = {};
    if (data.patientId) {
      await this.assertPatientAccess(userId, data.patientId);

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

    const history = await this.getRecentHistory(sessionId, userId, 10);

    let knowledgeContext = '';
    try {
      const ragResults = await vectorlessRagClient.search(data.message, 3);
      knowledgeContext = vectorlessRagClient.buildContext(ragResults);
    } catch (error) {
      logger.warn('Vectorless RAG search failed, continuing without knowledge context');
    }

    const systemPrompt = llmClient.getSystemPrompt(data.context || 'GENERAL');
    const messages: ChatMessage[] = [{ role: 'system', content: systemPrompt }];

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
      messages.push({ role: msg.role as ChatMessage['role'], content: msg.content });
    }

    messages.push({ role: 'user', content: data.message });

    const aiResponse = await llmClient.chat(messages, {
      functions: llmClient.getMedicalFunctions(),
      functionCall: 'auto',
    });

    let functionResult: any = null;
    if (aiResponse.functionCall) {
      functionResult = await this.executeFunction(
        aiResponse.functionCall.name,
        aiResponse.functionCall.arguments,
        userId,
        ipAddress
      );

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

      const finalResponse = await llmClient.chat(messages);
      aiResponse.message = finalResponse.message;
    }

    await this.saveConversation(sessionId, userId, data.patientId, [
      { role: 'user', content: data.message },
      { role: 'assistant', content: aiResponse.message },
    ]);

    const suggestedActions = this.generateSuggestedActions(
      intentResult.intent,
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

  static async processAudioMessage(
    audioFile: Express.Multer.File | Buffer,
    data: AudioMessageInput,
    userId: string,
    ipAddress: string = ''
  ): Promise<AudioChatResponse> {
    if (!whisperClient.isConfigured()) {
      throw new BadRequestError('Voice chat is not configured. Set GROQ_API_KEY.');
    }

    const startTime = Date.now();
    const format = data.format || 'webm';

    let audioBuffer: Buffer;
    if (Buffer.isBuffer(audioFile)) {
      audioBuffer = audioFile;
    } else if (audioFile.buffer?.length) {
      audioBuffer = audioFile.buffer;
    } else if (audioFile.path) {
      const fs = await import('fs/promises');
      audioBuffer = await fs.readFile(audioFile.path);
    } else {
      throw new BadRequestError('Invalid audio upload');
    }

    if (audioBuffer.length === 0) {
      throw new BadRequestError('Audio file is empty');
    }

    const transcription = await whisperClient.transcribeBuffer(
      audioBuffer,
      data.language,
      format
    );

    if (!transcription.text?.trim()) {
      throw new BadRequestError('Could not transcribe audio. Please speak clearly and try again.');
    }

    const chatResult = await this.processTextMessage(
      {
        message: transcription.text,
        sessionId: data.sessionId,
        patientId: data.patientId,
        context: data.context,
        language: data.language,
        stream: false,
      },
      userId,
      ipAddress
    );

    return {
      ...chatResult,
      type: 'voice',
      transcription: transcription.text,
      audioDuration: transcription.duration,
      segments: transcription.segments,
      responseTime: Date.now() - startTime,
    };
  }

  static async streamTextMessage(
    data: ChatMessageInput,
    userId: string,
    callbacks: {
      onToken: (token: string) => void;
      onComplete: (response: ChatResponse) => void;
      onError: (error: Error) => void;
    }
  ): Promise<void> {
    if (!llmClient.isConfigured()) {
      callbacks.onError(new BadRequestError('AI chatbot is not configured. Set GROQ_API_KEY.'));
      return;
    }

    const sessionId = data.sessionId || uuidv4();
    const startTime = Date.now();

    try {
      const systemPrompt = llmClient.getSystemPrompt(data.context || 'GENERAL');
      const history = await this.getRecentHistory(sessionId, userId, 5);

      const messages: ChatMessage[] = [{ role: 'system', content: systemPrompt }];

      for (const msg of history) {
        messages.push({ role: msg.role as ChatMessage['role'], content: msg.content });
      }
      messages.push({ role: 'user', content: data.message });

      let fullResponse = '';

      await llmClient.streamChat(messages, {
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
    } catch (error: any) {
      callbacks.onError(error);
    }
  }

  /**
   * Scoped to the caller. `sessionId` is a client-supplied uuid, so without the
   * userId filter anyone holding (or guessing) one could read someone else's
   * conversation — and these transcripts discuss symptoms and medications.
   * Staff who pass a `patientId` are checked against that chart first.
   */
  static async getChatHistory(query: ChatHistoryInput, userId: string): Promise<ChatHistoryResponse> {
    const { sessionId, patientId, page = 1, limit = 50 } = query;

    const where: any = { userId };
    if (sessionId) where.sessionId = sessionId;
    if (patientId) {
      await this.assertPatientAccess(userId, patientId);
      where.patientId = patientId;
      // A clinician asking for a chart's history wants every conversation about
      // that patient, not only the ones they personally typed.
      delete where.userId;
    }

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

  static async clearHistory(userId: string, sessionId?: string, patientId?: string): Promise<void> {
    if (!sessionId && !patientId) {
      throw new BadRequestError('Provide a sessionId or patientId to clear.');
    }

    const where: any = { userId };
    if (sessionId) where.sessionId = sessionId;
    if (patientId) {
      await this.assertPatientAccess(userId, patientId);
      where.patientId = patientId;
      delete where.userId;
    }

    const { count } = await prisma.conversationHistory.deleteMany({ where });
    logger.info(
      `Chat history cleared by ${userId}: session=${sessionId}, patient=${patientId}, removed=${count}`
    );
  }

  static async getChatStats(): Promise<any> {
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
      llmProvider: 'groq',
      voiceProvider: 'groq-whisper',
      ragProvider: 'postgresql_fts',
    };
  }

  private static async getRecentHistory(
    sessionId: string,
    userId: string,
    limit: number
  ): Promise<any[]> {
    return prisma.conversationHistory.findMany({
      where: { sessionId, userId },
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
    await prisma.conversationHistory.createMany({
      data: messages.map((msg) => ({
        userId,
        patientId: patientId || null,
        sessionId,
        role: msg.role,
        content: msg.content,
      })),
    });
  }

  private static async executeFunction(
    name: string,
    args: Record<string, any>,
    userId: string,
    ipAddress: string
  ): Promise<any> {
    switch (name) {
      case 'schedule_appointment':
        return this.scheduleAppointment(args, userId, ipAddress);

      case 'check_symptoms':
        return llmClient.analyzeSymptoms(
          Array.isArray(args.symptoms) ? args.symptoms : [String(args.symptoms)]
        );

      case 'check_drug_interactions': {
        // The model chose this id from free text, so it gets the same gate as a
        // caller-supplied one before any medication list comes back.
        let patient = null;
        if (args.patientId) {
          await this.assertPatientAccess(userId, args.patientId);
          patient = await prisma.patient.findUnique({
            where: { id: args.patientId },
            select: { currentMedications: true, allergies: true, firstName: true },
          });
        }

        const currentMeds = patient?.currentMedications || [];
        const drugName = args.drugName || '';

        const hasAllergy = (patient?.allergies || []).some(
          (a) => a.toLowerCase().includes(drugName.toLowerCase())
        );

        return {
          drugName,
          patientName: patient?.firstName || null,
          currentMedications: currentMeds,
          potentialConflict: hasAllergy || currentMeds.some(
            (m) => m.toLowerCase().includes(drugName.toLowerCase())
          ),
          safe: !hasAllergy,
          recommendation: hasAllergy
            ? 'Patient has a documented allergy — do not prescribe without physician review.'
            : 'Review full medication list with a licensed prescriber before dispensing.',
        };
      }

      case 'search_medical_knowledge': {
        try {
          const results = await vectorlessRagClient.search(args.query, 5);
          return {
            results: results.map((r) => ({
              text: r.content,
              title: r.title,
              sourceType: r.sourceType,
              score: r.score,
            })),
            retrievalMethod: 'postgresql_fts',
          };
        } catch (error: any) {
          return { results: [], error: error.message };
        }
      }

      default:
        return { executed: false, message: `Unknown function: ${name}` };
    }
  }

  private static async scheduleAppointment(
    args: Record<string, any>,
    userId: string,
    ipAddress: string
  ): Promise<any> {
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
      const doctor = await prisma.user.findFirst({
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
      const appointment = await AppointmentService.createAppointment(
        {
          patientId,
          doctorId,
          appointmentDate: preferredDate,
          startTime: preferredTime,
          duration: 15,
          type: AppointmentType.IN_PERSON,
          reason: args.reason || 'Scheduled via AI chatbot',
          isFollowUp: false,
        },
        userId,
        ipAddress,
        'HospynAI-Chatbot/1.0'
      );

      return {
        success: true,
        appointmentId: appointment.appointmentId,
        date: preferredDate,
        time: preferredTime,
        message: 'Appointment scheduled successfully',
      };
    } catch (error: any) {
      logger.warn('Chatbot appointment scheduling failed:', error.message);
      return { success: false, message: error.message };
    }
  }

  private static generateSuggestedActions(
    intent: string,
    patientId?: string | null
  ): SuggestedAction[] {
    const actions: SuggestedAction[] = [];

    switch (intent) {
      case 'BOOK_APPOINTMENT':
        actions.push(
          { action: 'book_appointment', label: 'Book Appointment', description: 'Schedule a visit', icon: 'calendar' },
          { action: 'view_doctors', label: 'View Doctors', description: 'See available doctors', icon: 'stethoscope' }
        );
        break;
      case 'CHECK_SYMPTOMS':
        actions.push(
          { action: 'start_triage', label: 'Start Triage', description: 'Symptom assessment', icon: 'clipboard' },
          { action: 'emergency', label: 'Emergency', description: 'Call emergency services', icon: 'alert', color: '#DC2626' }
        );
        break;
      case 'PRESCRIPTION_QUERY':
        actions.push(
          { action: 'view_prescriptions', label: 'My Prescriptions', description: 'View medications', icon: 'pill' },
          { action: 'refill_request', label: 'Request Refill', description: 'Refill a prescription', icon: 'refresh' }
        );
        break;
      default:
        actions.push(
          { action: 'book_appointment', label: 'Book Appointment', description: 'Schedule a visit' },
          { action: 'check_symptoms', label: 'Check Symptoms', description: 'Symptom analysis' }
        );
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
