"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMFactory = void 0;
const openai_1 = require("@langchain/openai");
const anthropic_1 = require("@langchain/anthropic");
const config_1 = require("../../config");
class LLMFactory {
    /**
     * Returns a LangChain model configured with fallbacks for maximum resilience.
     * Primary: Groq (llama-3.3-70b-versatile)
     * Fallback 1: OpenAI (gpt-3.5-turbo / gpt-4o-mini)
     * Fallback 2: Anthropic (claude-3-haiku)
     */
    static getFallbackModel(options = {}) {
        const temperature = options.temperature ?? 0.3;
        const maxTokens = options.maxTokens ?? 2000;
        // 1. Primary Model: Groq
        const primaryModel = new openai_1.ChatOpenAI({
            modelName: config_1.config.groq.model,
            temperature,
            maxTokens,
            configuration: {
                baseURL: config_1.config.groq.baseUrl,
                apiKey: config_1.config.groq.apiKey,
            },
            maxRetries: 1, // Fail fast so it falls back quickly
        });
        // 2. Secondary Model: OpenAI
        const fallbackOpenAI = new openai_1.ChatOpenAI({
            modelName: "gpt-4o-mini", // Cost-effective robust fallback
            temperature,
            maxTokens,
            configuration: {
                apiKey: config_1.config.openai.apiKey,
            },
            maxRetries: 1,
        });
        // 3. Tertiary Model: Anthropic
        const fallbackAnthropic = new anthropic_1.ChatAnthropic({
            modelName: config_1.config.anthropic.model,
            temperature,
            maxTokens,
            anthropicApiKey: config_1.config.anthropic.apiKey,
            maxRetries: 1,
        });
        // Chain the fallbacks
        // .withFallbacks returns a RunnableWithFallbacks which acts like a BaseChatModel
        return primaryModel.withFallbacks({
            fallbacks: [fallbackOpenAI, fallbackAnthropic],
        });
    }
}
exports.LLMFactory = LLMFactory;
//# sourceMappingURL=llmFactory.js.map