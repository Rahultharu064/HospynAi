"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DoctorController = void 0;
const doctorService_1 = require("../services/doctorService");
const errorMiddleware_1 = require("../../../middleware/errorMiddleware");
const errors_1 = require("../../../utils/errors");
class DoctorController {
}
exports.DoctorController = DoctorController;
_a = DoctorController;
// POST /api/v1/doctors
DoctorController.create = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const dto = req.body;
    const userId = req.user?.userId;
    if (!userId)
        throw new errors_1.UnauthorizedError();
    const doctor = await doctorService_1.DoctorService.createDoctor(dto, userId, req.ip || '', req.headers['user-agent'] || '');
    res.status(201).json({
        success: true,
        status: 201,
        message: 'Doctor created successfully',
        data: doctor,
    });
});
// GET /api/v1/doctors
DoctorController.list = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const query = req.query;
    const result = await doctorService_1.DoctorService.listDoctors(query);
    res.status(200).json({
        success: true,
        status: 200,
        data: result.doctors,
        pagination: result.pagination,
    });
});
// GET /api/v1/doctors/:id
DoctorController.getById = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const { id } = req.params;
    const doctor = await doctorService_1.DoctorService.getDoctorById(id);
    res.status(200).json({
        success: true,
        status: 200,
        data: doctor,
    });
});
// PATCH /api/v1/doctors/:id
DoctorController.update = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const { id } = req.params;
    const dto = req.body;
    const userId = req.user?.userId;
    if (!userId)
        throw new errors_1.UnauthorizedError();
    const doctor = await doctorService_1.DoctorService.updateDoctor(id, dto, userId, req.ip || '', req.headers['user-agent'] || '');
    res.status(200).json({
        success: true,
        status: 200,
        message: 'Doctor updated successfully',
        data: doctor,
    });
});
// PUT /api/v1/doctors/:id/schedule
DoctorController.updateSchedule = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const { id } = req.params;
    const dto = req.body;
    const userId = req.user?.userId;
    if (!userId)
        throw new errors_1.UnauthorizedError();
    const schedule = await doctorService_1.DoctorService.updateSchedule(id, dto, userId, req.ip || '', req.headers['user-agent'] || '');
    res.status(200).json({
        success: true,
        status: 200,
        message: 'Schedule updated successfully',
        data: schedule,
    });
});
// GET /api/v1/doctors/:id/schedule
DoctorController.getSchedule = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const { id } = req.params;
    const doctor = await doctorService_1.DoctorService.getDoctorById(id);
    res.status(200).json({
        success: true,
        status: 200,
        data: doctor.schedule,
    });
});
// GET /api/v1/doctors/availability
DoctorController.getAvailability = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const { doctorId, dateFrom, dateTo } = req.query;
    if (!doctorId || !dateFrom) {
        throw new errors_1.BadRequestError('Doctor ID and dateFrom are required');
    }
    const availability = await doctorService_1.DoctorService.getDoctorAvailability(doctorId, dateFrom, dateTo);
    res.status(200).json({
        success: true,
        status: 200,
        data: availability,
    });
});
// DELETE /api/v1/doctors/:id
DoctorController.delete = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.userId;
    if (!userId)
        throw new errors_1.UnauthorizedError();
    await doctorService_1.DoctorService.deleteDoctor(id, userId, req.ip || '', req.headers['user-agent'] || '');
    res.status(200).json({
        success: true,
        status: 200,
        message: 'Doctor deleted successfully',
    });
});
//# sourceMappingURL=doctorController.js.map