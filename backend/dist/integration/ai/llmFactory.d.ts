export declare class LLMFactory {
    /**
     * Returns a LangChain model configured with fallbacks for maximum resilience.
     * Primary: Groq (llama-3.3-70b-versatile)
     * Fallback 1: OpenAI (gpt-3.5-turbo / gpt-4o-mini)
     * Fallback 2: Anthropic (claude-3-haiku)
     */
    static getFallbackModel(options?: {
        temperature?: number;
        maxTokens?: number;
    }): import("@langchain/core/runnables").RunnableWithFallbacks<import("@langchain/core/language_models/base").BaseLanguageModelInput, import("@langchain/core/messages").AIMessageChunk<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>>>;
}
//# sourceMappingURL=llmFactory.d.ts.map