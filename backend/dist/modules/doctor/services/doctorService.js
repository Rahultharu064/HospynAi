"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DoctorService = void 0;
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = __importDefault(require("../../../config/prisma"));
const config_1 = require("../../../config");
const emailService_1 = require("../../auth/services/emailService");
const errors_1 = require("../../../utils/errors");
const logger_1 = __importDefault(require("../../../utils/logger"));
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
class DoctorService {
    /**
     * ============================================
     * CREATE DOCTOR
     * ============================================
     */
    static async createDoctor(data, userId, ipAddress, userAgent) {
        // Check if email already exists
        const existingUser = await prisma_1.default.user.findUnique({
            where: { email: data.email },
        });
        if (existingUser) {
            throw new errors_1.ConflictError('A user with this email already exists');
        }
        // Check if license number already exists
        if (data.licenseNumber) {
            const existingLicense = await prisma_1.default.doctorProfile.findUnique({
                where: { licenseNumber: data.licenseNumber },
            });
            if (existingLicense) {
                throw new errors_1.ConflictError('A doctor with this license number already exists');
            }
        }
        // Validate organization/branch
        if (data.organizationId) {
            const org = await prisma_1.default.organization.findUnique({
                where: { id: data.organizationId },
            });
            if (!org)
                throw new errors_1.BadRequestError('Organization not found');
        }
        if (data.branchId) {
            const branch = await prisma_1.default.branch.findUnique({
                where: { id: data.branchId },
            });
            if (!branch)
                throw new errors_1.BadRequestError('Branch not found');
        }
        // Hash password
        const hashedPassword = await bcryptjs_1.default.hash(data.password, config_1.config.security.bcryptRounds);
        // Create user and doctor profile in transaction
        const result = await prisma_1.default.$transaction(async (tx) => {
            // Create user
            const user = await tx.user.create({
                data: {
                    email: data.email,
                    passwordHash: hashedPassword,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    phone: data.phone || null,
                    role: client_1.UserRole.DOCTOR,
                    status: client_1.UserStatus.ACTIVE,
                    authProvider: client_1.AuthProvider.LOCAL,
                    isEmailVerified: true, // Doctors are pre-verified
                    organizationId: data.organizationId || null,
                    branchId: data.branchId || null,
                },
            });
            // Create doctor profile
            const profile = await tx.doctorProfile.create({
                data: {
                    userId: user.id,
                    specialization: data.specialization || null,
                    subSpecialization: data.subSpecialization || null,
                    qualification: data.qualification || null,
                    experience: data.experience || null,
                    licenseNumber: data.licenseNumber || null,
                    licenseExpiry: data.licenseExpiry ? new Date(data.licenseExpiry) : null,
                    biography: data.biography || null,
                    consultationFee: data.consultationFee || null,
                    telemedicineFee: data.telemedicineFee || null,
                    followUpFee: data.followUpFee || null,
                    maxPatientsPerDay: data.maxPatientsPerDay || 20,
                    availableForTelemed: data.availableForTelemed || false,
                    timezone: data.timezone || 'UTC',
                },
            });
            // Create default schedule if provided
            if (data.schedule?.days) {
                for (const day of data.schedule.days) {
                    await tx.doctorSchedule.create({
                        data: {
                            doctorId: profile.id,
                            dayOfWeek: day.dayOfWeek,
                            startTime: day.startTime,
                            endTime: day.endTime,
                            slotDuration: day.slotDuration || 15,
                            isActive: day.isActive ?? true,
                            breakStart: day.breakStart || null,
                            breakEnd: day.breakEnd || null,
                        },
                    });
                }
            }
            // Create audit log
            await tx.auditLog.create({
                data: {
                    userId,
                    organizationId: data.organizationId || null,
                    action: 'DOCTOR_CREATED',
                    resource: 'DOCTOR',
                    resourceId: user.id,
                    ipAddress,
                    userAgent,
                    metadata: {
                        doctorEmail: user.email,
                        doctorName: `${user.firstName} ${user.lastName}`,
                        specialization: data.specialization,
                    },
                },
            });
            return { user, profile };
        });
        // Send welcome email (non-blocking)
        emailService_1.EmailService.sendWelcomeEmail(result.user.email, result.user.firstName).catch((error) => {
            logger_1.default.error('Failed to send welcome email to doctor:', error);
        });
        logger_1.default.info(`Doctor created: ${result.user.email}`);
        return this.getDoctorById(result.user.id);
    }
    /**
     * ============================================
     * GET DOCTOR BY ID
     * ============================================
     */
    static async getDoctorById(id) {
        const user = await prisma_1.default.user.findFirst({
            where: { id, role: client_1.UserRole.DOCTOR },
            include: this.getDoctorInclude(),
        });
        if (!user || !user.doctorProfile) {
            throw new errors_1.NotFoundError('Doctor not found');
        }
        return this.formatDoctorResponse(user);
    }
    /**
     * ============================================
     * LIST DOCTORS
     * ============================================
     */
    static async listDoctors(query) {
        const { page = 1, limit = 10, search, specialization, organizationId, branchId, availableForTelemed, status, sortBy = 'createdAt', sortOrder = 'desc', } = query;
        const where = {
            role: client_1.UserRole.DOCTOR,
            ...(status && { status: status }),
            ...(organizationId && { organizationId }),
            ...(branchId && { branchId }),
            ...(search && {
                OR: [
                    { firstName: { contains: search, mode: 'insensitive' } },
                    { lastName: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                    {
                        doctorProfile: {
                            specialization: { contains: search, mode: 'insensitive' },
                        },
                    },
                ],
            }),
            ...(specialization && {
                doctorProfile: {
                    specialization: { contains: specialization, mode: 'insensitive' },
                },
            }),
            ...(availableForTelemed !== undefined && {
                doctorProfile: {
                    availableForTelemed,
                },
            }),
        };
        const skip = (page - 1) * limit;
        const [doctors, total] = await Promise.all([
            prisma_1.default.user.findMany({
                where,
                include: this.getDoctorInclude(),
                orderBy: sortBy === 'specialization' || sortBy === 'experience'
                    ? { doctorProfile: { [sortBy]: sortOrder } }
                    : { [sortBy]: sortOrder },
                skip,
                take: limit,
            }),
            prisma_1.default.user.count({ where }),
        ]);
        return {
            doctors: doctors.map((d) => this.formatDoctorResponse(d)),
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
     * UPDATE DOCTOR
     * ============================================
     */
    static async updateDoctor(id, data, userId, ipAddress, userAgent) {
        const user = await prisma_1.default.user.findFirst({
            where: { id, role: client_1.UserRole.DOCTOR },
            include: { doctorProfile: true },
        });
        if (!user || !user.doctorProfile) {
            throw new errors_1.NotFoundError('Doctor not found');
        }
        // Check license uniqueness
        if (data.licenseNumber) {
            const existingLicense = await prisma_1.default.doctorProfile.findFirst({
                where: {
                    licenseNumber: data.licenseNumber,
                    userId: { not: id },
                },
            });
            if (existingLicense) {
                throw new errors_1.ConflictError('License number already in use');
            }
        }
        await prisma_1.default.$transaction(async (tx) => {
            // Update user fields
            const userUpdateData = {};
            if (data.firstName)
                userUpdateData.firstName = data.firstName;
            if (data.lastName)
                userUpdateData.lastName = data.lastName;
            if (data.phone !== undefined)
                userUpdateData.phone = data.phone;
            if (data.status)
                userUpdateData.status = data.status;
            if (Object.keys(userUpdateData).length > 0) {
                await tx.user.update({
                    where: { id },
                    data: userUpdateData,
                });
            }
            // Update doctor profile
            const profileUpdateData = {};
            if (data.specialization !== undefined)
                profileUpdateData.specialization = data.specialization;
            if (data.subSpecialization !== undefined)
                profileUpdateData.subSpecialization = data.subSpecialization;
            if (data.qualification !== undefined)
                profileUpdateData.qualification = data.qualification;
            if (data.experience !== undefined)
                profileUpdateData.experience = data.experience;
            if (data.licenseNumber !== undefined)
                profileUpdateData.licenseNumber = data.licenseNumber;
            if (data.licenseExpiry !== undefined)
                profileUpdateData.licenseExpiry = data.licenseExpiry ? new Date(data.licenseExpiry) : null;
            if (data.biography !== undefined)
                profileUpdateData.biography = data.biography;
            if (data.consultationFee !== undefined)
                profileUpdateData.consultationFee = data.consultationFee;
            if (data.telemedicineFee !== undefined)
                profileUpdateData.telemedicineFee = data.telemedicineFee;
            if (data.followUpFee !== undefined)
                profileUpdateData.followUpFee = data.followUpFee;
            if (data.maxPatientsPerDay !== undefined)
                profileUpdateData.maxPatientsPerDay = data.maxPatientsPerDay;
            if (data.availableForTelemed !== undefined)
                profileUpdateData.availableForTelemed = data.availableForTelemed;
            if (data.timezone)
                profileUpdateData.timezone = data.timezone;
            if (Object.keys(profileUpdateData).length > 0) {
                await tx.doctorProfile.update({
                    where: { userId: id },
                    data: profileUpdateData,
                });
            }
            await tx.auditLog.create({
                data: {
                    userId,
                    action: 'DOCTOR_UPDATED',
                    resource: 'DOCTOR',
                    resourceId: id,
                    ipAddress,
                    userAgent,
                },
            });
        });
        logger_1.default.info(`Doctor updated: ${id}`);
        return this.getDoctorById(id);
    }
    /**
     * ============================================
     * UPDATE SCHEDULE
     * ============================================
     */
    static async updateSchedule(id, data, userId, ipAddress, userAgent) {
        const user = await prisma_1.default.user.findFirst({
            where: { id, role: client_1.UserRole.DOCTOR },
            include: { doctorProfile: true },
        });
        if (!user || !user.doctorProfile) {
            throw new errors_1.NotFoundError('Doctor not found');
        }
        // Delete existing schedules and create new ones
        await prisma_1.default.$transaction(async (tx) => {
            await tx.doctorSchedule.deleteMany({
                where: { doctorId: user.doctorProfile.id },
            });
            for (const day of data.days) {
                await tx.doctorSchedule.create({
                    data: {
                        doctorId: user.doctorProfile.id,
                        dayOfWeek: day.dayOfWeek,
                        startTime: day.startTime,
                        endTime: day.endTime,
                        slotDuration: day.slotDuration || 15,
                        isActive: day.isActive ?? true,
                        breakStart: day.breakStart || null,
                        breakEnd: day.breakEnd || null,
                    },
                });
            }
            await tx.auditLog.create({
                data: {
                    userId,
                    action: 'DOCTOR_SCHEDULE_UPDATED',
                    resource: 'DOCTOR',
                    resourceId: id,
                    ipAddress,
                    userAgent,
                },
            });
        });
        logger_1.default.info(`Doctor schedule updated: ${id}`);
        // Return updated schedule
        const schedules = await prisma_1.default.doctorSchedule.findMany({
            where: { doctorId: user.doctorProfile.id },
            orderBy: { dayOfWeek: 'asc' },
        });
        return schedules.map((s) => ({
            id: s.id,
            dayOfWeek: s.dayOfWeek,
            dayName: DAY_NAMES[s.dayOfWeek],
            startTime: s.startTime,
            endTime: s.endTime,
            slotDuration: s.slotDuration,
            isActive: s.isActive,
            breakStart: s.breakStart,
            breakEnd: s.breakEnd,
        }));
    }
    /**
     * ============================================
     * GET DOCTOR AVAILABILITY
     * ============================================
     */
    static async getDoctorAvailability(doctorId, dateFrom, dateTo) {
        const user = await prisma_1.default.user.findFirst({
            where: { id: doctorId, role: client_1.UserRole.DOCTOR },
            include: { doctorProfile: true },
        });
        if (!user || !user.doctorProfile) {
            throw new errors_1.NotFoundError('Doctor not found');
        }
        const endDate = dateTo || dateFrom;
        const startDate = new Date(dateFrom);
        const lastDate = new Date(endDate);
        // Get doctor's weekly schedule
        const schedules = await prisma_1.default.doctorSchedule.findMany({
            where: {
                doctorId: user.doctorProfile.id,
                isActive: true,
            },
        });
        // Get existing appointments for the date range
        const appointments = await prisma_1.default.appointment.findMany({
            where: {
                doctorId,
                appointmentDate: {
                    gte: startDate,
                    lte: lastDate,
                },
                status: { notIn: ['CANCELLED', 'NO_SHOW'] },
            },
            select: {
                appointmentDate: true,
                startTime: true,
                endTime: true,
            },
        });
        const availability = [];
        const currentDate = new Date(startDate);
        while (currentDate <= lastDate) {
            const dayOfWeek = currentDate.getDay();
            const daySchedule = schedules.find((s) => s.dayOfWeek === dayOfWeek);
            const dateStr = currentDate.toISOString().split('T')[0];
            if (daySchedule) {
                const dayAppointments = appointments.filter((a) => a.appointmentDate.toISOString().split('T')[0] === dateStr);
                const slots = this.generateTimeSlots(daySchedule.startTime, daySchedule.endTime, daySchedule.slotDuration, dayAppointments, daySchedule.breakStart, daySchedule.breakEnd);
                availability.push({
                    date: dateStr,
                    dayName: DAY_NAMES[dayOfWeek],
                    isAvailable: true,
                    slots,
                });
            }
            else {
                availability.push({
                    date: dateStr,
                    dayName: DAY_NAMES[dayOfWeek],
                    isAvailable: false,
                    slots: [],
                });
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return {
            doctorId: user.id,
            doctorName: `Dr. ${user.firstName} ${user.lastName}`,
            availability,
        };
    }
    /**
     * ============================================
     * DELETE DOCTOR
     * ============================================
     */
    static async deleteDoctor(id, userId, ipAddress, userAgent) {
        const user = await prisma_1.default.user.findFirst({
            where: { id, role: client_1.UserRole.DOCTOR },
        });
        if (!user) {
            throw new errors_1.NotFoundError('Doctor not found');
        }
        // Check if doctor has upcoming appointments
        const upcomingAppointments = await prisma_1.default.appointment.count({
            where: {
                doctorId: id,
                status: { in: ['SCHEDULED', 'CONFIRMED'] },
                appointmentDate: { gte: new Date() },
            },
        });
        if (upcomingAppointments > 0) {
            throw new errors_1.BadRequestError(`Cannot delete doctor with ${upcomingAppointments} upcoming appointments. Please reassign or cancel them first.`);
        }
        await prisma_1.default.$transaction(async (tx) => {
            // Soft delete user
            await tx.user.update({
                where: { id },
                data: {
                    status: client_1.UserStatus.INACTIVE,
                    deletedAt: new Date(),
                },
            });
            await tx.auditLog.create({
                data: {
                    userId,
                    action: 'DOCTOR_DELETED',
                    resource: 'DOCTOR',
                    resourceId: id,
                    ipAddress,
                    userAgent,
                },
            });
        });
        logger_1.default.info(`Doctor deleted: ${id}`);
    }
    /**
     * ============================================
     * HELPER METHODS
     * ============================================
     */
    static generateTimeSlots(startTime, endTime, slotDuration, appointments, breakStart, breakEnd) {
        const slots = [];
        const [startH, startM] = startTime.split(':').map(Number);
        const [endH, endM] = endTime.split(':').map(Number);
        let currentMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;
        // Parse break times
        let breakStartMinutes = -1;
        let breakEndMinutes = -1;
        if (breakStart && breakEnd) {
            const [bsH, bsM] = breakStart.split(':').map(Number);
            const [beH, beM] = breakEnd.split(':').map(Number);
            breakStartMinutes = bsH * 60 + bsM;
            breakEndMinutes = beH * 60 + beM;
        }
        while (currentMinutes + slotDuration <= endMinutes) {
            // Skip break time
            if (currentMinutes >= breakStartMinutes && currentMinutes < breakEndMinutes) {
                currentMinutes = breakEndMinutes;
                continue;
            }
            const slotStart = `${String(Math.floor(currentMinutes / 60)).padStart(2, '0')}:${String(currentMinutes % 60).padStart(2, '0')}`;
            const slotEnd = `${String(Math.floor((currentMinutes + slotDuration) / 60)).padStart(2, '0')}:${String((currentMinutes + slotDuration) % 60).padStart(2, '0')}`;
            const isBooked = appointments.some((apt) => slotStart < apt.endTime && slotEnd > apt.startTime);
            slots.push({
                startTime: slotStart,
                endTime: slotEnd,
                isAvailable: !isBooked,
                isBooked,
            });
            currentMinutes += slotDuration;
        }
        return slots;
    }
    static getDoctorInclude() {
        return {
            doctorProfile: {
                include: {
                    schedules: {
                        orderBy: { dayOfWeek: 'asc' },
                    },
                },
            },
            organization: {
                select: { id: true, name: true },
            },
            branch: {
                select: { id: true, name: true },
            },
        };
    }
    static formatDoctorResponse(user) {
        const profile = user.doctorProfile;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return {
            id: user.id,
            userId: user.id,
            email: user.email,
            phone: user.phone,
            firstName: user.firstName,
            lastName: user.lastName,
            fullName: `Dr. ${user.firstName} ${user.lastName}`,
            avatarUrl: user.avatarUrl,
            role: user.role,
            status: user.status,
            specialization: profile?.specialization || null,
            subSpecialization: profile?.subSpecialization || null,
            qualification: profile?.qualification || null,
            experience: profile?.experience || null,
            licenseNumber: profile?.licenseNumber || null,
            licenseExpiry: profile?.licenseExpiry?.toISOString() || null,
            biography: profile?.biography || null,
            consultationFee: profile?.consultationFee ? Number(profile.consultationFee) : null,
            telemedicineFee: profile?.telemedicineFee ? Number(profile.telemedicineFee) : null,
            followUpFee: profile?.followUpFee ? Number(profile.followUpFee) : null,
            maxPatientsPerDay: profile?.maxPatientsPerDay || null,
            availableForTelemed: profile?.availableForTelemed || false,
            timezone: profile?.timezone || 'UTC',
            isEmailVerified: user.isEmailVerified,
            schedule: profile?.schedules?.map((s) => ({
                id: s.id,
                dayOfWeek: s.dayOfWeek,
                dayName: DAY_NAMES[s.dayOfWeek],
                startTime: s.startTime,
                endTime: s.endTime,
                slotDuration: s.slotDuration,
                isActive: s.isActive,
                breakStart: s.breakStart,
                breakEnd: s.breakEnd,
            })) || [],
            organization: user.organization,
            branch: user.branch,
            stats: {
                totalPatients: 0,
                totalAppointments: 0,
                completedAppointments: 0,
                cancelledAppointments: 0,
                todayAppointments: 0,
                averageRating: 0,
                totalReviews: 0,
            },
            createdAt: user.createdAt.toISOString(),
            updatedAt: user.updatedAt.toISOString(),
        };
    }
}
exports.DoctorService = DoctorService;
//# sourceMappingURL=doctorService.js.map