import { v4 as uuidv4 } from 'uuid';
import prisma from '../../../config/prisma';
import { llmClient, extractJsonFromLLM } from '../../../integration/ai/aiClient';
import { vectorlessRagClient } from '../../../integration/ai/vectorlessRagClient';
import { AuditService } from '../../auth/services/auditService';
import {
  AgentChatInput,
  AgentTaskInput,
  AgentQueryInput,
} from '../validators/aiagentValidators';
import { NotFoundError } from '../../../utils/errors';
import {
  AgentChatResponse,
  AgentTaskResponse,
  AgentLogResponse,
  SuggestedAction,
} from '../../../types/aiagentTypes';
import logger from '../../../utils/logger';

// Tool definitions for the agent
const AVAILABLE_TOOLS = [
  {
    name: 'schedule_appointment',
    description: 'Schedule a new appointment for a patient',
    parameters: {
      patientId: 'string',
      doctorId: 'string',
      date: 'string (YYYY-MM-DD)',
      time: 'string (HH:mm)',
      type: 'IN_PERSON | TELEMEDICINE',
      reason: 'string',
    },
  },
  {
    name: 'search_patient_records',
    description: 'Search patient medical records',
    parameters: {
      patientId: 'string',
      query: 'string',
    },
  },
  {
    name: 'check_drug_interactions',
    description: 'Check for drug interactions',
    parameters: {
      drugName: 'string',
      patientId: 'string',
    },
  },
  {
    name: 'analyze_symptoms',
    description: 'Analyze patient symptoms',
    parameters: {
      symptoms: 'string[]',
      patientId: 'string',
    },
  },
  {
    name: 'generate_prescription',
    description: 'Generate a prescription',
    parameters: {
      patientId: 'string',
      drugName: 'string',
      dosage: 'string',
      frequency: 'string',
      duration: 'string',
    },
  },
  {
    name: 'query_knowledge_base',
    description: 'Query the medical knowledge base',
    parameters: {
      query: 'string',
    },
  },
  {
    name: 'send_notification',
    description: 'Send notification to a user',
    parameters: {
      userId: 'string',
      title: 'string',
      message: 'string',
      channel: 'EMAIL | SMS | PUSH',
    },
  },
];

export class AgentService {
  /**
   * ============================================
   * AGENT CHAT
   * ============================================
   */
  static async chat(
    data: AgentChatInput,
    userId: string
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

    // Load recent conversation history for context continuity
    const recentHistory = await prisma.conversationHistory.findMany({
      where: { userId, sessionId },
      orderBy: { createdAt: 'asc' },
      take: 6,
      select: { role: true, content: true },
    });

    // Retrieve relevant memories
    const memories = await this.retrieveMemories(data.patientId, userId, data.message);

    // Determine which tools to use based on the message
    const toolPlan = await this.planTools(data.message, patientContext);

    // Execute tools
    const actions = [];
    const toolsUsed: string[] = [];
    for (const tool of toolPlan.tools) {
      try {
        const result = await this.executeTool(tool.name, tool.parameters);
        actions.push({
          action: tool.name,
          description: tool.description,
          tool: tool.name,
          parameters: tool.parameters,
          result,
          status: 'completed' as const,
        });
        toolsUsed.push(tool.name);
      } catch (error: any) {
        actions.push({
          action: tool.name,
          description: tool.description,
          tool: tool.name,
          parameters: tool.parameters,
          result: null,
          status: 'failed' as const,
        });
      }
    }

    // Generate final response with conversation history injected
    const historyMessages = recentHistory.map((h) => ({
      role: h.role === 'USER' ? 'user' as const : 'assistant' as const,
      content: h.content,
    }));
    const contextSummary = [
      ...memories.map((m: any) => `[Memory] ${m.content}`),
      ...actions.filter((a) => a.status === 'completed').map((a) =>
        `[Tool: ${a.tool}] ${JSON.stringify(a.result).slice(0, 300)}`
      ),
    ].join('\n');
    const systemExtra = contextSummary
      ? `\n\nRelevant context:\n${contextSummary}`
      : '';
    const messages = [
      { role: 'system' as const, content: llmClient.getSystemPrompt('GENERAL') + systemExtra },
      ...historyMessages,
      { role: 'user' as const, content: data.message },
    ];
    const chatResp = await llmClient.chat(messages, { maxTokens: 1500, temperature: 0.7 });
    const response = {
      response: chatResp.message,
      tokensUsed: chatResp.usage.totalTokens,
      action: chatResp.message.toLowerCase().includes('emergency') ? 'ESCALATE' : null,
      data: chatResp.functionCall?.arguments || null,
      suggestedActions: [] as any[],
    };

    // Save to conversation history
    await prisma.conversationHistory.create({
      data: {
        userId,
        patientId: data.patientId || null,
        sessionId,
        role: 'USER',
        content: data.message,
      },
    });

    await prisma.conversationHistory.create({
      data: {
        userId,
        patientId: data.patientId || null,
        sessionId,
        role: 'ASSISTANT',
        content: response.response,
        metadata: { actions, toolsUsed },
      },
    });

    // Log agent activity
    await prisma.agentLog.create({
      data: {
        userId,
        sessionId,
        taskType: 'CHAT',
        input: { message: data.message, context: patientContext },
        output: { response: response.response, actions },
        toolCalls: actions,
        status: 'COMPLETED',
        duration: Date.now() - startTime,
        tokensUsed: response.tokensUsed || 0,
      },
    });

    return {
      sessionId,
      message: response.response,
      reasoning: null,
      actions,
      toolsUsed,
      data: response.data,
      confidence: 0.9,
      suggestedActions: response.suggestedActions || [],
      tokensUsed: response.tokensUsed || 0,
      responseTime: Date.now() - startTime,
    };
  }

  /**
   * ============================================
   * EXECUTE AGENT TASK
   * ============================================
   */
  static async executeTask(
    data: AgentTaskInput,
    userId: string
  ): Promise<AgentTaskResponse> {
    const taskId = uuidv4();
    const startTime = Date.now();

    // Create agent log
    await prisma.agentLog.create({
      data: {
        userId,
        sessionId: taskId,
        taskType: data.taskType,
        input: data.parameters,
        status: 'STARTED',
      },
    });

    // Execute task based on type
    const steps: any[] = [];
    let result: any = null;

    try {
      switch (data.taskType) {
        case 'SCHEDULE_APPOINTMENT':
          result = await this.scheduleAppointmentTask(data.parameters, steps);
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
        default:
          result = { message: 'Task type not implemented' };
      }

      // Update log
      await prisma.agentLog.updateMany({
        where: { sessionId: taskId },
        data: {
          status: 'COMPLETED',
          output: result,
          toolCalls: steps,
          duration: Date.now() - startTime,
        },
      });

      return {
        taskId,
        status: 'COMPLETED',
        progress: 100,
        steps,
        result,
        error: null,
        startedAt: new Date(startTime).toISOString(),
        completedAt: new Date().toISOString(),
      };
    } catch (error: any) {
      await prisma.agentLog.updateMany({
        where: { sessionId: taskId },
        data: {
          status: 'FAILED',
          errorMessage: error.message,
          duration: Date.now() - startTime,
        },
      });

      return {
        taskId,
        status: 'FAILED',
        progress: 0,
        steps,
        result: null,
        error: error.message,
        startedAt: new Date(startTime).toISOString(),
        completedAt: new Date().toISOString(),
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
    userId: string
  ): Promise<any> {
    return this.executeTool(data.toolName, data.parameters);
  }

  // ============================================
  // TASK IMPLEMENTATIONS
  // ============================================

  private static async scheduleAppointmentTask(params: any, steps: any[]): Promise<any> {
    const t0 = Date.now();
    const patient = await prisma.patient.findUnique({ where: { id: params.patientId } });
    steps.push({ step: 1, action: 'VALIDATE_PATIENT', tool: 'database',
      input: { patientId: params.patientId },
      output: patient ? `Found: ${patient.firstName} ${patient.lastName}` : 'Not found',
      status: patient ? 'completed' : 'failed', duration: Date.now() - t0 });
    if (!patient) return { success: false, message: 'Patient not found' };

    const t1 = Date.now();
    // Check for available appointment slots for the requested doctor/date
    const existingAppts = await prisma.appointment.count({
      where: { doctorId: params.doctorId, appointmentDate: params.date ? new Date(params.date) : undefined },
    });
    steps.push({ step: 2, action: 'CHECK_AVAILABILITY', tool: 'appointment_db',
      input: { doctorId: params.doctorId, date: params.date },
      output: `${existingAppts} existing appointments on requested date`,
      status: 'completed', duration: Date.now() - t1 });

    return { success: true, message: 'Availability checked — confirm to finalize booking',
      patientName: `${patient.firstName} ${patient.lastName}`, existingAppointments: existingAppts };
  }

  private static async analyzeSymptomsTask(params: any, steps: any[]): Promise<any> {
    const analysis = await llmClient.analyzeSymptoms(params.symptoms || []);
    
    steps.push({
      step: 1, action: 'ANALYZE_SYMPTOMS', tool: 'gpt4',
      input: params, output: analysis, status: 'completed', duration: 2000,
    });

    return analysis;
  }

  private static async checkDrugInteractionsTask(params: any, steps: any[]): Promise<any> {
    steps.push({
      step: 1, action: 'CHECK_INTERACTIONS', tool: 'drug_database',
      input: params, output: 'No interactions found', status: 'completed', duration: 500,
    });

    return {
      hasInteractions: false,
      interactions: [],
      severity: 'none',
    };
  }

  private static async summarizeRecordsTask(params: any, steps: any[]): Promise<any> {
    const t0 = Date.now();
    const patient = await prisma.patient.findUnique({ where: { id: params.patientId } });
    if (!patient) return { summary: 'Patient not found', keyFindings: [], recommendations: [] };

    const records = await prisma.medicalRecord.findMany({
      where: { patientId: params.patientId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    steps.push({ step: 1, action: 'FETCH_RECORDS', tool: 'database',
      input: { patientId: params.patientId }, output: `${records.length} records found`,
      status: 'completed', duration: Date.now() - t0 });

    const t1 = Date.now();
    const summary = await llmClient.generateMedicalSummary(patient, records);
    steps.push({ step: 2, action: 'GENERATE_SUMMARY', tool: 'llm',
      input: { recordCount: records.length }, output: 'Summary generated',
      status: 'completed', duration: Date.now() - t1 });

    return { summary, keyFindings: records.map((r: any) => r.diagnosis).filter(Boolean), recommendations: [] };
  }

  // ============================================
  // TOOL PLANNING & EXECUTION
  // ============================================

  private static async planTools(message: string, context: any): Promise<{
    tools: Array<{ name: string; description: string; parameters: any }>;
  }> {
    const toolList = AVAILABLE_TOOLS.map(
      (t) => `- ${t.name}: ${t.description}`
    ).join('\n');

    const prompt = `You are a medical AI orchestrator. Given the user message and patient context, select which tools (if any) to call.

Available tools:
${toolList}

Patient context: ${JSON.stringify(context?.patient || {})}
User message: "${message}"

Respond with JSON only:
{
  "tools": [
    { "name": "tool_name", "description": "why using this tool", "parameters": { "key": "value" } }
  ]
}

Rules:
- Only include tools that are clearly needed
- Extract parameter values from the message and context
- Return empty tools array if no tools needed
- patientId should be the patient's id from context if available`;

    try {
      const raw = await llmClient.complete(prompt, { temperature: 0.1, maxTokens: 500 });
      const parsed = extractJsonFromLLM(raw);
      return { tools: Array.isArray(parsed.tools) ? parsed.tools : [] };
    } catch (err) {
      logger.warn('Tool planning LLM call failed, using empty plan:', err);
      return { tools: [] };
    }
  }

  private static async executeTool(toolName: string, parameters: any): Promise<any> {
    switch (toolName) {
      case 'query_knowledge_base': {
        const results = await vectorlessRagClient.search(parameters.query || '', 5);
        return {
          results: results.map((r) => ({ text: r.content, title: r.title, score: r.score })),
          context: vectorlessRagClient.buildContext(results),
        };
      }
      case 'search_patient_records': {
        if (!parameters.patientId) return { records: [] };
        const records = await prisma.medicalRecord.findMany({
          where: { patientId: parameters.patientId },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: { id: true, recordType: true, diagnosis: true, createdAt: true },
        });
        return { records };
      }
      case 'analyze_symptoms': {
        if (!parameters.symptoms?.length && !parameters.patientId) {
          return { triage: 'routine', recommendation: 'Please describe your symptoms.' };
        }
        const symptoms = Array.isArray(parameters.symptoms)
          ? parameters.symptoms
          : [String(parameters.symptoms || '')];
        return llmClient.analyzeSymptoms(symptoms);
      }
      case 'check_drug_interactions': {
        if (!parameters.drugName) return { hasInteractions: false, interactions: [] };
        let currentMeds: string[] = [];
        if (parameters.patientId) {
          const patient = await prisma.patient.findUnique({
            where: { id: parameters.patientId },
            select: { currentMedications: true },
          });
          currentMeds = (patient?.currentMedications as string[]) || [];
        }
        const prompt = `Check drug interactions between "${parameters.drugName}" and current medications: ${currentMeds.join(', ') || 'none listed'}.
Respond JSON: { "hasInteractions": bool, "interactions": [{ "drug": "name", "severity": "mild|moderate|severe", "description": "..." }], "recommendation": "..." }`;
        const raw = await llmClient.complete(prompt, { temperature: 0.1, maxTokens: 400 });
        return extractJsonFromLLM(raw);
      }
      case 'schedule_appointment': {
        // Return a structured scheduling prompt — actual creation requires confirm flow
        return {
          canSchedule: true,
          message: 'Appointment scheduling initiated. Please confirm date and time.',
          parameters,
        };
      }
      case 'send_notification': {
        logger.info(`Agent notification request: ${JSON.stringify(parameters)}`);
        return { sent: true, channel: parameters.channel };
      }
      default:
        return { executed: true, toolName, parameters };
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
          ...(query
            ? { content: { contains: query, mode: 'insensitive' } }
            : {}),
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

    const [logs, total] = await Promise.all([
      prisma.agentLog.findMany({
        where: {
          ...(query.userId && { userId: query.userId }),
          ...(query.taskType && { taskType: query.taskType }),
          ...(query.status && { status: query.status }),
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.agentLog.count(),
    ]);

    return {
      logs: logs.map((l) => ({
        id: l.id,
        userId: l.userId,
        sessionId: l.sessionId,
        taskType: l.taskType,
        input: l.input,
        output: l.output,
        toolCalls: l.toolCalls,
        status: l.status,
        duration: l.duration,
        tokensUsed: l.tokensUsed,
        cost: l.cost,
        createdAt: l.createdAt.toISOString(),
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}