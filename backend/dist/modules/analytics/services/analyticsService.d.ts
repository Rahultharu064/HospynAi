import { DashboardStats, AnalyticsFilters } from '../../../types/analyticsTypes';
export declare class AnalyticsService {
    /**
     * ============================================
     * DASHBOARD OVERVIEW
     * ============================================
     */
    static getDashboardStats(filters?: AnalyticsFilters): Promise<DashboardStats>;
    /**
     * ============================================
     * OVERVIEW STATS
     * ============================================
     */
    private static getOverviewStats;
    /**
     * ============================================
     * APPOINTMENT ANALYTICS
     * ============================================
     */
    private static getAppointmentAnalytics;
    /**
     * ============================================
     * PATIENT ANALYTICS
     * ============================================
     */
    private static getPatientAnalytics;
    /**
     * ============================================
     * REVENUE ANALYTICS
     * ============================================
     */
    private static getRevenueAnalytics;
    /**
     * ============================================
     * AI ANALYTICS
     * ============================================
     */
    private static getAiAnalytics;
    /**
     * ============================================
     * OPERATIONAL KPIs
     * ============================================
     */
    private static getOperationalKPIs;
    private static getDateRange;
    private static getPreviousPeriod;
    private static buildWhereClause;
    private static getWeeklyTrend;
    private static getMonthlyTrend;
    private static getTopDoctors;
    private static getPeakHours;
    private static getPatientGrowthMonthly;
    private static getMonthlyRevenue;
}
//# sourceMappingURL=analyticsService.d.ts.map