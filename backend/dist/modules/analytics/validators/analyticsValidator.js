"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportAnalyticsSchema = exports.analyticsFilterSchema = void 0;
const zod_1 = require("zod");
exports.analyticsFilterSchema = zod_1.z.object({
    query: zod_1.z.object({
        dateFrom: zod_1.z.string().datetime().optional(),
        dateTo: zod_1.z.string().datetime().optional(),
        organizationId: zod_1.z.string().cuid().optional(),
        branchId: zod_1.z.string().cuid().optional(),
        doctorId: zod_1.z.string().cuid().optional(),
        period: zod_1.z.enum([
            'today', 'yesterday', 'this_week', 'last_week',
            'this_month', 'last_month', 'this_year', 'custom'
        ]).optional(),
        compareWithPrevious: zod_1.z.string().transform((v) => v === 'true').optional(),
    }),
});
exports.exportAnalyticsSchema = zod_1.z.object({
    body: zod_1.z.object({
        format: zod_1.z.enum(['pdf', 'csv', 'excel'], {
            required_error: 'Export format is required',
        }),
        sections: zod_1.z.array(zod_1.z.string()).optional(),
        dateFrom: zod_1.z.string().datetime().optional(),
        dateTo: zod_1.z.string().datetime().optional(),
        organizationId: zod_1.z.string().cuid().optional(),
    }),
});
//# sourceMappingURL=analyticsValidator.js.map