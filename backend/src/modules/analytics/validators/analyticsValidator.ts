import { z } from 'zod';

export const analyticsFilterSchema = z.object({
  query: z.object({
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
    organizationId: z.string().cuid().optional(),
    branchId: z.string().cuid().optional(),
    doctorId: z.string().cuid().optional(),
    period: z.enum([
      'today', 'yesterday', 'this_week', 'last_week',
      'this_month', 'last_month', 'this_year', 'custom'
    ]).optional(),
    compareWithPrevious: z.string().transform((v) => v === 'true').optional(),
  }),
});

export const exportAnalyticsSchema = z.object({
  body: z.object({
    format: z.enum(['pdf', 'csv', 'excel'], {
      required_error: 'Export format is required',
    }),
    sections: z.array(z.string()).optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
    organizationId: z.string().cuid().optional(),
  }),
});

export type AnalyticsFilterInput = z.infer<typeof analyticsFilterSchema>['query'];
export type ExportAnalyticsInput = z.infer<typeof exportAnalyticsSchema>['body'];