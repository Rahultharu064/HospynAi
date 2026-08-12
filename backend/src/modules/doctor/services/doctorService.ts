import { Prisma, UserRole, UserStatus, AuthProvider } from '@prisma/client';
import bcrypt from 'bcryptjs';
import prisma from '../../../config/prisma';
import { config } from '../../../config';
import { EmailService } from '../../auth/services/emailService';
import { AuditService } from '../../auth/services/auditService';
import {
  CreateDoctorInput,
  UpdateDoctorInput,
  UpdateScheduleInput,
  DoctorQueryInput,
} from '../validators/doctorValidator';
import {
  BadRequestError,
  NotFoundError,
  ConflictError,
} from '../../../utils/errors';
import {
  DoctorResponse,
  DoctorListResponse,
  DoctorAvailabilityResponse,
  DayAvailability,
  TimeSlotResponse,
  DayScheduleResponse,
} from '../../../types/doctorTypes';
import logger from '../../../utils/logger';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export class DoctorService {
  /**
   * ============================================
   * CREATE DOCTOR
   * ============================================
   */
  static async createDoctor(
    data: CreateDoctorInput,
    userId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<DoctorResponse> {
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictError('A user with this email already exists');
    }

    // Check if license number already exists
    if (data.licenseNumber) {
      const existingLicense = await prisma.doctorProfile.findUnique({
        where: { licenseNumber: data.licenseNumber },
      });
      if (existingLicense) {
        throw new ConflictError('A doctor with this license number already exists');
      }
    }

    // Validate organization/branch
    if (data.organizationId) {
      const org = await prisma.organization.findUnique({
        where: { id: data.organizationId },
      });
      if (!org) throw new BadRequestError('Organization not found');
    }

    if (data.branchId) {
      const branch = await prisma.branch.findUnique({
        where: { id: data.branchId },
      });
      if (!branch) throw new BadRequestError('Branch not found');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, config.security.bcryptRounds);

    // Create user and doctor profile in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash: hashedPassword,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone || null,
          role: UserRole.DOCTOR,
          status: UserStatus.ACTIVE,
          authProvider: AuthProvider.LOCAL,
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
    EmailService.sendWelcomeEmail(result.user.email, result.user.firstName).catch((error) => {
      logger.error('Failed to send welcome email to doctor:', error);
    });

    logger.info(`Doctor created: ${result.user.email}`);
    return this.getDoctorById(result.user.id);
  }

  /**
   * ============================================
   * GET DOCTOR BY ID
   * ============================================
   */
  static async getDoctorById(id: string): Promise<DoctorResponse> {
    const user = await prisma.user.findFirst({
      where: { id, role: UserRole.DOCTOR },
      include: this.getDoctorInclude(),
    });

    if (!user || !user.doctorProfile) {
      throw new NotFoundError('Doctor not found');
    }

    return this.formatDoctorResponse(user);
  }

  /**
   * ============================================
   * LIST DOCTORS
   * ============================================
   */
  static async listDoctors(query: DoctorQueryInput): Promise<DoctorListResponse> {
    const {
      page = 1,
      limit = 10,
      search,
      specialization,
      organizationId,
      branchId,
      availableForTelemed,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const where: Prisma.UserWhereInput = {
      role: UserRole.DOCTOR,
      ...(status && { status: status as UserStatus }),
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
      prisma.user.findMany({
        where,
        include: this.getDoctorInclude(),
        orderBy: sortBy === 'specialization' || sortBy === 'experience'
          ? { doctorProfile: { [sortBy]: sortOrder } }
          : { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
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
  static async updateDoctor(
    id: string,
    data: UpdateDoctorInput,
    userId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<DoctorResponse> {
    const user = await prisma.user.findFirst({
      where: { id, role: UserRole.DOCTOR },
      include: { doctorProfile: true },
    });

    if (!user || !user.doctorProfile) {
      throw new NotFoundError('Doctor not found');
    }

    // Check license uniqueness
    if (data.licenseNumber) {
      const existingLicense = await prisma.doctorProfile.findFirst({
        where: {
          licenseNumber: data.licenseNumber,
          userId: { not: id },
        },
      });
      if (existingLicense) {
        throw new ConflictError('License number already in use');
      }
    }

    await prisma.$transaction(async (tx) => {
      // Update user fields
      const userUpdateData: any = {};
      if (data.firstName) userUpdateData.firstName = data.firstName;
      if (data.lastName) userUpdateData.lastName = data.lastName;
      if (data.phone !== undefined) userUpdateData.phone = data.phone;
      if (data.status) userUpdateData.status = data.status as UserStatus;

      if (Object.keys(userUpdateData).length > 0) {
        await tx.user.update({
          where: { id },
          data: userUpdateData,
        });
      }

      // Update doctor profile
      const profileUpdateData: any = {};
      if (data.specialization !== undefined) profileUpdateData.specialization = data.specialization;
      if (data.subSpecialization !== undefined) profileUpdateData.subSpecialization = data.subSpecialization;
      if (data.qualification !== undefined) profileUpdateData.qualification = data.qualification;
      if (data.experience !== undefined) profileUpdateData.experience = data.experience;
      if (data.licenseNumber !== undefined) profileUpdateData.licenseNumber = data.licenseNumber;
      if (data.licenseExpiry !== undefined) profileUpdateData.licenseExpiry = data.licenseExpiry ? new Date(data.licenseExpiry) : null;
      if (data.biography !== undefined) profileUpdateData.biography = data.biography;
      if (data.consultationFee !== undefined) profileUpdateData.consultationFee = data.consultationFee;
      if (data.telemedicineFee !== undefined) profileUpdateData.telemedicineFee = data.telemedicineFee;
      if (data.followUpFee !== undefined) profileUpdateData.followUpFee = data.followUpFee;
      if (data.maxPatientsPerDay !== undefined) profileUpdateData.maxPatientsPerDay = data.maxPatientsPerDay;
      if (data.availableForTelemed !== undefined) profileUpdateData.availableForTelemed = data.availableForTelemed;
      if (data.timezone) profileUpdateData.timezone = data.timezone;

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

    logger.info(`Doctor updated: ${id}`);
    return this.getDoctorById(id);
  }

  /**
   * ============================================
   * UPDATE SCHEDULE
   * ============================================
   */
  static async updateSchedule(
    id: string,
    data: UpdateScheduleInput,
    userId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<DayScheduleResponse[]> {
    const user = await prisma.user.findFirst({
      where: { id, role: UserRole.DOCTOR },
      include: { doctorProfile: true },
    });

    if (!user || !user.doctorProfile) {
      throw new NotFoundError('Doctor not found');
    }

    // Delete existing schedules and create new ones
    await prisma.$transaction(async (tx) => {
      await tx.doctorSchedule.deleteMany({
        where: { doctorId: user.doctorProfile!.id },
      });

      for (const day of data.days) {
        await tx.doctorSchedule.create({
          data: {
            doctorId: user.doctorProfile!.id,
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

    logger.info(`Doctor schedule updated: ${id}`);

    // Return updated schedule
    const schedules = await prisma.doctorSchedule.findMany({
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
  static async getDoctorAvailability(
    doctorId: string,
    dateFrom: string,
    dateTo?: string
  ): Promise<DoctorAvailabilityResponse> {
    const user = await prisma.user.findFirst({
      where: { id: doctorId, role: UserRole.DOCTOR },
      include: { doctorProfile: true },
    });

    if (!user || !user.doctorProfile) {
      throw new NotFoundError('Doctor not found');
    }

    const endDate = dateTo || dateFrom;
    const startDate = new Date(dateFrom);
    const lastDate = new Date(endDate);

    // Get doctor's weekly schedule
    const schedules = await prisma.doctorSchedule.findMany({
      where: {
        doctorId: user.doctorProfile.id,
        isActive: true,
      },
    });

    // Get existing appointments for the date range
    const appointments = await prisma.appointment.findMany({
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

    const availability: DayAvailability[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= lastDate) {
      const dayOfWeek = currentDate.getDay();
      const daySchedule = schedules.find((s) => s.dayOfWeek === dayOfWeek);
      const dateStr = currentDate.toISOString().split('T')[0];

      if (daySchedule) {
        const dayAppointments = appointments.filter(
          (a) => a.appointmentDate.toISOString().split('T')[0] === dateStr
        );

        const slots = this.generateTimeSlots(
          daySchedule.startTime,
          daySchedule.endTime,
          daySchedule.slotDuration,
          dayAppointments,
          daySchedule.breakStart,
          daySchedule.breakEnd
        );

        availability.push({
          date: dateStr,
          dayName: DAY_NAMES[dayOfWeek],
          isAvailable: true,
          slots,
        });
      } else {
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
  static async deleteDoctor(
    id: string,
    userId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    const user = await prisma.user.findFirst({
      where: { id, role: UserRole.DOCTOR },
    });

    if (!user) {
      throw new NotFoundError('Doctor not found');
    }

    // Check if doctor has upcoming appointments
    const upcomingAppointments = await prisma.appointment.count({
      where: {
        doctorId: id,
        status: { in: ['SCHEDULED', 'CONFIRMED'] },
        appointmentDate: { gte: new Date() },
      },
    });

    if (upcomingAppointments > 0) {
      throw new BadRequestError(
        `Cannot delete doctor with ${upcomingAppointments} upcoming appointments. Please reassign or cancel them first.`
      );
    }

    await prisma.$transaction(async (tx) => {
      // Soft delete user
      await tx.user.update({
        where: { id },
        data: {
          status: UserStatus.INACTIVE,
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

    logger.info(`Doctor deleted: ${id}`);
  }

  /**
   * ============================================
   * HELPER METHODS
   * ============================================
   */
  private static generateTimeSlots(
    startTime: string,
    endTime: string,
    slotDuration: number,
    appointments: Array<{ startTime: string; endTime: string }>,
    breakStart?: string | null,
    breakEnd?: string | null
  ): TimeSlotResponse[] {
    const slots: TimeSlotResponse[] = [];
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

      const isBooked = appointments.some(
        (apt) => slotStart < apt.endTime && slotEnd > apt.startTime
      );

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

  private static getDoctorInclude(): Prisma.UserInclude {
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

  private static formatDoctorResponse(user: any): DoctorResponse {
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
      schedule: profile?.schedules?.map((s: any) => ({
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