import { CreateDoctorInput, UpdateDoctorInput, UpdateScheduleInput, DoctorQueryInput } from '../validators/doctor.validator';
import { DoctorResponse, DoctorListResponse, DoctorAvailabilityResponse, DayScheduleResponse } from '../types/doctor.types';
export declare class DoctorService {
    /**
     * ============================================
     * CREATE DOCTOR
     * ============================================
     */
    static createDoctor(data: CreateDoctorInput, userId: string, ipAddress: string, userAgent: string): Promise<DoctorResponse>;
    /**
     * ============================================
     * GET DOCTOR BY ID
     * ============================================
     */
    static getDoctorById(id: string): Promise<DoctorResponse>;
    /**
     * ============================================
     * LIST DOCTORS
     * ============================================
     */
    static listDoctors(query: DoctorQueryInput): Promise<DoctorListResponse>;
    /**
     * ============================================
     * UPDATE DOCTOR
     * ============================================
     */
    static updateDoctor(id: string, data: UpdateDoctorInput, userId: string, ipAddress: string, userAgent: string): Promise<DoctorResponse>;
    /**
     * ============================================
     * UPDATE SCHEDULE
     * ============================================
     */
    static updateSchedule(id: string, data: UpdateScheduleInput, userId: string, ipAddress: string, userAgent: string): Promise<DayScheduleResponse[]>;
    /**
     * ============================================
     * GET DOCTOR AVAILABILITY
     * ============================================
     */
    static getDoctorAvailability(doctorId: string, dateFrom: string, dateTo?: string): Promise<DoctorAvailabilityResponse>;
    /**
     * ============================================
     * DELETE DOCTOR
     * ============================================
     */
    static deleteDoctor(id: string, userId: string, ipAddress: string, userAgent: string): Promise<void>;
    /**
     * ============================================
     * HELPER METHODS
     * ============================================
     */
    private static generateTimeSlots;
    private static getDoctorInclude;
    private static formatDoctorResponse;
}
//# sourceMappingURL=doctorService.d.ts.map