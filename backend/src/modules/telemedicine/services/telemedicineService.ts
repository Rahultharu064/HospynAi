import { v4 as uuidv4 } from 'uuid';
import prisma from '../../../config/prisma';
import { AuditService } from '../../auth/services/auditService';
import {
  CreateSessionInput,
  SessionQueryInput,
} from '../validators/telemedicineValidators';
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
} from '../../../utils/errors';
import {
  TelemedicineSessionResponse,
  SessionListResponse,
  SessionStats,
  RoomInfo,
  IceServer,
} from '../../../types/telemedicineTypes';
import logger from '../../../utils/logger';

export class TelemedicineService {
  /**
   * ============================================
   * CREATE TELEMEDICINE SESSION
   * ============================================
   */
  static async createSession(
    data: CreateSessionInput,
    userId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<{ session: TelemedicineSessionResponse; roomInfo: RoomInfo }> {
    // Validate appointment
    const appointment = await prisma.appointment.findUnique({
      where: { id: data.appointmentId },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, patientId: true } },
        doctor: {
          select: { id: true, firstName: true, lastName: true },
          include: { doctorProfile: { select: { specialization: true } } },
        },
      },
    });

    if (!appointment) throw new NotFoundError('Appointment not found');
    
    if (appointment.type !== 'TELEMEDICINE') {
      throw new BadRequestError('Appointment is not a telemedicine appointment');
    }

    if (appointment.status !== 'SCHEDULED' && appointment.status !== 'CONFIRMED') {
      throw new BadRequestError('Appointment is not in a valid state for telemedicine');
    }

    // Check if patient and doctor match
    if (appointment.patientId !== data.patientId) {
      throw new BadRequestError('Patient does not match appointment');
    }
    if (appointment.doctorId !== data.doctorId) {
      throw new BadRequestError('Doctor does not match appointment');
    }

    // Generate room ID and token
    const roomId = `room_${uuidv4()}`;
    const token = this.generateRoomToken(roomId, data.patientId, data.doctorId);

    // Get ICE servers
    const iceServers = this.getIceServers();

    // Create session record
    const session = {
      id: uuidv4(),
      roomId,
      appointment: {
        id: appointment.id,
        appointmentId: appointment.appointmentId,
        type: appointment.type,
      },
      patient: appointment.patient,
      doctor: {
        id: appointment.doctor.id,
        firstName: appointment.doctor.firstName,
        lastName: appointment.doctor.lastName,
        specialization: appointment.doctor.doctorProfile?.specialization || null,
      },
      status: 'WAITING' as const,
      startedAt: null,
      endedAt: null,
      duration: null,
      recordingUrl: null,
      isRecorded: data.recordSession || false,
      quality: null,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Update appointment status
    await prisma.appointment.update({
      where: { id: data.appointmentId },
      data: { status: 'IN_PROGRESS' },
    });

    logger.info(`Telemedicine session created: ${roomId}`);

    return {
      session,
      roomInfo: {
        roomId,
        token,
        iceServers,
        expiresIn: 3600, // 1 hour
      },
    };
  }

  /**
   * ============================================
   * END SESSION
   * ============================================
   */
  static async endSession(
    sessionId: string,
    reason: string | null,
    notes: string | null,
    userId: string
  ): Promise<TelemedicineSessionResponse> {
    const endedAt = new Date();
    const duration = 30; // Would calculate from actual start/end

    logger.info(`Telemedicine session ended: ${sessionId}`);

    return {
      id: sessionId,
      roomId: `room_${sessionId}`,
      appointment: { id: '', appointmentId: '', type: 'TELEMEDICINE' },
      patient: { id: '', firstName: '', lastName: '', patientId: '' },
      doctor: { id: '', firstName: '', lastName: '', specialization: null },
      status: 'COMPLETED',
      startedAt: new Date(Date.now() - duration * 60000).toISOString(),
      endedAt: endedAt.toISOString(),
      duration,
      recordingUrl: null,
      isRecorded: false,
      quality: null,
      messages: [],
      createdAt: '',
      updatedAt: endedAt.toISOString(),
    };
  }

  /**
   * ============================================
   * LIST SESSIONS
   * ============================================
   */
  static async listSessions(query: SessionQueryInput): Promise<SessionListResponse> {
    const { page = 1, limit = 20 } = query;

    return {
      sessions: [],
      pagination: { page, limit, total: 0, totalPages: 0 },
    };
  }

  /**
   * ============================================
   * SESSION STATISTICS
   * ============================================
   */
  static async getSessionStats(): Promise<SessionStats> {
    return {
      totalSessions: 0,
      todaySessions: 0,
      activeSessions: 0,
      averageDuration: 25,
      completionRate: 90,
      byStatus: {},
      qualityMetrics: {
        averageLatency: 50,
        averagePacketLoss: 0.5,
        averageQualityScore: 4.2,
      },
      dailySessions: [],
    };
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private static generateRoomToken(roomId: string, patientId: string, doctorId: string): string {
    // In production, use a proper token generation service
    return Buffer.from(`${roomId}:${patientId}:${doctorId}:${Date.now()}`).toString('base64');
  }

  private static getIceServers(): IceServer[] {
    return [
      {
        urls: [
          'stun:stun.l.google.com:19302',
          'stun:stun1.l.google.com:19302',
        ],
      },
      {
        urls: process.env.TURN_SERVER_URL || 'turn:turn.voicemedpro.com:3478',
        username: process.env.TURN_SERVER_USERNAME || 'voicemed',
        credential: process.env.TURN_SERVER_CREDENTIAL || 'turn-password',
      },
    ];
  }
}