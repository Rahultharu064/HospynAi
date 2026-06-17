"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientService = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = __importDefault(require("../../../config/prisma"));
const fileService_1 = require("../../auth/services/fileService");
const errors_1 = require("../../../utils/errors");
const logger_1 = __importDefault(require("../../../utils/logger"));
class PatientService {
    /**
     * ============================================
     * CREATE PATIENT
     * ============================================
     */
    static async createPatient(data, userId, ipAddress, userAgent) {
        // Check for duplicate phone/email
        await this.checkDuplicatePatient(data.email, data.phone);
        // Generate unique patient ID
        const patientId = await this.generatePatientId();
        // Validate organization/branch if provided
        if (data.organizationId) {
            await this.validateOrganization(data.organizationId);
        }
        if (data.branchId) {
            await this.validateBranch(data.branchId, data.organizationId);
        }
        if (data.primaryDoctorId) {
            await this.validateDoctor(data.primaryDoctorId);
        }
        // Create patient
        const patient = await prisma_1.default.$transaction(async (tx) => {
            const newPatient = await tx.patient.create({
                data: {
                    patientId,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    email: data.email?.toLowerCase() || null,
                    phone: data.phone || null,
                    dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
                    gender: data.gender || null,
                    bloodGroup: data.bloodGroup || null,
                    address: data.address || null,
                    city: data.city || null,
                    state: data.state || null,
                    country: data.country || null,
                    zipCode: data.zipCode || null,
                    emergencyContactName: data.emergencyContactName || null,
                    emergencyContactPhone: data.emergencyContactPhone || null,
                    emergencyContactRelation: data.emergencyContactRelation || null,
                    insuranceProvider: data.insuranceProvider || null,
                    insurancePolicyNumber: data.insurancePolicyNumber || null,
                    insuranceValidUntil: data.insuranceValidUntil ? new Date(data.insuranceValidUntil) : null,
                    allergies: data.allergies || [],
                    chronicConditions: data.chronicConditions || [],
                    currentMedications: data.currentMedications || [],
                    notes: data.notes || null,
                    status: client_1.PatientStatus.ACTIVE,
                    organizationId: data.organizationId || null,
                    branchId: data.branchId || null,
                    primaryDoctorId: data.primaryDoctorId || null,
                    createdById: userId,
                    updatedById: userId,
                },
                include: this.getPatientInclude(),
            });
            // Create audit log
            await tx.auditLog.create({
                data: {
                    userId,
                    organizationId: newPatient.organizationId,
                    action: 'PATIENT_CREATED',
                    resource: 'PATIENT',
                    resourceId: newPatient.id,
                    ipAddress,
                    userAgent,
                    metadata: {
                        patientId: newPatient.patientId,
                        name: `${newPatient.firstName} ${newPatient.lastName}`,
                    },
                },
            });
            return newPatient;
        });
        logger_1.default.info(`Patient created: ${patient.patientId} by user ${userId}`);
        return this.formatPatientResponse(patient);
    }
    /**
     * ============================================
     * GET PATIENT BY ID
     * ============================================
     */
    static async getPatientById(id) {
        const patient = await prisma_1.default.patient.findUnique({
            where: { id },
            include: this.getPatientInclude(),
        });
        if (!patient || patient.deletedAt) {
            throw new errors_1.NotFoundError('Patient not found');
        }
        return this.formatPatientResponse(patient);
    }
    /**
     * ============================================
     * GET PATIENT BY PATIENT ID (Public ID)
     * ============================================
     */
    static async getPatientByPatientId(patientId) {
        const patient = await prisma_1.default.patient.findUnique({
            where: { patientId },
            include: this.getPatientInclude(),
        });
        if (!patient || patient.deletedAt) {
            throw new errors_1.NotFoundError('Patient not found');
        }
        return this.formatPatientResponse(patient);
    }
    /**
     * ============================================
     * LIST PATIENTS WITH FILTERING & PAGINATION
     * ============================================
     */
    static async listPatients(query) {
        const { page = 1, limit = 10, search, gender, bloodGroup, status, organizationId, branchId, primaryDoctorId, dateFrom, dateTo, sortBy = 'createdAt', sortOrder = 'desc', } = query;
        // Build where clause
        const where = {
            deletedAt: null,
        };
        // Search by name, email, phone, or patient ID
        if (search) {
            where.OR = [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search } },
                { patientId: { contains: search } },
            ];
        }
        if (gender)
            where.gender = gender;
        if (bloodGroup)
            where.bloodGroup = bloodGroup;
        if (status)
            where.status = status;
        if (organizationId)
            where.organizationId = organizationId;
        if (branchId)
            where.branchId = branchId;
        if (primaryDoctorId)
            where.primaryDoctorId = primaryDoctorId;
        // Date range filter
        if (dateFrom || dateTo) {
            where.createdAt = {};
            if (dateFrom)
                where.createdAt.gte = new Date(dateFrom);
            if (dateTo)
                where.createdAt.lte = new Date(dateTo);
        }
        // Calculate pagination
        const skip = (page - 1) * limit;
        // Execute queries
        const [patients, total] = await Promise.all([
            prisma_1.default.patient.findMany({
                where,
                include: this.getPatientInclude(),
                orderBy: { [sortBy]: sortOrder },
                skip,
                take: limit,
            }),
            prisma_1.default.patient.count({ where }),
        ]);
        return {
            patients: patients.map((p) => this.formatPatientResponse(p)),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    /**
     * ============================================
     * UPDATE PATIENT
     * ============================================
     */
    static async updatePatient(id, data, userId, ipAddress, userAgent) {
        // Check if patient exists
        const existingPatient = await prisma_1.default.patient.findUnique({
            where: { id },
        });
        if (!existingPatient || existingPatient.deletedAt) {
            throw new errors_1.NotFoundError('Patient not found');
        }
        // Check for duplicate phone/email (excluding current patient)
        if (data.email || data.phone) {
            await this.checkDuplicatePatient(data.email, data.phone, id);
        }
        // Validate references if provided
        if (data.primaryDoctorId) {
            await this.validateDoctor(data.primaryDoctorId);
        }
        // Update patient
        const patient = await prisma_1.default.$transaction(async (tx) => {
            const updated = await tx.patient.update({
                where: { id },
                data: {
                    ...(data.firstName !== undefined && { firstName: data.firstName }),
                    ...(data.lastName !== undefined && { lastName: data.lastName }),
                    ...(data.email !== undefined && { email: data.email?.toLowerCase() || null }),
                    ...(data.phone !== undefined && { phone: data.phone || null }),
                    ...(data.dateOfBirth !== undefined && { dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null }),
                    ...(data.gender !== undefined && { gender: data.gender }),
                    ...(data.bloodGroup !== undefined && { bloodGroup: data.bloodGroup }),
                    ...(data.address !== undefined && { address: data.address }),
                    ...(data.city !== undefined && { city: data.city }),
                    ...(data.state !== undefined && { state: data.state }),
                    ...(data.country !== undefined && { country: data.country }),
                    ...(data.zipCode !== undefined && { zipCode: data.zipCode }),
                    ...(data.emergencyContactName !== undefined && { emergencyContactName: data.emergencyContactName }),
                    ...(data.emergencyContactPhone !== undefined && { emergencyContactPhone: data.emergencyContactPhone }),
                    ...(data.emergencyContactRelation !== undefined && { emergencyContactRelation: data.emergencyContactRelation }),
                    ...(data.insuranceProvider !== undefined && { insuranceProvider: data.insuranceProvider }),
                    ...(data.insurancePolicyNumber !== undefined && { insurancePolicyNumber: data.insurancePolicyNumber }),
                    ...(data.insuranceValidUntil !== undefined && { insuranceValidUntil: data.insuranceValidUntil ? new Date(data.insuranceValidUntil) : null }),
                    ...(data.allergies !== undefined && { allergies: data.allergies }),
                    ...(data.chronicConditions !== undefined && { chronicConditions: data.chronicConditions }),
                    ...(data.currentMedications !== undefined && { currentMedications: data.currentMedications }),
                    ...(data.notes !== undefined && { notes: data.notes }),
                    ...(data.status !== undefined && { status: data.status }),
                    ...(data.primaryDoctorId !== undefined && { primaryDoctorId: data.primaryDoctorId }),
                    updatedById: userId,
                },
                include: this.getPatientInclude(),
            });
            // Create audit log
            await tx.auditLog.create({
                data: {
                    userId,
                    organizationId: updated.organizationId,
                    action: 'PATIENT_UPDATED',
                    resource: 'PATIENT',
                    resourceId: updated.id,
                    ipAddress,
                    userAgent,
                    metadata: {
                        patientId: updated.patientId,
                        updatedFields: Object.keys(data).filter((k) => data[k] !== undefined),
                    },
                },
            });
            return updated;
        });
        logger_1.default.info(`Patient updated: ${patient.patientId} by user ${userId}`);
        return this.formatPatientResponse(patient);
    }
    /**
     * ============================================
     * DELETE PATIENT (Soft Delete)
     * ============================================
     */
    static async deletePatient(id, userId, ipAddress, userAgent) {
        const patient = await prisma_1.default.patient.findUnique({ where: { id } });
        if (!patient || patient.deletedAt) {
            throw new errors_1.NotFoundError('Patient not found');
        }
        await prisma_1.default.$transaction(async (tx) => {
            await tx.patient.update({
                where: { id },
                data: {
                    deletedAt: new Date(),
                    status: client_1.PatientStatus.INACTIVE,
                    updatedById: userId,
                },
            });
            await tx.auditLog.create({
                data: {
                    userId,
                    organizationId: patient.organizationId,
                    action: 'PATIENT_DELETED',
                    resource: 'PATIENT',
                    resourceId: id,
                    ipAddress,
                    userAgent,
                    metadata: { patientId: patient.patientId },
                },
            });
        });
        logger_1.default.info(`Patient soft-deleted: ${patient.patientId} by user ${userId}`);
    }
    /**
     * ============================================
     * HARD DELETE PATIENT (Admin only)
     * ============================================
     */
    static async hardDeletePatient(id, userId, ipAddress, userAgent) {
        const patient = await prisma_1.default.patient.findUnique({ where: { id } });
        if (!patient) {
            throw new errors_1.NotFoundError('Patient not found');
        }
        // Check if patient has related records
        const relatedRecords = await prisma_1.default.$transaction([
            prisma_1.default.appointment.count({ where: { patientId: id } }),
            prisma_1.default.medicalRecord.count({ where: { patientId: id } }),
            prisma_1.default.payment.count({ where: { patientId: id } }),
        ]);
        const [appointments, medicalRecords, payments] = relatedRecords;
        if (appointments > 0 || medicalRecords > 0 || payments > 0) {
            throw new errors_1.BadRequestError(`Cannot permanently delete patient with existing records. ` +
                `Appointments: ${appointments}, Medical Records: ${medicalRecords}, Payments: ${payments}`);
        }
        await prisma_1.default.$transaction(async (tx) => {
            await tx.patientDocument.deleteMany({ where: { patientId: id } });
            await tx.patient.delete({ where: { id } });
            await tx.auditLog.create({
                data: {
                    userId,
                    action: 'PATIENT_HARD_DELETED',
                    resource: 'PATIENT',
                    resourceId: id,
                    ipAddress,
                    userAgent,
                    metadata: { patientId: patient.patientId },
                },
            });
        });
        logger_1.default.info(`Patient hard-deleted: ${patient.patientId} by user ${userId}`);
    }
    /**
     * ============================================
     * BULK IMPORT PATIENTS
     * ============================================
     */
    static async bulkImport(patients, userId, organizationId, branchId) {
        const result = {
            success: true,
            totalProcessed: patients.length,
            successCount: 0,
            failureCount: 0,
            errors: [],
        };
        for (let i = 0; i < patients.length; i++) {
            try {
                const patientData = {
                    ...patients[i],
                    organizationId: organizationId || patients[i].organizationId,
                    branchId: branchId || patients[i].branchId,
                };
                await this.createPatient(patientData, userId, 'bulk-import', 'system');
                result.successCount++;
            }
            catch (error) {
                result.failureCount++;
                result.errors.push({
                    row: i + 1,
                    message: error.message || 'Unknown error',
                });
            }
        }
        result.success = result.failureCount === 0;
        logger_1.default.info(`Bulk import completed: ${result.successCount} success, ${result.failureCount} failures`);
        return result;
    }
    /**
     * ============================================
     * PATIENT STATISTICS
     * ============================================
     */
    static async getPatientStats(organizationId) {
        const where = {
            deletedAt: null,
            ...(organizationId && { organizationId }),
        };
        const [totalPatients, activePatients, inactivePatients, newThisMonth, genderCounts, bloodGroupCounts, topConditions,] = await Promise.all([
            // Total patients
            prisma_1.default.patient.count({ where }),
            // Active patients
            prisma_1.default.patient.count({ where: { ...where, status: client_1.PatientStatus.ACTIVE } }),
            // Inactive patients
            prisma_1.default.patient.count({ where: { ...where, status: client_1.PatientStatus.INACTIVE } }),
            // New this month
            prisma_1.default.patient.count({
                where: {
                    ...where,
                    createdAt: {
                        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                    },
                },
            }),
            // Gender distribution
            prisma_1.default.patient.groupBy({
                by: ['gender'],
                where,
                _count: true,
            }),
            // Blood group distribution
            prisma_1.default.patient.groupBy({
                by: ['bloodGroup'],
                where,
                _count: true,
            }),
            // Top conditions (simplified)
            prisma_1.default.patient.findMany({
                where,
                select: { chronicConditions: true },
            }),
        ]);
        // Process gender distribution
        const genderDistribution = { male: 0, female: 0, other: 0 };
        genderCounts.forEach((g) => {
            if (g.gender === client_1.Gender.MALE)
                genderDistribution.male = g._count;
            else if (g.gender === client_1.Gender.FEMALE)
                genderDistribution.female = g._count;
            else
                genderDistribution.other += g._count;
        });
        // Process blood group distribution
        const bloodGroupDistribution = {};
        bloodGroupCounts.forEach((bg) => {
            if (bg.bloodGroup)
                bloodGroupDistribution[bg.bloodGroup] = bg._count;
        });
        // Process top conditions
        const conditionMap = new Map();
        topConditions.forEach((p) => {
            p.chronicConditions.forEach((condition) => {
                conditionMap.set(condition, (conditionMap.get(condition) || 0) + 1);
            });
        });
        const topConditionsList = Array.from(conditionMap.entries())
            .map(([condition, count]) => ({ condition, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
        // Age distribution
        const patientsWithDob = await prisma_1.default.patient.findMany({
            where: { ...where, dateOfBirth: { not: null } },
            select: { dateOfBirth: true },
        });
        const ageDistribution = { child: 0, teen: 0, adult: 0, senior: 0 };
        patientsWithDob.forEach((p) => {
            if (p.dateOfBirth) {
                const age = this.calculateAge(p.dateOfBirth);
                if (age <= 12)
                    ageDistribution.child++;
                else if (age <= 19)
                    ageDistribution.teen++;
                else if (age <= 59)
                    ageDistribution.adult++;
                else
                    ageDistribution.senior++;
            }
        });
        return {
            totalPatients,
            activePatients,
            inactivePatients,
            newThisMonth,
            genderDistribution,
            bloodGroupDistribution,
            ageDistribution,
            topConditions: topConditionsList,
        };
    }
    /**
     * ============================================
     * PATIENT DOCUMENTS
     * ============================================
     */
    static async uploadDocument(patientId, documentType, title, description, file, userId) {
        const patient = await prisma_1.default.patient.findUnique({
            where: { id: patientId },
        });
        if (!patient || patient.deletedAt) {
            throw new errors_1.NotFoundError('Patient not found');
        }
        const upload = await fileService_1.FileService.uploadMulterFile(file);
        const document = await prisma_1.default.patientDocument.create({
            data: {
                patientId,
                documentType,
                title,
                description: description || null,
                fileName: file.originalname,
                fileSize: file.size,
                mimeType: file.mimetype,
                cloudinaryPublicId: upload.publicId,
                url: upload.url,
                uploadedById: userId,
            },
            include: {
                uploadedBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });
        logger_1.default.info(`Document uploaded for patient ${patient.patientId}: ${title}`);
        return {
            id: document.id,
            patientId: document.patientId,
            documentType: document.documentType,
            title: document.title,
            description: document.description,
            fileName: document.fileName,
            fileSize: document.fileSize,
            mimeType: document.mimeType,
            url: document.url,
            uploadedBy: document.uploadedBy,
            createdAt: document.createdAt.toISOString(),
        };
    }
    static async getPatientDocuments(patientId) {
        const patient = await prisma_1.default.patient.findUnique({
            where: { id: patientId },
        });
        if (!patient || patient.deletedAt) {
            throw new errors_1.NotFoundError('Patient not found');
        }
        return prisma_1.default.patientDocument.findMany({
            where: { patientId },
            orderBy: { createdAt: 'desc' },
            include: {
                uploadedBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });
    }
    /**
     * ============================================
     * HELPER METHODS
     * ============================================
     */
    static async generatePatientId() {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const prefix = `PT${year}${month}`;
        // Get count of patients created this month
        const count = await prisma_1.default.patient.count({
            where: {
                patientId: { startsWith: prefix },
            },
        });
        // Generate sequential number
        const sequential = (count + 1).toString().padStart(5, '0');
        return `${prefix}${sequential}`;
    }
    static async checkDuplicatePatient(email, phone, excludeId) {
        const where = {
            deletedAt: null,
            ...(excludeId && { id: { not: excludeId } }),
        };
        if (email) {
            const existingEmail = await prisma_1.default.patient.findFirst({
                where: { ...where, email: email.toLowerCase() },
            });
            if (existingEmail) {
                throw new errors_1.ConflictError('A patient with this email already exists');
            }
        }
        if (phone) {
            const existingPhone = await prisma_1.default.patient.findFirst({
                where: { ...where, phone },
            });
            if (existingPhone) {
                throw new errors_1.ConflictError('A patient with this phone number already exists');
            }
        }
    }
    static async validateOrganization(organizationId) {
        const org = await prisma_1.default.organization.findUnique({
            where: { id: organizationId },
        });
        if (!org)
            throw new errors_1.BadRequestError('Organization not found');
    }
    static async validateBranch(branchId, organizationId) {
        const branch = await prisma_1.default.branch.findUnique({
            where: { id: branchId },
        });
        if (!branch)
            throw new errors_1.BadRequestError('Branch not found');
        if (organizationId && branch.organizationId !== organizationId) {
            throw new errors_1.BadRequestError('Branch does not belong to the specified organization');
        }
    }
    static async validateDoctor(doctorId) {
        const doctor = await prisma_1.default.user.findFirst({
            where: { id: doctorId, role: 'DOCTOR' },
        });
        if (!doctor)
            throw new errors_1.BadRequestError('Doctor not found');
    }
    static calculateAge(dateOfBirth) {
        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }
    static getPatientInclude() {
        return {
            primaryDoctor: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                },
            },
            organization: {
                select: {
                    id: true,
                    name: true,
                },
            },
            branch: {
                select: {
                    id: true,
                    name: true,
                },
            },
            createdBy: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                },
            },
        };
    }
    static formatPatientResponse(patient) {
        return {
            id: patient.id,
            patientId: patient.patientId,
            firstName: patient.firstName,
            lastName: patient.lastName,
            email: patient.email,
            phone: patient.phone,
            dateOfBirth: patient.dateOfBirth?.toISOString() || null,
            age: patient.dateOfBirth ? this.calculateAge(patient.dateOfBirth) : null,
            gender: patient.gender,
            bloodGroup: patient.bloodGroup,
            address: patient.address,
            city: patient.city,
            state: patient.state,
            country: patient.country,
            zipCode: patient.zipCode,
            emergencyContact: {
                name: patient.emergencyContactName,
                phone: patient.emergencyContactPhone,
                relation: patient.emergencyContactRelation,
            },
            insurance: {
                provider: patient.insuranceProvider,
                policyNumber: patient.insurancePolicyNumber,
                validUntil: patient.insuranceValidUntil?.toISOString() || null,
            },
            allergies: patient.allergies,
            chronicConditions: patient.chronicConditions,
            currentMedications: patient.currentMedications,
            notes: patient.notes,
            status: patient.status,
            primaryDoctor: patient.primaryDoctor,
            organization: patient.organization,
            branch: patient.branch,
            createdBy: patient.createdBy,
            totalVisits: patient._count?.appointments || 0,
            lastVisitDate: patient.appointments?.[0]?.appointmentDate?.toISOString() || null,
            createdAt: patient.createdAt.toISOString(),
            updatedAt: patient.updatedAt.toISOString(),
        };
    }
}
exports.PatientService = PatientService;
//# sourceMappingURL=patientService.js.map