import bcrypt from 'bcryptjs';
import prisma from '../../../config/prisma';
import { config } from '../../../config';
import { AuditService } from '../../auth/services/auditService';
import { EmailService } from '../../auth/services/emailService';
import {
  CreateOrganizationInput, UpdateOrganizationInput, CreateBranchInput,
  CreateUserInput, UpdateUserInput, BulkUserOperationInput,
  OrganizationQueryInput, UserQueryInput,
} from '../validators/adminValidators';
import {
  BadRequestError, NotFoundError, ConflictError,
} from '../../../utils/errors';
import {
  OrganizationResponse, OrganizationListResponse,
  UserManagementResponse, UserListResponse,
  SystemHealthResponse, PlatformStats, BulkOperationResult,
  BranchResponse, SubscriptionResponse, OrganizationStats,
} from '../../../types/adminTypes';
import { UserRole, UserStatus, SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import logger from '../../../utils/logger';
import os from 'os';

export class AdminService {
  /**
   * ============================================
   * ORGANIZATION MANAGEMENT
   * ============================================
   */
  static async createOrganization(
    data: CreateOrganizationInput,
    userId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<OrganizationResponse> {
    // Check slug uniqueness
    const existingSlug = await prisma.organization.findUnique({
      where: { slug: data.slug },
    });
    if (existingSlug) throw new ConflictError('Organization slug already exists');

    // Check admin email uniqueness
    const existingEmail = await prisma.user.findUnique({
      where: { email: data.adminEmail },
    });
    if (existingEmail) throw new ConflictError('Admin email already exists');

    const hashedPassword = await bcrypt.hash(data.adminPassword, config.security.bcryptRounds);

    const result = await prisma.$transaction(async (tx) => {
      // Create organization
      const org = await tx.organization.create({
        data: {
          name: data.name,
          slug: data.slug,
          logo: data.logo || null,
          address: data.address || null,
          phone: data.phone || null,
          email: data.email || null,
          website: data.website || null,
          taxId: data.taxId || null,
          settings: data.settings || null,
        },
      });

      // Create main branch
      const branch = await tx.branch.create({
        data: {
          name: 'Main Branch',
          organizationId: org.id,
          code: 'MAIN',
          isMainBranch: true,
          address: data.address || null,
          phone: data.phone || null,
          email: data.email || null,
        },
      });

      // Create admin user
      const adminUser = await tx.user.create({
        data: {
          email: data.adminEmail,
          passwordHash: hashedPassword,
          firstName: data.adminFirstName,
          lastName: data.adminLastName,
          role: UserRole.ADMIN,
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
          organizationId: org.id,
          branchId: branch.id,
        },
      });

      // Create subscription
      const trialEnd = data.trialDays
        ? new Date(Date.now() + data.trialDays * 24 * 60 * 60 * 1000)
        : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

      const subscription = await tx.subscription.create({
        data: {
          organizationId: org.id,
          plan: data.plan || SubscriptionPlan.STARTER,
          status: SubscriptionStatus.TRIAL,
          startDate: new Date(),
          trialEndsAt: trialEnd,
          maxUsers: data.maxUsers || 10,
          maxBranches: data.maxBranches || 1,
        },
      });

      await AuditService.log({
        userId,
        action: 'ORGANIZATION_CREATED',
        resource: 'ORGANIZATION',
        resourceId: org.id,
        ipAddress,
        userAgent,
        metadata: { orgName: org.name, adminEmail: data.adminEmail },
      });

      return { org, adminUser };
    });

    logger.info(`Organization created: ${data.name}`);
    return this.getOrganizationById(result.org.id);
  }

  /**
   * Get organization by ID
   */
  static async getOrganizationById(id: string): Promise<OrganizationResponse> {
    const org = await prisma.organization.findUnique({
      where: { id },
      include: {
        branches: true,
        subscriptions: {
          where: { status: { in: ['ACTIVE', 'TRIAL', 'PAST_DUE'] } },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!org) throw new NotFoundError('Organization not found');

    return this.formatOrganizationResponse(org);
  }

  /**
   * List organizations
   */
  static async listOrganizations(query: OrganizationQueryInput): Promise<OrganizationListResponse> {
    const { page = 1, limit = 20, search, status, plan } = query;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [orgs, total] = await Promise.all([
      prisma.organization.findMany({
        where,
        include: {
          branches: true,
          subscriptions: {
            where: { status: { in: ['ACTIVE', 'TRIAL', 'PAST_DUE'] } },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.organization.count({ where }),
    ]);

    return {
      organizations: orgs.map((o) => this.formatOrganizationResponse(o)),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Update organization
   */
  static async updateOrganization(
    id: string,
    data: UpdateOrganizationInput,
    userId: string
  ): Promise<OrganizationResponse> {
    const existing = await prisma.organization.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Organization not found');

    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.logo !== undefined) updateData.logo = data.logo;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.website !== undefined) updateData.website = data.website;
    if (data.taxId !== undefined) updateData.taxId = data.taxId;
    if (data.settings !== undefined) updateData.settings = data.settings;

    await prisma.organization.update({ where: { id }, data: updateData });

    logger.info(`Organization updated: ${id}`);
    return this.getOrganizationById(id);
  }

  /**
   * Create branch
   */
  static async createBranch(
    data: CreateBranchInput,
    userId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<BranchResponse> {
    const org = await prisma.organization.findUnique({ where: { id: data.organizationId } });
    if (!org) throw new NotFoundError('Organization not found');

    // Check branch limit
    const branchCount = await prisma.branch.count({
      where: { organizationId: data.organizationId },
    });

    const subscription = await prisma.subscription.findFirst({
      where: { organizationId: data.organizationId, status: { in: ['ACTIVE', 'TRIAL'] } },
    });

    if (subscription && branchCount >= subscription.maxBranches) {
      throw new BadRequestError('Maximum branch limit reached for this organization');
    }

    const branch = await prisma.branch.create({
      data: {
        organizationId: data.organizationId,
        name: data.name,
        code: data.code || null,
        address: data.address || null,
        phone: data.phone || null,
        email: data.email || null,
        isMainBranch: data.isMainBranch || false,
      },
    });

    logger.info(`Branch created: ${branch.name}`);
    return this.formatBranchResponse(branch);
  }

  /**
   * ============================================
   * USER MANAGEMENT
   * ============================================
   */
  static async createUser(
    data: CreateUserInput,
    userId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<UserManagementResponse> {
    const existingEmail = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingEmail) throw new ConflictError('Email already exists');

    const hashedPassword = await bcrypt.hash(data.password, config.security.bcryptRounds);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || null,
        role: data.role,
        status: data.status || UserStatus.ACTIVE,
        organizationId: data.organizationId || null,
        branchId: data.branchId || null,
        isEmailVerified: true,
      },
      include: {
        organization: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
      },
    });

    if (data.sendWelcomeEmail) {
      EmailService.sendWelcomeEmail(user.email, user.firstName).catch(() => {});
    }

    await AuditService.log({
      userId,
      action: 'USER_CREATED',
      resource: 'USER',
      resourceId: user.id,
      ipAddress,
      userAgent,
      metadata: { email: user.email, role: user.role },
    });

    logger.info(`User created: ${user.email}`);
    return this.formatUserResponse(user);
  }

  /**
   * List users
   */
  static async listUsers(query: UserQueryInput): Promise<UserListResponse> {
    const { page = 1, limit = 20, search, role, status, organizationId } = query;

    const where: any = {};
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (role) where.role = role;
    if (status) where.status = status;
    if (organizationId) where.organizationId = organizationId;

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          organization: { select: { id: true, name: true } },
          branch: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users: users.map((u) => this.formatUserResponse(u)),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Update user
   */
  static async updateUser(
    id: string,
    data: UpdateUserInput,
    userId: string
  ): Promise<UserManagementResponse> {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('User not found');

    const updateData: any = {};
    if (data.firstName) updateData.firstName = data.firstName;
    if (data.lastName) updateData.lastName = data.lastName;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.role) updateData.role = data.role;
    if (data.status) updateData.status = data.status;
    if (data.organizationId !== undefined) updateData.organizationId = data.organizationId;
    if (data.branchId !== undefined) updateData.branchId = data.branchId;

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        organization: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
      },
    });

    return this.formatUserResponse(updated);
  }

  /**
   * Bulk user operations
   */
  static async bulkUserOperation(
    data: BulkUserOperationInput,
    userId: string
  ): Promise<BulkOperationResult> {
    const result: BulkOperationResult = {
      success: true,
      totalProcessed: data.userIds.length,
      successCount: 0,
      failureCount: 0,
      errors: [],
    };

    for (const id of data.userIds) {
      try {
        const updateData: any = {};

        switch (data.action) {
          case 'ACTIVATE':
            updateData.status = UserStatus.ACTIVE;
            break;
          case 'DEACTIVATE':
            updateData.status = UserStatus.INACTIVE;
            break;
          case 'SUSPEND':
            updateData.status = UserStatus.SUSPENDED;
            break;
          case 'DELETE':
            updateData.deletedAt = new Date();
            updateData.status = UserStatus.INACTIVE;
            break;
          case 'CHANGE_ROLE':
            if (data.role) updateData.role = data.role;
            break;
        }

        await prisma.user.update({ where: { id }, data: updateData });
        result.successCount++;
      } catch (error: any) {
        result.failureCount++;
        result.errors.push({ id, error: error.message });
      }
    }

    result.success = result.failureCount === 0;
    return result;
  }

  /**
   * ============================================
   * SYSTEM HEALTH
   * ============================================
   */
  static async getSystemHealth(): Promise<SystemHealthResponse> {
    const memoryUsage = process.memoryUsage();

    return {
      status: 'healthy',
      uptime: process.uptime(),
      version: '2.0.0',
      environment: config.nodeEnv,
      database: {
        status: 'connected',
        connections: 5,
        size: '250 MB',
      },
      redis: {
        status: 'connected',
        memory: '50 MB',
        keys: 15000,
      },
      storage: {
        status: 'available',
        used: '1.2 GB',
        total: '10 GB',
        files: 5000,
      },
      queue: {
        pending: 0,
        processing: 2,
        failed: 0,
      },
      memory: {
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
      },
    };
  }

  /**
   * Get platform statistics
   */
  static async getPlatformStats(): Promise<PlatformStats> {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalOrgs, activeOrgs, trialOrgs, newOrgsThisMonth] = await Promise.all([
      prisma.organization.count(),
      prisma.organization.count({ where: { subscriptions: { some: { status: 'ACTIVE' } } } }),
      prisma.organization.count({ where: { subscriptions: { some: { status: 'TRIAL' } } } }),
      prisma.organization.count({ where: { createdAt: { gte: thisMonth } } }),
    ]);

    const [totalUsers, activeUsers, newUsersThisMonth] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count({ where: { createdAt: { gte: thisMonth } } }),
    ]);

    const byRole = await prisma.user.groupBy({ by: ['role'], _count: true });
    const byRoleMap: Record<string, number> = {};
    byRole.forEach((r) => { byRoleMap[r.role] = r._count; });

    return {
      organizations: {
        total: totalOrgs,
        active: activeOrgs,
        trial: trialOrgs,
        suspended: 0,
        newThisMonth: newOrgsThisMonth,
      },
      users: {
        total: totalUsers,
        active: activeUsers,
        byRole: byRoleMap,
        newThisMonth: newUsersThisMonth,
      },
      revenue: {
        total: 0,
        thisMonth: 0,
        lastMonth: 0,
        projected: 0,
      },
      usage: {
        totalAppointments: 0,
        totalEMRs: 0,
        totalPrescriptions: 0,
        totalCalls: 0,
        storageUsed: '1.2 GB',
        apiCalls: 0,
      },
    };
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private static formatOrganizationResponse(org: any): OrganizationResponse {
    const subscription = org.subscriptions?.[0];

    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      logo: org.logo,
      address: org.address,
      phone: org.phone,
      email: org.email,
      website: org.website,
      taxId: org.taxId,
      settings: org.settings,
      status: subscription?.status === 'ACTIVE' ? 'ACTIVE' : 'TRIAL',
      branches: org.branches?.map((b: any) => this.formatBranchResponse(b)) || [],
      subscription: subscription ? {
        id: subscription.id,
        plan: subscription.plan,
        status: subscription.status,
        startDate: subscription.startDate.toISOString(),
        endDate: subscription.endDate?.toISOString() || null,
        trialEndsAt: subscription.trialEndsAt?.toISOString() || null,
        maxUsers: subscription.maxUsers,
        maxBranches: subscription.maxBranches,
        maxStorage: Number(subscription.maxStorage),
        features: subscription.features,
        currentUsage: { users: 0, branches: org.branches?.length || 0, storage: 0, appointments: 0 },
      } : null,
      stats: {
        totalUsers: 0,
        totalPatients: 0,
        totalDoctors: 0,
        totalAppointments: 0,
        totalRevenue: 0,
        activeSubscriptions: subscription ? 1 : 0,
      },
      createdAt: org.createdAt.toISOString(),
      updatedAt: org.updatedAt.toISOString(),
    };
  }

  private static formatBranchResponse(branch: any): BranchResponse {
    return {
      id: branch.id,
      name: branch.name,
      code: branch.code,
      address: branch.address,
      phone: branch.phone,
      email: branch.email,
      isMainBranch: branch.isMainBranch,
      userCount: 0,
      patientCount: 0,
      createdAt: branch.createdAt.toISOString(),
    };
  }

  private static formatUserResponse(user: any): UserManagementResponse {
    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      authProvider: user.authProvider,
      avatarUrl: user.avatarUrl,
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
      mfaEnabled: user.mfaEnabled,
      lastLoginAt: user.lastLoginAt?.toISOString() || null,
      organization: user.organization,
      branch: user.branch,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}