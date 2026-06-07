import { CreateAppointmentInput, UpdateAppointmentInput, RescheduleAppointmentInput, AppointmentQueryInput } from '../validators/appointmentValidator';
import { AppointmentResponse, AppointmentListResponse, SlotAvailability, AppointmentStats } from '../../../types/appointmentTypes';
export declare class AppointmentService {
    /**
     * ============================================
     * CREATE APPOINTMENT
     * ============================================
     */
    static createAppointment(data: CreateAppointmentInput, userId: string, ipAddress: string, userAgent: string): Promise<AppointmentResponse>;
    /**
     * ============================================
     * GET APPOINTMENT BY ID
     * ============================================
     */
    static getAppointmentById(id: string): Promise<AppointmentResponse>;
    /**
     * ============================================
     * LIST APPOINTMENTS WITH FILTERING
     * ============================================
     */
    static listAppointments(query: AppointmentQueryInput): Promise<AppointmentListResponse>;
    /**
     * ============================================
     * UPDATE APPOINTMENT
     * ============================================
     */
    static updateAppointment(id: string, data: UpdateAppointmentInput, userId: string, ipAddress: string, userAgent: string): Promise<AppointmentResponse>;
    /**
     * ============================================
     * RESCHEDULE APPOINTMENT
     * ============================================
     */
    static rescheduleAppointment(id: string, data: RescheduleAppointmentInput, userId: string, ipAddress: string, userAgent: string): Promise<AppointmentResponse>;
    /**
     * ============================================
     * CANCEL APPOINTMENT
     * ============================================
     */
    static cancelAppointment(id: string, reason: string | null, userId: string, ipAddress: string, userAgent: string): Promise<AppointmentResponse>;
    /**
     * ============================================
     * GET AVAILABLE SLOTS
     * ============================================
     */
    static getAvailableSlots(doctorId: string, date: string, branchId?: string): Promise<SlotAvailability>;
    /**
     * ============================================
     * APPOINTMENT STATISTICS
     * ============================================
     */
    static getAppointmentStats(organizationId?: string, doctorId?: string, dateFrom?: string, dateTo?: string): Promise<AppointmentStats>;
    /**
     * ============================================
     * HELPER METHODS
     * ============================================
     */
    private static generateAppointmentId;
    private static checkSchedulingConflict;
    private static checkPatientConflict;
    private static sendAppointmentNotifications;
    private static getNotificationSubject;
    private static getSmsMessage;
    private static getNotificationTemplate;
    private static getAppointmentInclude;
    private static formatAppointmentResponse;
}
//# sourceMappingURL=appointmentService.d.ts.map