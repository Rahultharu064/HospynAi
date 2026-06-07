import OpenAI from 'openai';
import logger from '../../utils/logger';

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

// Medical system prompts
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

// Medical functions for function calling
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
  {
    name: 'create_prescription',
    description: 'Create a new prescription',
    parameters: {
      type: 'object',
      properties: {
        patientId: { type: 'string' },
        drugName: { type: 'string' },
        dosage: { type: 'string' },
        frequency: { type: 'string' },
        duration: { type: 'string' },
      },
      required: ['patientId', 'drugName', 'dosage', 'frequency', 'duration'],
    },
  },
];

export class GPTClient {
  private openai: OpenAI;
  private defaultModel = 'gpt-4o';

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || '',
    });
  }

  /**
   * Complete chat with context
   */
  async chat(
    messages: ChatMessage[],
    options: ChatCompletionOptions = {}
  ): Promise<ChatResponse> {
    try {
      const response = await this.openai.chat.completions.create({
        model: options.model || this.defaultModel,
        messages: messages as any,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens || 2000,
        top_p: options.topP || 1,
        frequency_penalty: options.frequencyPenalty || 0,
        presence_penalty: options.presencePenalty || 0,
        functions: options.functions,
        function_call: options.functionCall as any,
      });

      const choice = response.choices[0];
      const message = choice?.message;

      let functionCall: any = undefined;
      if (message?.function_call) {
        functionCall = {
          name: message.function_call.name,
          arguments: JSON.parse(message.function_call.arguments || '{}'),
        };
      }

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
      logger.error('GPT chat completion failed:', error);
      throw error;
    }
  }

  /**
   * Stream chat completion
   */
  async streamChat(
    messages: ChatMessage[],
    callbacks: StreamingCallback,
    options: ChatCompletionOptions = {}
  ): Promise<void> {
    try {
      const stream = await this.openai.chat.completions.create({
        model: options.model || this.defaultModel,
        messages: messages as any,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens || 2000,
        stream: true,
        functions: options.functions,
        function_call: options.functionCall as any,
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
      logger.error('GPT stream chat failed:', error);
    }
  }

  /**
   * Get system prompt based on context
   */
  getSystemPrompt(context: 'GENERAL' | 'DOCTOR' | 'PATIENT' | 'TRIAGE'): string {
    return SYSTEM_PROMPTS[context] || SYSTEM_PROMPTS.GENERAL;
  }

  /**
   * Get medical functions for function calling
   */
  getMedicalFunctions(): ChatFunction[] {
    return MEDICAL_FUNCTIONS;
  }

  /**
   * Simple text completion (non-streaming)
   */
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

  /**
   * Classify intent from user message
   */
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

Respond with JSON:
{
  "intent": "BOOK_APPOINTMENT | CHECK_SYMPTOMS | PRESCRIPTION_QUERY | GENERAL_INQUIRY | EMERGENCY | MEDICAL_ADVICE | BILLING | OTHER",
  "confidence": 0.0-1.0,
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
      const response = await this.complete(prompt, { temperature: 0.1, maxTokens: 300 });
      return JSON.parse(response);
    } catch (error) {
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

  /**
   * High-level generate response used by the app.
   */
  async generateResponse(
    prompt: string,
    intent: string = 'GENERAL_INQUIRY',
    context: Record<string, any> = {}
  ): Promise<GenerateResponseResult> {
    // Map a few known intent labels to system prompt categories
    const intentMap: Record<string, 'GENERAL' | 'DOCTOR' | 'PATIENT' | 'TRIAGE'> = {
      GENERAL_INQUIRY: 'GENERAL',
      DOCTOR_INQUIRY: 'DOCTOR',
      PATIENT_INQUIRY: 'PATIENT',
      TRIAGE: 'TRIAGE',
      SUMMARIZE_RECORDS: 'DOCTOR',
    };

    const systemContext = intentMap[intent] || 'GENERAL';

    const userContent = (typeof context === 'object' && Object.keys(context).length > 0)
      ? `${prompt}\n\nContext:\n${JSON.stringify(context)}`
      : prompt;

    const messages: ChatMessage[] = [
      { role: 'system', content: this.getSystemPrompt(systemContext) },
      { role: 'user', content: userContent },
    ];

    const chatResp = await this.chat(messages, { maxTokens: 1500, temperature: 0.7 });

    return {
      response: chatResp.message,
      tokensUsed: chatResp.usage?.totalTokens || 0,
      action: null,
      data: chatResp.functionCall?.arguments || null,
      suggestedActions: [],
    };
  }

  /**
   * Generate medical summary
   */
  async generateMedicalSummary(
    patientData: any,
    records: any[]
  ): Promise<string> {
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

  /**
   * Extract medical entities from text
   */
  async extractMedicalEntities(text: string): Promise<{
    conditions: string[];
    medications: string[];
    procedures: string[];
    measurements: Array<{ name: string; value: string; unit: string }>;
    dates: string[];
  }> {
    const prompt = `Extract medical entities from this text:
    
"${text}"

Respond with JSON:
{
  "conditions": ["condition1", "condition2"],
  "medications": ["med1", "med2"],
  "procedures": ["procedure1"],
  "measurements": [{"name": "Blood Pressure", "value": "120/80", "unit": "mmHg"}],
  "dates": ["2024-01-15"]
}`;

    try {
      const response = await this.complete(prompt, { temperature: 0.1, maxTokens: 500 });
      return JSON.parse(response);
    } catch (error) {
      return { conditions: [], medications: [], procedures: [], measurements: [], dates: [] };
    }
  }

  /**
   * Translate medical jargon to plain language
   */
  async simplifyMedicalText(medicalText: string): Promise<string> {
    const prompt = `Translate this medical text into simple, easy-to-understand language for a patient:

"${medicalText}"

Keep it accurate but make it understandable for someone without medical training.`;
    
    return this.complete(prompt, { temperature: 0.3, maxTokens: 500 });
  }
}

export const gptClient = new GPTClient();
