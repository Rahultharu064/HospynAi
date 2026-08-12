import { UserRole, UserStatus } from '../../../core/models/user.model';

export interface OrganizationResponse {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  status: string;
  branches: { id: string; name: string; isMainBranch: boolean; userCount: number; patientCount: number }[];
  subscription: { plan: string; status: string; endDate: string | null } | null;
  stats: {
    totalUsers: number;
    totalPatients: number;
    totalDoctors: number;
    totalAppointments: number;
    totalRevenue: number;
  };
  createdAt: string;
}

export interface OrganizationListResponse {
  success: boolean;
  status: number;
  organizations: OrganizationResponse[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface CreateOrganizationRequest {
  name: string;
  slug: string;
  phone?: string;
  email?: string;
  website?: string;
  adminEmail: string;
  adminFirstName: string;
  adminLastName: string;
  adminPassword: string;
}

export interface UserManagementResponse {
  id: string;
  email: string;
  phone: string | null;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  isEmailVerified: boolean;
  lastLoginAt: string | null;
  organization: { id: string; name: string } | null;
  branch: { id: string; name: string } | null;
  createdAt: string;
}

export interface UserListResponse {
  success: boolean;
  status: number;
  users: UserManagementResponse[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  organizationId?: string;
  sendWelcomeEmail?: boolean;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  status?: UserStatus;
}

export interface SystemHealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  version: string;
  environment: string;
  database: { status: string; connections: number; size: string };
  redis: { status: string; memory: string; keys: number };
  storage: { status: string; used: string; total: string; files: number };
  queue: { pending: number; processing: number; failed: number };
  memory: { heapUsed: string; heapTotal: string; rss: string };
}

export interface PlatformStats {
  organizations: { total: number; active: number; trial: number; suspended: number; newThisMonth: number };
  users: { total: number; active: number; byRole: Record<string, number>; newThisMonth: number };
  revenue: { total: number; thisMonth: number; lastMonth: number; projected: number };
  usage: {
    totalAppointments: number;
    totalEMRs: number;
    totalPrescriptions: number;
    totalCalls: number;
    storageUsed: string;
    apiCalls: number;
  };
}

export const USER_ROLES: UserRole[] = [
  'SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'PHARMACIST', 'LAB_TECHNICIAN', 'PATIENT',
];
