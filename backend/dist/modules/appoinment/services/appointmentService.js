"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentService = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = __importDefault(require("../../../config/prisma"));
const emailService_1 = require("../../auth/services/emailService");
const smsService_1 = require("../../auth/services/smsService");
const errors_1 = require("../../../utils/errors");
const logger_1 = __importDefault(require("../../../utils/logger"));
class AppointmentService {
    /**
     * ============================================
     * CREATE APPOINTMENT
     * ============================================
     */
    static async createAppointment(data, userId, ipAddress, userAgent) {
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
            include: { doctorProfile: true },
        });
        if (!doctor) {
            throw new errors_1.NotFoundError('Doctor not found or not available');
        }
        // Check doctor's schedule for the day
        const appointmentDate = new Date(data.appointmentDate);
        const dayOfWeek = appointmentDate.getDay();
        const schedule = await prisma_1.default.doctorSchedule.findFirst({
            where: {
                doctorId: data.doctorId,
                dayOfWeek,
                isActive: true,
            },
        });
        if (!schedule) {
            throw new errors_1.BadRequestError('Doctor is not available on this day');
        }
        // Check if the requested time is within doctor's schedule
        if (data.startTime < schedule.startTime ||
            (data.endTime && data.endTime > schedule.endTime)) {
            throw new errors_1.BadRequestError(`Doctor is only available from ${schedule.startTime} to ${schedule.endTime}`);
        }
        // Calculate end time if not provided
        const duration = data.duration || 15;
        let endTime = data.endTime;
        if (!endTime) {
            const [hours, minutes] = data.startTime.split(':').map(Number);
            const totalMinutes = hours * 60 + minutes + duration;
            const endHours = Math.floor(totalMinutes / 60);
            const endMinutes = totalMinutes % 60;
            endTime = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
        }
        // Check for scheduling conflicts
        await this.checkSchedulingConflict(data.doctorId, data.appointmentDate, data.startTime, endTime, undefined // exclude current appointment
        );
        // Check patient doesn't have another appointment at the same time
        await this.checkPatientConflict(data.patientId, data.appointmentDate, data.startTime, endTime);
        // Check doctor's max patients per day
        const appointmentsCount = await prisma_1.default.appointment.count({
            where: {
                doctorId: data.doctorId,
                appointmentDate: {
                    gte: new Date(data.appointmentDate + 'T00:00:00Z'),
                    lt: new Date(data.appointmentDate + 'T23:59:59Z'),
                },
                status: { notIn: ['CANCELLED', 'NO_SHOW'] },
            },
        });
        const maxPatients = doctor.doctorProfile?.maxPatientsPerDay || 20;
        if (appointmentsCount >= maxPatients) {
            throw new errors_1.BadRequestError('Doctor has reached maximum patients for this day');
        }
        // Generate unique appointment ID
        const appointmentId = await this.generateAppointmentId();
        // Create appointment
        const appointment = await prisma_1.default.$transaction(async (tx) => {
            const newAppointment = await tx.appointment.create({
                data: {
                    appointmentId,
                    patientId: data.patientId,
                    doctorId: data.doctorId,
                    branchId: data.branchId || patient.branchId,
                    organizationId: data.organizationId || patient.organizationId,
                    appointmentDate: new Date(data.appointmentDate),
                    startTime: data.startTime,
                    endTime: endTime,
                    duration,
                    type: data.type || client_1.AppointmentType.IN_PERSON,
                    status: client_1.AppointmentStatus.SCHEDULED,
                    reason: data.reason || null,
                    symptoms: data.symptoms || null,
                    notes: data.notes || null,
                    isFollowUp: data.isFollowUp || false,
                    followUpForId: data.followUpForId || null,
                    createdById: userId,
                    updatedById: userId,
                },
                include: this.getAppointmentInclude(),
            });
            // Create audit log
            await tx.auditLog.create({
                data: {
                    userId,
                    organizationId: newAppointment.organizationId,
                    action: 'APPOINTMENT_CREATED',
                    resource: 'APPOINTMENT',
                    resourceId: newAppointment.id,
                    ipAddress,
                    userAgent,
                    metadata: {
                        appointmentId: newAppointment.appointmentId,
                        patientId: data.patientId,
                        doctorId: data.doctorId,
                        date: data.appointmentDate,
                        time: data.startTime,
                    },
                },
            });
            return newAppointment;
        });
        // Send notifications (non-blocking)
        this.sendAppointmentNotifications(appointment, 'created').catch((error) => {
            logger_1.default.error('Failed to send appointment notifications:', error);
        });
        logger_1.default.info(`Appointment created: ${appointment.appointmentId}`);
        return this.formatAppointmentResponse(appointment);
    }
    /**
     * ============================================
     * GET APPOINTMENT BY ID
     * ============================================
     */
    static async getAppointmentById(id) {
        const appointment = await prisma_1.default.appointment.findUnique({
            where: { id },
            include: this.getAppointmentInclude(),
        });
        if (!appointment) {
            throw new errors_1.NotFoundError('Appointment not found');
        }
        return this.formatAppointmentResponse(appointment);
    }
    /**
     * ============================================
     * LIST APPOINTMENTS WITH FILTERING
     * ============================================
     */
    static async listAppointments(query) {
        const { page = 1, limit = 10, patientId, doctorId, branchId, organizationId, status, type, dateFrom, dateTo, search, sortBy = 'appointmentDate', sortOrder = 'asc', } = query;
        // Build where clause
        const where = {};
        if (patientId)
            where.patientId = patientId;
        if (doctorId)
            where.doctorId = doctorId;
        if (branchId)
            where.branchId = branchId;
        if (organizationId)
            where.organizationId = organizationId;
        if (status)
            where.status = status;
        if (type)
            where.type = type;
        // Date range filter
        if (dateFrom || dateTo) {
            where.appointmentDate = {};
            if (dateFrom)
                where.appointmentDate.gte = new Date(dateFrom);
            if (dateTo)
                where.appointmentDate.lte = new Date(dateTo);
        }
        // Search by patient name, doctor name, or appointment ID
        if (search) {
            where.OR = [
                {
                    patient: {
                        OR: [
                            { firstName: { contains: search, mode: 'insensitive' } },
                            { lastName: { contains: search, mode: 'insensitive' } },
                            { patientId: { contains: search } },
                        ],
                    },
                },
                {
                    doctor: {
                        OR: [
                            { firstName: { contains: search, mode: 'insensitive' } },
                            { lastName: { contains: search, mode: 'insensitive' } },
                        ],
                    },
                },
                { appointmentId: { contains: search } },
            ];
        }
        const skip = (page - 1) * limit;
        const [appointments, total] = await Promise.all([
            prisma_1.default.appointment.findMany({
                where,
                include: this.getAppointmentInclude(),
                orderBy: { [sortBy]: sortOrder },
                skip,
                take: limit,
            }),
            prisma_1.default.appointment.count({ where }),
        ]);
        return {
            appointments: appointments.map((a) => this.formatAppointmentResponse(a)),
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
     * UPDATE APPOINTMENT
     * ============================================
     */
    static async updateAppointment(id, data, userId, ipAddress, userAgent) {
        const existingAppointment = await prisma_1.default.appointment.findUnique({
            where: { id },
        });
        if (!existingAppointment) {
            throw new errors_1.NotFoundError('Appointment not found');
        }
        // Check if appointment can be updated
        if (['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(existingAppointment.status)) {
            throw new errors_1.BadRequestError(`Cannot update ${existingAppointment.status.toLowerCase()} appointment`);
        }
        const appointment = await prisma_1.default.$transaction(async (tx) => {
            const updated = await tx.appointment.update({
                where: { id },
                data: {
                    ...(data.appointmentDate && { appointmentDate: new Date(data.appointmentDate) }),
                    ...(data.startTime && { startTime: data.startTime }),
                    ...(data.endTime && { endTime: data.endTime }),
                    ...(data.type && { type: data.type }),
                    ...(data.status && { status: data.status }),
                    ...(data.reason !== undefined && { reason: data.reason }),
                    ...(data.symptoms !== undefined && { symptoms: data.symptoms }),
                    ...(data.notes !== undefined && { notes: data.notes }),
                    ...(data.status === 'IN_PROGRESS' && { actualStartTime: new Date() }),
                    ...(data.status === 'COMPLETED' && { actualEndTime: new Date() }),
                    updatedById: userId,
                },
                include: this.getAppointmentInclude(),
            });
            await tx.auditLog.create({
                data: {
                    userId,
                    organizationId: updated.organizationId,
                    action: 'APPOINTMENT_UPDATED',
                    resource: 'APPOINTMENT',
                    resourceId: updated.id,
                    ipAddress,
                    userAgent,
                    metadata: {
                        appointmentId: updated.appointmentId,
                        status: updated.status,
                    },
                },
            });
            return updated;
        });
        return this.formatAppointmentResponse(appointment);
    }
    /**
     * ============================================
     * RESCHEDULE APPOINTMENT
     * ============================================
     */
    static async rescheduleAppointment(id, data, userId, ipAddress, userAgent) {
        const existingAppointment = await prisma_1.default.appointment.findUnique({
            where: { id },
        });
        if (!existingAppointment) {
            throw new errors_1.NotFoundError('Appointment not found');
        }
        if (!['SCHEDULED', 'CONFIRMED'].includes(existingAppointment.status)) {
            throw new errors_1.BadRequestError('Only scheduled or confirmed appointments can be rescheduled');
        }
        // Calculate end time
        let endTime = data.endTime;
        if (!endTime) {
            const [hours, minutes] = data.startTime.split(':').map(Number);
            const totalMinutes = hours * 60 + minutes + existingAppointment.duration;
            const endHours = Math.floor(totalMinutes / 60);
            const endMinutes = totalMinutes % 60;
            endTime = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
        }
        // Check for conflicts (excluding current appointment)
        await this.checkSchedulingConflict(existingAppointment.doctorId, data.appointmentDate, data.startTime, endTime, id);
        const appointment = await prisma_1.default.$transaction(async (tx) => {
            const updated = await tx.appointment.update({
                where: { id },
                data: {
                    appointmentDate: new Date(data.appointmentDate),
                    startTime: data.startTime,
                    endTime,
                    status: client_1.AppointmentStatus.RESCHEDULED,
                    updatedById: userId,
                },
                include: this.getAppointmentInclude(),
            });
            await tx.auditLog.create({
                data: {
                    userId,
                    organizationId: updated.organizationId,
                    action: 'APPOINTMENT_RESCHEDULED',
                    resource: 'APPOINTMENT',
                    resourceId: updated.id,
                    ipAddress,
                    userAgent,
                    metadata: {
                        appointmentId: updated.appointmentId,
                        oldDate: existingAppointment.appointmentDate,
                        newDate: data.appointmentDate,
                        reason: data.reason,
                    },
                },
            });
            return updated;
        });
        // Send reschedule notifications
        this.sendAppointmentNotifications(appointment, 'rescheduled').catch((error) => {
            logger_1.default.error('Failed to send reschedule notifications:', error);
        });
        return this.formatAppointmentResponse(appointment);
    }
    /**
     * ============================================
     * CANCEL APPOINTMENT
     * ============================================
     */
    static async cancelAppointment(id, reason, userId, ipAddress, userAgent) {
        const existingAppointment = await prisma_1.default.appointment.findUnique({
            where: { id },
        });
        if (!existingAppointment) {
            throw new errors_1.NotFoundError('Appointment not found');
        }
        if (['COMPLETED', 'CANCELLED'].includes(existingAppointment.status)) {
            throw new errors_1.BadRequestError('Appointment is already ' + existingAppointment.status.toLowerCase());
        }
        const appointment = await prisma_1.default.$transaction(async (tx) => {
            const updated = await tx.appointment.update({
                where: { id },
                data: {
                    status: client_1.AppointmentStatus.CANCELLED,
                    cancelledAt: new Date(),
                    cancelledBy: userId,
                    cancelReason: reason || 'Cancelled by user',
                    updatedById: userId,
                },
                include: this.getAppointmentInclude(),
            });
            await tx.auditLog.create({
                data: {
                    userId,
                    organizationId: updated.organizationId,
                    action: 'APPOINTMENT_CANCELLED',
                    resource: 'APPOINTMENT',
                    resourceId: updated.id,
                    ipAddress,
                    userAgent,
                    metadata: {
                        appointmentId: updated.appointmentId,
                        reason,
                    },
                },
            });
            return updated;
        });
        // Send cancellation notifications
        this.sendAppointmentNotifications(appointment, 'cancelled').catch((error) => {
            logger_1.default.error('Failed to send cancellation notifications:', error);
        });
        return this.formatAppointmentResponse(appointment);
    }
    /**
     * ============================================
     * GET AVAILABLE SLOTS
     * ============================================
     */
    static async getAvailableSlots(doctorId, date, branchId) {
        const appointmentDate = new Date(date);
        const dayOfWeek = appointmentDate.getDay();
        // Get doctor's schedule for this day
        const schedule = await prisma_1.default.doctorSchedule.findFirst({
            where: {
                doctorId,
                dayOfWeek,
                isActive: true,
            },
        });
        if (!schedule) {
            return {
                date,
                slots: [],
            };
        }
        // Get existing appointments for this doctor on this date
        const existingAppointments = await prisma_1.default.appointment.findMany({
            where: {
                doctorId,
                appointmentDate: {
                    gte: new Date(date + 'T00:00:00Z'),
                    lt: new Date(date + 'T23:59:59Z'),
                },
                status: { notIn: ['CANCELLED', 'NO_SHOW'] },
            },
            select: {
                startTime: true,
                endTime: true,
                duration: true,
            },
        });
        // Generate time slots
        const slots = [];
        const slotDuration = schedule.slotDuration || 15;
        const [startHour, startMinute] = schedule.startTime.split(':').map(Number);
        const [endHour, endMinute] = schedule.endTime.split(':').map(Number);
        let currentMinutes = startHour * 60 + startMinute;
        const endMinutes = endHour * 60 + endMinute;
        while (currentMinutes + slotDuration <= endMinutes) {
            // Skip break time if defined
            if (schedule.breakStart && schedule.breakEnd) {
                const [breakStartHour, breakStartMin] = schedule.breakStart.split(':').map(Number);
                const [breakEndHour, breakEndMin] = schedule.breakEnd.split(':').map(Number);
                const breakStart = breakStartHour * 60 + breakStartMin;
                const breakEnd = breakEndHour * 60 + breakEndMin;
                if (currentMinutes >= breakStart && currentMinutes < breakEnd) {
                    currentMinutes = breakEnd;
                    continue;
                }
            }
            const slotStartHour = Math.floor(currentMinutes / 60);
            const slotStartMin = currentMinutes % 60;
            const slotEndHour = Math.floor((currentMinutes + slotDuration) / 60);
            const slotEndMin = (currentMinutes + slotDuration) % 60;
            const slotStart = `${String(slotStartHour).padStart(2, '0')}:${String(slotStartMin).padStart(2, '0')}`;
            const slotEnd = `${String(slotEndHour).padStart(2, '0')}:${String(slotEndMin).padStart(2, '0')}`;
            // Check if slot conflicts with any existing appointment
            const isBooked = existingAppointments.some((apt) => {
                return slotStart < apt.endTime && slotEnd > apt.startTime;
            });
            slots.push({
                startTime: slotStart,
                endTime: slotEnd,
                isAvailable: !isBooked,
                isBooked,
            });
            currentMinutes += slotDuration;
        }
        return {
            date,
            slots,
        };
    }
    /**
     * ============================================
     * APPOINTMENT STATISTICS
     * ============================================
     */
    static async getAppointmentStats(organizationId, doctorId, dateFrom, dateTo) {
        const where = {};
        if (organizationId)
            where.organizationId = organizationId;
        if (doctorId)
            where.doctorId = doctorId;
        if (dateFrom || dateTo) {
            where.appointmentDate = {};
            if (dateFrom)
                where.appointmentDate.gte = new Date(dateFrom);
            if (dateTo)
                where.appointmentDate.lte = new Date(dateTo);
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const [totalAppointments, todayAppointments, completedToday, cancelledToday, noShowToday, typeDistribution, statusDistribution,] = await Promise.all([
            prisma_1.default.appointment.count({ where }),
            prisma_1.default.appointment.count({
                where: {
                    ...where,
                    appointmentDate: { gte: today, lt: tomorrow },
                },
            }),
            prisma_1.default.appointment.count({
                where: {
                    ...where,
                    appointmentDate: { gte: today, lt: tomorrow },
                    status: 'COMPLETED',
                },
            }),
            prisma_1.default.appointment.count({
                where: {
                    ...where,
                    appointmentDate: { gte: today, lt: tomorrow },
                    status: 'CANCELLED',
                },
            }),
            prisma_1.default.appointment.count({
                where: {
                    ...where,
                    appointmentDate: { gte: today, lt: tomorrow },
                    status: 'NO_SHOW',
                },
            }),
            // Type distribution
            prisma_1.default.appointment.groupBy({
                by: ['type'],
                where,
                _count: true,
            }),
            // Status distribution
            prisma_1.default.appointment.groupBy({
                by: ['status'],
                where,
                _count: true,
            }),
        ]);
        const typeDistributionMap = {};
        typeDistribution.forEach((t) => {
            typeDistributionMap[t.type] = t._count;
        });
        const statusDistributionMap = {};
        statusDistribution.forEach((s) => {
            statusDistributionMap[s.status] = s._count;
        });
        return {
            totalAppointments,
            todayAppointments,
            completedToday,
            cancelledToday,
            noShowToday,
            waitingInQueue: statusDistributionMap['SCHEDULED'] || 0 + statusDistributionMap['CONFIRMED'] || 0,
            averageWaitTime: 15, // This would be calculated from actual data
            appointmentTypeDistribution: typeDistributionMap,
            statusDistribution: statusDistributionMap,
            peakHours: [],
            monthlyTrend: [],
        };
    }
    /**
     * ============================================
     * HELPER METHODS
     * ============================================
     */
    static async generateAppointmentId() {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const prefix = `APT${year}${month}${day}`;
        const count = await prisma_1.default.appointment.count({
            where: {
                appointmentId: { startsWith: prefix },
            },
        });
        const sequential = (count + 1).toString().padStart(4, '0');
        return `${prefix}${sequential}`;
    }
    static async checkSchedulingConflict(doctorId, date, startTime, endTime, excludeAppointmentId) {
        const where = {
            doctorId,
            appointmentDate: {
                gte: new Date(date + 'T00:00:00Z'),
                lt: new Date(date + 'T23:59:59Z'),
            },
            status: { notIn: ['CANCELLED', 'NO_SHOW'] },
            OR: [
                {
                    startTime: { lt: endTime },
                    endTime: { gt: startTime },
                },
            ],
        };
        if (excludeAppointmentId) {
            where.id = { not: excludeAppointmentId };
        }
        const conflictingAppointment = await prisma_1.default.appointment.findFirst({ where });
        if (conflictingAppointment) {
            throw new errors_1.ConflictError(`Time slot ${startTime}-${endTime} conflicts with existing appointment (${conflictingAppointment.appointmentId})`);
        }
    }
    static async checkPatientConflict(patientId, date, startTime, endTime) {
        const conflictingAppointment = await prisma_1.default.appointment.findFirst({
            where: {
                patientId,
                appointmentDate: {
                    gte: new Date(date + 'T00:00:00Z'),
                    lt: new Date(date + 'T23:59:59Z'),
                },
                status: { notIn: ['CANCELLED', 'NO_SHOW'] },
                OR: [
                    {
                        startTime: { lt: endTime },
                        endTime: { gt: startTime },
                    },
                ],
            },
        });
        if (conflictingAppointment) {
            throw new errors_1.ConflictError(`Patient already has an appointment at this time (${conflictingAppointment.appointmentId})`);
        }
    }
    static async sendAppointmentNotifications(appointment, action) {
        const patient = appointment.patient;
        const doctor = appointment.doctor;
        const notificationData = {
            appointmentId: appointment.appointmentId,
            date: appointment.appointmentDate,
            time: appointment.startTime,
            doctorName: `Dr. ${doctor.firstName} ${doctor.lastName}`,
            patientName: `${patient.firstName} ${patient.lastName}`,
        };
        // Send email to patient
        if (patient.email) {
            const subject = this.getNotificationSubject(action);
            const html = this.getNotificationTemplate(notificationData, action, 'patient');
            emailService_1.EmailService.sendMail(patient.email, subject, html).catch((err) => {
                logger_1.default.error('Failed to send patient email:', err);
            });
        }
        // Send SMS to patient
        if (patient.phone) {
            const message = this.getSmsMessage(notificationData, action);
            smsService_1.SmsService.sendSms(patient.phone, message).catch((err) => {
                logger_1.default.error('Failed to send patient SMS:', err);
            });
        }
        // Send email to doctor
        if (doctor.email) {
            const subject = `Appointment ${action} - ${patient.firstName} ${patient.lastName}`;
            const html = this.getNotificationTemplate(notificationData, action, 'doctor');
            emailService_1.EmailService.sendMail(doctor.email, subject, html).catch((err) => {
                logger_1.default.error('Failed to send doctor email:', err);
            });
        }
    }
    static getNotificationSubject(action) {
        const subjects = {
            created: 'Appointment Confirmed - VoiceMed Pro',
            rescheduled: 'Appointment Rescheduled - VoiceMed Pro',
            cancelled: 'Appointment Cancelled - VoiceMed Pro',
            reminder: 'Appointment Reminder - VoiceMed Pro',
        };
        return subjects[action] || 'Appointment Update - VoiceMed Pro';
    }
    static getSmsMessage(data, action) {
        const messages = {
            created: `[VoiceMed Pro] Appointment confirmed with ${data.doctorName} on ${data.date} at ${data.time}. ID: ${data.appointmentId}`,
            rescheduled: `[VoiceMed Pro] Appointment rescheduled with ${data.doctorName} to ${data.date} at ${data.time}. ID: ${data.appointmentId}`,
            cancelled: `[VoiceMed Pro] Appointment cancelled with ${data.doctorName} on ${data.date} at ${data.time}. ID: ${data.appointmentId}`,
        };
        return messages[action] || '';
    }
    static getNotificationTemplate(data, action, recipient) {
        return `
      <div style="font-family: Arial; max-width: 480px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1B3A6B;">Appointment ${action.charAt(0).toUpperCase() + action.slice(1)}</h2>
        <div style="background: #f0fdfa; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p><strong>Appointment ID:</strong> ${data.appointmentId}</p>
          <p><strong>Date:</strong> ${data.date}</p>
          <p><strong>Time:</strong> ${data.time}</p>
          <p><strong>${recipient === 'patient' ? 'Doctor' : 'Patient'}:</strong> ${recipient === 'patient' ? data.doctorName : data.patientName}</p>
        </div>
        <p style="color: #6b7280;">Thank you for choosing VoiceMed Pro.</p>
      </div>
    `;
    }
    static getAppointmentInclude() {
        return {
            patient: {
                select: {
                    id: true,
                    patientId: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                    email: true,
                    dateOfBirth: true,
                    gender: true,
                    bloodGroup: true,
                },
            },
            doctor: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatarUrl: true,
                    doctorProfile: {
                        select: {
                            specialization: true,
                        },
                    },
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
            payment: {
                select: {
                    id: true,
                    invoiceId: true,
                    amount: true,
                    status: true,
                },
            },
        };
    }
    static formatAppointmentResponse(appointment) {
        return {
            id: appointment.id,
            appointmentId: appointment.appointmentId,
            patient: {
                id: appointment.patient.id,
                patientId: appointment.patient.patientId,
                firstName: appointment.patient.firstName,
                lastName: appointment.patient.lastName,
                phone: appointment.patient.phone,
                email: appointment.patient.email,
                dateOfBirth: appointment.patient.dateOfBirth?.toISOString() || null,
                gender: appointment.patient.gender,
                bloodGroup: appointment.patient.bloodGroup,
            },
            doctor: {
                id: appointment.doctor.id,
                firstName: appointment.doctor.firstName,
                lastName: appointment.doctor.lastName,
                specialization: appointment.doctor.doctorProfile?.specialization || null,
                avatarUrl: appointment.doctor.avatarUrl,
            },
            branch: appointment.branch,
            appointmentDate: appointment.appointmentDate.toISOString(),
            startTime: appointment.startTime,
            endTime: appointment.endTime,
            duration: appointment.duration,
            type: appointment.type,
            status: appointment.status,
            reason: appointment.reason,
            symptoms: appointment.symptoms,
            notes: appointment.notes,
            queueToken: appointment.queueToken,
            queuePosition: appointment.queuePosition,
            estimatedWait: appointment.estimatedWait,
            actualStartTime: appointment.actualStartTime?.toISOString() || null,
            actualEndTime: appointment.actualEndTime?.toISOString() || null,
            cancelledAt: appointment.cancelledAt?.toISOString() || null,
            cancelledBy: appointment.cancelledBy,
            cancelReason: appointment.cancelReason,
            isFollowUp: appointment.isFollowUp,
            followUpFor: null,
            payment: appointment.payment,
            createdBy: appointment.createdBy,
            createdAt: appointment.createdAt.toISOString(),
            updatedAt: appointment.updatedAt.toISOString(),
        };
    }
}
exports.AppointmentService = AppointmentService;
//# sourceMappingURL=appointmentService.js.map