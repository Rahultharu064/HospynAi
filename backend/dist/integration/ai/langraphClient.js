"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.langGraphAgent = exports.LangGraphAgent = void 0;
const langgraph_1 = require("@langchain/langgraph");
const openai_1 = require("@langchain/openai");
const tools_1 = require("@langchain/core/tools");
const messages_1 = require("@langchain/core/messages");
const zod_1 = require("zod");
const config_1 = require("../../config");
const logger_1 = __importDefault(require("../../utils/logger"));
const prisma_1 = __importDefault(require("../../config/prisma"));
const vectorlessRagClient_1 = require("./vectorlessRagClient");
// ============================================
// STATE DEFINITIONS
// ============================================
/**
 * Agent state that flows through the graph
 */
const AgentState = langgraph_1.Annotation.Root({
    messages: (0, langgraph_1.Annotation)({
        reducer: (current, update) => current.concat(update),
        default: () => [],
    }),
    userId: (0, langgraph_1.Annotation)(),
    patientId: (0, langgraph_1.Annotation)(),
    sessionId: (0, langgraph_1.Annotation)(),
    taskType: (0, langgraph_1.Annotation)(),
    intent: (0, langgraph_1.Annotation)(),
    toolsToUse: (0, langgraph_1.Annotation)(),
    toolResults: (0, langgraph_1.Annotation)(),
    finalResponse: (0, langgraph_1.Annotation)(),
    status: (0, langgraph_1.Annotation)(),
    error: (0, langgraph_1.Annotation)(),
    iterations: (0, langgraph_1.Annotation)(),
    maxIterations: (0, langgraph_1.Annotation)(),
});
// ============================================
// TOOL DEFINITIONS
// ============================================
/**
 * Schedule appointment tool
 */
class ScheduleAppointmentTool extends tools_1.StructuredTool {
    constructor() {
        super(...arguments);
        this.name = "schedule_appointment";
        this.description = "Schedule a medical appointment for a patient. Input should be a JSON with patientId, doctorId, date, time, and reason.";
        this.schema = zod_1.z.object({
            patientId: zod_1.z.string().describe("The patient ID"),
            doctorId: zod_1.z.string().optional().describe("Preferred doctor ID"),
            date: zod_1.z.string().describe("Appointment date (YYYY-MM-DD)"),
            time: zod_1.z.string().describe("Appointment time (HH:mm)"),
            reason: zod_1.z.string().describe("Reason for visit"),
            type: zod_1.z.enum(["IN_PERSON", "TELEMEDICINE"]).optional().default("IN_PERSON"),
        });
    }
    async _call(input) {
        try {
            // Check doctor availability
            const appointmentDate = new Date(input.date);
            const dayOfWeek = appointmentDate.getDay();
            let doctorId = input.doctorId;
            if (!doctorId) {
                // Find first available doctor
                const availableDoctor = await prisma_1.default.user.findFirst({
                    where: {
                        role: "DOCTOR",
                        status: "ACTIVE",
                        doctorProfile: {
                            schedules: {
                                some: {
                                    dayOfWeek,
                                    isActive: true,
                                    startTime: { lte: input.time },
                                    endTime: { gte: input.time },
                                },
                            },
                        },
                    },
                    select: { id: true, firstName: true, lastName: true },
                });
                if (!availableDoctor) {
                    return JSON.stringify({
                        success: false,
                        message: "No doctors available at the requested time",
                    });
                }
                doctorId = availableDoctor.id;
            }
            // Create appointment
            const appointment = await prisma_1.default.appointment.create({
                data: {
                    appointmentId: `APT-${Date.now()}`,
                    patientId: input.patientId,
                    doctorId: doctorId,
                    appointmentDate,
                    startTime: input.time,
                    endTime: input.time, // Will calculate based on duration
                    duration: 15,
                    type: input.type,
                    status: "SCHEDULED",
                    reason: input.reason,
                    createdById: "ai-agent",
                    updatedById: "ai-agent",
                },
            });
            return JSON.stringify({
                success: true,
                message: "Appointment scheduled successfully",
                appointmentId: appointment.appointmentId,
                date: input.date,
                time: input.time,
            });
        }
        catch (error) {
            return JSON.stringify({
                success: false,
                message: error.message || "Failed to schedule appointment",
            });
        }
    }
}
/**
 * Search patient records tool
 */
class SearchPatientRecordsTool extends tools_1.StructuredTool {
    constructor() {
        super(...arguments);
        this.name = "search_patient_records";
        this.description = "Search patient medical records. Input should be a JSON with patientId and optional query.";
        this.schema = zod_1.z.object({
            patientId: zod_1.z.string().describe("The patient ID"),
            query: zod_1.z.string().optional().describe("Search query for records"),
        });
    }
    async _call(input) {
        try {
            const where = { patientId: input.patientId };
            if (input.query) {
                where.OR = [
                    { diagnosis: { contains: input.query, mode: "insensitive" } },
                    { chiefComplaint: { contains: input.query, mode: "insensitive" } },
                    { treatmentPlan: { contains: input.query, mode: "insensitive" } },
                ];
            }
            const records = await prisma_1.default.medicalRecord.findMany({
                where,
                include: {
                    prescriptions: true,
                    labReports: true,
                },
                orderBy: { createdAt: "desc" },
                take: 10,
            });
            const summary = records.map((r) => ({
                id: r.id,
                date: r.createdAt,
                diagnosis: r.diagnosis,
                chiefComplaint: r.chiefComplaint,
                prescriptions: r.prescriptions.map((p) => p.drugName),
                labReports: r.labReports.map((l) => l.testName),
            }));
            return JSON.stringify({
                success: true,
                recordsFound: records.length,
                records: summary,
            });
        }
        catch (error) {
            return JSON.stringify({
                success: false,
                message: error.message,
            });
        }
    }
}
/**
 * Check drug interactions tool
 */
class CheckDrugInteractionsTool extends tools_1.StructuredTool {
    constructor() {
        super(...arguments);
        this.name = "check_drug_interactions";
        this.description = "Check for potential drug interactions. Input should be a JSON with drugName and patientId.";
        this.schema = zod_1.z.object({
            drugName: zod_1.z.string().describe("Drug name to check"),
            patientId: zod_1.z.string().optional().describe("Patient ID for current medications context"),
        });
    }
    async _call(input) {
        try {
            let currentMedications = [];
            if (input.patientId) {
                const patient = await prisma_1.default.patient.findUnique({
                    where: { id: input.patientId },
                    select: { currentMedications: true },
                });
                if (patient) {
                    currentMedications = patient.currentMedications;
                }
            }
            // Known interaction database (simplified)
            const interactions = {
                "warfarin": ["aspirin", "ibuprofen", "naproxen"],
                "metformin": ["alcohol", "contrast dye"],
                "lisinopril": ["potassium supplements", "salt substitutes"],
                "atorvastatin": ["grapefruit", "erythromycin"],
                "omeprazole": ["clopidogrel", "methotrexate"],
            };
            const drugLower = input.drugName.toLowerCase();
            const knownInteractions = interactions[drugLower] || [];
            const relevantInteractions = currentMedications.filter((med) => knownInteractions.includes(med.toLowerCase()));
            return JSON.stringify({
                success: true,
                drugName: input.drugName,
                hasInteractions: relevantInteractions.length > 0,
                interactions: relevantInteractions,
                severity: relevantInteractions.length > 0 ? "MODERATE" : "NONE",
                recommendation: relevantInteractions.length > 0
                    ? "Consult with physician before combining these medications"
                    : "No known interactions with current medications",
            });
        }
        catch (error) {
            return JSON.stringify({
                success: false,
                message: error.message,
            });
        }
    }
}
/**
 * Analyze symptoms tool
 */
class AnalyzeSymptomsTool extends tools_1.StructuredTool {
    constructor() {
        super(...arguments);
        this.name = "analyze_symptoms";
        this.description = "Analyze patient symptoms and provide triage recommendation. Input should be a JSON with symptoms array and patientId.";
        this.schema = zod_1.z.object({
            symptoms: zod_1.z.array(zod_1.z.string()).describe("List of symptoms"),
            patientId: zod_1.z.string().optional().describe("Patient ID for medical history context"),
            duration: zod_1.z.string().optional().describe("Duration of symptoms"),
            severity: zod_1.z.enum(["mild", "moderate", "severe"]).optional(),
        });
    }
    async _call(input) {
        try {
            let patientContext = {};
            if (input.patientId) {
                const patient = await prisma_1.default.patient.findUnique({
                    where: { id: input.patientId },
                    select: {
                        dateOfBirth: true,
                        gender: true,
                        allergies: true,
                        chronicConditions: true,
                        currentMedications: true,
                    },
                });
                if (patient) {
                    const age = patient.dateOfBirth
                        ? Math.floor((Date.now() - patient.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
                        : null;
                    patientContext = { ...patient, age };
                }
            }
            // Emergency symptoms check
            const emergencySymptoms = [
                "chest pain", "difficulty breathing", "severe bleeding",
                "loss of consciousness", "stroke symptoms", "severe burn",
                "seizure", "sudden confusion", "severe allergic reaction",
            ];
            const hasEmergency = input.symptoms.some((s) => emergencySymptoms.some((es) => s.toLowerCase().includes(es)));
            if (hasEmergency) {
                return JSON.stringify({
                    success: true,
                    triageLevel: "EMERGENCY",
                    recommendation: "SEEK EMERGENCY MEDICAL ATTENTION IMMEDIATELY. Call 911 or go to the nearest emergency room.",
                    urgency: "emergency",
                    shouldSeeDoctor: true,
                });
            }
            // Urgent symptoms check
            const urgentSymptoms = [
                "high fever", "severe pain", "persistent vomiting",
                "shortness of breath", "severe headache", "abdominal pain",
            ];
            const hasUrgent = input.symptoms.some((s) => urgentSymptoms.some((us) => s.toLowerCase().includes(us)));
            if (hasUrgent || input.severity === "severe") {
                return JSON.stringify({
                    success: true,
                    triageLevel: "URGENT",
                    recommendation: "You should see a doctor within 24 hours. Schedule an appointment as soon as possible.",
                    urgency: "urgent",
                    shouldSeeDoctor: true,
                });
            }
            return JSON.stringify({
                success: true,
                triageLevel: "ROUTINE",
                recommendation: "Your symptoms can be managed with routine care. Schedule an appointment at your convenience.",
                urgency: "routine",
                shouldSeeDoctor: input.symptoms.length > 3 || input.severity === "moderate",
            });
        }
        catch (error) {
            return JSON.stringify({
                success: false,
                message: error.message,
            });
        }
    }
}
/**
 * Generate prescription tool
 */
class GeneratePrescriptionTool extends tools_1.StructuredTool {
    constructor() {
        super(...arguments);
        this.name = "generate_prescription";
        this.description = "Generate a new prescription for a patient. Input should be a JSON with patientId, drugName, dosage, frequency, and duration.";
        this.schema = zod_1.z.object({
            patientId: zod_1.z.string().describe("Patient ID"),
            drugName: zod_1.z.string().describe("Drug name"),
            dosage: zod_1.z.string().describe("Dosage (e.g., '500mg')"),
            frequency: zod_1.z.string().describe("Frequency (e.g., 'Twice daily')"),
            duration: zod_1.z.string().describe("Duration (e.g., '7 days')"),
        });
    }
    async _call(input) {
        try {
            // In production, this would create a prescription in the database
            const prescriptionId = `RX-${Date.now()}`;
            return JSON.stringify({
                success: true,
                message: "Prescription generated",
                prescriptionId,
                drugName: input.drugName,
                dosage: input.dosage,
                frequency: input.frequency,
                duration: input.duration,
                warning: "This prescription requires doctor approval before dispensing.",
            });
        }
        catch (error) {
            return JSON.stringify({
                success: false,
                message: error.message,
            });
        }
    }
}
/**
 * Query knowledge base tool
 */
class QueryKnowledgeBaseTool extends tools_1.StructuredTool {
    constructor() {
        super(...arguments);
        this.name = "query_knowledge_base";
        this.description = "Search the medical knowledge base for information. Input should be a JSON with query string.";
        this.schema = zod_1.z.object({
            query: zod_1.z.string().describe("Search query"),
            category: zod_1.z.enum(["condition", "medication", "procedure", "guideline"]).optional(),
        });
    }
    async _call(input) {
        try {
            const results = await vectorlessRagClient_1.vectorlessRagClient.search(input.query, 5, input.category ? input.category.toUpperCase() : undefined);
            return JSON.stringify({
                success: true,
                resultsFound: results.length,
                results: results.map((r) => ({
                    documentId: r.documentId,
                    title: r.title,
                    sourceType: r.sourceType,
                    excerpt: r.content.slice(0, 300),
                    score: r.score,
                })),
                context: vectorlessRagClient_1.vectorlessRagClient.buildContext(results),
            });
        }
        catch (error) {
            return JSON.stringify({
                success: false,
                message: error.message,
            });
        }
    }
}
// ============================================
// AGENT GRAPH DEFINITION
// ============================================
/**
 * LangGraph Agent for medical task orchestration
 */
class LangGraphAgent {
    constructor() {
        this.model = new openai_1.ChatOpenAI({
            modelName: config_1.config.groq.model,
            temperature: 0.3,
            maxTokens: 2000,
            configuration: {
                baseURL: config_1.config.groq.baseUrl,
                apiKey: config_1.config.groq.apiKey,
            },
        });
        this.tools = [
            new ScheduleAppointmentTool(),
            new SearchPatientRecordsTool(),
            new CheckDrugInteractionsTool(),
            new AnalyzeSymptomsTool(),
            new GeneratePrescriptionTool(),
            new QueryKnowledgeBaseTool(),
        ];
        this.buildGraph();
    }
    /**
     * Build the LangGraph workflow
     */
    buildGraph() {
        const workflow = new langgraph_1.StateGraph(AgentState)
            // Add nodes
            .addNode("analyze", this.analyzeNode.bind(this))
            .addNode("plan_tools", this.planToolsNode.bind(this))
            .addNode("execute_tools", this.executeToolsNode.bind(this))
            .addNode("generate_response", this.generateResponseNode.bind(this))
            .addNode("handle_error", this.handleErrorNode.bind(this))
            // Add edges
            .addEdge(langgraph_1.START, "analyze")
            .addConditionalEdges("analyze", this.routeAfterAnalyze.bind(this), {
            plan_tools: "plan_tools",
            generate_response: "generate_response",
            handle_error: "handle_error",
        })
            .addEdge("plan_tools", "execute_tools")
            .addConditionalEdges("execute_tools", this.routeAfterExecute.bind(this), {
            generate_response: "generate_response",
            plan_tools: "plan_tools",
            handle_error: "handle_error",
        })
            .addEdge("generate_response", langgraph_1.END)
            .addEdge("handle_error", langgraph_1.END);
        this.compiledGraph = workflow.compile();
    }
    /**
     * Analyze user input and determine intent
     */
    async analyzeNode(state) {
        logger_1.default.info(`[LangGraph] Analyzing input for session: ${state.sessionId}`);
        try {
            const messages = state.messages;
            const lastMessage = messages[messages.length - 1];
            const content = typeof lastMessage.content === "string"
                ? lastMessage.content
                : JSON.stringify(lastMessage.content);
            const systemPrompt = new messages_1.SystemMessage(`You are a medical AI agent. Analyze the user's message and determine:
        1. The intent (SCHEDULE_APPOINTMENT, CHECK_SYMPTOMS, PRESCRIPTION_QUERY, GENERAL_INQUIRY, EMERGENCY)
        2. Whether tools are needed to fulfill the request
        3. The urgency level
        
        Respond with JSON:
        {
          "intent": "string",
          "needsTools": boolean,
          "urgency": "routine|urgent|emergency",
          "summary": "Brief summary of what the user wants"
        }`);
            const response = await this.model.invoke([systemPrompt, lastMessage]);
            const analysisText = typeof response.content === "string"
                ? response.content
                : JSON.stringify(response.content);
            let analysis;
            try {
                // Extract JSON from response
                const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
                analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { intent: "GENERAL_INQUIRY", needsTools: false };
            }
            catch {
                analysis = { intent: "GENERAL_INQUIRY", needsTools: false, urgency: "routine" };
            }
            return {
                intent: analysis.intent || "GENERAL_INQUIRY",
                status: "ANALYZED",
                iterations: (state.iterations || 0) + 1,
            };
        }
        catch (error) {
            logger_1.default.error("Analyze node error:", error);
            return {
                status: "ERROR",
                error: error.message,
            };
        }
    }
    /**
     * Route after analysis
     */
    routeAfterAnalyze(state) {
        if (state.status === "ERROR")
            return "handle_error";
        if (state.intent === "GENERAL_INQUIRY" || state.intent === "EMERGENCY") {
            return "generate_response";
        }
        return "plan_tools";
    }
    /**
     * Plan which tools to use
     */
    async planToolsNode(state) {
        logger_1.default.info(`[LangGraph] Planning tools for intent: ${state.intent}`);
        try {
            const toolDescriptions = this.tools.map((t) => `- ${t.name}: ${t.description}`).join("\n");
            const planningPrompt = new messages_1.SystemMessage(`You have access to these tools:\n${toolDescriptions}\n\n
        Based on the user's request (intent: ${state.intent}), determine which tools to use.
        Respond with JSON array of tool names: ["tool1", "tool2"]`);
            const messages = state.messages;
            const response = await this.model.invoke([planningPrompt, ...messages]);
            const responseText = typeof response.content === "string"
                ? response.content
                : JSON.stringify(response.content);
            let toolNames = [];
            try {
                const jsonMatch = responseText.match(/\[[\s\S]*\]/);
                toolNames = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
            }
            catch {
                toolNames = [];
            }
            // Map intents to default tools if none planned
            if (toolNames.length === 0) {
                const defaultTools = {
                    SCHEDULE_APPOINTMENT: ["schedule_appointment"],
                    CHECK_SYMPTOMS: ["analyze_symptoms"],
                    PRESCRIPTION_QUERY: ["check_drug_interactions"],
                    GENERAL_INQUIRY: ["query_knowledge_base"],
                };
                toolNames = defaultTools[state.intent] || ["query_knowledge_base"];
            }
            return {
                toolsToUse: toolNames,
                status: "PLANNED",
            };
        }
        catch (error) {
            logger_1.default.error("Plan tools node error:", error);
            return {
                status: "ERROR",
                error: error.message,
            };
        }
    }
    /**
     * Execute the planned tools
     */
    async executeToolsNode(state) {
        logger_1.default.info(`[LangGraph] Executing tools: ${state.toolsToUse.join(", ")}`);
        const toolResults = {};
        const messages = state.messages;
        const lastMessage = messages[messages.length - 1];
        const content = typeof lastMessage.content === "string"
            ? lastMessage.content
            : JSON.stringify(lastMessage.content);
        for (const toolName of state.toolsToUse) {
            const tool = this.tools.find((t) => t.name === toolName);
            if (!tool)
                continue;
            try {
                // Extract parameters using AI
                const extractionPrompt = new messages_1.SystemMessage(`Extract parameters for the tool "${toolName}" from this message: "${content}".
          The tool requires: ${JSON.stringify(tool.schema)}
          Respond with valid JSON for the tool input.`);
                const response = await this.model.invoke([extractionPrompt]);
                const responseText = typeof response.content === "string"
                    ? response.content
                    : JSON.stringify(response.content);
                let params;
                try {
                    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                    params = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
                }
                catch {
                    params = {};
                }
                // Add patientId from state if not in extracted params
                if (state.patientId && !params.patientId) {
                    params.patientId = state.patientId;
                }
                // Execute tool
                logger_1.default.info(`[LangGraph] Executing tool: ${toolName} with params:`, params);
                const result = await tool.invoke(params);
                toolResults[toolName] = JSON.parse(result);
            }
            catch (error) {
                logger_1.default.error(`Tool execution error (${toolName}):`, error);
                toolResults[toolName] = {
                    success: false,
                    error: error.message,
                };
            }
        }
        return {
            toolResults,
            status: "EXECUTED",
        };
    }
    /**
     * Route after tool execution
     */
    routeAfterExecute(state) {
        if (state.status === "ERROR")
            return "handle_error";
        // Check if we need more tool calls (max 3 iterations)
        if (state.iterations < 3 && state.intent === "CHECK_SYMPTOMS") {
            return "plan_tools"; // Could chain more tools
        }
        return "generate_response";
    }
    /**
     * Generate final response
     */
    async generateResponseNode(state) {
        logger_1.default.info(`[LangGraph] Generating final response`);
        try {
            const context = {
                intent: state.intent,
                toolResults: state.toolResults,
            };
            const responsePrompt = new messages_1.SystemMessage(`You are a medical AI assistant. Generate a helpful, concise response based on the tool results.
        Context: ${JSON.stringify(context)}
        
        Guidelines:
        - Be empathetic and professional
        - Include relevant information from tool results
        - Suggest next steps
        - Include medical disclaimer when appropriate
        - For emergencies, emphasize calling 911 immediately`);
            const messages = state.messages;
            const response = await this.model.invoke([responsePrompt, ...messages]);
            const finalResponse = typeof response.content === "string"
                ? response.content
                : JSON.stringify(response.content);
            return {
                finalResponse,
                status: "COMPLETED",
            };
        }
        catch (error) {
            logger_1.default.error("Generate response node error:", error);
            return {
                finalResponse: "I apologize, but I encountered an error processing your request. Please try again or contact support.",
                status: "COMPLETED",
                error: error.message,
            };
        }
    }
    /**
     * Handle errors
     */
    async handleErrorNode(state) {
        logger_1.default.error(`[LangGraph] Error in workflow: ${state.error}`);
        return {
            finalResponse: "I encountered an issue processing your request. Please try again or contact support for assistance.",
            status: "FAILED",
        };
    }
    /**
     * Run the agent with a user message
     */
    async run(input) {
        const initialState = {
            messages: [
                new messages_1.HumanMessage(input.message),
            ],
            userId: input.userId,
            patientId: input.patientId || null,
            sessionId: input.sessionId,
            taskType: "CHAT",
            intent: "",
            toolsToUse: [],
            toolResults: {},
            finalResponse: "",
            status: "STARTED",
            error: null,
            iterations: 0,
            maxIterations: 5,
        };
        logger_1.default.info(`[LangGraph] Starting agent run for session: ${input.sessionId}`);
        const startTime = Date.now();
        const result = await this.compiledGraph.invoke(initialState);
        logger_1.default.info(`[LangGraph] Agent run completed in ${Date.now() - startTime}ms`);
        return {
            sessionId: input.sessionId,
            response: result.finalResponse || "I'm sorry, I couldn't process that request.",
            intent: result.intent,
            toolResults: result.toolResults,
            status: result.status,
            iterations: result.iterations,
        };
    }
    /**
     * Run agent for a specific task
     */
    async runTask(taskType, parameters, userId) {
        logger_1.default.info(`[LangGraph] Running task: ${taskType}`);
        // Map task types to tool names
        const taskToolMap = {
            SCHEDULE_APPOINTMENT: "schedule_appointment",
            CREATE_PRESCRIPTION: "generate_prescription",
            ORDER_LAB_TEST: "query_knowledge_base",
            ANALYZE_SYMPTOMS: "analyze_symptoms",
            CHECK_DRUG_INTERACTIONS: "check_drug_interactions",
            SUMMARIZE_RECORDS: "search_patient_records",
            TRIAGE_PATIENT: "analyze_symptoms",
        };
        const toolName = taskToolMap[taskType];
        if (!toolName) {
            return { success: false, message: `Unknown task type: ${taskType}` };
        }
        const tool = this.tools.find((t) => t.name === toolName);
        if (!tool) {
            return { success: false, message: `Tool not found: ${toolName}` };
        }
        try {
            const result = await tool.invoke(parameters);
            return JSON.parse(result);
        }
        catch (error) {
            return { success: false, message: error.message };
        }
    }
    /**
     * Get available tools
     */
    getAvailableTools() {
        return this.tools.map((t) => ({
            name: t.name,
            description: t.description,
        }));
    }
}
exports.LangGraphAgent = LangGraphAgent;
// Singleton instance
exports.langGraphAgent = new LangGraphAgent();
//# sourceMappingURL=langraphClient.js.map