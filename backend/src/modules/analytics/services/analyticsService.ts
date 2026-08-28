import { Prisma, AppointmentStatus, PaymentStatus, PatientStatus, Gender } from '@prisma/client';
import prisma from '../../../config/prisma';
import {
  DashboardStats,
  OverviewStats,
  AppointmentAnalytics,
  PatientAnalytics,
  RevenueAnalytics,
  AiAnalytics,
  OperationalKPIs,
  AnalyticsFilters,
  MonthlyTrend,
  TopDoctor,
  PeakHour,
  ConditionStat,
  ServiceRevenue,
} from '../../../types/analyticsTypes';
import logger from '../../../utils/logger';

export class AnalyticsService {
  /**
   * ============================================
   * DASHBOARD OVERVIEW
   * ============================================
   */
  static async getDashboardStats(filters?: AnalyticsFilters): Promise<DashboardStats> {
    const dateRange = this.getDateRange(filters);

    const [
      overview,
      appointments,
      patients,
      revenue,
      ai,
      operational,
    ] = await Promise.all([
      this.getOverviewStats(dateRange, filters),
      this.getAppointmentAnalytics(dateRange, filters),
      this.getPatientAnalytics(dateRange, filters),
      this.getRevenueAnalytics(dateRange, filters),
      this.getAiAnalytics(dateRange, filters),
      this.getOperationalKPIs(dateRange, filters),
    ]);

    return {
      overview,
      appointments,
      patients,
      revenue,
      ai,
      operational,
    };
  }

  /**
   * ============================================
   * OVERVIEW STATS
   * ============================================
   */
  private static async getOverviewStats(
    dateRange: { start: Date; end: Date },
    filters?: AnalyticsFilters
  ): Promise<OverviewStats> {
    const where = this.buildWhereClause(filters);
    const prevDateRange = this.getPreviousPeriod(dateRange);

    const [
      totalPatients,
      totalDoctors,
      totalAppointments,
      totalRevenue,
      prevPatients,
      prevAppointments,
      prevRevenue,
      todayAppointments,
      waitingPatients,
    ] = await Promise.all([
      prisma.patient.count({ where: { ...where, deletedAt: null } }),
      prisma.user.count({ where: { ...where, role: 'DOCTOR', status: 'ACTIVE' } }),
      prisma.appointment.count({ where: { ...where, createdAt: { gte: dateRange.start, lte: dateRange.end } } }),
      prisma.payment.aggregate({
        where: { ...where, status: 'COMPLETED', paidAt: { gte: dateRange.start, lte: dateRange.end } },
        _sum: { totalAmount: true },
      }),

      prisma.patient.count({ where: { ...where, deletedAt: null, createdAt: { lte: prevDateRange.end } } }),
      prisma.appointment.count({ where: { ...where, createdAt: { gte: prevDateRange.start, lte: prevDateRange.end } } }),
      prisma.payment.aggregate({
        where: { ...where, status: 'COMPLETED', paidAt: { gte: prevDateRange.start, lte: prevDateRange.end } },
        _sum: { totalAmount: true },
      }),

      // Today's appointments
      prisma.appointment.count({
        where: {
          ...where,
          appointmentDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      }),

      // Waiting patients in queue
      prisma.appointment.count({
        where: {
          ...where,
          status: { in: ['SCHEDULED', 'CONFIRMED'] },
          queueToken: { not: null },
          appointmentDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      }),
    ]);

    const currentRevenue = Number(totalRevenue._sum.totalAmount || 0);
    const previousRevenue = Number(prevRevenue._sum.totalAmount || 0);

    return {
      totalPatients,
      totalDoctors,
      totalAppointments,
      totalRevenue: currentRevenue,
      patientGrowth: prevPatients > 0 ? ((totalPatients - prevPatients) / prevPatients) * 100 : 0,
      appointmentGrowth: prevAppointments > 0 ? ((totalAppointments - prevAppointments) / prevAppointments) * 100 : 0,
      revenueGrowth: previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0,
      todayAppointments,
      waitingPatients,
    };
  }

  /**
   * ============================================
   * APPOINTMENT ANALYTICS
   * ============================================
   */
  private static async getAppointmentAnalytics(
    dateRange: { start: Date; end: Date },
    filters?: AnalyticsFilters
  ): Promise<AppointmentAnalytics> {
    const where = {
      ...this.buildWhereClause(filters),
      createdAt: { gte: dateRange.start, lte: dateRange.end },
    };

    const [
      total,
      completed,
      cancelled,
      noShow,
      rescheduled,
      byType,
      byStatus,
      hourlyDistribution,
      dailyDistribution,
      weeklyTrend,
      monthlyTrend,
      topDoctors,
      peakHours,
    ] = await Promise.all([
      prisma.appointment.count({ where }),
      prisma.appointment.count({ where: { ...where, status: 'COMPLETED' } }),
      prisma.appointment.count({ where: { ...where, status: 'CANCELLED' } }),
      prisma.appointment.count({ where: { ...where, status: 'NO_SHOW' } }),
      prisma.appointment.count({ where: { ...where, status: 'RESCHEDULED' } }),

      prisma.appointment.groupBy({ by: ['type'], where, _count: true }),
      prisma.appointment.groupBy({ by: ['status'], where, _count: true }),

      // Hourly distribution
      prisma.$queryRaw<Array<{ hour: number; count: bigint }>>`
        SELECT EXTRACT(HOUR FROM "start_time"::time) as hour, COUNT(*) as count
        FROM appointments
        WHERE "created_at" >= ${dateRange.start} AND "created_at" <= ${dateRange.end}
        GROUP BY hour ORDER BY hour
      `,

      // Daily distribution
      prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
        SELECT DATE("appointment_date") as date, COUNT(*) as count
        FROM appointments
        WHERE "created_at" >= ${dateRange.start} AND "created_at" <= ${dateRange.end}
        GROUP BY date ORDER BY date
      `,

      // Weekly trend (last 12 weeks)
      this.getWeeklyTrend(dateRange, where),

      // Monthly trend (last 12 months)
      this.getMonthlyTrend(dateRange, where),

      // Top doctors
      this.getTopDoctors(dateRange, filters),

      // Peak hours
      this.getPeakHours(dateRange, where),
    ]);

    const byTypeMap: Record<string, number> = {};
    byType.forEach((t) => { byTypeMap[t.type] = t._count; });

    const byStatusMap: Record<string, number> = {};
    byStatus.forEach((s) => { byStatusMap[s.status] = s._count; });

    return {
      total,
      completed,
      cancelled,
      noShow,
      rescheduled,
      completionRate: total > 0 ? (completed / total) * 100 : 0,
      cancellationRate: total > 0 ? (cancelled / total) * 100 : 0,
      noShowRate: total > 0 ? (noShow / total) * 100 : 0,
      averageWaitTime: 15, // Would be calculated from actual queue data
      averageConsultationTime: 20,
      byType: byTypeMap,
      byStatus: byStatusMap,
      hourlyDistribution: (hourlyDistribution as any[]).map((h: any) => ({
        hour: Number(h.hour),
        count: Number(h.count),
        label: `${String(h.hour).padStart(2, '0')}:00`,
      })),
      dailyDistribution: (dailyDistribution as any[]).map((d: any) => ({
        date: d.date,
        count: Number(d.count),
        label: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      })),
      weeklyTrend,
      monthlyTrend,
      topDoctors,
      peakHours,
    };
  }

  /**
   * ============================================
   * PATIENT ANALYTICS
   * ============================================
   */
  private static async getPatientAnalytics(
    dateRange: { start: Date; end: Date },
    filters?: AnalyticsFilters
  ): Promise<PatientAnalytics> {
    const where = { ...this.buildWhereClause(filters), deletedAt: null };

    const [
      total,
      active,
      inactive,
      newThisMonth,
      newThisYear,
      genderCounts,
      bloodGroupCounts,
      topConditions,
      patientGrowth,
    ] = await Promise.all([
      prisma.patient.count({ where }),
      prisma.patient.count({ where: { ...where, status: 'ACTIVE' } }),
      prisma.patient.count({ where: { ...where, status: 'INACTIVE' } }),

      prisma.patient.count({
        where: {
          ...where,
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),

      prisma.patient.count({
        where: {
          ...where,
          createdAt: {
            gte: new Date(new Date().getFullYear(), 0, 1),
          },
        },
      }),

      prisma.patient.groupBy({ by: ['gender'], where, _count: true }),
      prisma.patient.groupBy({ by: ['bloodGroup'], where, _count: true }),

      // Top conditions
      prisma.patient.findMany({
        where,
        select: { chronicConditions: true },
      }),

      // Patient growth monthly
      this.getPatientGrowthMonthly(dateRange, where),
    ]);

    // Process gender distribution
    const genderMap = { male: 0, female: 0, other: 0 };
    genderCounts.forEach((g) => {
      if (g.gender === Gender.MALE) genderMap.male = g._count;
      else if (g.gender === Gender.FEMALE) genderMap.female = g._count;
      else genderMap.other += g._count;
    });

    const totalGender = genderMap.male + genderMap.female + genderMap.other;

    // Process blood group
    const bloodGroupMap: Record<string, number> = {};
    bloodGroupCounts.forEach((bg) => {
      if (bg.bloodGroup) bloodGroupMap[bg.bloodGroup] = bg._count;
    });

    // Process top conditions
    const conditionMap = new Map<string, number>();
    topConditions.forEach((p) => {
      p.chronicConditions.forEach((c) => {
        conditionMap.set(c, (conditionMap.get(c) || 0) + 1);
      });
    });

    const conditionsList: ConditionStat[] = Array.from(conditionMap.entries())
      .map(([condition, count]) => ({
        condition,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
        trend: 'stable' as const,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Calculate average visits
    const totalAppointments = await prisma.appointment.count({
      where: { createdAt: { gte: dateRange.start, lte: dateRange.end } },
    });

    return {
      total,
      active,
      inactive,
      newThisMonth,
      newThisYear,
      retentionRate: 85, // Placeholder
      averageVisits: total > 0 ? totalAppointments / total : 0,
      genderDistribution: {
        male: genderMap.male,
        female: genderMap.female,
        other: genderMap.other,
        malePercentage: totalGender > 0 ? (genderMap.male / totalGender) * 100 : 0,
        femalePercentage: totalGender > 0 ? (genderMap.female / totalGender) * 100 : 0,
      },
      ageDistribution: {
        child: 0, teen: 0, adult: 0, middleAge: 0, senior: 0, averageAge: 35,
      },
      bloodGroupDistribution: bloodGroupMap,
      topConditions: conditionsList,
      topAllergies: [],
      patientGrowth,
      geographicDistribution: [],
    };
  }

  /**
   * ============================================
   * REVENUE ANALYTICS
   * ============================================
   */
  private static async getRevenueAnalytics(
    dateRange: { start: Date; end: Date },
    filters?: AnalyticsFilters
  ): Promise<RevenueAnalytics> {
    const where = {
      ...this.buildWhereClause(filters),
      status: PaymentStatus.COMPLETED,
      paidAt: { gte: dateRange.start, lte: dateRange.end },
    };

    const prevDateRange = this.getPreviousPeriod(dateRange);

    const [
      totalRevenue,
      thisMonth,
      lastMonth,
      thisYear,
      revenueByMethod,
      monthlyRevenue,
      outstanding,
      refunded,
    ] = await Promise.all([
      prisma.payment.aggregate({ where, _sum: { totalAmount: true } }),

      prisma.payment.aggregate({
        where: {
          ...where,
          paidAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
        _sum: { totalAmount: true },
      }),

      prisma.payment.aggregate({
        where: {
          ...where,
          paidAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
            lt: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
        _sum: { totalAmount: true },
      }),

      prisma.payment.aggregate({
        where: {
          ...where,
          paidAt: { gte: new Date(new Date().getFullYear(), 0, 1) },
        },
        _sum: { totalAmount: true },
      }),

      prisma.payment.groupBy({ by: ['method'], where, _sum: { totalAmount: true } }),

      this.getMonthlyRevenue(dateRange, where),

      prisma.payment.aggregate({
        where: { ...this.buildWhereClause(filters), status: 'PENDING' },
        _sum: { totalAmount: true },
      }),

      prisma.payment.aggregate({
        where: { ...this.buildWhereClause(filters), status: { in: ['REFUNDED', 'PARTIALLY_REFUNDED'] } },
        _sum: { refundAmount: true },
      }),
    ]);

    const totalRev = Number(totalRevenue._sum.totalAmount || 0);

    const byMethodMap: Record<string, number> = {};
    revenueByMethod.forEach((m) => {
      if (m.method) byMethodMap[m.method] = Number(m._sum.totalAmount || 0);
    });

    return {
      totalRevenue: totalRev,
      thisMonth: Number(thisMonth._sum.totalAmount || 0),
      lastMonth: Number(lastMonth._sum.totalAmount || 0),
      thisYear: Number(thisYear._sum.totalAmount || 0),
      averagePerPatient: 0,
      averagePerAppointment: 0,
      revenueByMethod: byMethodMap,
      revenueByService: [],
      monthlyRevenue,
      dailyRevenue: [],
      outstandingAmount: Number(outstanding._sum.totalAmount || 0),
      collectionRate: 90,
      refundRate: totalRev > 0 ? (Number(refunded._sum.refundAmount || 0) / totalRev) * 100 : 0,
    };
  }

  /**
   * ============================================
   * AI ANALYTICS
   * ============================================
   */
  private static async getAiAnalytics(
    dateRange: { start: Date; end: Date },
    filters?: AnalyticsFilters
  ): Promise<AiAnalytics> {
    const where = {
      createdAt: { gte: dateRange.start, lte: dateRange.end },
    };

    const [
      totalVoice,
      totalCalls,
      totalAgentTasks,
      aiResolved,
      voiceTypes,
      callOutcomes,
    ] = await Promise.all([
      prisma.voiceLog.count({ where }),
      prisma.callLog.count({ where }),
      prisma.agentLog.count({ where }),
      prisma.callLog.count({ where: { ...where, outcome: 'AI_RESOLVED' } }),

      prisma.voiceLog.groupBy({ by: ['interactionType'], where, _count: true }),
      prisma.callLog.groupBy({ by: ['outcome'], where, _count: true }),
    ]);

    const voiceTypesMap: Record<string, number> = {};
    voiceTypes.forEach((v) => { voiceTypesMap[v.interactionType] = v._count; });

    const outcomesMap: Record<string, number> = {};
    callOutcomes.forEach((c) => { outcomesMap[c.outcome] = c._count; });

    return {
      totalVoiceInteractions: totalVoice,
      totalCalls,
      totalAgentTasks,
      aiResolvedCalls: aiResolved,
      handoffRate: totalCalls > 0 ? ((totalCalls - aiResolved) / totalCalls) * 100 : 0,
      averageConfidence: 0.92,
      callSuccessRate: totalCalls > 0 ? (aiResolved / totalCalls) * 100 : 0,
      missedCallRate: totalCalls > 0 ? ((outcomesMap['MISSED'] || 0) / totalCalls) * 100 : 0,
      escalationRate: totalCalls > 0 ? ((outcomesMap['ESCALATED'] || 0) / totalCalls) * 100 : 0,
      voiceInteractionTypes: voiceTypesMap,
      callOutcomes: outcomesMap,
      dailyCallVolume: [],
      agentTaskCompletion: 95,
      averageResponseTime: 2.5,
    };
  }

  /**
   * ============================================
   * OPERATIONAL KPIs
   * ============================================
   */
  private static async getOperationalKPIs(
    dateRange: { start: Date; end: Date },
    filters?: AnalyticsFilters
  ): Promise<OperationalKPIs> {
    return {
      patientSatisfaction: 4.5,
      appointmentBookingRate: 85,
      checkInToConsultationTime: 12,
      missedCallRate: 15,
      systemUptime: 99.9,
      blockchainVerificationRate: 100,
      emrDigitalAdoptionRate: 92,
      staffProductivity: [],
    };
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private static getDateRange(filters?: AnalyticsFilters): { start: Date; end: Date } {
    if (filters?.dateFrom && filters?.dateTo) {
      return { start: new Date(filters.dateFrom), end: new Date(filters.dateTo) };
    }

    const period = filters?.period || 'this_month';
    const now = new Date();
    let start: Date, end: Date;

    switch (period) {
      case 'today':
        start = new Date(now.setHours(0, 0, 0, 0));
        end = new Date(now.setHours(23, 59, 59, 999));
        break;
      case 'yesterday':
        start = new Date(now.setDate(now.getDate() - 1));
        start.setHours(0, 0, 0, 0);
        end = new Date(start);
        end.setHours(23, 59, 59, 999);
        break;
      case 'this_week':
        start = new Date(now.setDate(now.getDate() - now.getDay()));
        start.setHours(0, 0, 0, 0);
        end = new Date();
        break;
      case 'last_week':
        start = new Date(now.setDate(now.getDate() - now.getDay() - 7));
        start.setHours(0, 0, 0, 0);
        end = new Date(start);
        end.setDate(end.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        break;
      case 'this_month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = now;
        break;
      case 'last_month':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        break;
      case 'this_year':
        start = new Date(now.getFullYear(), 0, 1);
        end = now;
        break;
      default:
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = now;
    }

    return { start, end };
  }

  private static getPreviousPeriod(dateRange: { start: Date; end: Date }): { start: Date; end: Date } {
    const duration = dateRange.end.getTime() - dateRange.start.getTime();
    return {
      start: new Date(dateRange.start.getTime() - duration),
      end: new Date(dateRange.start.getTime() - 1),
    };
  }

  private static buildWhereClause(filters?: AnalyticsFilters): any {
    const where: any = {};
    if (filters?.organizationId) where.organizationId = filters.organizationId;
    if (filters?.branchId) where.branchId = filters.branchId;
    if (filters?.doctorId) where.doctorId = filters.doctorId;
    return where;
  }

  private static async getWeeklyTrend(dateRange: any, where: any): Promise<any[]> {
    return [];
  }

  private static async getMonthlyTrend(dateRange: any, where: any): Promise<MonthlyTrend[]> {
    return [];
  }

  private static async getTopDoctors(dateRange: any, filters?: AnalyticsFilters): Promise<TopDoctor[]> {
    return [];
  }

  private static async getPeakHours(dateRange: any, where: any): Promise<PeakHour[]> {
    return [];
  }

  private static async getPatientGrowthMonthly(dateRange: any, where: any): Promise<MonthlyTrend[]> {
    return [];
  }

  private static async getMonthlyRevenue(dateRange: any, where: any): Promise<any[]> {
    return [];
  }
}