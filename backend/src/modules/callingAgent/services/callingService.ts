import { CallOutcome, VoiceInteractionType } from '@prisma/client';
import prisma from '../../../config/prisma';
import { config } from '../../../config';
import { twilioClient } from '../../../integration/twilio/twilioClient';
import { llmClient } from '../../../integration/ai/aiClient';
import { AuditService } from '../../auth/services/auditService';
import {
  InitiateCallInput, TransferToHumanInput, CallQueryInput,
} from '../validators/callingValidator';
import { BadRequestError, NotFoundError } from '../../../utils/errors';
import {
  CallResponse, CallListResponse, OutboundCallResponse, CallStats, ActiveCall, CallTranscript,
} from '../../../types/callingTypes';
import logger from '../../../utils/logger';

export class CallingService {
  static async initiateOutboundCall(data: InitiateCallInput, userId: string): Promise<OutboundCallResponse> {
    const patient = await prisma.patient.findUnique({ where: { id: data.patientId } });
    if (!patient || patient.deletedAt) throw new NotFoundError('Patient not found');

    let message = data.message;
    if (!message) {
      const messages: Record<string, string> = {
        REMINDER: `Hello ${patient.firstName}, this is HospynAI reminding you about your upcoming appointment. Please say confirm to confirm, or reschedule to change the date.`,
        FOLLOW_UP: `Hello ${patient.firstName}, this is HospynAI following up on your recent visit. How are you feeling today? Please speak freely.`,
        APPOINTMENT_CONFIRMATION: `Hello ${patient.firstName}, this is HospynAI confirming your upcoming appointment. Please say confirm to proceed, or cancel to cancel.`,
        GENERAL: `Hello ${patient.firstName}, this is HospynAI calling. How can we help you today?`,
      };
      message = messages[data.callType] || messages.GENERAL;
    }

    const twimlUrl = `${process.env.API_URL}/api/v1/calling/webhook/voice?type=outbound&patientId=${data.patientId}`;
    const result = await twilioClient.makeCall(data.phoneNumber, config.twilio.phoneNumber, twimlUrl);

    await prisma.callLog.create({
      data: {
        callSid: result.callSid, patientId: data.patientId,
        fromNumber: config.twilio.phoneNumber, toNumber: data.phoneNumber,
        direction: 'OUTBOUND', outcome: CallOutcome.MISSED, aiHandled: true,
        metadata: { callType: data.callType, appointmentId: data.appointmentId, initiatedBy: userId, message },
        startedAt: new Date(),
      },
    });

    return { success: true, callSid: result.callSid, status: result.status, message: 'Call initiated' };
  }

  static async handleIncomingCall(twilioRequest: any): Promise<string> {
    const { CallSid, From, To, FromCity, FromState, FromCountry } = twilioRequest;
    const patient = await prisma.patient.findFirst({ where: { phone: From } });

    await prisma.callLog.create({
      data: {
        callSid: CallSid, patientId: patient?.id || null,
        fromNumber: From, toNumber: To, direction: 'INBOUND',
        outcome: CallOutcome.MISSED, aiHandled: true,
        metadata: { callerInfo: { city: FromCity, state: FromState, country: FromCountry } },
        startedAt: new Date(),
      },
    });

    return patient
      ? twilioClient.generateResponseTwiML(`Hello ${patient.firstName}! Welcome back to HospynAI. How can I help you today?`)
      : twilioClient.generateIncomingTwiML();
  }

  static async processVoiceInput(twilioRequest: any): Promise<string> {
    const { CallSid, SpeechResult, Confidence, Digits } = twilioRequest;
    const userInput = SpeechResult || Digits || '';
    const fallback = twilioRequest.query?.fallback === 'true';

    if (fallback || !userInput) {
      await prisma.callLog.update({ where: { callSid: CallSid }, data: { outcome: CallOutcome.MISSED, endedAt: new Date() } });
      return twilioClient.generateEndCallTwiML('I didn\'t hear anything. Please call back when ready. Goodbye!');
    }

    const intentResult = await llmClient.classifyIntent(userInput);

    // Emergency routing — highest priority
    if (intentResult.intent === 'EMERGENCY' || intentResult.urgency === 'emergency') {
      return this.handleEmergency(CallSid, userInput);
    }

    const aiResponse = await llmClient.generateResponse(userInput, intentResult.intent, {});
    const callLog = await prisma.callLog.findUnique({ where: { callSid: CallSid } });

    if (callLog) {
      await prisma.voiceLog.create({
        data: {
          patientId: callLog.patientId,
          interactionType: (intentResult.interactionType || 'voice') as VoiceInteractionType,
          transcript: userInput,
          aiResponse: aiResponse.response,
          confidence: parseFloat(Confidence || '0.8'),
          intent: intentResult.intent,
          metadata: { callSid: CallSid, entities: intentResult.entities, urgency: intentResult.urgency },
        },
      });
    }

    // Transfer to human if AI confidence is low or escalation required
    const confidence = parseFloat(Confidence || '0.8');
    if (aiResponse.action === 'ESCALATE' || confidence < 0.55) {
      return twilioClient.generateTransferTwiML(
        process.env.HUMAN_AGENT_NUMBER || '+1234567890',
        'Let me connect you with a human agent who can better assist you. Please hold.'
      );
    }

    return twilioClient.generateResponseTwiML(aiResponse.response);
  }

  private static async handleEmergency(callSid: string, input: string): Promise<string> {
    await prisma.callLog.update({
      where: { callSid },
      data: { outcome: CallOutcome.ESCALATED, handoffReason: 'EMERGENCY_DETECTED', metadata: { emergencyInput: input } },
    });

    return twilioClient.generateTransferTwiML(
      process.env.EMERGENCY_NUMBER || '911',
      'I understand this may be an emergency. Transferring to emergency services now. Please stay on the line.'
    );
  }

  static async transferToHuman(data: TransferToHumanInput, userId: string): Promise<{ twiml: string }> {
    const callLog = await prisma.callLog.findUnique({ where: { callSid: data.callSid } });
    if (!callLog) throw new NotFoundError('Call not found');

    await prisma.callLog.update({
      where: { callSid: data.callSid },
      data: {
        aiHandled: false, handoffReason: data.reason, handoffTo: data.department || 'Human Agent',
        metadata: { ...((callLog.metadata as any) || {}), transferredBy: userId, transferredAt: new Date().toISOString(), priority: data.priority },
      },
    });

    return { twiml: twilioClient.generateTransferTwiML(process.env.HUMAN_AGENT_NUMBER || '+1234567890', 'Let me transfer you to a human agent.') };
  }

  static async handleStatusCallback(statusData: any): Promise<void> {
    const { CallSid, CallStatus, CallDuration, RecordingUrl } = statusData;
    const callLog = await prisma.callLog.findUnique({ where: { callSid: CallSid } });
    if (!callLog) return;

    const updateData: any = {};
    if (CallStatus === 'completed') {
      updateData.endedAt = new Date();
      updateData.duration = CallDuration ? parseInt(CallDuration) : null;
      updateData.recordingUrl = RecordingUrl || null;
      updateData.outcome = callLog.handoffReason ? CallOutcome.HANDED_OFF : callLog.aiHandled ? CallOutcome.AI_RESOLVED : callLog.outcome;
    } else if (['no-answer', 'busy', 'failed'].includes(CallStatus)) {
      updateData.outcome = CallOutcome.MISSED;
      updateData.endedAt = new Date();
    }

    await prisma.callLog.update({ where: { callSid: CallSid }, data: updateData });
    logger.info(`Call ${CallSid} status: ${CallStatus}`);
  }

  static async handleVoicemail(data: any): Promise<void> {
    const { CallSid, RecordingUrl, RecordingDuration, TranscriptionText } = data;
    logger.info(`Voicemail received for ${CallSid} (${RecordingDuration}s)`);
    await prisma.callLog.update({
      where: { callSid: CallSid },
      data: {
        recordingUrl: RecordingUrl || null,
        transcript: TranscriptionText || null,
        outcome: CallOutcome.MISSED,
        endedAt: new Date(),
        duration: RecordingDuration ? parseInt(RecordingDuration) : null,
      },
    }).catch((e) => logger.warn('Voicemail callLog update failed:', e));
  }

  static async handleTranscription(data: any): Promise<void> {
    await prisma.callLog.update({
      where: { callSid: data.CallSid },
      data: { transcript: data.TranscriptionText },
    });
  }

  static async handleRecording(data: any): Promise<void> {
    await prisma.callLog.update({
      where: { callSid: data.CallSid },
      data: { recordingUrl: data.RecordingUrl },
    });
  }

  static async getCallLogs(query: CallQueryInput): Promise<CallListResponse> {
    const { page = 1, limit = 20, patientId, outcome, direction, aiHandled, search, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const where: any = {};
    if (patientId) where.patientId = patientId;
    if (outcome) where.outcome = outcome;
    if (direction) where.direction = direction;
    if (aiHandled !== undefined) where.aiHandled = aiHandled;
    if (search) where.OR = [{ callSid: { contains: search } }, { fromNumber: { contains: search } }, { toNumber: { contains: search } }];

    const skip = (page - 1) * limit;
    const [calls, total] = await Promise.all([
      prisma.callLog.findMany({ where, include: { patient: { select: { id: true, patientId: true, firstName: true, lastName: true } } }, orderBy: { [sortBy]: sortOrder }, skip, take: limit }),
      prisma.callLog.count({ where }),
    ]);

    return { calls: calls.map((c) => this.formatCallResponse(c)), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  static async getCallTranscript(callSid: string): Promise<CallTranscript | null> {
    const callLog = await prisma.callLog.findUnique({ where: { callSid } });
    if (!callLog) throw new NotFoundError('Call not found');

    const allVoiceLogs = await prisma.voiceLog.findMany({ orderBy: { createdAt: 'asc' } });
    const voiceLogs = allVoiceLogs.filter((v) => (v.metadata as any)?.callSid === callSid);

    const transcript = voiceLogs.map((v) => v.transcript).filter(Boolean).join('\n') || callLog.transcript || '';
    return { callSid: callLog.callSid, transcript, segments: [], duration: callLog.duration || 0 };
  }

  static async getCallStats(): Promise<CallStats> {
    const [totalCalls, inboundCalls, outboundCalls, aiResolved, handedOff, missed] = await Promise.all([
      prisma.callLog.count(),
      prisma.callLog.count({ where: { direction: 'INBOUND' } }),
      prisma.callLog.count({ where: { direction: 'OUTBOUND' } }),
      prisma.callLog.count({ where: { outcome: 'AI_RESOLVED' } }),
      prisma.callLog.count({ where: { outcome: 'HANDED_OFF' } }),
      prisma.callLog.count({ where: { outcome: 'MISSED' } }),
    ]);

    // Real average duration from DB instead of hardcoded value
    const durationAgg = await prisma.callLog.aggregate({
      _avg: { duration: true },
      where: { duration: { gt: 0 } },
    });
    const averageDuration = Math.round(durationAgg._avg.duration || 0);

    return {
      totalCalls, inboundCalls, outboundCalls, aiResolved, handedOff, missed,
      averageDuration,
      aiResolutionRate: totalCalls > 0 ? Math.round((aiResolved / totalCalls) * 1000) / 10 : 0,
      missedCallRate: totalCalls > 0 ? Math.round((missed / totalCalls) * 1000) / 10 : 0,
      averageHandoffTime: 0, peakHours: [], dailyVolume: [],
      outcomes: { aiResolved, handedOff, missed },
    };
  }

  static async getActiveCalls(): Promise<ActiveCall[]> {
    const calls = await twilioClient.getActiveCalls();
    return calls.map((call: any) => ({
      callSid: call.sid, patientName: null, phoneNumber: call.to || call.from,
      status: call.status, duration: call.duration || 0, aiHandling: true,
      startedAt: call.startTime?.toISOString() || new Date().toISOString(),
    }));
  }

  private static formatCallResponse(call: any): CallResponse {
    return {
      id: call.id, callSid: call.callSid, patient: call.patient,
      fromNumber: call.fromNumber, toNumber: call.toNumber, direction: call.direction,
      outcome: call.outcome, duration: call.duration, transcript: call.transcript,
      recordingUrl: call.recordingUrl, aiHandled: call.aiHandled,
      handoffReason: call.handoffReason, handoffTo: call.handoffTo, metadata: call.metadata,
      startedAt: call.startedAt.toISOString(), endedAt: call.endedAt?.toISOString() || null,
      createdAt: call.createdAt.toISOString(),
    };
  }
}
