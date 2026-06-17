export interface ChatMessage {
    role: 'system' | 'user' | 'assistant' | 'function' | 'tool';
    content: string | null;
    name?: string;
    tool_call_id?: string;
    function_call?: {
        name: string;
        arguments: string;
    };
    tool_calls?: Array<{
        id: string;
        type: 'function';
        function: {
            name: string;
            arguments: string;
        };
    }>;
}
export interface ChatCompletionOptions {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    stream?: boolean;
    functions?: ChatFunction[];
    functionCall?: 'auto' | 'none' | {
        name: string;
    };
}
export interface ChatFunction {
    name: string;
    description: string;
    parameters: Record<string, any>;
}
export interface ChatResponse {
    message: string;
    role: string;
    functionCall?: {
        id: string;
        name: string;
        arguments: Record<string, any>;
    };
    usage: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    finishReason: string;
}
export interface GenerateResponseResult {
    response: string;
    tokensUsed?: number;
    action?: string | null;
    data?: any;
    suggestedActions?: any[];
}
export interface StreamingCallback {
    onToken: (token: string) => void;
    onComplete: (response: ChatResponse) => void;
    onError: (error: Error) => void;
}
/** Extract JSON from LLM output that may include markdown fences */
export declare function extractJsonFromLLM(text: string): Record<string, any>;
/**
 * Groq-backed LLM client (OpenAI-compatible API).
 * Used for chat, intent classification, streaming, and tool calling.
 */
export declare class LLMClient {
    private client;
    private defaultModel;
    private configured;
    constructor();
    isConfigured(): boolean;
    private ensureConfigured;
    private functionsToTools;
    private normalizeMessages;
    private parseToolCall;
    chat(messages: ChatMessage[], options?: ChatCompletionOptions): Promise<ChatResponse>;
    streamChat(messages: ChatMessage[], callbacks: StreamingCallback, options?: ChatCompletionOptions): Promise<void>;
    getSystemPrompt(context: 'GENERAL' | 'DOCTOR' | 'PATIENT' | 'TRIAGE'): string;
    getMedicalFunctions(): ChatFunction[];
    complete(prompt: string, options?: {
        temperature?: number;
        maxTokens?: number;
        systemPrompt?: string;
    }): Promise<string>;
    classifyIntent(message: string): Promise<{
        intent: string;
        confidence: number;
        entities: Record<string, any>;
        sentiment: 'positive' | 'negative' | 'neutral';
        urgency: 'routine' | 'urgent' | 'emergency';
        interactionType?: string;
    }>;
    generateResponse(prompt: string, intent?: string, context?: Record<string, any>): Promise<GenerateResponseResult>;
    analyzeSymptoms(symptoms: string[]): Promise<{
        triage: 'routine' | 'urgent' | 'emergency';
        recommendation: string;
        followUpQuestions: string[];
    }>;
    generateMedicalSummary(patientData: any, records: any[]): Promise<string>;
    extractMedicalEntities(text: string): Promise<{
        conditions: string[];
        medications: string[];
        procedures: string[];
        measurements: Array<{
            name: string;
            value: string;
            unit: string;
        }>;
        dates: string[];
    }>;
    simplifyMedicalText(medicalText: string): Promise<string>;
}
export declare const llmClient: LLMClient;
/** @deprecated Use llmClient — kept for backward compatibility across modules */
export declare const gptClient: LLMClient;
//# sourceMappingURL=aiClient.d.ts.map