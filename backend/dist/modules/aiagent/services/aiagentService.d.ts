import { AgentChatInput, AgentTaskInput, AgentQueryInput } from '../validators/aiagentValidators';
import { AgentChatResponse, AgentTaskResponse, AgentLogResponse } from '../../../types/aiagentTypes';
export declare class AgentService {
    /**
     * ============================================
     * AGENT CHAT
     * ============================================
     */
    static chat(data: AgentChatInput, userId: string): Promise<AgentChatResponse>;
    /**
     * ============================================
     * EXECUTE AGENT TASK
     * ============================================
     */
    static executeTask(data: AgentTaskInput, userId: string): Promise<AgentTaskResponse>;
    /**
     * ============================================
     * TOOL EXECUTION
     * ============================================
     */
    static executeToolCall(data: {
        toolName: string;
        parameters: Record<string, any>;
    }, userId: string): Promise<any>;
    private static scheduleAppointmentTask;
    private static analyzeSymptomsTask;
    private static checkDrugInteractionsTask;
    private static summarizeRecordsTask;
    private static planTools;
    private static executeTool;
    private static retrieveMemories;
    static getAgentHistory(query: AgentQueryInput): Promise<{
        logs: AgentLogResponse[];
        pagination: any;
    }>;
}
//# sourceMappingURL=aiagentService.d.ts.map