export interface ChatMessage {
    role: 'system' | 'user' | 'assistant' | 'function';
    content: string;
    name?: string;
    function_call?: {
        name: string;
        arguments: string;
    };
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
export declare class GPTClient {
    private openai;
    private defaultModel;
    constructor();
    /**
     * Complete chat with context
     */
    chat(messages: ChatMessage[], options?: ChatCompletionOptions): Promise<ChatResponse>;
    /**
     * Stream chat completion
     */
    streamChat(messages: ChatMessage[], callbacks: StreamingCallback, options?: ChatCompletionOptions): Promise<void>;
    /**
     * Get system prompt based on context
     */
    getSystemPrompt(context: 'GENERAL' | 'DOCTOR' | 'PATIENT' | 'TRIAGE'): string;
    /**
     * Get medical functions for function calling
     */
    getMedicalFunctions(): ChatFunction[];
    /**
     * Simple text completion (non-streaming)
     */
    complete(prompt: string, options?: {
        temperature?: number;
        maxTokens?: number;
        systemPrompt?: string;
    }): Promise<string>;
    /**
     * Classify intent from user message
     */
    classifyIntent(message: string): Promise<{
        intent: string;
        confidence: number;
        entities: Record<string, any>;
        sentiment: 'positive' | 'negative' | 'neutral';
        urgency: 'routine' | 'urgent' | 'emergency';
        interactionType?: string;
    }>; 
    /** High-level helper used across the app to generate a response with optional intent and context. */
    generateResponse(prompt: string, intent?: string, context?: Record<string, any>): Promise<GenerateResponseResult>;
    /**
     * Generate medical summary
     */
    generateMedicalSummary(patientData: any, records: any[]): Promise<string>;
    /**
     * Extract medical entities from text
     */
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
    /**
     * Translate medical jargon to plain language
     */
    simplifyMedicalText(medicalText: string): Promise<string>;
}
export declare const gptClient: GPTClient;
//# sourceMappingURL=aiClient.d.ts.map
