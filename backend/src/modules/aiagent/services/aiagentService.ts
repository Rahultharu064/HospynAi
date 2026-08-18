import { v4 as uuidv4 } from 'uuid';
import { UserRole } from '@prisma/client';
import prisma from '../../../config/prisma';
import { llmClient, ChatMessage, ChatFunction, extractJsonFromLLM } from '../../../integration/ai/aiClient';
import { vectorlessRagClient } from '../../../integration/ai/vectorlessRagClient';
import { AppointmentService } from '../../appoinment/services/appointmentService';
import { PatientService } from '../../patient/services/patientService';
import { NotificationService } from '../../notifications/services/notificationService';
import { PrescriptionService } from '../../emr/services/prescriptionService';
import {
  AgentChatInput,
  AgentTaskInput,
  AgentQueryInput,
} from '../validators/aiagentValidators';
import {
  AgentChatResponse,
  AgentTaskResponse,
  AgentLogResponse,
  SuggestedAction,
} from '../../../types/aiagentTypes';
import logger from '../../../utils/logger';

// Tool schema handed to the LLM for real function-calling — the model decides which
// tool(s) to invoke and with what arguments based on the conversation, instead of
// keyword-matching the user's message.
const TOOL_SCHEMAS: ChatFunction[] = [
  {
    name: 'schedule_appointment',
    description:
      "Book a medical appointment, or list a doctor's open time slots on a date when no specific time has been chosen yet. Call with just patientId/doctorId/date to see availability first.",
    parameters: {
      type: 'object',
      properties: {
        patientId: { type: 'string', description: 'Patient ID (cuid)' },
        doctorId: { type: 'string', description: 'Doctor ID (cuid)' },
        date: { type: 'string', description: 'Date in YYYY-MM-DD format' },
        time: { type: 'string', description: 'Start time in HH:mm 24-hour format. Omit to only list available slots.' },
        reason: { type: 'string', description: 'Reason for the visit' },
      },
      required: ['patientId', 'doctorId', 'date'],
    },
  },
  {
    name: 'search_patient_records',
    description: "Look up a patient's core medical record: demographics, allergies, chronic conditions, current medications.",
    parameters: {
      type: 'object',
      properties: { patientId: { type: 'string', description: 'Patient ID (cuid)' } },
      required: ['patientId'],
    },
  },
  {
    name: 'check_drug_interactions',
    description:
      "AI-assisted screen for potential interactions between a proposed drug and the patient's current medications. Advisory only — always recommend pharmacist/physician verification before dispensing.",
    parameters: {
      type: 'object',
      properties: {
        drugName: { type: 'string', description: 'Drug being considered' },
        patientId: { type: 'string', description: 'Patient ID (cuid), used to pull current medications for comparison' },
      },
      required: ['drugName', 'patientId'],
    },
  },
  {
    name: 'analyze_symptoms',
    description: 'Analyze reported symptoms and produce a triage recommendation (routine / urgent / emergency) with follow-up questions.',
    parameters: {
      type: 'object',
      properties: {
        symptoms: { type: 'array', items: { type: 'string' }, description: 'List of reported symptoms' },
      },
      required: ['symptoms'],
    },
  },
  {
    name: 'generate_prescription',
    description:
      'Draft a prescription recommendation for physician review. This never dispenses medication on its own — a licensed doctor must confirm it before it becomes an active prescription.',
    parameters: {
      type: 'object',
      properties: {
        patientId: { type: 'string', description: 'Patient ID (cuid)' },
        drugName: { type: 'string' },
        dosage: { type: 'string' },
        frequency: { type: 'string' },
        duration: { type: 'string' },
      },
      required: ['patientId', 'drugName', 'dosage', 'frequency', 'duration'],
    },
  },
  {
    name: 'query_knowledge_base',
    description: 'Search the medical knowledge base (policies, guides, FAQs) for grounded information to cite in the answer.',
    parameters: {
      type: 'object',
      properties: { query: { type: 'string' } },
      required: ['query'],
    },
  },
  {
    name: 'send_notification',
    description: 'Send a notification (email, SMS, or push) to a user — e.g. an appointment confirmation or a reminder.',
    parameters: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: 'Recipient user ID (cuid)' },
        title: { type: 'string' },
        message: { type: 'string' },
        channel: { type: 'string', enum: ['EMAIL', 'SMS', 'PUSH', 'VOICE_CALL'] },
      },
      required: ['userId', 'title', 'message'],
    },
  },
];

const MAX_TOOL_ROUNDS = 3;
const MAX_HISTORY_TURNS = 10;

export class AgentService {
  /**
   * ============================================
   * AGENT CHAT
   * ============================================
   */
  static async chat(
    data: AgentChatInput,
    userId: string,
    userRole?: UserRole
  ): Promise<AgentChatResponse> {
    const startTime = Date.now();
    const sessionId = data.sessionId || uuidv4();

    // Get patient context if available
    let patientContext = data.context || {};
    if (data.patientId) {
      const patient = await prisma.patient.findUnique({
        where: { id: data.patientId },
        select: {
          patientId: true, firstName: true, lastName: true,
          dateOfBirth: true, gender: true, bloodGroup: true,
          allergies: true, chronicConditions: true, currentMedications: true,
        },
      });
      if (patient) {
        patientContext = { ...patientContext, patient };
      }
    }

    // Retrieve relevant memories
    const memories = await this.retrieveMemories(data.patientId, userId, data.message);

    // Load prior turns for this session so the agent has real conversation memory
    const priorTurns = await prisma.conversationHistory.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
      take: MAX_HISTORY_TURNS,
    });
    priorTurns.reverse();

    const systemPrompt = this.buildSystemPrompt(patientContext, memories);
    const messages: ChatMessage[] = [{ role: 'system', content: systemPrompt }];
    for (const turn of priorTurns) {
      messages.push({ role: turn.role === 'ASSISTANT' ? 'assistant' : 'user', content: turn.content });
    }
    messages.push({ role: 'user', content: data.message });

    const { finalMessage, actions, toolsUsed, tokensUsed, lastToolResult } = await this.runToolLoop(
      messages,
      userId,
      userRole
    );

    const suggestedActions = this.buildSuggestedActions(toolsUsed, lastToolResult);

    // Save to conversation history
    await prisma.conversationHistory.create({
      data: { userId, patientId: data.patientId || null, sessionId, role: 'USER', content: data.message },
    });

    await prisma.conversationHistory.create({
      data: {
        userId, patientId: data.patientId || null, sessionId, role: 'ASSISTANT',
        content: finalMessage, metadata: { actions, toolsUsed },
      },
    });

    // Log agent activity
    await prisma.agentLog.create({
      data: {
        userId, sessionId, taskType: 'CHAT',
        input: { message: data.message, context: patientContext },
        output: { response: finalMessage, actions },
        toolCalls: actions, status: 'COMPLETED',
        duration: Date.now() - startTime, tokensUsed,
      },
    });

    return {
      sessionId,
      message: finalMessage,
      reasoning: null,
      actions,
      toolsUsed,
      data: lastToolResult,
      confidence: 0.9,
      suggestedActions,
      tokensUsed,
      responseTime: Date.now() - startTime,
    };
  }

  private static buildSystemPrompt(context: Record<string, any>, memories: any[]): string {
    const base = llmClient.getSystemPrompt('GENERAL');
    const parts = [base];

    if (context.patient) {
      parts.push(
        `Current patient context: ${context.patient.firstName} ${context.patient.lastName}, ` +
        `allergies: ${(context.patient.allergies || []).join(', ') || 'none recorded'}, ` +
        `chronic conditions: ${(context.patient.chronicConditions || []).join(', ') || 'none recorded'}, ` +
        `current medications: ${(context.patient.currentMedications || []).join(', ') || 'none recorded'}.`
      );
    }

    if (memories.length > 0) {
      parts.push(`Relevant prior context:\n${memories.map((m) => `- ${m.content}`).join('\n')}`);
    }

    parts.push(
      'You have access to tools for scheduling appointments, looking up patient records, ' +
      'checking drug interactions, analyzing symptoms, drafting prescriptions, searching the knowledge base, ' +
      'and sending notifications. Use them when the user asks for something actionable rather than just describing what you would do.'
    );

    return parts.join('\n\n');
  }

  /**
   * Runs the OpenAI/Groq-style tool-calling loop: ask the model, execute any requested
   * tool, feed the result back, and repeat until the model returns a final answer or the
   * round cap is hit.
   */
  private static async runToolLoop(
    messages: ChatMessage[],
    userId: string,
    userRole?: UserRole
  ): Promise<{
    finalMessage: string;
    actions: any[];
    toolsUsed: string[];
    tokensUsed: number;
    lastToolResult: any;
  }> {
    const actions: any[] = [];
    const toolsUsed: string[] = [];
    let tokensUsed = 0;
    let lastToolResult: any = null;
    const working = [...messages];

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const response = await llmClient.chat(working, { functions: TOOL_SCHEMAS, maxTokens: 1200, temperature: 0.5 });
      tokensUsed += response.usage.totalTokens;

      if (!response.functionCall) {
        return { finalMessage: response.message, actions, toolsUsed, tokensUsed, lastToolResult };
      }

      const { name, arguments: args } = response.functionCall;
      let result: any;
      let status: 'completed' | 'failed' = 'completed';
      try {
        result = await this.executeTool(name, args, userId, userRole);
        lastToolResult = result;
      } catch (error: any) {
        result = { error: error.message || 'Tool execution failed' };
        status = 'failed';
      }

      toolsUsed.push(name);
      actions.push({
        action: name, description: TOOL_SCHEMAS.find((t) => t.name === name)?.description || name,
        tool: name, parameters: args, result, status,
      });

      working.push({ role: 'assistant', content: response.message || null, tool_calls: [{
        id: response.functionCall.id, type: 'function',
        function: { name, arguments: JSON.stringify(args) },
      }] });
      working.push({
        role: 'tool', content: JSON.stringify(result).slice(0, 4000),
        tool_call_id: response.functionCall.id,
      });
    }

    // Round cap hit — ask once more for a final summary without tool access.
    const wrapUp = await llmClient.chat(working, { maxTokens: 600, temperature: 0.5 });
    tokensUsed += wrapUp.usage.totalTokens;
    return { finalMessage: wrapUp.message, actions, toolsUsed, tokensUsed, lastToolResult };
  }

  private static buildSuggestedActions(toolsUsed: string[], lastToolResult: any): SuggestedAction[] {
    const suggestions: SuggestedAction[] = [];
    if (toolsUsed.includes('schedule_appointment') && lastToolResult?.slots) {
      suggestions.push({
        action: 'CONFIRM_APPOINTMENT', label: 'Pick a time slot',
        description: 'Choose one of the available slots to confirm the booking.',
      });
    }
    if (toolsUsed.includes('generate_prescription') && lastToolResult?.requiresPhysicianApproval) {
      suggestions.push({
        action: 'REVIEW_PRESCRIPTION', label: 'Review draft prescription',
        description: 'A licensed doctor must review and confirm this draft before it becomes active.',
      });
    }
    return suggestions;
  }

  /**
   * ============================================
   * EXECUTE AGENT TASK
   * ============================================
   */
  static async executeTask(
    data: AgentTaskInput,
    userId: string,
    userRole?: UserRole
  ): Promise<AgentTaskResponse> {
    const taskId = uuidv4();
    const startTime = Date.now();

    // Create agent log
    await prisma.agentLog.create({
      data: { userId, sessionId: taskId, taskType: data.taskType, input: data.parameters, status: 'STARTED' },
    });

    const steps: any[] = [];
    let result: any = null;

    try {
      switch (data.taskType) {
        case 'SCHEDULE_APPOINTMENT':
          result = await this.scheduleAppointmentTask(data.parameters, userId, steps);
          break;
        case 'ANALYZE_SYMPTOMS':
          result = await this.analyzeSymptomsTask(data.parameters, steps);
          break;
        case 'CHECK_DRUG_INTERACTIONS':
          result = await this.checkDrugInteractionsTask(data.parameters, steps);
          break;
        case 'SUMMARIZE_RECORDS':
          result = await this.summarizeRecordsTask(data.parameters, steps);
          break;
        case 'CREATE_PRESCRIPTION':
          result = await this.executeTool('generate_prescription', data.parameters, userId, userRole);
          steps.push({ step: 1, action: 'DRAFT_PRESCRIPTION', tool: 'prescription_service', input: data.parameters, output: result, status: 'completed', duration: 0 });
          break;
        case 'SEND_NOTIFICATION':
          result = await this.executeTool('send_notification', data.parameters, userId, userRole);
          steps.push({ step: 1, action: 'SEND_NOTIFICATION', tool: 'notification_service', input: data.parameters, output: result, status: 'completed', duration: 0 });
          break;
        default:
          result = { message: `Task type ${data.taskType} is not yet automated — route to a human.` };
      }

      await prisma.agentLog.updateMany({
        where: { sessionId: taskId },
        data: { status: 'COMPLETED', output: result, toolCalls: steps, duration: Date.now() - startTime },
      });

      return {
        taskId, status: 'COMPLETED', progress: 100, steps, result, error: null,
        startedAt: new Date(startTime).toISOString(), completedAt: new Date().toISOString(),
      };
    } catch (error: any) {
      await prisma.agentLog.updateMany({
        where: { sessionId: taskId },
        data: { status: 'FAILED', errorMessage: error.message, duration: Date.now() - startTime },
      });

      return {
        taskId, status: 'FAILED', progress: 0, steps, result: null, error: error.message,
        startedAt: new Date(startTime).toISOString(), completedAt: new Date().toISOString(),
      };
    }
  }

  /**
   * ============================================
   * TOOL EXECUTION
   * ============================================
   */
  static async executeToolCall(
    data: { toolName: string; parameters: Record<string, any> },
    userId: string,
    userRole?: UserRole
  ): Promise<any> {
    return this.executeTool(data.toolName, data.parameters, userId, userRole);
  }

  // ============================================
  // TASK IMPLEMENTATIONS (delegate to the same real tool executors as chat)
  // ============================================

  private static async scheduleAppointmentTask(params: any, userId: string, steps: any[]): Promise<any> {
    const result = await this.executeTool('schedule_appointment', params, userId);
    steps.push({
      step: 1, action: params.time ? 'BOOK_APPOINTMENT' : 'CHECK_AVAILABILITY', tool: 'appointment_service',
      input: params, output: result, status: 'completed', duration: 0,
    });
    return result;
  }

  private static async analyzeSymptomsTask(params: any, steps: any[]): Promise<any> {
    const analysis = await llmClient.analyzeSymptoms(params.symptoms || []);
    steps.push({ step: 1, action: 'ANALYZE_SYMPTOMS', tool: 'llm', input: params, output: analysis, status: 'completed', duration: 0 });
    return analysis;
  }

  private static async checkDrugInteractionsTask(params: any, steps: any[]): Promise<any> {
    const result = await this.executeTool('check_drug_interactions', params, '');
    steps.push({ step: 1, action: 'CHECK_INTERACTIONS', tool: 'llm', input: params, output: result, status: 'completed', duration: 0 });
    return result;
  }

  private static async summarizeRecordsTask(params: any, steps: any[]): Promise<any> {
    if (!params.patientId) {
      return { summary: 'No patient specified.', keyFindings: [], recommendations: [] };
    }

    const [patient, records, prescriptions] = await Promise.all([
      prisma.patient.findUnique({ where: { id: params.patientId } }),
      prisma.medicalRecord.findMany({ where: { patientId: params.patientId }, orderBy: { createdAt: 'desc' }, take: 10 }),
      prisma.prescription.findMany({ where: { patientId: params.patientId, status: 'ACTIVE' } }),
    ]);
    steps.push({ step: 1, action: 'FETCH_RECORDS', tool: 'database', input: params, output: `${records.length} records found`, status: 'completed', duration: 0 });

    if (!patient) return { summary: 'Patient not found.', keyFindings: [], recommendations: [] };

    const summary = await llmClient.generateMedicalSummary(patient, records);
    steps.push({ step: 2, action: 'SUMMARIZE', tool: 'llm', input: { recordCount: records.length }, output: 'Summary generated', status: 'completed', duration: 0 });

    return {
      summary,
      keyFindings: [
        patient.chronicConditions?.length ? `Chronic conditions: ${patient.chronicConditions.join(', ')}` : null,
        patient.allergies?.length ? `Allergies: ${patient.allergies.join(', ')}` : null,
      ].filter(Boolean),
      recommendations: prescriptions.length > 0
        ? [`Review ${prescriptions.length} active prescription(s) for renewal or interaction risk.`]
        : [],
    };
  }

  // ============================================
  // REAL TOOL EXECUTORS
  // ============================================

  private static async executeTool(
    toolName: string,
    parameters: Record<string, any>,
    userId: string,
    userRole?: UserRole
  ): Promise<any> {
    switch (toolName) {
      case 'query_knowledge_base': {
        const results = await vectorlessRagClient.search(parameters.query || '', 5);
        return {
          results: results.map((r) => ({ text: r.content, title: r.title, score: r.score })),
          context: vectorlessRagClient.buildContext(results),
        };
      }

      case 'search_patient_records': {
        if (!parameters.patientId) return { error: 'patientId is required' };
        try {
          const [patient, recentRecords] = await Promise.all([
            PatientService.getPatientById(parameters.patientId),
            prisma.medicalRecord.findMany({
              where: { patientId: parameters.patientId },
              orderBy: { createdAt: 'desc' },
              take: 5,
              select: { id: true, status: true, chiefComplaint: true, diagnosis: true, createdAt: true },
            }),
          ]);
          return { patient, recentRecords };
        } catch {
          return { error: 'Patient not found' };
        }
      }

      case 'analyze_symptoms': {
        const symptoms: string[] = Array.isArray(parameters.symptoms) ? parameters.symptoms : [];
        if (symptoms.length === 0) return { error: 'At least one symptom is required' };
        return llmClient.analyzeSymptoms(symptoms);
      }

      case 'check_drug_interactions': {
        if (!parameters.drugName) return { error: 'drugName is required' };

        let currentMedications: string[] = [];
        if (parameters.patientId) {
          const patient = await prisma.patient.findUnique({
            where: { id: parameters.patientId },
            select: { currentMedications: true },
          });
          currentMedications = patient?.currentMedications || [];
        }

        if (currentMedications.length === 0) {
          return {
            hasInteractions: false,
            interactions: [],
            disclaimer: 'No current medications on file to compare against. This is not a substitute for pharmacist review.',
          };
        }

        const prompt = `A clinician is considering prescribing "${parameters.drugName}" for a patient currently taking: ${currentMedications.join(', ')}.
List any clinically significant interactions.

Respond with JSON only:
{
  "hasInteractions": true,
  "interactions": [{ "withDrug": "string", "severity": "minor | moderate | major", "description": "string" }],
  "disclaimer": "AI-assisted screen — verify with a pharmacist or drug interaction database before prescribing."
}`;

        try {
          const response = await llmClient.complete(prompt, { temperature: 0.1, maxTokens: 500, systemPrompt: llmClient.getSystemPrompt('DOCTOR') });
          return extractJsonFromLLM(response);
        } catch (error) {
          logger.warn('Drug interaction check failed:', error);
          return {
            hasInteractions: null,
            interactions: [],
            disclaimer: 'Automated check unavailable — verify manually with a pharmacist before prescribing.',
          };
        }
      }

      case 'schedule_appointment': {
        const { patientId, doctorId, date, time, reason } = parameters;
        if (!patientId || !doctorId || !date) {
          return { error: 'patientId, doctorId, and date are required' };
        }

        if (!time) {
          const availability = await AppointmentService.getAvailableSlots(doctorId, date);
          return { slots: availability.slots.filter((s) => s.isAvailable), date };
        }

        if (!userId) return { error: 'A user context is required to book an appointment' };

        try {
          const appointment = await AppointmentService.createAppointment(
            { patientId, doctorId, appointmentDate: date, startTime: time, reason: reason || null } as any,
            userId,
            '', 'ai-agent'
          );
          return { booked: true, appointment };
        } catch (error: any) {
          return { booked: false, error: error.message };
        }
      }

      case 'generate_prescription': {
        const { patientId, drugName, dosage, frequency, duration, medicalRecordId } = parameters;
        if (!patientId || !drugName || !dosage || !frequency || !duration) {
          return { error: 'patientId, drugName, dosage, frequency, and duration are required' };
        }

        const draft = {
          patientId, drugName, dosage, frequency, duration,
          requiresPhysicianApproval: true,
          note: 'This is an AI-generated draft. A licensed doctor must review and confirm it before it becomes an active prescription.',
        };

        // Only actually persist the prescription when a doctor is driving the agent
        // and has supplied the medical record this prescription attaches to.
        if (userRole === UserRole.DOCTOR && medicalRecordId && userId) {
          try {
            const prescription = await PrescriptionService.createPrescription(
              { medicalRecordId, patientId, drugName, dosage, frequency, duration } as any,
              userId, '', 'ai-agent'
            );
            return { created: true, prescription };
          } catch (error: any) {
            return { created: false, error: error.message, draft };
          }
        }

        return { created: false, draft };
      }

      case 'send_notification': {
        const { userId: targetUserId, title, message, channel } = parameters;
        if (!targetUserId || !title || !message) {
          return { error: 'userId, title, and message are required' };
        }
        try {
          const notification = await NotificationService.createNotification(
            { userId: targetUserId, title, message, type: 'AGENT_MESSAGE', channel: channel || 'EMAIL' } as any,
            userId || targetUserId
          );
          return { sent: true, notification };
        } catch (error: any) {
          return { sent: false, error: error.message };
        }
      }

      default:
        return { error: `Unknown tool: ${toolName}` };
    }
  }

  private static async retrieveMemories(
    patientId?: string | null,
    userId?: string | null,
    query?: string
  ): Promise<any[]> {
    if (!patientId && !userId) return [];

    try {
      const memories = await prisma.aiMemory.findMany({
        where: {
          ...(patientId ? { patientId } : {}),
          ...(userId ? { userId } : {}),
          ...(query ? { content: { contains: query, mode: 'insensitive' } } : {}),
        },
        orderBy: { relevanceScore: 'desc' },
        take: 5,
        select: { content: true, memoryType: true, relevanceScore: true },
      });
      return memories;
    } catch (error) {
      return [];
    }
  }

  static async getAgentHistory(query: AgentQueryInput): Promise<{ logs: AgentLogResponse[]; pagination: any }> {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where = {
      ...(query.userId && { userId: query.userId }),
      ...(query.taskType && { taskType: query.taskType }),
      ...(query.status && { status: query.status }),
    };

    const [logs, total] = await Promise.all([
      prisma.agentLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      prisma.agentLog.count({ where }),
    ]);

    return {
      logs: logs.map((l) => ({
        id: l.id, userId: l.userId, sessionId: l.sessionId, taskType: l.taskType,
        input: l.input, output: l.output, toolCalls: l.toolCalls, status: l.status,
        duration: l.duration, tokensUsed: l.tokensUsed, cost: l.cost, createdAt: l.createdAt.toISOString(),
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}
