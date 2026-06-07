"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EMRController = void 0;
const emrService_1 = require("../services/emrService");
const prescriptionService_1 = require("../services/prescriptionService");
const lab_reportService_1 = require("../services/lab-reportService");
const errorMiddleware_1 = require("../../../middleware/errorMiddleware");
const errors_1 = require("../../../utils/errors");
class EMRController {
}
exports.EMRController = EMRController;
_a = EMRController;
// POST /api/v1/emr
EMRController.create = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const dto = req.body;
    const userId = req.user?.userId;
    if (!userId)
        throw new errors_1.UnauthorizedError();
    const emr = await emrService_1.EMRService.createEMR(dto, userId, req.ip || '', req.headers['user-agent'] || '');
    res.status(201).json({ success: true, status: 201, message: 'EMR created', data: emr });
});
// GET /api/v1/emr/:id
EMRController.getById = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const { id } = req.params;
    const emr = await emrService_1.EMRService.getEMRById(id);
    res.status(200).json({ success: true, status: 200, data: emr });
});
// GET /api/v1/emr/patient/:patientId
EMRController.getPatientHistory = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const { patientId } = req.params;
    const query = req.query;
    const result = await emrService_1.EMRService.getPatientEMRHistory(patientId, query);
    res.status(200).json({ success: true, status: 200, ...result });
});
// PATCH /api/v1/emr/:id
EMRController.update = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const { id } = req.params;
    const dto = req.body;
    const userId = req.user?.userId;
    if (!userId)
        throw new errors_1.UnauthorizedError();
    const emr = await emrService_1.EMRService.updateEMR(id, dto, userId, req.ip || '', req.headers['user-agent'] || '');
    res.status(200).json({ success: true, status: 200, message: 'EMR updated', data: emr });
});
// POST /api/v1/emr/:id/sign
EMRController.sign = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.userId;
    if (!userId)
        throw new errors_1.UnauthorizedError();
    const emr = await emrService_1.EMRService.signEMR(id, userId, req.ip || '', req.headers['user-agent'] || '');
    res.status(200).json({ success: true, status: 200, message: 'EMR signed', data: emr });
});
// POST /api/v1/emr/:id/version
EMRController.newVersion = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.userId;
    if (!userId)
        throw new errors_1.UnauthorizedError();
    const emr = await emrService_1.EMRService.createNewVersion(id, userId, req.ip || '', req.headers['user-agent'] || '');
    res.status(201).json({ success: true, status: 201, message: 'New version created', data: emr });
});
// GET /api/v1/emr/:id/pdf
EMRController.generatePDF = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const { id } = req.params;
    const result = await emrService_1.EMRService.generatePDF(id);
    res.status(200).json({ success: true, status: 200, data: result });
});
// GET /api/v1/emr/stats
EMRController.stats = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const stats = await emrService_1.EMRService.getEMRStats();
    res.status(200).json({ success: true, status: 200, data: stats });
});
// POST /api/v1/emr/prescriptions
EMRController.createPrescription = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const dto = req.body;
    const userId = req.user?.userId;
    if (!userId)
        throw new errors_1.UnauthorizedError();
    const prescription = await prescriptionService_1.PrescriptionService.createPrescription(dto, userId, req.ip || '', req.headers['user-agent'] || '');
    res.status(201).json({ success: true, status: 201, message: 'Prescription created', data: prescription });
});
// POST /api/v1/emr/lab-reports
EMRController.createLabReport = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const dto = req.body;
    const userId = req.user?.userId;
    if (!userId)
        throw new errors_1.UnauthorizedError();
    const report = await lab_reportService_1.LabReportService.createLabReport(dto, userId, req.ip || '', req.headers['user-agent'] || '');
    res.status(201).json({ success: true, status: 201, message: 'Lab report created', data: report });
});
//# sourceMappingURL=emrController.js.map