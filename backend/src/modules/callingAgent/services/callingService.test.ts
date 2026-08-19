import { CallOutcome, VoiceInteractionType } from '@prisma/client';

jest.mock('../../../config/prisma', () => ({
  __esModule: true,
  default: {
    patient: { findUnique: jest.fn(), findFirst: jest.fn() },
    callLog: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
    voiceLog: { create: jest.fn(), findMany: jest.fn() },
  },
}));

jest.mock('../../../integration/twilio/twilioClient', () => ({
  __esModule: true,
  twilioClient: {
    makeCall: jest.fn(),
    generateResponseTwiML: jest.fn((msg: string) => `<Response><Say>${msg}</Say></Response>`),
    generateIncomingTwiML: jest.fn(() => '<Response><Say>incoming</Say></Response>'),
    generateEndCallTwiML: jest.fn((msg: string) => `<Response><Say>${msg}</Say><Hangup/></Response>`),
    generateTransferTwiML: jest.fn((to: string, msg: string) => `<Response><Say>${msg}</Say><Dial>${to}</Dial></Response>`),
    getActiveCalls: jest.fn(),
  },
}));

jest.mock('../../../integration/ai/aiClient', () => ({
  __esModule: true,
  gptClient: { classifyIntent: jest.fn() },
  llmClient: { chat: jest.fn(), getSystemPrompt: jest.fn(() => 'system prompt') },
}));

import prisma from '../../../config/prisma';
import { twilioClient } from '../../../integration/twilio/twilioClient';
import { gptClient, llmClient } from '../../../integration/ai/aiClient';
import { CallingService } from './callingService';
import { NotFoundError } from '../../../utils/errors';

const mockPrisma = prisma as unknown as {
  patient: { findUnique: jest.Mock; findFirst: jest.Mock };
  callLog: {
    create: jest.Mock; update: jest.Mock; findUnique: jest.Mock; findMany: jest.Mock;
    count: jest.Mock; aggregate: jest.Mock; groupBy: jest.Mock;
  };
  voiceLog: { create: jest.Mock; findMany: jest.Mock };
};
const mockTwilioClient = twilioClient as unknown as {
  makeCall: jest.Mock; generateResponseTwiML: jest.Mock; generateIncomingTwiML: jest.Mock;
  generateEndCallTwiML: jest.Mock; generateTransferTwiML: jest.Mock; getActiveCalls: jest.Mock;
};
const mockGptClient = gptClient as unknown as { classifyIntent: jest.Mock };
const mockLlmClient = llmClient as unknown as { chat: jest.Mock; getSystemPrompt: jest.Mock };

describe('CallingService.initiateOutboundCall', () => {
  it('throws NotFoundError when the patient does not exist', async () => {
    mockPrisma.patient.findUnique.mockResolvedValue(null);

    await expect(
      CallingService.initiateOutboundCall(
        { patientId: 'p1', phoneNumber: '+15551234567', callType: 'REMINDER' } as any,
        'user1'
      )
    ).rejects.toThrow(NotFoundError);
  });

  it('places the call and logs it against the patient', async () => {
    mockPrisma.patient.findUnique.mockResolvedValue({ id: 'p1', firstName: 'Jane', deletedAt: null });
    mockTwilioClient.makeCall.mockResolvedValue({ callSid: 'CA123', status: 'queued' });
    mockPrisma.callLog.create.mockResolvedValue({});

    const result = await CallingService.initiateOutboundCall(
      { patientId: 'p1', phoneNumber: '+15551234567', callType: 'REMINDER' } as any,
      'user1'
    );

    expect(result).toEqual({ success: true, callSid: 'CA123', status: 'queued', message: 'Call initiated' });
    expect(mockPrisma.callLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ callSid: 'CA123', patientId: 'p1', direction: 'OUTBOUND' }),
      })
    );
  });
});

describe('CallingService.handleIncomingCall', () => {
  it('greets a known patient by name', async () => {
    mockPrisma.patient.findFirst.mockResolvedValue({ id: 'p1', firstName: 'Jane' });
    mockPrisma.callLog.create.mockResolvedValue({});

    await CallingService.handleIncomingCall({ CallSid: 'CA1', From: '+15551234567', To: '+15559876543' });

    expect(mockTwilioClient.generateResponseTwiML).toHaveBeenCalledWith(expect.stringContaining('Jane'));
  });

  it('falls back to the generic greeting for an unknown caller', async () => {
    mockPrisma.patient.findFirst.mockResolvedValue(null);
    mockPrisma.callLog.create.mockResolvedValue({});

    await CallingService.handleIncomingCall({ CallSid: 'CA2', From: '+15550000000', To: '+15559876543' });

    expect(mockTwilioClient.generateIncomingTwiML).toHaveBeenCalled();
  });
});

describe('CallingService.processVoiceInput', () => {
  it('ends the call when there is no input', async () => {
    mockPrisma.callLog.update.mockResolvedValue({});

    await CallingService.processVoiceInput({ CallSid: 'CA1', SpeechResult: '', query: {} });

    expect(mockPrisma.callLog.update).toHaveBeenCalledWith({
      where: { callSid: 'CA1' },
      data: { outcome: CallOutcome.MISSED, endedAt: expect.any(Date) },
    });
    expect(mockTwilioClient.generateEndCallTwiML).toHaveBeenCalled();
  });

  it('escalates directly when intent is classified as EMERGENCY', async () => {
    mockGptClient.classifyIntent.mockResolvedValue({
      intent: 'EMERGENCY', urgency: 'emergency', entities: {}, confidence: 0.9, sentiment: 'negative',
    });
    mockPrisma.callLog.update.mockResolvedValue({});

    await CallingService.processVoiceInput({ CallSid: 'CA1', SpeechResult: 'I am having chest pain' });

    expect(mockTwilioClient.generateTransferTwiML).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('emergency')
    );
    // Emergency short-circuits before the conversational LLM turn and voiceLog write.
    expect(mockLlmClient.chat).not.toHaveBeenCalled();
  });

  it('escalates when urgency is emergency even if intent is not classified as EMERGENCY', async () => {
    // Regression test: urgency lives at the top level of classifyIntent's result, not
    // inside `entities` — a prior bug checked `entities.urgency`, which never fires.
    mockGptClient.classifyIntent.mockResolvedValue({
      intent: 'GENERAL_INQUIRY', urgency: 'emergency', entities: {}, confidence: 0.9, sentiment: 'negative',
    });
    mockPrisma.callLog.update.mockResolvedValue({});

    await CallingService.processVoiceInput({ CallSid: 'CA1', SpeechResult: 'help I cannot breathe' });

    expect(mockTwilioClient.generateTransferTwiML).toHaveBeenCalled();
  });

  it('persists a voice turn with a valid VoiceInteractionType enum value', async () => {
    // Regression test: classifyIntent's `intent` field (BOOK_APPOINTMENT, CHECK_SYMPTOMS, ...)
    // must be mapped to the Prisma VoiceInteractionType enum, not cast from the unrelated
    // `interactionType` field (which holds 'voice' | 'text' | 'dtmf' | 'other').
    mockGptClient.classifyIntent.mockResolvedValue({
      intent: 'BOOK_APPOINTMENT', urgency: 'routine', entities: {}, confidence: 0.9,
      sentiment: 'neutral', interactionType: 'voice',
    });
    mockPrisma.callLog.findUnique.mockResolvedValue({ callSid: 'CA1', patientId: 'p1' });
    mockPrisma.voiceLog.findMany.mockResolvedValue([]);
    mockPrisma.patient.findUnique.mockResolvedValue({
      firstName: 'Jane', lastName: 'Doe', allergies: [], chronicConditions: [], currentMedications: [],
    });
    mockLlmClient.chat.mockResolvedValue({ message: 'Sure, let\'s book that.' });
    mockPrisma.voiceLog.create.mockResolvedValue({});

    await CallingService.processVoiceInput({ CallSid: 'CA1', SpeechResult: 'I want to book an appointment', Confidence: '0.9' });

    expect(mockPrisma.voiceLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ interactionType: VoiceInteractionType.APPOINTMENT_BOOKING }),
      })
    );
    const validEnumValues = Object.values(VoiceInteractionType);
    const writtenValue = mockPrisma.voiceLog.create.mock.calls[0][0].data.interactionType;
    expect(validEnumValues).toContain(writtenValue);
  });

  it('falls back to GENERAL_INQUIRY interactionType for an unmapped intent', async () => {
    mockGptClient.classifyIntent.mockResolvedValue({
      intent: 'BILLING', urgency: 'routine', entities: {}, confidence: 0.8, sentiment: 'neutral',
    });
    mockPrisma.callLog.findUnique.mockResolvedValue({ callSid: 'CA1', patientId: null });
    mockPrisma.voiceLog.findMany.mockResolvedValue([]);
    mockLlmClient.chat.mockResolvedValue({ message: 'Let me check your billing.' });
    mockPrisma.voiceLog.create.mockResolvedValue({});

    await CallingService.processVoiceInput({ CallSid: 'CA1', SpeechResult: 'question about my bill', Confidence: '0.9' });

    expect(mockPrisma.voiceLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ interactionType: VoiceInteractionType.GENERAL_INQUIRY }),
      })
    );
  });

  it('transfers to a human when urgency is urgent', async () => {
    mockGptClient.classifyIntent.mockResolvedValue({
      intent: 'CHECK_SYMPTOMS', urgency: 'urgent', entities: {}, confidence: 0.9, sentiment: 'neutral',
    });
    mockPrisma.callLog.findUnique.mockResolvedValue({ callSid: 'CA1', patientId: null });
    mockPrisma.voiceLog.findMany.mockResolvedValue([]);
    mockLlmClient.chat.mockResolvedValue({ message: 'That sounds concerning.' });
    mockPrisma.voiceLog.create.mockResolvedValue({});

    await CallingService.processVoiceInput({ CallSid: 'CA1', SpeechResult: 'my symptoms are getting worse', Confidence: '0.9' });

    expect(mockTwilioClient.generateTransferTwiML).toHaveBeenCalled();
    expect(mockTwilioClient.generateResponseTwiML).not.toHaveBeenCalled();
  });

  it('transfers to a human when speech confidence is low', async () => {
    mockGptClient.classifyIntent.mockResolvedValue({
      intent: 'GENERAL_INQUIRY', urgency: 'routine', entities: {}, confidence: 0.9, sentiment: 'neutral',
    });
    mockPrisma.callLog.findUnique.mockResolvedValue({ callSid: 'CA1', patientId: null });
    mockPrisma.voiceLog.findMany.mockResolvedValue([]);
    mockLlmClient.chat.mockResolvedValue({ message: 'response' });
    mockPrisma.voiceLog.create.mockResolvedValue({});

    await CallingService.processVoiceInput({ CallSid: 'CA1', SpeechResult: 'mumble mumble', Confidence: '0.2' });

    expect(mockTwilioClient.generateTransferTwiML).toHaveBeenCalled();
  });
});

describe('CallingService.transferToHuman', () => {
  it('throws NotFoundError when the call does not exist', async () => {
    mockPrisma.callLog.findUnique.mockResolvedValue(null);

    await expect(
      CallingService.transferToHuman({ callSid: 'CA404', reason: 'patient request' } as any, 'user1')
    ).rejects.toThrow(NotFoundError);
  });

  it('marks the call handed off and returns transfer TwiML', async () => {
    mockPrisma.callLog.findUnique.mockResolvedValue({ callSid: 'CA1', metadata: {} });
    mockPrisma.callLog.update.mockResolvedValue({});

    const result = await CallingService.transferToHuman(
      { callSid: 'CA1', reason: 'patient request', priority: 'urgent' } as any,
      'user1'
    );

    expect(mockPrisma.callLog.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { callSid: 'CA1' },
        data: expect.objectContaining({ aiHandled: false, handoffReason: 'patient request' }),
      })
    );
    expect(result.twiml).toContain('Dial');
  });
});

describe('CallingService.handleStatusCallback', () => {
  it('is a no-op when the call log is missing', async () => {
    mockPrisma.callLog.findUnique.mockResolvedValue(null);

    await CallingService.handleStatusCallback({ CallSid: 'CA404', CallStatus: 'completed' });

    expect(mockPrisma.callLog.update).not.toHaveBeenCalled();
  });

  it('marks a completed AI-handled call as AI_RESOLVED', async () => {
    mockPrisma.callLog.findUnique.mockResolvedValue({ callSid: 'CA1', aiHandled: true, handoffReason: null, outcome: CallOutcome.MISSED });
    mockPrisma.callLog.update.mockResolvedValue({});

    await CallingService.handleStatusCallback({ CallSid: 'CA1', CallStatus: 'completed', CallDuration: '42' });

    expect(mockPrisma.callLog.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { callSid: 'CA1' },
        data: expect.objectContaining({ outcome: CallOutcome.AI_RESOLVED, duration: 42 }),
      })
    );
  });

  it('marks a no-answer call as MISSED', async () => {
    mockPrisma.callLog.findUnique.mockResolvedValue({ callSid: 'CA1', aiHandled: true, handoffReason: null, outcome: CallOutcome.MISSED });
    mockPrisma.callLog.update.mockResolvedValue({});

    await CallingService.handleStatusCallback({ CallSid: 'CA1', CallStatus: 'no-answer' });

    expect(mockPrisma.callLog.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ outcome: CallOutcome.MISSED }) })
    );
  });
});

describe('CallingService.getCallTranscript', () => {
  it('throws NotFoundError for an unknown call', async () => {
    mockPrisma.callLog.findUnique.mockResolvedValue(null);

    await expect(CallingService.getCallTranscript('CA404')).rejects.toThrow(NotFoundError);
  });

  it('builds transcript segments from voice logs in order', async () => {
    const start = new Date('2026-01-01T00:00:00.000Z');
    mockPrisma.callLog.findUnique.mockResolvedValue({ callSid: 'CA1', startedAt: start, transcript: null, duration: 30 });
    mockPrisma.voiceLog.findMany.mockResolvedValue([
      { createdAt: new Date(start.getTime() + 5000), transcript: 'hello', aiResponse: 'hi there', confidence: 0.9 },
    ]);

    const result = await CallingService.getCallTranscript('CA1');

    expect(result?.segments).toHaveLength(2);
    expect(result?.segments[0]).toMatchObject({ speaker: 'PATIENT', text: 'hello', startTime: 5 });
    expect(result?.segments[1]).toMatchObject({ speaker: 'AI', text: 'hi there', startTime: 5 });
  });
});

describe('CallingService.getCallStats', () => {
  it('computes resolution and missed-call rates from raw counts', async () => {
    mockPrisma.callLog.count
      .mockResolvedValueOnce(10) // total
      .mockResolvedValueOnce(6) // inbound
      .mockResolvedValueOnce(4) // outbound
      .mockResolvedValueOnce(7) // aiResolved
      .mockResolvedValueOnce(2) // handedOff
      .mockResolvedValueOnce(1); // missed
    mockPrisma.callLog.aggregate
      .mockResolvedValueOnce({ _avg: { duration: 120 } })
      .mockResolvedValueOnce({ _avg: { duration: 90 } });
    mockPrisma.callLog.groupBy.mockResolvedValue([{ outcome: 'AI_RESOLVED', _count: { _all: 7 } }]);
    mockPrisma.callLog.findMany.mockResolvedValue([{ startedAt: new Date() }]);

    const stats = await CallingService.getCallStats();

    expect(stats.totalCalls).toBe(10);
    expect(stats.aiResolutionRate).toBe(70);
    expect(stats.missedCallRate).toBe(10);
    expect(stats.averageDuration).toBe(120);
  });
});

describe('CallingService.getActiveCalls', () => {
  it('maps raw Twilio call objects into ActiveCall shape', async () => {
    mockTwilioClient.getActiveCalls.mockResolvedValue([
      { sid: 'CA1', to: '+15551234567', status: 'in-progress', duration: 12, startTime: new Date('2026-01-01T00:00:00.000Z') },
    ]);

    const result = await CallingService.getActiveCalls();

    expect(result).toEqual([
      {
        callSid: 'CA1', patientName: null, phoneNumber: '+15551234567',
        status: 'in-progress', duration: 12, aiHandling: true,
        startedAt: '2026-01-01T00:00:00.000Z',
      },
    ]);
  });
});
