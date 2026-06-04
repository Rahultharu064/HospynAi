import { Request, Response } from 'express';
import { AppointmentService } from '../services/appointmentService';
import { QueueService } from '../services/queueService';
import { AsyncHandler } from '../../../middleware/errorMiddleware';
import { BadRequestError, UnauthorizedError } from '../../../utils/errors';
import {
  CreateAppointmentInput,
  UpdateAppointmentInput,
  RescheduleAppointmentInput,
  AppointmentQueryInput,
  QueueTokenInput,
} from '../validators/appointmentValidator'

export class AppointmentController {
  // ============================================
  // APPOINTMENT CRUD
  // ============================================

  // POST /api/v1/appointments
  static create = AsyncHandler.handle(async (req: Request, res: Response) => {
    const dto: CreateAppointmentInput = req.body;
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();

    const appointment = await AppointmentService.createAppointment(
      dto,
      userId,
      req.ip || '',
      req.headers['user-agent'] || ''
    );

    res.status(201).json({
      success: true,
      status: 201,
      message: 'Appointment created successfully',
      data: appointment,
    });
  });

  // GET /api/v1/appointments
  static list = AsyncHandler.handle(async (req: Request, res: Response) => {
    const query: AppointmentQueryInput = req.query as any;
    const result = await AppointmentService.listAppointments(query);

    res.status(200).json({
      success: true,
      status: 200,
      data: result.appointments,
      pagination: result.pagination,
    });
  });

  // GET /api/v1/appointments/:id
  static getById = AsyncHandler.handle(async (req: Request, res: Response) => {
    const { id } = req.params;
    const appointment = await AppointmentService.getAppointmentById(id);

    res.status(200).json({
      success: true,
      status: 200,
      data: appointment,
    });
  });

  // PATCH /api/v1/appointments/:id
  static update = AsyncHandler.handle(async (req: Request, res: Response) => {
    const { id } = req.params;
    const dto: UpdateAppointmentInput = req.body;
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();

    const appointment = await AppointmentService.updateAppointment(
      id,
      dto,
      userId,
      req.ip || '',
      req.headers['user-agent'] || ''
    );

    res.status(200).json({
      success: true,
      status: 200,
      message: 'Appointment updated successfully',
      data: appointment,
    });
  });

  // PATCH /api/v1/appointments/:id/reschedule
  static reschedule = AsyncHandler.handle(async (req: Request, res: Response) => {
    const { id } = req.params;
    const dto: RescheduleAppointmentInput = req.body;
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();

    const appointment = await AppointmentService.rescheduleAppointment(
      id,
      dto,
      userId,
      req.ip || '',
      req.headers['user-agent'] || ''
    );

    res.status(200).json({
      success: true,
      status: 200,
      message: 'Appointment rescheduled successfully',
      data: appointment,
    });
  });

  // PATCH /api/v1/appointments/:id/cancel
  static cancel = AsyncHandler.handle(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();

    const appointment = await AppointmentService.cancelAppointment(
      id,
      reason || null,
      userId,
      req.ip || '',
      req.headers['user-agent'] || ''
    );

    res.status(200).json({
      success: true,
      status: 200,
      message: 'Appointment cancelled successfully',
      data: appointment,
    });
  });

  // ============================================
  // AVAILABILITY
  // ============================================

  // GET /api/v1/appointments/availability
  static getAvailability = AsyncHandler.handle(async (req: Request, res: Response) => {
    const { doctorId, date, branchId } = req.query as any;

    if (!doctorId || !date) {
      throw new BadRequestError('Doctor ID and date are required');
    }

    const slots = await AppointmentService.getAvailableSlots(doctorId, date, branchId);

    res.status(200).json({
      success: true,
      status: 200,
      data: slots,
    });
  });

  // ============================================
  // QUEUE MANAGEMENT
  // ============================================

  // POST /api/v1/appointments/queue/token
  static generateToken = AsyncHandler.handle(async (req: Request, res: Response) => {
    const dto: QueueTokenInput = req.body;
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();

    const token = await QueueService.generateQueueToken(
      dto,
      userId,
      req.ip || '',
      req.headers['user-agent'] || ''
    );

    res.status(201).json({
      success: true,
      status: 201,
      message: 'Queue token generated successfully',
      data: token,
    });
  });

  // GET /api/v1/appointments/queue/:doctorId
  static getDoctorQueue = AsyncHandler.handle(async (req: Request, res: Response) => {
    const { doctorId } = req.params;
    const queue = await QueueService.getDoctorQueue(doctorId);

    res.status(200).json({
      success: true,
      status: 200,
      data: queue,
    });
  });

  // GET /api/v1/appointments/queue/live
  static getLiveQueue = AsyncHandler.handle(async (req: Request, res: Response) => {
    const branchId = req.query.branchId as string | undefined;
    const queue = await QueueService.getLiveQueueStatus(branchId);

    res.status(200).json({
      success: true,
      status: 200,
      data: queue,
    });
  });

  // POST /api/v1/appointments/queue/call-next
  static callNext = AsyncHandler.handle(async (req: Request, res: Response) => {
    const { doctorId } = req.body;
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();

    if (!doctorId) {
      throw new BadRequestError('Doctor ID is required');
    }

    const nextPatient = await QueueService.callNextPatient(
      doctorId,
      userId,
      req.ip || '',
      req.headers['user-agent'] || ''
    );

    if (!nextPatient) {
      return res.status(200).json({
        success: true,
        status: 200,
        message: 'No more patients in queue',
        data: null,
      });
    }

    res.status(200).json({
      success: true,
      status: 200,
      message: 'Next patient called',
      data: nextPatient,
    });
  });

  // PATCH /api/v1/appointments/:id/no-show
  static markNoShow = AsyncHandler.handle(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();

    await QueueService.markNoShow(
      id,
      userId,
      req.ip || '',
      req.headers['user-agent'] || ''
    );

    res.status(200).json({
      success: true,
      status: 200,
      message: 'Appointment marked as no-show',
    });
  });

  // PATCH /api/v1/appointments/:id/complete
  static complete = AsyncHandler.handle(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();

    await QueueService.completeAppointment(
      id,
      userId,
      req.ip || '',
      req.headers['user-agent'] || ''
    );

    res.status(200).json({
      success: true,
      status: 200,
      message: 'Appointment completed successfully',
    });
  });

  // POST /api/v1/appointments/queue/recalculate
  static recalculateQueue = AsyncHandler.handle(async (req: Request, res: Response) => {
    const { doctorId } = req.body;
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();

    if (!doctorId) {
      throw new BadRequestError('Doctor ID is required');
    }

    await QueueService.recalculateQueue(
      doctorId,
      userId,
      req.ip || '',
      req.headers['user-agent'] || ''
    );

    res.status(200).json({
      success: true,
      status: 200,
      message: 'Queue recalculated successfully',
    });
  });

  // ============================================
  // STATISTICS
  // ============================================

  // GET /api/v1/appointments/stats
  static stats = AsyncHandler.handle(async (req: Request, res: Response) => {
    const { organizationId, doctorId, dateFrom, dateTo } = req.query as any;
    const stats = await AppointmentService.getAppointmentStats(
      organizationId,
      doctorId,
      dateFrom,
      dateTo
    );

    res.status(200).json({
      success: true,
      status: 200,
      data: stats,
    });
  });

  // POST /api/v1/appointments/bulk-status
  static bulkUpdateStatus = AsyncHandler.handle(async (req: Request, res: Response) => {
    const { appointmentIds, status } = req.body;
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();

    const result = await QueueService.bulkUpdateStatus(
      appointmentIds,
      status,
      userId,
      req.ip || '',
      req.headers['user-agent'] || ''
    );

    res.status(200).json({
      success: true,
      status: 200,
      message: `Updated ${result.success} appointments, ${result.failed} failed`,
      data: result,
    });
  });

  // POST /api/v1/appointments/send-reminders (Admin/System only)
  static sendReminders = AsyncHandler.handle(async (req: Request, res: Response) => {
    await QueueService.sendReminders();

    res.status(200).json({
      success: true,
      status: 200,
      message: 'Reminders sent successfully',
    });
  });
}