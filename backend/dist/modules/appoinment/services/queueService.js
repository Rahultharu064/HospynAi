"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueService = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = __importDefault(require("../../../config/prisma"));
const errors_1 = require("../../../utils/errors");
const logger_1 = __importDefault(require("../../../utils/logger"));
class QueueService {
    /**
     * ============================================
     * GENERATE QUEUE TOKEN
     * ============================================
     */
    static async generateQueueToken(data, userId, ipAddress, userAgent) {
        // Validate patient exists
        const patient = await prisma_1.default.patient.findUnique({
            where: { id: data.patientId },
        });
        if (!patient || patient.deletedAt) {
            throw new errors_1.NotFoundError('Patient not found');
        }
        // Validate doctor exists and is active
        const doctor = await prisma_1.default.user.findFirst({
            where: { id: data.doctorId, role: 'DOCTOR', status: 'ACTIVE' },
        });
        if (!doctor) {
            throw new errors_1.NotFoundError('Doctor not found or not available');
        }
        // Check if patient already has an active queue token for this doctor today
        const existingToken = await prisma_1.default.appointment.findFirst({
            where: {
                patientId: data.patientId,
                doctorId: data.doctorId,
                appointmentDate: {
                    gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    lt: new Date(new Date().setHours(23, 59, 59, 999)),
                },
                status: { notIn: ['CANCELLED', 'NO_SHOW', 'COMPLETED'] },
                queueToken: { not: null },
            },
        });
        if (existingToken) {
            return {
                queueToken: existingToken.queueToken,
                queuePosition: existingToken.queuePosition,
                estimatedWait: existingToken.estimatedWait,
                patientName: `${patient.firstName} ${patient.lastName}`,
                status: existingToken.status,
            };
        }
        // Generate queue token
        const queueToken = await this.generateUniqueQueueToken();
        // Calculate queue position
        const queuePosition = await this.calculateQueuePosition(data.doctorId);
        // Estimate wait time (based on doctor's average consultation time)
        const estimatedWait = await this.calculateEstimatedWait(data.doctorId, queuePosition);
        // Get current time for appointment
        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        // Create a walk-in appointment
        const appointment = await prisma_1.default.$transaction(async (tx) => {
            const appointmentId = await this.generateAppointmentId();
            const newAppointment = await tx.appointment.create({
                data: {
                    appointmentId,
                    patientId: data.patientId,
                    doctorId: data.doctorId,
                    branchId: data.branchId || patient.branchId,
                    organizationId: patient.organizationId,
                    appointmentDate: new Date(),
                    startTime: currentTime,
                    endTime: currentTime, // Will be updated when seen
                    duration: 15,
                    type: data.appointmentType || client_1.AppointmentType.WALK_IN,
                    status: client_1.AppointmentStatus.SCHEDULED,
                    reason: data.reason || 'Walk-in consultation',
                    queueToken,
                    queuePosition,
                    estimatedWait,
                    createdById: userId,
                    updatedById: userId,
                },
            });
            // Create audit log
            await tx.auditLog.create({
                data: {
                    userId,
                    organizationId: newAppointment.organizationId,
                    action: 'QUEUE_TOKEN_GENERATED',
                    resource: 'APPOINTMENT',
                    resourceId: newAppointment.id,
                    ipAddress,
                    userAgent,
                    metadata: {
                        queueToken,
                        queuePosition,
                        patientId: data.patientId,
                        doctorId: data.doctorId,
                    },
                },
            });
            return newAppointment;
        });
        logger_1.default.info(`Queue token generated: ${queueToken} for patient ${data.patientId}`);
        return {
            queueToken: appointment.queueToken,
            queuePosition: appointment.queuePosition,
            estimatedWait: appointment.estimatedWait,
            patientName: `${patient.firstName} ${patient.lastName}`,
            status: appointment.status,
        };
    }
    /**
     * ============================================
     * GET DOCTOR'S QUEUE
     * ============================================
     */
    static async getDoctorQueue(doctorId) {
        // Validate doctor exists
        const doctor = await prisma_1.default.user.findFirst({
            where: { id: doctorId, role: 'DOCTOR' },
            select: {
                id: true,
                firstName: true,
                lastName: true,
            },
        });
        if (!doctor) {
            throw new errors_1.NotFoundError('Doctor not found');
        }
        // Get today's queue
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const queueItems = await prisma_1.default.appointment.findMany({
            where: {
                doctorId,
                appointmentDate: {
                    gte: today,
                    lt: tomorrow,
                },
                status: {
                    in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'],
                },
                queueToken: { not: null },
            },
            orderBy: [
                { status: 'asc' }, // IN_PROGRESS first, then SCHEDULED
                { queuePosition: 'asc' },
            ],
            include: {
                patient: {
                    select: {
                        firstName: true,
                        lastName: true,
                        patientId: true,
                    },
                },
            },
        });
        // Calculate statistics
        const totalWaiting = queueItems.filter((q) => q.status === 'SCHEDULED' || q.status === 'CONFIRMED').length;
        const waitingTimes = queueItems
            .filter((q) => q.estimatedWait)
            .map((q) => q.estimatedWait);
        const averageWaitTime = waitingTimes.length > 0
            ? Math.round(waitingTimes.reduce((a, b) => a + b, 0) / waitingTimes.length)
            : 0;
        const queue = queueItems.map((item) => ({
            queueToken: item.queueToken,
            queuePosition: item.queuePosition,
            estimatedWait: item.estimatedWait,
            patientName: `${item.patient.firstName} ${item.patient.lastName}`,
            status: item.status,
        }));
        return {
            doctorId: doctor.id,
            doctorName: `Dr. ${doctor.firstName} ${doctor.lastName}`,
            totalWaiting,
            averageWaitTime,
            queue,
        };
    }
    /**
     * ============================================
     * CALL NEXT PATIENT
     * ============================================
     */
    static async callNextPatient(doctorId, userId, ipAddress, userAgent) {
        // Find the next patient in queue
        const nextPatient = await prisma_1.default.appointment.findFirst({
            where: {
                doctorId,
                appointmentDate: {
                    gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    lt: new Date(new Date().setHours(23, 59, 59, 999)),
                },
                status: 'SCHEDULED',
                queueToken: { not: null },
            },
            orderBy: { queuePosition: 'asc' },
            include: {
                patient: {
                    select: {
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });
        if (!nextPatient) {
            return null; // No more patients in queue
        }
        // Update current patient to IN_PROGRESS
        await prisma_1.default.$transaction(async (tx) => {
            // Mark any existing IN_PROGRESS as COMPLETED (safety check)
            await tx.appointment.updateMany({
                where: {
                    doctorId,
                    status: 'IN_PROGRESS',
                    appointmentDate: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0)),
                        lt: new Date(new Date().setHours(23, 59, 59, 999)),
                    },
                },
                data: {
                    status: client_1.AppointmentStatus.COMPLETED,
                    actualEndTime: new Date(),
                    updatedById: userId,
                },
            });
            // Update next patient to IN_PROGRESS
            await tx.appointment.update({
                where: { id: nextPatient.id },
                data: {
                    status: client_1.AppointmentStatus.IN_PROGRESS,
                    actualStartTime: new Date(),
                    updatedById: userId,
                },
            });
            // Recalculate queue positions for remaining patients
            const remainingPatients = await tx.appointment.findMany({
                where: {
                    doctorId,
                    appointmentDate: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0)),
                        lt: new Date(new Date().setHours(23, 59, 59, 999)),
                    },
                    status: 'SCHEDULED',
                    queueToken: { not: null },
                },
                orderBy: { queuePosition: 'asc' },
            });
            // Update positions (shift everyone up by 1)
            for (let i = 0; i < remainingPatients.length; i++) {
                const newPosition = i + 1;
                const estimatedWait = await this.calculateEstimatedWait(doctorId, newPosition);
                await tx.appointment.update({
                    where: { id: remainingPatients[i].id },
                    data: {
                        queuePosition: newPosition,
                        estimatedWait,
                    },
                });
            }
            // Create audit log
            await tx.auditLog.create({
                data: {
                    userId,
                    action: 'PATIENT_CALLED',
                    resource: 'APPOINTMENT',
                    resourceId: nextPatient.id,
                    ipAddress,
                    userAgent,
                    metadata: {
                        queueToken: nextPatient.queueToken,
                        patientId: nextPatient.patientId,
                        doctorId,
                    },
                },
            });
        });
        logger_1.default.info(`Next patient called: ${nextPatient.queueToken}`);
        return {
            queueToken: nextPatient.queueToken,
            queuePosition: 0, // Now being served
            estimatedWait: 0,
            patientName: `${nextPatient.patient.firstName} ${nextPatient.patient.lastName}`,
            status: client_1.AppointmentStatus.IN_PROGRESS,
        };
    }
    /**
     * ============================================
     * MARK AS NO-SHOW
     * ============================================
     */
    static async markNoShow(appointmentId, userId, ipAddress, userAgent) {
        const appointment = await prisma_1.default.appointment.findUnique({
            where: { id: appointmentId },
        });
        if (!appointment) {
            throw new errors_1.NotFoundError('Appointment not found');
        }
        if (!['SCHEDULED', 'CONFIRMED'].includes(appointment.status)) {
            throw new errors_1.BadRequestError('Only scheduled appointments can be marked as no-show');
        }
        await prisma_1.default.$transaction(async (tx) => {
            await tx.appointment.update({
                where: { id: appointmentId },
                data: {
                    status: client_1.AppointmentStatus.NO_SHOW,
                    updatedById: userId,
                },
            });
            await tx.auditLog.create({
                data: {
                    userId,
                    action: 'PATIENT_NO_SHOW',
                    resource: 'APPOINTMENT',
                    resourceId: appointmentId,
                    ipAddress,
                    userAgent,
                    metadata: {
                        appointmentId: appointment.appointmentId,
                        queueToken: appointment.queueToken,
                    },
                },
            });
        });
        logger_1.default.info(`Appointment marked as no-show: ${appointment.appointmentId}`);
        // Recalculate queue for remaining patients
        if (appointment.doctorId && appointment.queueToken) {
            await this.recalculateQueue(appointment.doctorId, userId, ipAddress, userAgent);
        }
    }
    /**
     * ============================================
     * COMPLETE APPOINTMENT
     * ============================================
     */
    static async completeAppointment(appointmentId, userId, ipAddress, userAgent) {
        const appointment = await prisma_1.default.appointment.findUnique({
            where: { id: appointmentId },
        });
        if (!appointment) {
            throw new errors_1.NotFoundError('Appointment not found');
        }
        if (!['IN_PROGRESS', 'SCHEDULED', 'CONFIRMED'].includes(appointment.status)) {
            throw new errors_1.BadRequestError('Cannot complete this appointment');
        }
        await prisma_1.default.$transaction(async (tx) => {
            await tx.appointment.update({
                where: { id: appointmentId },
                data: {
                    status: client_1.AppointmentStatus.COMPLETED,
                    actualEndTime: new Date(),
                    updatedById: userId,
                },
            });
            await tx.auditLog.create({
                data: {
                    userId,
                    action: 'APPOINTMENT_COMPLETED',
                    resource: 'APPOINTMENT',
                    resourceId: appointmentId,
                    ipAddress,
                    userAgent,
                    metadata: {
                        appointmentId: appointment.appointmentId,
                        queueToken: appointment.queueToken,
                    },
                },
            });
        });
        logger_1.default.info(`Appointment completed: ${appointment.appointmentId}`);
    }
    /**
     * ============================================
     * RECALCULATE QUEUE
     * ============================================
     */
    static async recalculateQueue(doctorId, userId, ipAddress, userAgent) {
        const activeAppointments = await prisma_1.default.appointment.findMany({
            where: {
                doctorId,
                appointmentDate: {
                    gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    lt: new Date(new Date().setHours(23, 59, 59, 999)),
                },
                status: { in: ['SCHEDULED', 'CONFIRMED'] },
                queueToken: { not: null },
            },
            orderBy: { createdAt: 'asc' },
        });
        // Reassign positions and wait times
        for (let i = 0; i < activeAppointments.length; i++) {
            const newPosition = i + 1;
            const estimatedWait = await this.calculateEstimatedWait(doctorId, newPosition);
            await prisma_1.default.appointment.update({
                where: { id: activeAppointments[i].id },
                data: {
                    queuePosition: newPosition,
                    estimatedWait,
                    updatedById: userId,
                },
            });
        }
        logger_1.default.info(`Queue recalculated for doctor ${doctorId}`);
    }
    /**
     * ============================================
     * BULK UPDATE QUEUE STATUS
     * ============================================
     */
    static async bulkUpdateStatus(appointmentIds, status, userId, ipAddress, userAgent) {
        const result = { success: 0, failed: 0, errors: [] };
        for (const id of appointmentIds) {
            try {
                await prisma_1.default.appointment.update({
                    where: { id },
                    data: {
                        status,
                        ...(status === 'IN_PROGRESS' && { actualStartTime: new Date() }),
                        ...(status === 'COMPLETED' && { actualEndTime: new Date() }),
                        ...(status === 'CANCELLED' && { cancelledAt: new Date(), cancelledBy: userId }),
                        updatedById: userId,
                    },
                });
                result.success++;
            }
            catch (error) {
                result.failed++;
                result.errors.push(`Appointment ${id}: ${error.message}`);
            }
        }
        return result;
    }
    /**
     * ============================================
     * HELPER METHODS
     * ============================================
     */
    static async generateUniqueQueueToken() {
        const date = new Date();
        const prefix = `Q${date.getFullYear().toString().slice(-2)}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
        // Get count of tokens generated today
        const count = await prisma_1.default.appointment.count({
            where: {
                queueToken: { startsWith: prefix },
            },
        });
        return `${prefix}${(count + 1).toString().padStart(3, '0')}`;
    }
    static async generateAppointmentId() {
        const date = new Date();
        const prefix = `APT${date.getFullYear().toString().slice(-2)}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
        const count = await prisma_1.default.appointment.count({
            where: { appointmentId: { startsWith: prefix } },
        });
        return `${prefix}${(count + 1).toString().padStart(4, '0')}`;
    }
    static async calculateQueuePosition(doctorId) {
        const count = await prisma_1.default.appointment.count({
            where: {
                doctorId,
                appointmentDate: {
                    gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    lt: new Date(new Date().setHours(23, 59, 59, 999)),
                },
                status: { in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'] },
                queueToken: { not: null },
            },
        });
        return count + 1;
    }
    static async calculateEstimatedWait(doctorId, queuePosition) {
        // Get doctor's average consultation time from schedule
        const today = new Date();
        const schedule = await prisma_1.default.doctorSchedule.findFirst({
            where: {
                doctorId,
                dayOfWeek: today.getDay(),
                isActive: true,
            },
        });
        const avgConsultationTime = schedule?.slotDuration || 15; // minutes
        // Check if there's a patient currently IN_PROGRESS
        const currentPatient = await prisma_1.default.appointment.findFirst({
            where: {
                doctorId,
                status: 'IN_PROGRESS',
                appointmentDate: {
                    gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    lt: new Date(new Date().setHours(23, 59, 59, 999)),
                },
            },
            select: { actualStartTime: true },
        });
        let currentPatientRemainingTime = 0;
        if (currentPatient?.actualStartTime) {
            const elapsed = Math.floor((Date.now() - currentPatient.actualStartTime.getTime()) / 60000);
            currentPatientRemainingTime = Math.max(0, avgConsultationTime - elapsed);
        }
        // Calculate total wait time
        const patientsAhead = queuePosition - 1;
        const totalWait = currentPatientRemainingTime + (patientsAhead * avgConsultationTime);
        return Math.max(0, Math.round(totalWait));
    }
    /**
     * ============================================
     * GET LIVE QUEUE STATUS
     * ============================================
     */
    static async getLiveQueueStatus(branchId) {
        const where = {
            appointmentDate: {
                gte: new Date(new Date().setHours(0, 0, 0, 0)),
                lt: new Date(new Date().setHours(23, 59, 59, 999)),
            },
            status: { in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'] },
            queueToken: { not: null },
        };
        if (branchId)
            where.branchId = branchId;
        const queueItems = await prisma_1.default.appointment.findMany({
            where,
            orderBy: [
                { status: 'asc' },
                { queuePosition: 'asc' },
            ],
            select: {
                id: true,
                queueToken: true,
                queuePosition: true,
                estimatedWait: true,
                status: true,
                startTime: true,
                type: true,
                patient: {
                    select: {
                        patientId: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                doctor: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                branch: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
        return queueItems;
    }
    /**
     * ============================================
     * SEND APPOINTMENT REMINDERS
     * ============================================
     */
    static async sendReminders() {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        const dayAfterTomorrow = new Date(tomorrow);
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
        // Find appointments for tomorrow
        const appointments = await prisma_1.default.appointment.findMany({
            where: {
                appointmentDate: {
                    gte: tomorrow,
                    lt: dayAfterTomorrow,
                },
                status: { in: ['SCHEDULED', 'CONFIRMED'] },
            },
            include: {
                patient: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                        email: true,
                    },
                },
                doctor: {
                    select: {
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });
        let sentCount = 0;
        for (const appointment of appointments) {
            try {
                // Send SMS reminder
                if (appointment.patient.phone) {
                    const { SmsService } = await Promise.resolve().then(() => __importStar(require('../../auth/services/smsService')));
                    await SmsService.sendSms(appointment.patient.phone, `[VoiceMed Pro] Reminder: You have an appointment with Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName} tomorrow at ${appointment.startTime}. ID: ${appointment.appointmentId}`);
                }
                // Send email reminder
                if (appointment.patient.email) {
                    const { EmailService } = await Promise.resolve().then(() => __importStar(require('../../auth/services/emailService')));
                    await EmailService.sendMail(appointment.patient.email, 'Appointment Reminder - VoiceMed Pro', `
              <h2>Appointment Reminder</h2>
              <p>Dear ${appointment.patient.firstName},</p>
              <p>This is a reminder for your appointment tomorrow:</p>
              <ul>
                <li><strong>Doctor:</strong> Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}</li>
                <li><strong>Time:</strong> ${appointment.startTime}</li>
                <li><strong>Appointment ID:</strong> ${appointment.appointmentId}</li>
              </ul>
              <p>Please arrive 10 minutes before your scheduled time.</p>
            `);
                }
                sentCount++;
            }
            catch (error) {
                logger_1.default.error(`Failed to send reminder for appointment ${appointment.id}:`, error);
            }
        }
        logger_1.default.info(`Sent ${sentCount} appointment reminders for tomorrow`);
    }
}
exports.QueueService = QueueService;
//# sourceMappingURL=queueService.js.map