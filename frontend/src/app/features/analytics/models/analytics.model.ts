export interface OverviewStats {
  totalPatients: number;
  totalDoctors: number;
  totalAppointments: number;
  totalRevenue: number;
  patientGrowth: number;
  appointmentGrowth: number;
  revenueGrowth: number;
  todayAppointments: number;
  waitingPatients: number;
}

export interface AppointmentAnalytics {
  total: number;
  completed: number;
  cancelled: number;
  noShow: number;
  completionRate: number;
  cancellationRate: number;
  noShowRate: number;
  averageWaitTime: number;
  byType: Record<string, number>;
  weeklyTrend: { week: string; count: number }[];
  topDoctors: { doctorId: string; name: string; count: number }[];
}

export interface RevenueAnalytics {
  total: number;
  collected: number;
  pending: number;
  overdue: number;
  byMethod: Record<string, number>;
  monthlyTrend: { month: string; amount: number }[];
}

export interface PatientAnalytics {
  total: number;
  newThisMonth: number;
  genderDistribution: Record<string, number>;
  ageDistribution: Record<string, number>;
}

export interface DashboardStats {
  overview: OverviewStats;
  appointments: AppointmentAnalytics;
  patients: PatientAnalytics;
  revenue: RevenueAnalytics;
}
