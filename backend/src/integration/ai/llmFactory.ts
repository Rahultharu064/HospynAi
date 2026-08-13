import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { config } from "../../config";

export class LLMFactory {
  /**
   * Returns a LangChain model configured with fallbacks for maximum resilience.
   * Primary: Groq (llama-3.3-70b-versatile)
   * Fallback 1: OpenAI (gpt-3.5-turbo / gpt-4o-mini)
   * Fallback 2: Anthropic (claude-3-haiku)
   */
  static getFallbackModel(options: { temperature?: number; maxTokens?: number } = {}) {
    const temperature = options.temperature ?? 0.3;
    const maxTokens = options.maxTokens ?? 2000;

    // 1. Primary Model: Groq
    const primaryModel = new ChatOpenAI({
      modelName: config.groq.model,
      temperature,
      maxTokens,
      configuration: {
        baseURL: config.groq.baseUrl,
        apiKey: config.groq.apiKey,
      },
      maxRetries: 1, // Fail fast so it falls back quickly
    });

    // 2. Secondary Model: OpenAI
    const fallbackOpenAI = new ChatOpenAI({
      modelName: "gpt-4o-mini", // Cost-effective robust fallback
      temperature,
      maxTokens,
      configuration: {
        apiKey: config.openai.apiKey,
      },
      maxRetries: 1,
    });

    // 3. Tertiary Model: Anthropic
    const fallbackAnthropic = new ChatAnthropic({
      modelName: config.anthropic.model,
      temperature,
      maxTokens,
      anthropicApiKey: config.anthropic.apiKey,
      maxRetries: 1,
    });

    // Chain the fallbacks
    // .withFallbacks returns a RunnableWithFallbacks which acts like a BaseChatModel
    return primaryModel.withFallbacks({
      fallbacks: [fallbackOpenAI, fallbackAnthropic],
    });
  }
}
