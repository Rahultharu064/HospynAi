"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = __importDefault(require("../../../config/prisma"));
class AnalyticsService {
    /**
     * ============================================
     * DASHBOARD OVERVIEW
     * ============================================
     */
    static async getDashboardStats(filters) {
        const dateRange = this.getDateRange(filters);
        const [overview, appointments, patients, revenue, ai, operational,] = await Promise.all([
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
    static async getOverviewStats(dateRange, filters) {
        const where = this.buildWhereClause(filters);
        const prevDateRange = this.getPreviousPeriod(dateRange);
        const [totalPatients, totalDoctors, totalAppointments, totalRevenue, prevPatients, prevAppointments, prevRevenue, todayAppointments, waitingPatients,] = await Promise.all([
            prisma_1.default.patient.count({ where: { ...where, deletedAt: null } }),
            prisma_1.default.user.count({ where: { ...where, role: 'DOCTOR', status: 'ACTIVE' } }),
            prisma_1.default.appointment.count({ where: { ...where, createdAt: { gte: dateRange.start, lte: dateRange.end } } }),
            prisma_1.default.payment.aggregate({
                where: { ...where, status: 'COMPLETED', paidAt: { gte: dateRange.start, lte: dateRange.end } },
                _sum: { totalAmount: true },
            }),
            prisma_1.default.patient.count({ where: { ...where, deletedAt: null, createdAt: { lte: prevDateRange.end } } }),
            prisma_1.default.appointment.count({ where: { ...where, createdAt: { gte: prevDateRange.start, lte: prevDateRange.end } } }),
            prisma_1.default.payment.aggregate({
                where: { ...where, status: 'COMPLETED', paidAt: { gte: prevDateRange.start, lte: prevDateRange.end } },
                _sum: { totalAmount: true },
            }),
            // Today's appointments
            prisma_1.default.appointment.count({
                where: {
                    ...where,
                    appointmentDate: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0)),
                        lt: new Date(new Date().setHours(23, 59, 59, 999)),
                    },
                },
            }),
            // Waiting patients in queue
            prisma_1.default.appointment.count({
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
    static async getAppointmentAnalytics(dateRange, filters) {
        const where = {
            ...this.buildWhereClause(filters),
            createdAt: { gte: dateRange.start, lte: dateRange.end },
        };
        const [total, completed, cancelled, noShow, rescheduled, byType, byStatus, hourlyDistribution, dailyDistribution, weeklyTrend, monthlyTrend, topDoctors, peakHours,] = await Promise.all([
            prisma_1.default.appointment.count({ where }),
            prisma_1.default.appointment.count({ where: { ...where, status: 'COMPLETED' } }),
            prisma_1.default.appointment.count({ where: { ...where, status: 'CANCELLED' } }),
            prisma_1.default.appointment.count({ where: { ...where, status: 'NO_SHOW' } }),
            prisma_1.default.appointment.count({ where: { ...where, status: 'RESCHEDULED' } }),
            prisma_1.default.appointment.groupBy({ by: ['type'], where, _count: true }),
            prisma_1.default.appointment.groupBy({ by: ['status'], where, _count: true }),
            // Hourly distribution
            prisma_1.default.$queryRaw `
        SELECT EXTRACT(HOUR FROM "start_time"::time) as hour, COUNT(*) as count
        FROM appointments
        WHERE "created_at" >= ${dateRange.start} AND "created_at" <= ${dateRange.end}
        GROUP BY hour ORDER BY hour
      `,
            // Daily distribution
            prisma_1.default.$queryRaw `
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
        const byTypeMap = {};
        byType.forEach((t) => { byTypeMap[t.type] = t._count; });
        const byStatusMap = {};
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
            hourlyDistribution: hourlyDistribution.map((h) => ({
                hour: Number(h.hour),
                count: Number(h.count),
                label: `${String(h.hour).padStart(2, '0')}:00`,
            })),
            dailyDistribution: dailyDistribution.map((d) => ({
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
    static async getPatientAnalytics(dateRange, filters) {
        const where = { ...this.buildWhereClause(filters), deletedAt: null };
        const [total, active, inactive, newThisMonth, newThisYear, genderCounts, bloodGroupCounts, topConditions, patientGrowth,] = await Promise.all([
            prisma_1.default.patient.count({ where }),
            prisma_1.default.patient.count({ where: { ...where, status: 'ACTIVE' } }),
            prisma_1.default.patient.count({ where: { ...where, status: 'INACTIVE' } }),
            prisma_1.default.patient.count({
                where: {
                    ...where,
                    createdAt: {
                        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                    },
                },
            }),
            prisma_1.default.patient.count({
                where: {
                    ...where,
                    createdAt: {
                        gte: new Date(new Date().getFullYear(), 0, 1),
                    },
                },
            }),
            prisma_1.default.patient.groupBy({ by: ['gender'], where, _count: true }),
            prisma_1.default.patient.groupBy({ by: ['bloodGroup'], where, _count: true }),
            // Top conditions
            prisma_1.default.patient.findMany({
                where,
                select: { chronicConditions: true },
            }),
            // Patient growth monthly
            this.getPatientGrowthMonthly(dateRange, where),
        ]);
        // Process gender distribution
        const genderMap = { male: 0, female: 0, other: 0 };
        genderCounts.forEach((g) => {
            if (g.gender === client_1.Gender.MALE)
                genderMap.male = g._count;
            else if (g.gender === client_1.Gender.FEMALE)
                genderMap.female = g._count;
            else
                genderMap.other += g._count;
        });
        const totalGender = genderMap.male + genderMap.female + genderMap.other;
        // Process blood group
        const bloodGroupMap = {};
        bloodGroupCounts.forEach((bg) => {
            if (bg.bloodGroup)
                bloodGroupMap[bg.bloodGroup] = bg._count;
        });
        // Process top conditions
        const conditionMap = new Map();
        topConditions.forEach((p) => {
            p.chronicConditions.forEach((c) => {
                conditionMap.set(c, (conditionMap.get(c) || 0) + 1);
            });
        });
        const conditionsList = Array.from(conditionMap.entries())
            .map(([condition, count]) => ({
            condition,
            count,
            percentage: total > 0 ? (count / total) * 100 : 0,
            trend: 'stable',
        }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
        // Calculate average visits
        const totalAppointments = await prisma_1.default.appointment.count({
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
    static async getRevenueAnalytics(dateRange, filters) {
        const where = {
            ...this.buildWhereClause(filters),
            status: client_1.PaymentStatus.COMPLETED,
            paidAt: { gte: dateRange.start, lte: dateRange.end },
        };
        const prevDateRange = this.getPreviousPeriod(dateRange);
        const [totalRevenue, thisMonth, lastMonth, thisYear, revenueByMethod, monthlyRevenue, outstanding, refunded,] = await Promise.all([
            prisma_1.default.payment.aggregate({ where, _sum: { totalAmount: true } }),
            prisma_1.default.payment.aggregate({
                where: {
                    ...where,
                    paidAt: {
                        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                    },
                },
                _sum: { totalAmount: true },
            }),
            prisma_1.default.payment.aggregate({
                where: {
                    ...where,
                    paidAt: {
                        gte: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
                        lt: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                    },
                },
                _sum: { totalAmount: true },
            }),
            prisma_1.default.payment.aggregate({
                where: {
                    ...where,
                    paidAt: { gte: new Date(new Date().getFullYear(), 0, 1) },
                },
                _sum: { totalAmount: true },
            }),
            prisma_1.default.payment.groupBy({ by: ['method'], where, _sum: { totalAmount: true } }),
            this.getMonthlyRevenue(dateRange, where),
            prisma_1.default.payment.aggregate({
                where: { ...this.buildWhereClause(filters), status: 'PENDING' },
                _sum: { totalAmount: true },
            }),
            prisma_1.default.payment.aggregate({
                where: { ...this.buildWhereClause(filters), status: { in: ['REFUNDED', 'PARTIALLY_REFUNDED'] } },
                _sum: { refundAmount: true },
            }),
        ]);
        const totalRev = Number(totalRevenue._sum.totalAmount || 0);
        const byMethodMap = {};
        revenueByMethod.forEach((m) => {
            if (m.method)
                byMethodMap[m.method] = Number(m._sum.totalAmount || 0);
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
    static async getAiAnalytics(dateRange, filters) {
        const where = {
            createdAt: { gte: dateRange.start, lte: dateRange.end },
        };
        const [totalVoice, totalCalls, aiResolved, voiceTypes, callOutcomes,] = await Promise.all([
            prisma_1.default.voiceLog.count({ where }),
            prisma_1.default.callLog.count({ where }),
            prisma_1.default.callLog.count({ where: { ...where, outcome: 'AI_RESOLVED' } }),
            prisma_1.default.voiceLog.groupBy({ by: ['interactionType'], where, _count: true }),
            prisma_1.default.callLog.groupBy({ by: ['outcome'], where, _count: true }),
        ]);
        const voiceTypesMap = {};
        voiceTypes.forEach((v) => { voiceTypesMap[v.interactionType] = v._count; });
        const outcomesMap = {};
        callOutcomes.forEach((c) => { outcomesMap[c.outcome] = c._count; });
        return {
            totalVoiceInteractions: totalVoice,
            totalCalls,
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
    static async getOperationalKPIs(dateRange, filters) {
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
    static getDateRange(filters) {
        if (filters?.dateFrom && filters?.dateTo) {
            return { start: new Date(filters.dateFrom), end: new Date(filters.dateTo) };
        }
        const period = filters?.period || 'this_month';
        const now = new Date();
        let start, end;
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
    static getPreviousPeriod(dateRange) {
        const duration = dateRange.end.getTime() - dateRange.start.getTime();
        return {
            start: new Date(dateRange.start.getTime() - duration),
            end: new Date(dateRange.start.getTime() - 1),
        };
    }
    static buildWhereClause(filters) {
        const where = {};
        if (filters?.organizationId)
            where.organizationId = filters.organizationId;
        if (filters?.branchId)
            where.branchId = filters.branchId;
        if (filters?.doctorId)
            where.doctorId = filters.doctorId;
        return where;
    }
    static async getWeeklyTrend(dateRange, where) {
        return [];
    }
    static async getMonthlyTrend(dateRange, where) {
        return [];
    }
    static async getTopDoctors(dateRange, filters) {
        return [];
    }
    static async getPeakHours(dateRange, where) {
        return [];
    }
    static async getPatientGrowthMonthly(dateRange, where) {
        return [];
    }
    static async getMonthlyRevenue(dateRange, where) {
        return [];
    }
}
exports.AnalyticsService = AnalyticsService;
//# sourceMappingURL=analyticsService.js.map