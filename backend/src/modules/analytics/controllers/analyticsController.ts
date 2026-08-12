import { Request, Response } from 'express';
import { AnalyticsService } from '../services/analyticsService';
import { AsyncHandler } from '../../../middleware/errorMiddleware';
import { AnalyticsFilterInput, ExportAnalyticsInput } from '../validators/analyticsValidator';

export class AnalyticsController {
  // GET /api/v1/analytics/dashboard
  static dashboard = AsyncHandler.handle(async (req: Request, res: Response) => {
    const filters: AnalyticsFilterInput = req.query as any;
    const stats = await AnalyticsService.getDashboardStats(filters);

    res.status(200).json({
      success: true, status: 200, data: stats,
    });
  });

  // GET /api/v1/analytics/export
  static export = AsyncHandler.handle(async (req: Request, res: Response) => {
    const options: ExportAnalyticsInput = req.body;

    res.status(200).json({
      success: true, status: 200,
      message: `Export initiated in ${options.format} format`,
    });
  });
}