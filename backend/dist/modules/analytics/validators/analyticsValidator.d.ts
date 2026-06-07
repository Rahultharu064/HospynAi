import { z } from 'zod';
export declare const analyticsFilterSchema: z.ZodObject<{
    query: z.ZodObject<{
        dateFrom: z.ZodOptional<z.ZodString>;
        dateTo: z.ZodOptional<z.ZodString>;
        organizationId: z.ZodOptional<z.ZodString>;
        branchId: z.ZodOptional<z.ZodString>;
        doctorId: z.ZodOptional<z.ZodString>;
        period: z.ZodOptional<z.ZodEnum<["today", "yesterday", "this_week", "last_week", "this_month", "last_month", "this_year", "custom"]>>;
        compareWithPrevious: z.ZodOptional<z.ZodEffects<z.ZodString, boolean, string>>;
    }, "strip", z.ZodTypeAny, {
        organizationId?: string | undefined;
        branchId?: string | undefined;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
        doctorId?: string | undefined;
        period?: "custom" | "today" | "yesterday" | "this_week" | "last_week" | "this_month" | "last_month" | "this_year" | undefined;
        compareWithPrevious?: boolean | undefined;
    }, {
        organizationId?: string | undefined;
        branchId?: string | undefined;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
        doctorId?: string | undefined;
        period?: "custom" | "today" | "yesterday" | "this_week" | "last_week" | "this_month" | "last_month" | "this_year" | undefined;
        compareWithPrevious?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    query: {
        organizationId?: string | undefined;
        branchId?: string | undefined;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
        doctorId?: string | undefined;
        period?: "custom" | "today" | "yesterday" | "this_week" | "last_week" | "this_month" | "last_month" | "this_year" | undefined;
        compareWithPrevious?: boolean | undefined;
    };
}, {
    query: {
        organizationId?: string | undefined;
        branchId?: string | undefined;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
        doctorId?: string | undefined;
        period?: "custom" | "today" | "yesterday" | "this_week" | "last_week" | "this_month" | "last_month" | "this_year" | undefined;
        compareWithPrevious?: string | undefined;
    };
}>;
export declare const exportAnalyticsSchema: z.ZodObject<{
    body: z.ZodObject<{
        format: z.ZodEnum<["pdf", "csv", "excel"]>;
        sections: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        dateFrom: z.ZodOptional<z.ZodString>;
        dateTo: z.ZodOptional<z.ZodString>;
        organizationId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        format: "csv" | "pdf" | "excel";
        organizationId?: string | undefined;
        sections?: string[] | undefined;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
    }, {
        format: "csv" | "pdf" | "excel";
        organizationId?: string | undefined;
        sections?: string[] | undefined;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        format: "csv" | "pdf" | "excel";
        organizationId?: string | undefined;
        sections?: string[] | undefined;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
    };
}, {
    body: {
        format: "csv" | "pdf" | "excel";
        organizationId?: string | undefined;
        sections?: string[] | undefined;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
    };
}>;
export type AnalyticsFilterInput = z.infer<typeof analyticsFilterSchema>['query'];
export type ExportAnalyticsInput = z.infer<typeof exportAnalyticsSchema>['body'];
//# sourceMappingURL=analyticsValidator.d.ts.map