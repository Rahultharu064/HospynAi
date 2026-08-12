import { Request, Response } from 'express';
import { PatientService } from '../services/patientService';
import { AsyncHandler } from '../../../middleware/errorMiddleware';
import { BadRequestError, UnauthorizedError } from '../../../utils/errors';
import {
  CreatePatientInput,
  UpdatePatientInput,
  PatientQueryInput,
  UploadDocumentInput,
} from '../validators/patientValidator';

export class PatientController {
  // POST /api/v1/patients
  static create = AsyncHandler.handle(async (req: Request, res: Response) => {
    const dto: CreatePatientInput = req.body;
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();

    const patient = await PatientService.createPatient(
      dto,
      userId,
      req.ip || '',
      req.headers['user-agent'] || ''
    );

    res.status(201).json({
      success: true,
      status: 201,
      message: 'Patient created successfully',
      data: patient,
    });
  });

  // GET /api/v1/patients
  static list = AsyncHandler.handle(async (req: Request, res: Response) => {
    const query: PatientQueryInput = req.query as any;
    const result = await PatientService.listPatients(query);

    res.status(200).json({
      success: true,
      status: 200,
      data: result.patients,
      pagination: result.pagination,
    });
  });

  // GET /api/v1/patients/:id
  static getById = AsyncHandler.handle(async (req: Request, res: Response) => {
    const { id } = req.params;
    const patient = await PatientService.getPatientById(id);

    res.status(200).json({
      success: true,
      status: 200,
      data: patient,
    });
  });

  // GET /api/v1/patients/pid/:patientId
  static getByPatientId = AsyncHandler.handle(async (req: Request, res: Response) => {
    const { patientId } = req.params;
    const patient = await PatientService.getPatientByPatientId(patientId);

    res.status(200).json({
      success: true,
      status: 200,
      data: patient,
    });
  });

  // PATCH /api/v1/patients/:id
  static update = AsyncHandler.handle(async (req: Request, res: Response) => {
    const { id } = req.params;
    const dto: UpdatePatientInput = req.body;
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();

    const patient = await PatientService.updatePatient(
      id,
      dto,
      userId,
      req.ip || '',
      req.headers['user-agent'] || ''
    );

    res.status(200).json({
      success: true,
      status: 200,
      message: 'Patient updated successfully',
      data: patient,
    });
  });

  // DELETE /api/v1/patients/:id
  static delete = AsyncHandler.handle(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();

    await PatientService.deletePatient(
      id,
      userId,
      req.ip || '',
      req.headers['user-agent'] || ''
    );

    res.status(200).json({
      success: true,
      status: 200,
      message: 'Patient deleted successfully',
    });
  });

  // POST /api/v1/patients/bulk
  static bulkImport = AsyncHandler.handle(async (req: Request, res: Response) => {
    const { patients, organizationId, branchId } = req.body;
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();

    if (!Array.isArray(patients) || patients.length === 0) {
      throw new BadRequestError('Patients array is required');
    }

    const result = await PatientService.bulkImport(
      patients,
      userId,
      organizationId,
      branchId
    );

    res.status(200).json({
      success: result.success,
      status: 200,
      message: `Imported ${result.successCount} of ${result.totalProcessed} patients`,
      data: result,
    });
  });

  // GET /api/v1/patients/stats
  static stats = AsyncHandler.handle(async (req: Request, res: Response) => {
    const organizationId = req.query.organizationId as string | undefined;
    const stats = await PatientService.getPatientStats(organizationId);

    res.status(200).json({
      success: true,
      status: 200,
      data: stats,
    });
  });

  // POST /api/v1/patients/:id/documents
  static uploadDocument = AsyncHandler.handle(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { documentType, title, description }: UploadDocumentInput = req.body;
    const file = req.file;
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();
    if (!file) throw new BadRequestError('File is required');

    const document = await PatientService.uploadDocument(
      id,
      documentType,
      title,
      description,
      file,
      userId
    );

    res.status(201).json({
      success: true,
      status: 201,
      message: 'Document uploaded successfully',
      data: document,
    });
  });

  // GET /api/v1/patients/:id/documents
  static getDocuments = AsyncHandler.handle(async (req: Request, res: Response) => {
    const { id } = req.params;
    const documents = await PatientService.getPatientDocuments(id);

    res.status(200).json({
      success: true,
      status: 200,
      data: documents,
    });
  });
}
