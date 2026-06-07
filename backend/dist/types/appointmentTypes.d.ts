import { AppointmentStatus, AppointmentType, PaymentStatus } from '@prisma/client';
export interface CreateAppointmentDto {
    patientId: string;
    doctorId: string;
    branchId?: string;
    organizationId?: string;
    appointmentDate: string;
    startTime: string;
    endTime?: string;
    duration?: number;
    type?: AppointmentType;
    reason?: string;
    symptoms?: string;
    notes?: string;
    isFollowUp?: boolean;
    followUpForId?: string;
}
export interface UpdateAppointmentDto {
    appointmentDate?: string;
    startTime?: string;
    endTime?: string;
    type?: AppointmentType;
    status?: AppointmentStatus;
    reason?: string;
    symptoms?: string;
    notes?: string;
}
export interface RescheduleAppointmentDto {
    appointmentDate: string;
    startTime: string;
    endTime?: string;
    reason?: string;
}
export interface AppointmentQueryDto {
    page?: number;
    limit?: number;
    patientId?: string;
    doctorId?: string;
    branchId?: string;
    organizationId?: string;
    status?: AppointmentStatus;
    type?: AppointmentType;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export interface QueueTokenDto {
    patientId: string;
    doctorId: string;
    branchId?: string;
    appointmentType?: AppointmentType;
    reason?: string;
}
export interface AppointmentResponse {
    id: string;
    appointmentId: string;
    patient: {
        id: string;
        patientId: string;
        firstName: string;
        lastName: string;
        phone: string | null;
        email: string | null;
        dateOfBirth: string | null;
        gender: string | null;
        bloodGroup: string | null;
    };
    doctor: {
        id: string;
        firstName: string;
        lastName: string;
        specialization: string | null;
        avatarUrl: string | null;
    };
    branch: {
        id: string;
        name: string;
    } | null;
    appointmentDate: string;
    startTime: string;
    endTime: string;
    duration: number;
    type: AppointmentType;
    status: AppointmentStatus;
    reason: string | null;
    symptoms: string | null;
    notes: string | null;
    queueToken: string | null;
    queuePosition: number | null;
    estimatedWait: number | null;
    actualStartTime: string | null;
    actualEndTime: string | null;
    cancelledAt: string | null;
    cancelledBy: string | null;
    cancelReason: string | null;
    isFollowUp: boolean;
    followUpFor: {
        id: string;
        appointmentId: string;
        appointmentDate: string;
    } | null;
    payment: {
        id: string;
        invoiceId: string;
        amount: number;
        status: PaymentStatus;
    } | null;
    createdBy: {
        id: string;
        firstName: string;
        lastName: string;
    };
    createdAt: string;
    updatedAt: string;
}
export interface AppointmentListResponse {
    appointments: AppointmentResponse[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
export interface QueueResponse {
    queueToken: string;
    queuePosition: number;
    estimatedWait: number;
    patientName: string;
    status: AppointmentStatus;
}
export interface QueueListResponse {
    doctorId: string;
    doctorName: string;
    totalWaiting: number;
    averageWaitTime: number;
    queue: QueueResponse[];
}
export interface SlotAvailability {
    date: string;
    slots: TimeSlot[];
}
export interface TimeSlot {
    startTime: string;
    endTime: string;
    isAvailable: boolean;
    isBooked: boolean;
}
export interface AppointmentStats {
    totalAppointments: number;
    todayAppointments: number;
    completedToday: number;
    cancelledToday: number;
    noShowToday: number;
    waitingInQueue: number;
    averageWaitTime: number;
    appointmentTypeDistribution: Record<string, number>;
    statusDistribution: Record<string, number>;
    peakHours: Array<{
        hour: number;
        count: number;
    }>;
    monthlyTrend: Array<{
        month: string;
        count: number;
    }>;
}
//# sourceMappingURL=appointmentTypes.d.ts.map