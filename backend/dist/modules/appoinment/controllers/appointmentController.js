"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentController = void 0;
const appointmentService_1 = require("../services/appointmentService");
const queueService_1 = require("../services/queueService");
const errorMiddleware_1 = require("../../../middleware/errorMiddleware");
const errors_1 = require("../../../utils/errors");
class AppointmentController {
}
exports.AppointmentController = AppointmentController;
_a = AppointmentController;
// ============================================
// APPOINTMENT CRUD
// ============================================
// POST /api/v1/appointments
AppointmentController.create = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const dto = req.body;
    const userId = req.user?.userId;
    if (!userId)
        throw new errors_1.UnauthorizedError();
    const appointment = await appointmentService_1.AppointmentService.createAppointment(dto, userId, req.ip || '', req.headers['user-agent'] || '');
    res.status(201).json({
        success: true,
        status: 201,
        message: 'Appointment created successfully',
        data: appointment,
    });
});
// GET /api/v1/appointments
AppointmentController.list = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const query = req.query;
    const result = await appointmentService_1.AppointmentService.listAppointments(query);
    res.status(200).json({
        success: true,
        status: 200,
        data: result.appointments,
        pagination: result.pagination,
    });
});
// GET /api/v1/appointments/:id
AppointmentController.getById = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const { id } = req.params;
    const appointment = await appointmentService_1.AppointmentService.getAppointmentById(id);
    res.status(200).json({
        success: true,
        status: 200,
        data: appointment,
    });
});
// PATCH /api/v1/appointments/:id
AppointmentController.update = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const { id } = req.params;
    const dto = req.body;
    const userId = req.user?.userId;
    if (!userId)
        throw new errors_1.UnauthorizedError();
    const appointment = await appointmentService_1.AppointmentService.updateAppointment(id, dto, userId, req.ip || '', req.headers['user-agent'] || '');
    res.status(200).json({
        success: true,
        status: 200,
        message: 'Appointment updated successfully',
        data: appointment,
    });
});
// PATCH /api/v1/appointments/:id/reschedule
AppointmentController.reschedule = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const { id } = req.params;
    const dto = req.body;
    const userId = req.user?.userId;
    if (!userId)
        throw new errors_1.UnauthorizedError();
    const appointment = await appointmentService_1.AppointmentService.rescheduleAppointment(id, dto, userId, req.ip || '', req.headers['user-agent'] || '');
    res.status(200).json({
        success: true,
        status: 200,
        message: 'Appointment rescheduled successfully',
        data: appointment,
    });
});
// PATCH /api/v1/appointments/:id/cancel
AppointmentController.cancel = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user?.userId;
    if (!userId)
        throw new errors_1.UnauthorizedError();
    const appointment = await appointmentService_1.AppointmentService.cancelAppointment(id, reason || null, userId, req.ip || '', req.headers['user-agent'] || '');
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
AppointmentController.getAvailability = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const { doctorId, date, branchId } = req.query;
    if (!doctorId || !date) {
        throw new errors_1.BadRequestError('Doctor ID and date are required');
    }
    const slots = await appointmentService_1.AppointmentService.getAvailableSlots(doctorId, date, branchId);
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
AppointmentController.generateToken = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const dto = req.body;
    const userId = req.user?.userId;
    if (!userId)
        throw new errors_1.UnauthorizedError();
    const token = await queueService_1.QueueService.generateQueueToken(dto, userId, req.ip || '', req.headers['user-agent'] || '');
    res.status(201).json({
        success: true,
        status: 201,
        message: 'Queue token generated successfully',
        data: token,
    });
});
// GET /api/v1/appointments/queue/:doctorId
AppointmentController.getDoctorQueue = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const { doctorId } = req.params;
    const queue = await queueService_1.QueueService.getDoctorQueue(doctorId);
    res.status(200).json({
        success: true,
        status: 200,
        data: queue,
    });
});
// GET /api/v1/appointments/queue/live
AppointmentController.getLiveQueue = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const branchId = req.query.branchId;
    const queue = await queueService_1.QueueService.getLiveQueueStatus(branchId);
    res.status(200).json({
        success: true,
        status: 200,
        data: queue,
    });
});
// POST /api/v1/appointments/queue/call-next
AppointmentController.callNext = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const { doctorId } = req.body;
    const userId = req.user?.userId;
    if (!userId)
        throw new errors_1.UnauthorizedError();
    if (!doctorId) {
        throw new errors_1.BadRequestError('Doctor ID is required');
    }
    const nextPatient = await queueService_1.QueueService.callNextPatient(doctorId, userId, req.ip || '', req.headers['user-agent'] || '');
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
AppointmentController.markNoShow = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.userId;
    if (!userId)
        throw new errors_1.UnauthorizedError();
    await queueService_1.QueueService.markNoShow(id, userId, req.ip || '', req.headers['user-agent'] || '');
    res.status(200).json({
        success: true,
        status: 200,
        message: 'Appointment marked as no-show',
    });
});
// PATCH /api/v1/appointments/:id/complete
AppointmentController.complete = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.userId;
    if (!userId)
        throw new errors_1.UnauthorizedError();
    await queueService_1.QueueService.completeAppointment(id, userId, req.ip || '', req.headers['user-agent'] || '');
    res.status(200).json({
        success: true,
        status: 200,
        message: 'Appointment completed successfully',
    });
});
// POST /api/v1/appointments/queue/recalculate
AppointmentController.recalculateQueue = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const { doctorId } = req.body;
    const userId = req.user?.userId;
    if (!userId)
        throw new errors_1.UnauthorizedError();
    if (!doctorId) {
        throw new errors_1.BadRequestError('Doctor ID is required');
    }
    await queueService_1.QueueService.recalculateQueue(doctorId, userId, req.ip || '', req.headers['user-agent'] || '');
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
AppointmentController.stats = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const { organizationId, doctorId, dateFrom, dateTo } = req.query;
    const stats = await appointmentService_1.AppointmentService.getAppointmentStats(organizationId, doctorId, dateFrom, dateTo);
    res.status(200).json({
        success: true,
        status: 200,
        data: stats,
    });
});
// POST /api/v1/appointments/bulk-status
AppointmentController.bulkUpdateStatus = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const { appointmentIds, status } = req.body;
    const userId = req.user?.userId;
    if (!userId)
        throw new errors_1.UnauthorizedError();
    const result = await queueService_1.QueueService.bulkUpdateStatus(appointmentIds, status, userId, req.ip || '', req.headers['user-agent'] || '');
    res.status(200).json({
        success: true,
        status: 200,
        message: `Updated ${result.success} appointments, ${result.failed} failed`,
        data: result,
    });
});
// POST /api/v1/appointments/send-reminders (Admin/System only)
AppointmentController.sendReminders = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    await queueService_1.QueueService.sendReminders();
    res.status(200).json({
        success: true,
        status: 200,
        message: 'Reminders sent successfully',
    });
});
//# sourceMappingURL=appointmentController.js.map