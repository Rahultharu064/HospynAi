import OpenAI from 'openai';
import { config } from '../../config';
import { BadRequestError } from '../../utils/errors';
import logger from '../../utils/logger';

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
    function: { name: string; arguments: string };
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
  functionCall?: 'auto' | 'none' | { name: string };
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

const SYSTEM_PROMPTS = {
  GENERAL: `You are HospynAi, a professional medical AI assistant.
You provide helpful, accurate, and empathetic healthcare information.
Always include appropriate medical disclaimers when giving health advice.
Never provide definitive diagnoses - always recommend consulting healthcare professionals.
Be concise but thorough in your responses.
If you detect an emergency, immediately advise calling emergency services.`,

  DOCTOR: `You are HospynAi, assisting a licensed medical doctor.
Provide detailed clinical information, drug interaction checks, and evidence-based recommendations.
Reference medical guidelines when applicable.
Be precise with medical terminology and dosages.`,

  PATIENT: `You are HospynAi, a friendly medical assistant for patients.
Use simple, easy-to-understand language.
Be empathetic and supportive.
Help with appointment booking, medication reminders, and general health questions.
Always remind patients to consult their doctor for medical advice.`,

  TRIAGE: `You are HospynAi, performing initial patient triage.
Assess the urgency of symptoms based on standard medical triage protocols.
Categorize as: ROUTINE (see doctor within days), URGENT (see doctor within 24 hours), or EMERGENCY (call emergency services immediately).
Ask relevant follow-up questions to better assess the situation.`,
};

const MEDICAL_FUNCTIONS: ChatFunction[] = [
  {
    name: 'schedule_appointment',
    description: 'Schedule a medical appointment for a patient',
    parameters: {
      type: 'object',
      properties: {
        patientId: { type: 'string', description: 'Patient ID' },
        doctorId: { type: 'string', description: 'Preferred doctor ID' },
        preferredDate: { type: 'string', description: 'Preferred date (YYYY-MM-DD)' },
        preferredTime: { type: 'string', description: 'Preferred time (HH:mm)' },
        reason: { type: 'string', description: 'Reason for visit' },
        urgency: { type: 'string', enum: ['routine', 'urgent', 'emergency'] },
      },
      required: ['patientId', 'reason'],
    },
  },
  {
    name: 'check_symptoms',
    description: 'Analyze patient symptoms and provide triage recommendation',
    parameters: {
      type: 'object',
      properties: {
        symptoms: { type: 'array', items: { type: 'string' }, description: 'List of symptoms' },
        duration: { type: 'string', description: 'How long symptoms have persisted' },
        severity: { type: 'string', enum: ['mild', 'moderate', 'severe'] },
        patientId: { type: 'string', description: 'Patient ID for context' },
      },
      required: ['symptoms'],
    },
  },
  {
    name: 'check_drug_interactions',
    description: 'Check for potential drug interactions',
    parameters: {
      type: 'object',
      properties: {
        drugName: { type: 'string', description: 'Drug name to check' },
        patientId: { type: 'string', description: 'Patient ID for current medications' },
      },
      required: ['drugName'],
    },
  },
  {
    name: 'search_medical_knowledge',
    description: 'Search the medical knowledge base for information',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        category: { type: 'string', enum: ['condition', 'medication', 'procedure', 'guideline'] },
      },
      required: ['query'],
    },
  },
];

/** Extract JSON from LLM output that may include markdown fences */
export function extractJsonFromLLM(text: string): Record<string, any> {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenced) {
      return JSON.parse(fenced[1].trim());
    }
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error('No JSON object found in LLM response');
  }
}

/**
 * Groq-backed LLM client (OpenAI-compatible API).
 * Used for chat, intent classification, streaming, and tool calling.
 */
export class LLMClient {
  private client: OpenAI;
  private defaultModel: string;
  private configured: boolean;

  constructor() {
    this.defaultModel = config.groq.model;
    this.configured = Boolean(config.groq.apiKey);
    this.client = new OpenAI({
      apiKey: config.groq.apiKey || 'not-configured',
      baseURL: config.groq.baseUrl,
    });

    if (!this.configured) {
      logger.warn('GROQ_API_KEY is not set — AI chatbot and voice features will not work');
    }
  }

  isConfigured(): boolean {
    return this.configured;
  }

  private ensureConfigured(): void {
    if (!this.configured) {
      throw new BadRequestError('AI service is not configured. Set GROQ_API_KEY in environment variables.');
    }
  }

  private functionsToTools(functions?: ChatFunction[]) {
    if (!functions?.length) return undefined;
    return functions.map((fn) => ({
      type: 'function' as const,
      function: fn,
    }));
  }

  private normalizeMessages(messages: ChatMessage[]): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
    return messages.map((msg) => {
      if (msg.role === 'tool' && msg.tool_call_id) {
        return {
          role: 'tool' as const,
          content: msg.content || '',
          tool_call_id: msg.tool_call_id,
        };
      }

      if (msg.role === 'function') {
        return {
          role: 'tool' as const,
          content: msg.content || '',
          tool_call_id: msg.name || 'tool_call',
        };
      }

      if (msg.tool_calls?.length) {
        return {
          role: 'assistant' as const,
          content: msg.content,
          tool_calls: msg.tool_calls,
        };
      }

      return {
        role: msg.role as 'system' | 'user' | 'assistant',
        content: msg.content || '',
        ...(msg.name ? { name: msg.name } : {}),
      };
    });
  }

  private parseToolCall(message: OpenAI.Chat.Completions.ChatCompletionMessage | undefined) {
    if (!message) return undefined;

    if (message.tool_calls?.length) {
      const call = message.tool_calls[0];
      if (call.type === 'function') {
        return {
          id: call.id,
          name: call.function.name,
          arguments: JSON.parse(call.function.arguments || '{}'),
        };
      }
    }

    const legacy = (message as any).function_call;
    if (legacy?.name) {
      return {
        id: 'legacy_call',
        name: legacy.name,
        arguments: JSON.parse(legacy.arguments || '{}'),
      };
    }

    return undefined;
  }

  async chat(messages: ChatMessage[], options: ChatCompletionOptions = {}): Promise<ChatResponse> {
    this.ensureConfigured();

    try {
      const tools = this.functionsToTools(options.functions);
      const response = await this.client.chat.completions.create({
        model: options.model || this.defaultModel,
        messages: this.normalizeMessages(messages),
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens || 2000,
        top_p: options.topP || 1,
        frequency_penalty: options.frequencyPenalty || 0,
        presence_penalty: options.presencePenalty || 0,
        ...(tools
          ? {
              tools,
              tool_choice: options.functionCall === 'none' ? 'none' : 'auto',
            }
          : {}),
      });

      const choice = response.choices[0];
      const message = choice?.message;
      const functionCall = this.parseToolCall(message);

      return {
        message: message?.content || '',
        role: message?.role || 'assistant',
        functionCall,
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0,
        },
        finishReason: choice?.finish_reason || 'stop',
      };
    } catch (error) {
      logger.error('Groq chat completion failed:', error);
      throw error;
    }
  }

  async streamChat(
    messages: ChatMessage[],
    callbacks: StreamingCallback,
    options: ChatCompletionOptions = {}
  ): Promise<void> {
    this.ensureConfigured();

    try {
      const stream = await this.client.chat.completions.create({
        model: options.model || this.defaultModel,
        messages: this.normalizeMessages(messages),
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens || 2000,
        stream: true,
      });

      let fullContent = '';
      let finishReason = 'stop';

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullContent += content;
          callbacks.onToken(content);
        }
        if (chunk.choices[0]?.finish_reason) {
          finishReason = chunk.choices[0].finish_reason;
        }
      }

      callbacks.onComplete({
        message: fullContent,
        role: 'assistant',
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        finishReason,
      });
    } catch (error: any) {
      callbacks.onError(error);
      logger.error('Groq stream chat failed:', error);
    }
  }

  getSystemPrompt(context: 'GENERAL' | 'DOCTOR' | 'PATIENT' | 'TRIAGE'): string {
    return SYSTEM_PROMPTS[context] || SYSTEM_PROMPTS.GENERAL;
  }

  getMedicalFunctions(): ChatFunction[] {
    return MEDICAL_FUNCTIONS;
  }

  async complete(
    prompt: string,
    options: { temperature?: number; maxTokens?: number; systemPrompt?: string } = {}
  ): Promise<string> {
    const messages: ChatMessage[] = [
      { role: 'system', content: options.systemPrompt || SYSTEM_PROMPTS.GENERAL },
      { role: 'user', content: prompt },
    ];

    const response = await this.chat(messages, {
      temperature: options.temperature || 0.7,
      maxTokens: options.maxTokens || 1000,
    });

    return response.message;
  }

  async classifyIntent(message: string): Promise<{
    intent: string;
    confidence: number;
    entities: Record<string, any>;
    sentiment: 'positive' | 'negative' | 'neutral';
    urgency: 'routine' | 'urgent' | 'emergency';
    interactionType?: string;
  }> {
    const prompt = `Analyze the following user message and extract intent, entities, sentiment, and urgency.

Message: "${message}"

Respond with JSON only (no markdown):
{
  "intent": "BOOK_APPOINTMENT | CHECK_SYMPTOMS | PRESCRIPTION_QUERY | GENERAL_INQUIRY | EMERGENCY | MEDICAL_ADVICE | BILLING | OTHER",
  "confidence": 0.0,
  "entities": {
    "symptoms": [],
    "medications": [],
    "dates": [],
    "doctors": [],
    "appointmentType": null
  },
  "interactionType": "voice | text | dtmf | other",
  "sentiment": "positive | negative | neutral",
  "urgency": "routine | urgent | emergency"
}`;

    try {
      const response = await this.complete(prompt, { temperature: 0.1, maxTokens: 400 });
      const parsed = extractJsonFromLLM(response);
      return {
        intent: parsed.intent || 'GENERAL_INQUIRY',
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
        entities: parsed.entities || {},
        sentiment: parsed.sentiment || 'neutral',
        urgency: parsed.urgency || 'routine',
        interactionType: parsed.interactionType || 'text',
      };
    } catch (error) {
      logger.warn('Intent classification failed, using defaults:', error);
      return {
        intent: 'GENERAL_INQUIRY',
        confidence: 0.5,
        entities: {},
        sentiment: 'neutral',
        urgency: 'routine',
        interactionType: 'text',
      };
    }
  }

  async generateResponse(
    prompt: string,
    intent: string = 'GENERAL_INQUIRY',
    context: Record<string, any> = {}
  ): Promise<GenerateResponseResult> {
    const intentMap: Record<string, 'GENERAL' | 'DOCTOR' | 'PATIENT' | 'TRIAGE'> = {
      GENERAL_INQUIRY: 'GENERAL',
      DOCTOR_INQUIRY: 'DOCTOR',
      PATIENT_INQUIRY: 'PATIENT',
      TRIAGE: 'TRIAGE',
      EMERGENCY: 'TRIAGE',
      SUMMARIZE_RECORDS: 'DOCTOR',
    };

    const systemContext = intentMap[intent] || 'GENERAL';
    const userContent =
      typeof context === 'object' && Object.keys(context).length > 0
        ? `${prompt}\n\nContext:\n${JSON.stringify(context)}`
        : prompt;

    const messages: ChatMessage[] = [
      { role: 'system', content: this.getSystemPrompt(systemContext) },
      { role: 'user', content: userContent },
    ];

    const chatResp = await this.chat(messages, { maxTokens: 1500, temperature: 0.7 });

    let action: string | null = null;
    if (intent === 'EMERGENCY' || chatResp.message.toLowerCase().includes('emergency')) {
      action = 'ESCALATE';
    }

    return {
      response: chatResp.message,
      tokensUsed: chatResp.usage?.totalTokens || 0,
      action,
      data: chatResp.functionCall?.arguments || null,
      suggestedActions: [],
    };
  }

  async analyzeSymptoms(symptoms: string[]): Promise<{
    triage: 'routine' | 'urgent' | 'emergency';
    recommendation: string;
    followUpQuestions: string[];
  }> {
    const prompt = `Analyze these symptoms for triage: ${symptoms.join(', ')}

Respond with JSON only:
{
  "triage": "routine | urgent | emergency",
  "recommendation": "brief clinical recommendation",
  "followUpQuestions": ["question1", "question2"]
}`;

    try {
      const response = await this.complete(prompt, {
        temperature: 0.2,
        maxTokens: 500,
        systemPrompt: SYSTEM_PROMPTS.TRIAGE,
      });
      return extractJsonFromLLM(response) as {
        triage: 'routine' | 'urgent' | 'emergency';
        recommendation: string;
        followUpQuestions: string[];
      };
    } catch {
      return {
        triage: 'routine',
        recommendation: 'Please schedule a consultation with a healthcare provider.',
        followUpQuestions: ['How long have you had these symptoms?'],
      };
    }
  }

  async generateMedicalSummary(patientData: any, records: any[]): Promise<string> {
    const prompt = `Generate a concise medical summary for the following patient data and records.

Patient: ${JSON.stringify(patientData)}
Records: ${JSON.stringify(records)}

Provide a professional clinical summary including:
1. Patient overview
2. Key medical history
3. Current medications
4. Recent visits/procedures
5. Active conditions
6. Recommendations`;

    return this.complete(prompt, { temperature: 0.3, maxTokens: 1000 });
  }

  async extractMedicalEntities(text: string): Promise<{
    conditions: string[];
    medications: string[];
    procedures: string[];
    measurements: Array<{ name: string; value: string; unit: string }>;
    dates: string[];
  }> {
    const prompt = `Extract medical entities from this text:

"${text}"

Respond with JSON only:
{
  "conditions": [],
  "medications": [],
  "procedures": [],
  "measurements": [{"name": "Blood Pressure", "value": "120/80", "unit": "mmHg"}],
  "dates": []
}`;

    try {
      const response = await this.complete(prompt, { temperature: 0.1, maxTokens: 500 });
      return extractJsonFromLLM(response) as {
        conditions: string[];
        medications: string[];
        procedures: string[];
        measurements: Array<{ name: string; value: string; unit: string }>;
        dates: string[];
      };
    } catch {
      return { conditions: [], medications: [], procedures: [], measurements: [], dates: [] };
    }
  }

  async simplifyMedicalText(medicalText: string): Promise<string> {
    const prompt = `Translate this medical text into simple, easy-to-understand language for a patient:

"${medicalText}"

Keep it accurate but make it understandable for someone without medical training.`;

    return this.complete(prompt, { temperature: 0.3, maxTokens: 500 });
  }
}

export const llmClient = new LLMClient();
/** @deprecated Use llmClient — kept for backward compatibility across modules */
export const gptClient = llmClient;
