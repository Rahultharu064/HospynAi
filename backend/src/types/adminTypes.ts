import { UserRole, UserStatus, SubscriptionPlan, SubscriptionStatus } from '@prisma/client';

// ============================================
// ORGANIZATION DTOs
// ============================================

export interface CreateOrganizationDto {
  name: string;
  slug: string;
  logo?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  taxId?: string;
  settings?: Record<string, any>;
  plan?: SubscriptionPlan;
  trialDays?: number;
  maxUsers?: number;
  maxBranches?: number;
  adminEmail: string;
  adminFirstName: string;
  adminLastName: string;
  adminPassword: string;
}

export interface UpdateOrganizationDto {
  name?: string;
  logo?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  taxId?: string;
  settings?: Record<string, any>;
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

export interface CreateBranchDto {
  organizationId: string;
  name: string;
  code?: string;
  address?: string;
  phone?: string;
  email?: string;
  isMainBranch?: boolean;
}

export interface UpdateBranchDto {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  isMainBranch?: boolean;
}

// ============================================
// USER MANAGEMENT DTOs
// ============================================

export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  organizationId?: string;
  branchId?: string;
  status?: UserStatus;
  sendWelcomeEmail?: boolean;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: UserRole;
  status?: UserStatus;
  organizationId?: string;
  branchId?: string;
}

export interface BulkUserOperationDto {
  userIds: string[];
  action: 'ACTIVATE' | 'DEACTIVATE' | 'SUSPEND' | 'DELETE' | 'CHANGE_ROLE';
  role?: UserRole;
  reason?: string;
}

// ============================================
// SYSTEM CONFIG DTOs
// ============================================

export interface SystemConfigDto {
  key: string;
  value: any;
  description?: string;
  category?: string;
}

export interface UpdateSystemConfigDto {
  value: any;
  description?: string;
}

export interface SystemBackupDto {
  type: 'FULL' | 'INCREMENTAL';
  includeFiles?: boolean;
  notes?: string;
}

// ============================================
// QUERY DTOs
// ============================================

export interface OrganizationQueryDto {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  plan?: SubscriptionPlan;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface UserQueryDto {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  organizationId?: string;
  branchId?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ============================================
// RESPONSE TYPES
// ============================================

export interface OrganizationResponse {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  taxId: string | null;
  settings: Record<string, any> | null;
  status: string;
  branches: BranchResponse[];
  subscription: SubscriptionResponse | null;
  stats: OrganizationStats;
  createdAt: string;
  updatedAt: string;
}

export interface BranchResponse {
  id: string;
  name: string;
  code: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  isMainBranch: boolean;
  userCount: number;
  patientCount: number;
  createdAt: string;
}

export interface SubscriptionResponse {
  id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string | null;
  trialEndsAt: string | null;
  maxUsers: number;
  maxBranches: number;
  maxStorage: number;
  features: Record<string, any> | null;
  currentUsage: {
    users: number;
    branches: number;
    storage: number;
    appointments: number;
  };
}

export interface OrganizationStats {
  totalUsers: number;
  totalPatients: number;
  totalDoctors: number;
  totalAppointments: number;
  totalRevenue: number;
  activeSubscriptions: number;
}

export interface OrganizationListResponse {
  organizations: OrganizationResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UserManagementResponse {
  id: string;
  email: string;
  phone: string | null;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  authProvider: string;
  avatarUrl: string | null;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  mfaEnabled: boolean;
  lastLoginAt: string | null;
  organization: { id: string; name: string } | null;
  branch: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserListResponse {
  users: UserManagementResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SystemHealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  version: string;
  environment: string;
  database: {
    status: string;
    connections: number;
    size: string;
  };
  redis: {
    status: string;
    memory: string;
    keys: number;
  };
  storage: {
    status: string;
    used: string;
    total: string;
    files: number;
  };
  queue: {
    pending: number;
    processing: number;
    failed: number;
  };
  memory: {
    heapUsed: string;
    heapTotal: string;
    rss: string;
  };
}

export interface PlatformStats {
  organizations: {
    total: number;
    active: number;
    trial: number;
    suspended: number;
    newThisMonth: number;
  };
  users: {
    total: number;
    active: number;
    byRole: Record<string, number>;
    newThisMonth: number;
  };
  revenue: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    projected: number;
  };
  usage: {
    totalAppointments: number;
    totalEMRs: number;
    totalPrescriptions: number;
    totalCalls: number;
    storageUsed: string;
    apiCalls: number;
  };
}

export interface BulkOperationResult {
  success: boolean;
  totalProcessed: number;
  successCount: number;
  failureCount: number;
  errors: Array<{ id: string; error: string }>;
}