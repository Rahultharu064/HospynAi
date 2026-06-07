"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelemedicineService = void 0;
const uuid_1 = require("uuid");
const prisma_1 = __importDefault(require("../../../config/prisma"));
const errors_1 = require("../../../utils/errors");
const logger_1 = __importDefault(require("../../../utils/logger"));
class TelemedicineService {
    /**
     * ============================================
     * CREATE TELEMEDICINE SESSION
     * ============================================
     */
    static async createSession(data, userId, ipAddress, userAgent) {
        // Validate appointment
        const appointment = await prisma_1.default.appointment.findUnique({
            where: { id: data.appointmentId },
            include: {
                patient: { select: { id: true, firstName: true, lastName: true, patientId: true } },
                doctor: {
                    select: { id: true, firstName: true, lastName: true },
                    include: { doctorProfile: { select: { specialization: true } } },
                },
            },
        });
        if (!appointment)
            throw new errors_1.NotFoundError('Appointment not found');
        if (appointment.type !== 'TELEMEDICINE') {
            throw new errors_1.BadRequestError('Appointment is not a telemedicine appointment');
        }
        if (appointment.status !== 'SCHEDULED' && appointment.status !== 'CONFIRMED') {
            throw new errors_1.BadRequestError('Appointment is not in a valid state for telemedicine');
        }
        // Check if patient and doctor match
        if (appointment.patientId !== data.patientId) {
            throw new errors_1.BadRequestError('Patient does not match appointment');
        }
        if (appointment.doctorId !== data.doctorId) {
            throw new errors_1.BadRequestError('Doctor does not match appointment');
        }
        // Generate room ID and token
        const roomId = `room_${(0, uuid_1.v4)()}`;
        const token = this.generateRoomToken(roomId, data.patientId, data.doctorId);
        // Get ICE servers
        const iceServers = this.getIceServers();
        // Create session record
        const session = {
            id: (0, uuid_1.v4)(),
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
            status: 'WAITING',
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
        await prisma_1.default.appointment.update({
            where: { id: data.appointmentId },
            data: { status: 'IN_PROGRESS' },
        });
        logger_1.default.info(`Telemedicine session created: ${roomId}`);
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
    static async endSession(sessionId, reason, notes, userId) {
        const endedAt = new Date();
        const duration = 30; // Would calculate from actual start/end
        logger_1.default.info(`Telemedicine session ended: ${sessionId}`);
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
    static async listSessions(query) {
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
    static async getSessionStats() {
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
    static generateRoomToken(roomId, patientId, doctorId) {
        // In production, use a proper token generation service
        return Buffer.from(`${roomId}:${patientId}:${doctorId}:${Date.now()}`).toString('base64');
    }
    static getIceServers() {
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
exports.TelemedicineService = TelemedicineService;
//# sourceMappingURL=telemedicineService.js.map