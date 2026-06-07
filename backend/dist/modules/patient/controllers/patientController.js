"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientController = void 0;
const patientService_1 = require("../services/patientService");
const errorMiddleware_1 = require("../../../middleware/errorMiddleware");
const errors_1 = require("../../../utils/errors");
class PatientController {
}
exports.PatientController = PatientController;
_a = PatientController;
// POST /api/v1/patients
PatientController.create = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const dto = req.body;
    const userId = req.user?.userId;
    if (!userId)
        throw new errors_1.UnauthorizedError();
    const patient = await patientService_1.PatientService.createPatient(dto, userId, req.ip || '', req.headers['user-agent'] || '');
    res.status(201).json({
        success: true,
        status: 201,
        message: 'Patient created successfully',
        data: patient,
    });
});
// GET /api/v1/patients
PatientController.list = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const query = req.query;
    const result = await patientService_1.PatientService.listPatients(query);
    res.status(200).json({
        success: true,
        status: 200,
        data: result.patients,
        pagination: result.pagination,
    });
});
// GET /api/v1/patients/:id
PatientController.getById = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const { id } = req.params;
    const patient = await patientService_1.PatientService.getPatientById(id);
    res.status(200).json({
        success: true,
        status: 200,
        data: patient,
    });
});
// GET /api/v1/patients/pid/:patientId
PatientController.getByPatientId = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const { patientId } = req.params;
    const patient = await patientService_1.PatientService.getPatientByPatientId(patientId);
    res.status(200).json({
        success: true,
        status: 200,
        data: patient,
    });
});
// PATCH /api/v1/patients/:id
PatientController.update = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const { id } = req.params;
    const dto = req.body;
    const userId = req.user?.userId;
    if (!userId)
        throw new errors_1.UnauthorizedError();
    const patient = await patientService_1.PatientService.updatePatient(id, dto, userId, req.ip || '', req.headers['user-agent'] || '');
    res.status(200).json({
        success: true,
        status: 200,
        message: 'Patient updated successfully',
        data: patient,
    });
});
// DELETE /api/v1/patients/:id
PatientController.delete = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.userId;
    if (!userId)
        throw new errors_1.UnauthorizedError();
    await patientService_1.PatientService.deletePatient(id, userId, req.ip || '', req.headers['user-agent'] || '');
    res.status(200).json({
        success: true,
        status: 200,
        message: 'Patient deleted successfully',
    });
});
// POST /api/v1/patients/bulk
PatientController.bulkImport = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const { patients, organizationId, branchId } = req.body;
    const userId = req.user?.userId;
    if (!userId)
        throw new errors_1.UnauthorizedError();
    if (!Array.isArray(patients) || patients.length === 0) {
        throw new errors_1.BadRequestError('Patients array is required');
    }
    const result = await patientService_1.PatientService.bulkImport(patients, userId, organizationId, branchId);
    res.status(200).json({
        success: result.success,
        status: 200,
        message: `Imported ${result.successCount} of ${result.totalProcessed} patients`,
        data: result,
    });
});
// GET /api/v1/patients/stats
PatientController.stats = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const organizationId = req.query.organizationId;
    const stats = await patientService_1.PatientService.getPatientStats(organizationId);
    res.status(200).json({
        success: true,
        status: 200,
        data: stats,
    });
});
// POST /api/v1/patients/:id/documents
PatientController.uploadDocument = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const { id } = req.params;
    const { documentType, title, description } = req.body;
    const file = req.file;
    const userId = req.user?.userId;
    if (!userId)
        throw new errors_1.UnauthorizedError();
    if (!file)
        throw new errors_1.BadRequestError('File is required');
    const document = await patientService_1.PatientService.uploadDocument(id, documentType, title, description, file, userId);
    res.status(201).json({
        success: true,
        status: 201,
        message: 'Document uploaded successfully',
        data: document,
    });
});
// GET /api/v1/patients/:id/documents
PatientController.getDocuments = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const { id } = req.params;
    const documents = await patientService_1.PatientService.getPatientDocuments(id);
    res.status(200).json({
        success: true,
        status: 200,
        data: documents,
    });
});
//# sourceMappingURL=patientController.js.map