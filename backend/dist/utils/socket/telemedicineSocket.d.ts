import { Server } from 'socket.io';
interface RoomParticipant {
    userId: string;
    socketId: string;
    role: 'DOCTOR' | 'PATIENT';
    joinedAt: Date;
    status: 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED';
}
export declare function setupTelemedicineSocket(io: Server): void;
/**
 * Get active rooms info
 */
export declare function getActiveRooms(): Map<string, Map<string, RoomParticipant>>;
/**
 * Get room participants
 */
export declare function getRoomParticipants(roomId: string): Map<string, RoomParticipant> | undefined;
export {};
//# sourceMappingURL=telemedicineSocket.d.ts.map