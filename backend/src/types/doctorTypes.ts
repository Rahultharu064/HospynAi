export interface CreateDoctorDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  specialization?: string;
  subSpecialization?: string;
  qualification?: string;
  experience?: number;
  licenseNumber?: string;
  licenseExpiry?: string;
  biography?: string;
  consultationFee?: number;
  telemedicineFee?: number;
  followUpFee?: number;
  maxPatientsPerDay?: number;
  availableForTelemed?: boolean;
  timezone?: string;
  organizationId?: string;
  branchId?: string;
  schedule?: WeeklyScheduleDto;
}

export interface UpdateDoctorDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  specialization?: string;
  subSpecialization?: string;
  qualification?: string;
  experience?: number;
  licenseNumber?: string;
  licenseExpiry?: string;
  biography?: string;
  consultationFee?: number;
  telemedicineFee?: number;
  followUpFee?: number;
  maxPatientsPerDay?: number;
  availableForTelemed?: boolean;
  timezone?: string;
  status?: string;
}

export interface WeeklyScheduleDto {
  days: DayScheduleDto[];
}

export interface DayScheduleDto {
  dayOfWeek: number; // 0=Sunday, 6=Saturday
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  slotDuration?: number; // minutes, default 15
  isActive?: boolean;
  breakStart?: string;
  breakEnd?: string;
}

export interface DoctorQueryDto {
  page?: number;
  limit?: number;
  search?: string;
  specialization?: string;
  organizationId?: string;
  branchId?: string;
  availableForTelemed?: boolean;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DoctorResponse {
  id: string;
  userId: string;
  email: string;
  phone: string | null;
  firstName: string;
  lastName: string;
  fullName: string;
  avatarUrl: string | null;
  role: string;
  status: string;
  specialization: string | null;
  subSpecialization: string | null;
  qualification: string | null;
  experience: number | null;
  licenseNumber: string | null;
  licenseExpiry: string | null;
  biography: string | null;
  consultationFee: number | null;
  telemedicineFee: number | null;
  followUpFee: number | null;
  maxPatientsPerDay: number | null;
  availableForTelemed: boolean;
  timezone: string;
  isEmailVerified: boolean;
  schedule: DayScheduleResponse[];
  organization: {
    id: string;
    name: string;
  } | null;
  branch: {
    id: string;
    name: string;
  } | null;
  stats: DoctorStats;
  createdAt: string;
  updatedAt: string;
}

export interface DayScheduleResponse {
  id: string;
  dayOfWeek: number;
  dayName: string;
  startTime: string;
  endTime: string;
  slotDuration: number;
  isActive: boolean;
  breakStart: string | null;
  breakEnd: string | null;
}

export interface DoctorListResponse {
  doctors: DoctorResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DoctorStats {
  totalPatients: number;
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  todayAppointments: number;
  averageRating: number;
  totalReviews: number;
}

export interface DoctorAvailabilityResponse {
  doctorId: string;
  doctorName: string;
  availability: DayAvailability[];
}

export interface DayAvailability {
  date: string;
  dayName: string;
  isAvailable: boolean;
  slots: TimeSlotResponse[];
}

export interface TimeSlotResponse {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  isBooked: boolean;
}