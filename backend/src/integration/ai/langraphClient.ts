import { StateGraph, END, START, Annotation } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { StructuredTool } from "@langchain/core/tools";
import { HumanMessage, AIMessage, SystemMessage, BaseMessage } from "@langchain/core/messages";
import { z } from "zod";
import { config } from "../../config";
import logger from "../../utils/logger";
import prisma from "../../config/prisma";
import { vectorlessRagClient } from "./vectorlessRagClient";

// ============================================
// STATE DEFINITIONS
// ============================================

/**
 * Agent state that flows through the graph
 */
const AgentState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (current, update) => current.concat(update),
    default: () => [],
  }),
  userId: Annotation<string>(),
  patientId: Annotation<string | null>(),
  sessionId: Annotation<string>(),
  taskType: Annotation<string>(),
  intent: Annotation<string>(),
  toolsToUse: Annotation<string[]>(),
  toolResults: Annotation<Record<string, any>>(),
  finalResponse: Annotation<string>(),
  status: Annotation<string>(),
  error: Annotation<string | null>(),
  iterations: Annotation<number>(),
  maxIterations: Annotation<number>(),
});

// ============================================
// TOOL DEFINITIONS
// ============================================

/**
 * Schedule appointment tool
 */
class ScheduleAppointmentTool extends StructuredTool {
  name = "schedule_appointment";
  description = "Schedule a medical appointment for a patient. Input should be a JSON with patientId, doctorId, date, time, and reason.";

  schema = z.object({
    patientId: z.string().describe("The patient ID"),
    doctorId: z.string().optional().describe("Preferred doctor ID"),
    date: z.string().describe("Appointment date (YYYY-MM-DD)"),
    time: z.string().describe("Appointment time (HH:mm)"),
    reason: z.string().describe("Reason for visit"),
    type: z.enum(["IN_PERSON", "TELEMEDICINE"]).optional().default("IN_PERSON"),
  });

  async _call(input: z.infer<typeof this.schema>): Promise<string> {
    try {
      // Check doctor availability
      const appointmentDate = new Date(input.date);
      const dayOfWeek = appointmentDate.getDay();

      let doctorId = input.doctorId;
      if (!doctorId) {
        // Find first available doctor
        const availableDoctor = await prisma.user.findFirst({
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
      const appointment = await prisma.appointment.create({
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
    } catch (error: any) {
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
class SearchPatientRecordsTool extends StructuredTool {
  name = "search_patient_records";
  description = "Search patient medical records. Input should be a JSON with patientId and optional query.";

  schema = z.object({
    patientId: z.string().describe("The patient ID"),
    query: z.string().optional().describe("Search query for records"),
  });

  async _call(input: z.infer<typeof this.schema>): Promise<string> {
    try {
      const where: any = { patientId: input.patientId };

      if (input.query) {
        where.OR = [
          { diagnosis: { contains: input.query, mode: "insensitive" } },
          { chiefComplaint: { contains: input.query, mode: "insensitive" } },
          { treatmentPlan: { contains: input.query, mode: "insensitive" } },
        ];
      }

      const records = await prisma.medicalRecord.findMany({
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
    } catch (error: any) {
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
class CheckDrugInteractionsTool extends StructuredTool {
  name = "check_drug_interactions";
  description = "Check for potential drug interactions. Input should be a JSON with drugName and patientId.";

  schema = z.object({
    drugName: z.string().describe("Drug name to check"),
    patientId: z.string().optional().describe("Patient ID for current medications context"),
  });

  async _call(input: z.infer<typeof this.schema>): Promise<string> {
    try {
      let currentMedications: string[] = [];

      if (input.patientId) {
        const patient = await prisma.patient.findUnique({
          where: { id: input.patientId },
          select: { currentMedications: true },
        });
        if (patient) {
          currentMedications = patient.currentMedications;
        }
      }

      // Known interaction database (simplified)
      const interactions: Record<string, string[]> = {
        "warfarin": ["aspirin", "ibuprofen", "naproxen"],
        "metformin": ["alcohol", "contrast dye"],
        "lisinopril": ["potassium supplements", "salt substitutes"],
        "atorvastatin": ["grapefruit", "erythromycin"],
        "omeprazole": ["clopidogrel", "methotrexate"],
      };

      const drugLower = input.drugName.toLowerCase();
      const knownInteractions = interactions[drugLower] || [];
      
      const relevantInteractions = currentMedications.filter((med) =>
        knownInteractions.includes(med.toLowerCase())
      );

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
    } catch (error: any) {
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
class AnalyzeSymptomsTool extends StructuredTool {
  name = "analyze_symptoms";
  description = "Analyze patient symptoms and provide triage recommendation. Input should be a JSON with symptoms array and patientId.";

  schema = z.object({
    symptoms: z.array(z.string()).describe("List of symptoms"),
    patientId: z.string().optional().describe("Patient ID for medical history context"),
    duration: z.string().optional().describe("Duration of symptoms"),
    severity: z.enum(["mild", "moderate", "severe"]).optional(),
  });

  async _call(input: z.infer<typeof this.schema>): Promise<string> {
    try {
      let patientContext: any = {};
      if (input.patientId) {
        const patient = await prisma.patient.findUnique({
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

      const hasEmergency = input.symptoms.some((s) =>
        emergencySymptoms.some((es) => s.toLowerCase().includes(es))
      );

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

      const hasUrgent = input.symptoms.some((s) =>
        urgentSymptoms.some((us) => s.toLowerCase().includes(us))
      );

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
    } catch (error: any) {
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
class GeneratePrescriptionTool extends StructuredTool {
  name = "generate_prescription";
  description = "Generate a new prescription for a patient. Input should be a JSON with patientId, drugName, dosage, frequency, and duration.";

  schema = z.object({
    patientId: z.string().describe("Patient ID"),
    drugName: z.string().describe("Drug name"),
    dosage: z.string().describe("Dosage (e.g., '500mg')"),
    frequency: z.string().describe("Frequency (e.g., 'Twice daily')"),
    duration: z.string().describe("Duration (e.g., '7 days')"),
  });

  async _call(input: z.infer<typeof this.schema>): Promise<string> {
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
    } catch (error: any) {
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
class QueryKnowledgeBaseTool extends StructuredTool {
  name = "query_knowledge_base";
  description = "Search the medical knowledge base for information. Input should be a JSON with query string.";

  schema = z.object({
    query: z.string().describe("Search query"),
    category: z.enum(["condition", "medication", "procedure", "guideline"]).optional(),
  });

  async _call(input: z.infer<typeof this.schema>): Promise<string> {
    try {
      const results = await vectorlessRagClient.search(
        input.query,
        5,
        input.category ? input.category.toUpperCase() : undefined
      );

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
        context: vectorlessRagClient.buildContext(results),
      });
    } catch (error: any) {
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
export class LangGraphAgent {
  private model: ChatOpenAI;
  private tools: StructuredTool[];
  private graph: any;
  private compiledGraph: any;

  constructor() {
    this.model = new ChatOpenAI({
      modelName: config.groq.model,
      temperature: 0.3,
      maxTokens: 2000,
      configuration: {
        baseURL: config.groq.baseUrl,
        apiKey: config.groq.apiKey,
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
  private buildGraph(): void {
    const workflow = new StateGraph(AgentState)
      // Add nodes
      .addNode("analyze", this.analyzeNode.bind(this))
      .addNode("plan_tools", this.planToolsNode.bind(this))
      .addNode("execute_tools", this.executeToolsNode.bind(this))
      .addNode("generate_response", this.generateResponseNode.bind(this))
      .addNode("handle_error", this.handleErrorNode.bind(this))
      // Add edges
      .addEdge(START, "analyze")
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
      .addEdge("generate_response", END)
      .addEdge("handle_error", END);

    this.compiledGraph = workflow.compile();
  }

  /**
   * Analyze user input and determine intent
   */
  private async analyzeNode(state: typeof AgentState.State): Promise<Partial<typeof AgentState.State>> {
    logger.info(`[LangGraph] Analyzing input for session: ${state.sessionId}`);

    try {
      const messages = state.messages;
      const lastMessage = messages[messages.length - 1];
      const content = typeof lastMessage.content === "string" 
        ? lastMessage.content 
        : JSON.stringify(lastMessage.content);

      const systemPrompt = new SystemMessage(
        `You are a medical AI agent. Analyze the user's message and determine:
        1. The intent (SCHEDULE_APPOINTMENT, CHECK_SYMPTOMS, PRESCRIPTION_QUERY, GENERAL_INQUIRY, EMERGENCY)
        2. Whether tools are needed to fulfill the request
        3. The urgency level
        
        Respond with JSON:
        {
          "intent": "string",
          "needsTools": boolean,
          "urgency": "routine|urgent|emergency",
          "summary": "Brief summary of what the user wants"
        }`
      );

      const response = await this.model.invoke([systemPrompt, lastMessage]);
      const analysisText = typeof response.content === "string" 
        ? response.content 
        : JSON.stringify(response.content);
      
      let analysis;
      try {
        // Extract JSON from response
        const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
        analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { intent: "GENERAL_INQUIRY", needsTools: false };
      } catch {
        analysis = { intent: "GENERAL_INQUIRY", needsTools: false, urgency: "routine" };
      }

      return {
        intent: analysis.intent || "GENERAL_INQUIRY",
        status: "ANALYZED",
        iterations: (state.iterations || 0) + 1,
      };
    } catch (error: any) {
      logger.error("Analyze node error:", error);
      return {
        status: "ERROR",
        error: error.message,
      };
    }
  }

  /**
   * Route after analysis
   */
  private routeAfterAnalyze(state: typeof AgentState.State): string {
    if (state.status === "ERROR") return "handle_error";
    if (state.intent === "GENERAL_INQUIRY" || state.intent === "EMERGENCY") {
      return "generate_response";
    }
    return "plan_tools";
  }

  /**
   * Plan which tools to use
   */
  private async planToolsNode(state: typeof AgentState.State): Promise<Partial<typeof AgentState.State>> {
    logger.info(`[LangGraph] Planning tools for intent: ${state.intent}`);

    try {
      const toolDescriptions = this.tools.map((t) => `- ${t.name}: ${t.description}`).join("\n");

      const planningPrompt = new SystemMessage(
        `You have access to these tools:\n${toolDescriptions}\n\n
        Based on the user's request (intent: ${state.intent}), determine which tools to use.
        Respond with JSON array of tool names: ["tool1", "tool2"]`
      );

      const messages = state.messages;
      const response = await this.model.invoke([planningPrompt, ...messages]);

      const responseText = typeof response.content === "string" 
        ? response.content 
        : JSON.stringify(response.content);

      let toolNames: string[] = [];
      try {
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        toolNames = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
      } catch {
        toolNames = [];
      }

      // Map intents to default tools if none planned
      if (toolNames.length === 0) {
        const defaultTools: Record<string, string[]> = {
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
    } catch (error: any) {
      logger.error("Plan tools node error:", error);
      return {
        status: "ERROR",
        error: error.message,
      };
    }
  }

  /**
   * Execute the planned tools
   */
  private async executeToolsNode(state: typeof AgentState.State): Promise<Partial<typeof AgentState.State>> {
    logger.info(`[LangGraph] Executing tools: ${state.toolsToUse.join(", ")}`);

    const toolResults: Record<string, any> = {};
    const messages = state.messages;
    const lastMessage = messages[messages.length - 1];
    const content = typeof lastMessage.content === "string" 
      ? lastMessage.content 
      : JSON.stringify(lastMessage.content);

    for (const toolName of state.toolsToUse) {
      const tool = this.tools.find((t) => t.name === toolName);
      if (!tool) continue;

      try {
        // Extract parameters using AI
        const extractionPrompt = new SystemMessage(
          `Extract parameters for the tool "${toolName}" from this message: "${content}".
          The tool requires: ${JSON.stringify(tool.schema)}
          Respond with valid JSON for the tool input.`
        );

        const response = await this.model.invoke([extractionPrompt]);
        const responseText = typeof response.content === "string" 
          ? response.content 
          : JSON.stringify(response.content);

        let params;
        try {
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          params = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
        } catch {
          params = {};
        }

        // Add patientId from state if not in extracted params
        if (state.patientId && !params.patientId) {
          params.patientId = state.patientId;
        }

        // Execute tool
        logger.info(`[LangGraph] Executing tool: ${toolName} with params:`, params);
        const result = await tool.invoke(params);
        toolResults[toolName] = JSON.parse(result);
      } catch (error: any) {
        logger.error(`Tool execution error (${toolName}):`, error);
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
  private routeAfterExecute(state: typeof AgentState.State): string {
    if (state.status === "ERROR") return "handle_error";
    
    // Check if we need more tool calls (max 3 iterations)
    if (state.iterations < 3 && state.intent === "CHECK_SYMPTOMS") {
      return "plan_tools"; // Could chain more tools
    }
    
    return "generate_response";
  }

  /**
   * Generate final response
   */
  private async generateResponseNode(state: typeof AgentState.State): Promise<Partial<typeof AgentState.State>> {
    logger.info(`[LangGraph] Generating final response`);

    try {
      const context = {
        intent: state.intent,
        toolResults: state.toolResults,
      };

      const responsePrompt = new SystemMessage(
        `You are a medical AI assistant. Generate a helpful, concise response based on the tool results.
        Context: ${JSON.stringify(context)}
        
        Guidelines:
        - Be empathetic and professional
        - Include relevant information from tool results
        - Suggest next steps
        - Include medical disclaimer when appropriate
        - For emergencies, emphasize calling 911 immediately`
      );

      const messages = state.messages;
      const response = await this.model.invoke([responsePrompt, ...messages]);
      const finalResponse = typeof response.content === "string" 
        ? response.content 
        : JSON.stringify(response.content);

      return {
        finalResponse,
        status: "COMPLETED",
      };
    } catch (error: any) {
      logger.error("Generate response node error:", error);
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
  private async handleErrorNode(state: typeof AgentState.State): Promise<Partial<typeof AgentState.State>> {
    logger.error(`[LangGraph] Error in workflow: ${state.error}`);
    
    return {
      finalResponse: "I encountered an issue processing your request. Please try again or contact support for assistance.",
      status: "FAILED",
    };
  }

  /**
   * Run the agent with a user message
   */
  async run(input: {
    message: string;
    userId: string;
    patientId?: string | null;
    sessionId: string;
    context?: Record<string, any>;
  }): Promise<{
    sessionId: string;
    response: string;
    intent: string;
    toolResults: Record<string, any>;
    status: string;
    iterations: number;
  }> {
    const initialState = {
      messages: [
        new HumanMessage(input.message),
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

    logger.info(`[LangGraph] Starting agent run for session: ${input.sessionId}`);
    const startTime = Date.now();

    const result = await this.compiledGraph.invoke(initialState);

    logger.info(`[LangGraph] Agent run completed in ${Date.now() - startTime}ms`);

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
  async runTask(taskType: string, parameters: Record<string, any>, userId: string): Promise<any> {
    logger.info(`[LangGraph] Running task: ${taskType}`);

    // Map task types to tool names
    const taskToolMap: Record<string, string> = {
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
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Get available tools
   */
  getAvailableTools(): Array<{ name: string; description: string }> {
    return this.tools.map((t) => ({
      name: t.name,
      description: t.description,
    }));
  }
}

// Singleton instance
export const langGraphAgent = new LangGraphAgent();