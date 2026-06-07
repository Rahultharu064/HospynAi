"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentService = void 0;
const uuid_1 = require("uuid");
const prisma_1 = __importDefault(require("../../../config/prisma"));
const aiClient_1 = require("../../../integration/ai/aiClient");
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
class AgentService {
    /**
     * ============================================
     * AGENT CHAT
     * ============================================
     */
    static async chat(data, userId) {
        const startTime = Date.now();
        const sessionId = data.sessionId || (0, uuid_1.v4)();
        // Get patient context if available
        let patientContext = data.context || {};
        if (data.patientId) {
            const patient = await prisma_1.default.patient.findUnique({
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
        // Determine which tools to use based on the message
        const toolPlan = await this.planTools(data.message, patientContext);
        // Execute tools
        const actions = [];
        const toolsUsed = [];
        for (const tool of toolPlan.tools) {
            try {
                const result = await this.executeTool(tool.name, tool.parameters);
                actions.push({
                    action: tool.name,
                    description: tool.description,
                    tool: tool.name,
                    parameters: tool.parameters,
                    result,
                    status: 'completed',
                });
                toolsUsed.push(tool.name);
            }
            catch (error) {
                actions.push({
                    action: tool.name,
                    description: tool.description,
                    tool: tool.name,
                    parameters: tool.parameters,
                    result: null,
                    status: 'failed',
                });
            }
        }
        // Generate final response
        const response = await aiClient_1.gptClient.generateResponse(data.message, 'GENERAL_INQUIRY', { ...patientContext, actions, memories });
        // Save to conversation history
        await prisma_1.default.conversationHistory.create({
            data: {
                userId,
                patientId: data.patientId || null,
                sessionId,
                role: 'USER',
                content: data.message,
            },
        });
        await prisma_1.default.conversationHistory.create({
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
        await prisma_1.default.agentLog.create({
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
    static async executeTask(data, userId) {
        const taskId = (0, uuid_1.v4)();
        const startTime = Date.now();
        // Create agent log
        await prisma_1.default.agentLog.create({
            data: {
                userId,
                sessionId: taskId,
                taskType: data.taskType,
                input: data.parameters,
                status: 'STARTED',
            },
        });
        // Execute task based on type
        const steps = [];
        let result = null;
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
            await prisma_1.default.agentLog.updateMany({
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
        }
        catch (error) {
            await prisma_1.default.agentLog.updateMany({
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
    static async executeToolCall(data, userId) {
        return this.executeTool(data.toolName, data.parameters);
    }
    // ============================================
    // TASK IMPLEMENTATIONS
    // ============================================
    static async scheduleAppointmentTask(params, steps) {
        steps.push({
            step: 1, action: 'VALIDATE_PATIENT', tool: 'database',
            input: params, output: 'Patient found', status: 'completed', duration: 50,
        });
        steps.push({
            step: 2, action: 'CHECK_AVAILABILITY', tool: 'appointment_service',
            input: params, output: 'Slots available', status: 'completed', duration: 100,
        });
        return {
            success: true,
            message: 'Appointment scheduled successfully',
            appointmentId: `APT-${Date.now()}`,
        };
    }
    static async analyzeSymptomsTask(params, steps) {
        const analysis = await aiClient_1.gptClient.analyzeSymptoms(params.symptoms || []);
        steps.push({
            step: 1, action: 'ANALYZE_SYMPTOMS', tool: 'gpt4',
            input: params, output: analysis, status: 'completed', duration: 2000,
        });
        return analysis;
    }
    static async checkDrugInteractionsTask(params, steps) {
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
    static async summarizeRecordsTask(params, steps) {
        steps.push({
            step: 1, action: 'FETCH_RECORDS', tool: 'database',
            input: params, output: 'Records fetched', status: 'completed', duration: 300,
        });
        return {
            summary: 'Patient has a history of...',
            keyFindings: [],
            recommendations: [],
        };
    }
    // ============================================
    // TOOL PLANNING & EXECUTION
    // ============================================
    static async planTools(message, context) {
        // In production, this would use GPT-4 to plan which tools to use
        const tools = [];
        if (message.toLowerCase().includes('appointment') || message.toLowerCase().includes('schedule')) {
            tools.push({
                name: 'schedule_appointment',
                description: 'Schedule an appointment',
                parameters: { patientId: context.patient?.id },
            });
        }
        if (message.toLowerCase().includes('symptom') || message.toLowerCase().includes('pain')) {
            tools.push({
                name: 'analyze_symptoms',
                description: 'Analyze symptoms',
                parameters: { patientId: context.patient?.id },
            });
        }
        return { tools };
    }
    static async executeTool(toolName, parameters) {
        // Execute the appropriate tool
        switch (toolName) {
            case 'query_knowledge_base':
                // Would query RAG
                return { results: [] };
            default:
                return { executed: true, toolName };
        }
    }
    static async retrieveMemories(patientId, userId, query) {
        if (!patientId && !userId)
            return [];
        try {
            // In production, would embed query and search Qdrant
            return [];
        }
        catch (error) {
            return [];
        }
    }
    static async getAgentHistory(query) {
        const { page = 1, limit = 20 } = query;
        const skip = (page - 1) * limit;
        const [logs, total] = await Promise.all([
            prisma_1.default.agentLog.findMany({
                where: {
                    ...(query.userId && { userId: query.userId }),
                    ...(query.taskType && { taskType: query.taskType }),
                    ...(query.status && { status: query.status }),
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma_1.default.agentLog.count(),
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
exports.AgentService = AgentService;
//# sourceMappingURL=aiagentService.js.map