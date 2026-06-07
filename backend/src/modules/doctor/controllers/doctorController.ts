import { Request, Response } from 'express';
import { DoctorService } from '../services/doctorService';
import { AsyncHandler } from '../../../middleware/errorMiddleware';
import { BadRequestError, UnauthorizedError } from '../../../utils/errors';
import {
  CreateDoctorInput,
  UpdateDoctorInput,
  UpdateScheduleInput,
  DoctorQueryInput,
} from '../validators/doctorValidator';

export class DoctorController {
  // POST /api/v1/doctors
  static create = AsyncHandler.handle(async (req: Request, res: Response) => {
    const dto: CreateDoctorInput = req.body;
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();

    const doctor = await DoctorService.createDoctor(
      dto,
      userId,
      req.ip || '',
      req.headers['user-agent'] || ''
    );

    res.status(201).json({
      success: true,
      status: 201,
      message: 'Doctor created successfully',
      data: doctor,
    });
  });

  // GET /api/v1/doctors
  static list = AsyncHandler.handle(async (req: Request, res: Response) => {
    const query: DoctorQueryInput = req.query as any;
    const result = await DoctorService.listDoctors(query);

    res.status(200).json({
      success: true,
      status: 200,
      data: result.doctors,
      pagination: result.pagination,
    });
  });

  // GET /api/v1/doctors/:id
  static getById = AsyncHandler.handle(async (req: Request, res: Response) => {
    const { id } = req.params;
    const doctor = await DoctorService.getDoctorById(id);

    res.status(200).json({
      success: true,
      status: 200,
      data: doctor,
    });
  });

  // PATCH /api/v1/doctors/:id
  static update = AsyncHandler.handle(async (req: Request, res: Response) => {
    const { id } = req.params;
    const dto: UpdateDoctorInput = req.body;
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();

    const doctor = await DoctorService.updateDoctor(
      id,
      dto,
      userId,
      req.ip || '',
      req.headers['user-agent'] || ''
    );

    res.status(200).json({
      success: true,
      status: 200,
      message: 'Doctor updated successfully',
      data: doctor,
    });
  });

  // PUT /api/v1/doctors/:id/schedule
  static updateSchedule = AsyncHandler.handle(async (req: Request, res: Response) => {
    const { id } = req.params;
    const dto: UpdateScheduleInput = req.body;
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();

    const schedule = await DoctorService.updateSchedule(
      id,
      dto,
      userId,
      req.ip || '',
      req.headers['user-agent'] || ''
    );

    res.status(200).json({
      success: true,
      status: 200,
      message: 'Schedule updated successfully',
      data: schedule,
    });
  });

  // GET /api/v1/doctors/:id/schedule
  static getSchedule = AsyncHandler.handle(async (req: Request, res: Response) => {
    const { id } = req.params;
    const doctor = await DoctorService.getDoctorById(id);

    res.status(200).json({
      success: true,
      status: 200,
      data: doctor.schedule,
    });
  });

  // GET /api/v1/doctors/availability
  static getAvailability = AsyncHandler.handle(async (req: Request, res: Response) => {
    const { doctorId, dateFrom, dateTo } = req.query as any;

    if (!doctorId || !dateFrom) {
      throw new BadRequestError('Doctor ID and dateFrom are required');
    }

    const availability = await DoctorService.getDoctorAvailability(
      doctorId,
      dateFrom,
      dateTo
    );

    res.status(200).json({
      success: true,
      status: 200,
      data: availability,
    });
  });

  // DELETE /api/v1/doctors/:id
  static delete = AsyncHandler.handle(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();

    await DoctorService.deleteDoctor(
      id,
      userId,
      req.ip || '',
      req.headers['user-agent'] || ''
    );

    res.status(200).json({
      success: true,
      status: 200,
      message: 'Doctor deleted successfully',
    });
  });
}