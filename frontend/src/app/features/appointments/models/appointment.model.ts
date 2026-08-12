export type AppointmentStatus =
  | 'SCHEDULED'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW'
  | 'RESCHEDULED';

export type AppointmentType = 'IN_PERSON' | 'TELEMEDICINE' | 'WALK_IN' | 'EMERGENCY' | 'FOLLOW_UP';

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
  branch: { id: string; name: string } | null;
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
  followUpFor: { id: string; appointmentId: string; appointmentDate: string } | null;
  payment: { id: string; invoiceId: string; amount: number; status: string } | null;
  createdBy: { id: string; firstName: string; lastName: string };
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppointmentRequest {
  patientId: string;
  doctorId: string;
  branchId?: string;
  appointmentDate: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  type?: AppointmentType;
  reason?: string;
  symptoms?: string;
  notes?: string;
}

export interface AppointmentQuery {
  page?: number;
  limit?: number;
  patientId?: string;
  doctorId?: string;
  status?: AppointmentStatus;
  type?: AppointmentType;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface SlotAvailability {
  date: string;
  slots: TimeSlot[];
}

export interface QueueTokenRequest {
  patientId: string;
  doctorId: string;
  branchId?: string;
  appointmentType?: AppointmentType;
  reason?: string;
}

export const APPOINTMENT_TYPES: AppointmentType[] = ['IN_PERSON', 'TELEMEDICINE', 'WALK_IN', 'EMERGENCY', 'FOLLOW_UP'];
