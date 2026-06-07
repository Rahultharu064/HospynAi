/**
 * LangGraph Agent for medical task orchestration
 */
export declare class LangGraphAgent {
    private model;
    private tools;
    private graph;
    private compiledGraph;
    constructor();
    /**
     * Build the LangGraph workflow
     */
    private buildGraph;
    /**
     * Analyze user input and determine intent
     */
    private analyzeNode;
    /**
     * Route after analysis
     */
    private routeAfterAnalyze;
    /**
     * Plan which tools to use
     */
    private planToolsNode;
    /**
     * Execute the planned tools
     */
    private executeToolsNode;
    /**
     * Route after tool execution
     */
    private routeAfterExecute;
    /**
     * Generate final response
     */
    private generateResponseNode;
    /**
     * Handle errors
     */
    private handleErrorNode;
    /**
     * Run the agent with a user message
     */
    run(input: {
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
    }>;
    /**
     * Run agent for a specific task
     */
    runTask(taskType: string, parameters: Record<string, any>, userId: string): Promise<any>;
    /**
     * Get available tools
     */
    getAvailableTools(): Array<{
        name: string;
        description: string;
    }>;
}
export declare const langGraphAgent: LangGraphAgent;
//# sourceMappingURL=langraphClient.d.ts.map