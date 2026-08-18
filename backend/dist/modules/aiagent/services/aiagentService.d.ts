import { UserRole } from '@prisma/client';
import { AgentChatInput, AgentTaskInput, AgentQueryInput } from '../validators/aiagentValidators';
import { AgentChatResponse, AgentTaskResponse, AgentLogResponse } from '../../../types/aiagentTypes';
export declare class AgentService {
    /**
     * ============================================
     * AGENT CHAT
     * ============================================
     */
    static chat(data: AgentChatInput, userId: string, userRole?: UserRole): Promise<AgentChatResponse>;
    private static buildSystemPrompt;
    /**
     * Runs the OpenAI/Groq-style tool-calling loop: ask the model, execute any requested
     * tool, feed the result back, and repeat until the model returns a final answer or the
     * round cap is hit.
     */
    private static runToolLoop;
    private static buildSuggestedActions;
    /**
     * ============================================
     * EXECUTE AGENT TASK
     * ============================================
     */
    static executeTask(data: AgentTaskInput, userId: string, userRole?: UserRole): Promise<AgentTaskResponse>;
    /**
     * ============================================
     * TOOL EXECUTION
     * ============================================
     */
    static executeToolCall(data: {
        toolName: string;
        parameters: Record<string, any>;
    }, userId: string, userRole?: UserRole): Promise<any>;
    private static scheduleAppointmentTask;
    private static analyzeSymptomsTask;
    private static checkDrugInteractionsTask;
    private static summarizeRecordsTask;
    private static executeTool;
    private static retrieveMemories;
    static getAgentHistory(query: AgentQueryInput): Promise<{
        logs: AgentLogResponse[];
        pagination: any;
    }>;
}
//# sourceMappingURL=aiagentService.d.ts.map