// ============================================
// DASHBOARD STATS
// ============================================

export interface DashboardStats {
  overview: OverviewStats;
  appointments: AppointmentAnalytics;
  patients: PatientAnalytics;
  revenue: RevenueAnalytics;
  ai: AiAnalytics;
  operational: OperationalKPIs;
}

export interface OverviewStats {
  totalPatients: number;
  totalDoctors: number;
  totalAppointments: number;
  totalRevenue: number;
  patientGrowth: number; // percentage
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
  rescheduled: number;
  completionRate: number;
  cancellationRate: number;
  noShowRate: number;
  averageWaitTime: number;
  averageConsultationTime: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  hourlyDistribution: HourlyData[];
  dailyDistribution: DailyData[];
  weeklyTrend: WeeklyTrend[];
  monthlyTrend: MonthlyTrend[];
  topDoctors: TopDoctor[];
  peakHours: PeakHour[];
}

export interface PatientAnalytics {
  total: number;
  active: number;
  inactive: number;
  newThisMonth: number;
  newThisYear: number;
  retentionRate: number;
  averageVisits: number;
  genderDistribution: GenderDistribution;
  ageDistribution: AgeDistribution;
  bloodGroupDistribution: Record<string, number>;
  topConditions: ConditionStat[];
  topAllergies: AllergyStat[];
  patientGrowth: MonthlyTrend[];
  geographicDistribution: GeographicData[];
}

export interface RevenueAnalytics {
  totalRevenue: number;
  thisMonth: number;
  lastMonth: number;
  thisYear: number;
  averagePerPatient: number;
  averagePerAppointment: number;
  revenueByMethod: Record<string, number>;
  revenueByService: ServiceRevenue[];
  monthlyRevenue: MonthlyRevenue[];
  dailyRevenue: DailyRevenue[];
  outstandingAmount: number;
  collectionRate: number;
  refundRate: number;
}

export interface AiAnalytics {
  totalVoiceInteractions: number;
  totalCalls: number;
  aiResolvedCalls: number;
  handoffRate: number;
  averageConfidence: number;
  callSuccessRate: number;
  missedCallRate: number;
  escalationRate: number;
  voiceInteractionTypes: Record<string, number>;
  callOutcomes: Record<string, number>;
  dailyCallVolume: DailyData[];
  agentTaskCompletion: number;
  averageResponseTime: number;
}

export interface OperationalKPIs {
  patientSatisfaction: number; // NPS score
  appointmentBookingRate: number;
  checkInToConsultationTime: number; // minutes
  missedCallRate: number;
  systemUptime: number; // percentage
  blockchainVerificationRate: number;
  emrDigitalAdoptionRate: number;
  staffProductivity: StaffProductivity[];
}

// ============================================
// CHART DATA TYPES
// ============================================

export interface HourlyData {
  hour: number;
  count: number;
  label: string;
}

export interface DailyData {
  date: string;
  count: number;
  label: string;
}

export interface WeeklyTrend {
  week: string;
  startDate: string;
  endDate: string;
  count: number;
  value: number;
}

export interface MonthlyTrend {
  month: string;
  year: number;
  count: number;
  value: number;
  label: string;
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
  count: number;
}

export interface DailyRevenue {
  date: string;
  revenue: number;
  count: number;
}

export interface TopDoctor {
  id: string;
  name: string;
  specialization: string | null;
  avatarUrl: string | null;
  totalAppointments: number;
  completedAppointments: number;
  averageRating: number;
  revenue: number;
}

export interface PeakHour {
  hour: number;
  count: number;
  percentage: number;
  label: string;
}

export interface GenderDistribution {
  male: number;
  female: number;
  other: number;
  malePercentage: number;
  femalePercentage: number;
}

export interface AgeDistribution {
  child: number;   // 0-12
  teen: number;    // 13-19
  adult: number;   // 20-39
  middleAge: number; // 40-59
  senior: number;  // 60+
  averageAge: number;
}

export interface ConditionStat {
  condition: string;
  count: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
}

export interface AllergyStat {
  allergy: string;
  count: number;
  percentage: number;
}

export interface GeographicData {
  city: string;
  state: string;
  country: string;
  count: number;
  percentage: number;
}

export interface ServiceRevenue {
  service: string;
  revenue: number;
  count: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
}

export interface StaffProductivity {
  id: string;
  name: string;
  role: string;
  appointments: number;
  patients: number;
  revenue: number;
  hoursWorked: number;
  productivityScore: number;
}

// ============================================
// FILTER OPTIONS
// ============================================

export interface AnalyticsFilters {
  dateFrom?: string;
  dateTo?: string;
  organizationId?: string;
  branchId?: string;
  doctorId?: string;
  period?: 'today' | 'yesterday' | 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'this_year' | 'custom';
  compareWithPrevious?: boolean;
}

export interface ExportOptions {
  format: 'pdf' | 'csv' | 'excel';
  sections?: string[];
  dateFrom?: string;
  dateTo?: string;
  organizationId?: string;
}