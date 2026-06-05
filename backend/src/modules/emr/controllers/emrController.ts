import { Request, Response } from 'express';
import { EMRService } from '../services/emrService';
import { PrescriptionService } from '../services/prescriptionService';
import { LabReportService } from '../services/lab-reportService';
import { AsyncHandler } from '../../../middleware/errorMiddleware';
import { BadRequestError, UnauthorizedError } from '../../../utils/errors';
import {
  CreateEMRInput,
  UpdateEMRInput,
  CreatePrescriptionInput,
  CreateLabReportInput,
  EMRQueryInput,
} from '../validators/emrValidator';

export class EMRController {
  // POST /api/v1/emr
  static create = AsyncHandler.handle(async (req: Request, res: Response) => {
    const dto: CreateEMRInput = req.body;
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();

    const emr = await EMRService.createEMR(dto, userId, req.ip || '', req.headers['user-agent'] || '');
    res.status(201).json({ success: true, status: 201, message: 'EMR created', data: emr });
  });

  // GET /api/v1/emr/:id
  static getById = AsyncHandler.handle(async (req: Request, res: Response) => {
    const { id } = req.params;
    const emr = await EMRService.getEMRById(id);
    res.status(200).json({ success: true, status: 200, data: emr });
  });

  // GET /api/v1/emr/patient/:patientId
  static getPatientHistory = AsyncHandler.handle(async (req: Request, res: Response) => {
    const { patientId } = req.params;
    const query = req.query as any;
    const result = await EMRService.getPatientEMRHistory(patientId, query);
    res.status(200).json({ success: true, status: 200, ...result });
  });

  // PATCH /api/v1/emr/:id
  static update = AsyncHandler.handle(async (req: Request, res: Response) => {
    const { id } = req.params;
    const dto: UpdateEMRInput = req.body;
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();

    const emr = await EMRService.updateEMR(id, dto, userId, req.ip || '', req.headers['user-agent'] || '');
    res.status(200).json({ success: true, status: 200, message: 'EMR updated', data: emr });
  });

  // POST /api/v1/emr/:id/sign
  static sign = AsyncHandler.handle(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();

    const emr = await EMRService.signEMR(id, userId, req.ip || '', req.headers['user-agent'] || '');
    res.status(200).json({ success: true, status: 200, message: 'EMR signed', data: emr });
  });

  // POST /api/v1/emr/:id/version
  static newVersion = AsyncHandler.handle(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();

    const emr = await EMRService.createNewVersion(id, userId, req.ip || '', req.headers['user-agent'] || '');
    res.status(201).json({ success: true, status: 201, message: 'New version created', data: emr });
  });

  // GET /api/v1/emr/:id/pdf
  static generatePDF = AsyncHandler.handle(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await EMRService.generatePDF(id);
    res.status(200).json({ success: true, status: 200, data: result });
  });

  // GET /api/v1/emr/stats
  static stats = AsyncHandler.handle(async (req: Request, res: Response) => {
    const stats = await EMRService.getEMRStats();
    res.status(200).json({ success: true, status: 200, data: stats });
  });

  // POST /api/v1/emr/prescriptions
  static createPrescription = AsyncHandler.handle(async (req: Request, res: Response) => {
    const dto: CreatePrescriptionInput = req.body;
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();

    const prescription = await PrescriptionService.createPrescription(
      dto, userId, req.ip || '', req.headers['user-agent'] || ''
    );
    res.status(201).json({ success: true, status: 201, message: 'Prescription created', data: prescription });
  });

  // POST /api/v1/emr/lab-reports
  static createLabReport = AsyncHandler.handle(async (req: Request, res: Response) => {
    const dto: CreateLabReportInput = req.body;
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();

    const report = await LabReportService.createLabReport(
      dto, userId, req.ip || '', req.headers['user-agent'] || ''
    );
    res.status(201).json({ success: true, status: 201, message: 'Lab report created', data: report });
  });
}