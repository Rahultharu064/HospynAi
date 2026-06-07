import { AppointmentStatus } from '@prisma/client';
import { QueueTokenInput } from '../validators/appointmentValidator';
import { QueueResponse, QueueListResponse } from '../../../types/appointmentTypes';
export declare class QueueService {
    /**
     * ============================================
     * GENERATE QUEUE TOKEN
     * ============================================
     */
    static generateQueueToken(data: QueueTokenInput, userId: string, ipAddress: string, userAgent: string): Promise<QueueResponse>;
    /**
     * ============================================
     * GET DOCTOR'S QUEUE
     * ============================================
     */
    static getDoctorQueue(doctorId: string): Promise<QueueListResponse>;
    /**
     * ============================================
     * CALL NEXT PATIENT
     * ============================================
     */
    static callNextPatient(doctorId: string, userId: string, ipAddress: string, userAgent: string): Promise<QueueResponse | null>;
    /**
     * ============================================
     * MARK AS NO-SHOW
     * ============================================
     */
    static markNoShow(appointmentId: string, userId: string, ipAddress: string, userAgent: string): Promise<void>;
    /**
     * ============================================
     * COMPLETE APPOINTMENT
     * ============================================
     */
    static completeAppointment(appointmentId: string, userId: string, ipAddress: string, userAgent: string): Promise<void>;
    /**
     * ============================================
     * RECALCULATE QUEUE
     * ============================================
     */
    static recalculateQueue(doctorId: string, userId: string, ipAddress: string, userAgent: string): Promise<void>;
    /**
     * ============================================
     * BULK UPDATE QUEUE STATUS
     * ============================================
     */
    static bulkUpdateStatus(appointmentIds: string[], status: AppointmentStatus, userId: string, ipAddress: string, userAgent: string): Promise<{
        success: number;
        failed: number;
        errors: string[];
    }>;
    /**
     * ============================================
     * HELPER METHODS
     * ============================================
     */
    private static generateUniqueQueueToken;
    private static generateAppointmentId;
    private static calculateQueuePosition;
    private static calculateEstimatedWait;
    /**
     * ============================================
     * GET LIVE QUEUE STATUS
     * ============================================
     */
    static getLiveQueueStatus(branchId?: string): Promise<any[]>;
    /**
     * ============================================
     * SEND APPOINTMENT REMINDERS
     * ============================================
     */
    static sendReminders(): Promise<void>;
}
//# sourceMappingURL=queueService.d.ts.map