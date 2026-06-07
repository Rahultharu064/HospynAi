import { CreateSessionInput, SessionQueryInput } from '../validators/telemedicineValidators';
import { TelemedicineSessionResponse, SessionListResponse, SessionStats, RoomInfo } from '../../../types/telemedicineTypes';
export declare class TelemedicineService {
    /**
     * ============================================
     * CREATE TELEMEDICINE SESSION
     * ============================================
     */
    static createSession(data: CreateSessionInput, userId: string, ipAddress: string, userAgent: string): Promise<{
        session: TelemedicineSessionResponse;
        roomInfo: RoomInfo;
    }>;
    /**
     * ============================================
     * END SESSION
     * ============================================
     */
    static endSession(sessionId: string, reason: string | null, notes: string | null, userId: string): Promise<TelemedicineSessionResponse>;
    /**
     * ============================================
     * LIST SESSIONS
     * ============================================
     */
    static listSessions(query: SessionQueryInput): Promise<SessionListResponse>;
    /**
     * ============================================
     * SESSION STATISTICS
     * ============================================
     */
    static getSessionStats(): Promise<SessionStats>;
    private static generateRoomToken;
    private static getIceServers;
}
//# sourceMappingURL=telemedicineService.d.ts.map