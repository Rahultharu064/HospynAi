import { CreateOrganizationInput, UpdateOrganizationInput, CreateBranchInput, CreateUserInput, UpdateUserInput, BulkUserOperationInput, OrganizationQueryInput, UserQueryInput } from '../validators/adminValidators';
import { OrganizationResponse, OrganizationListResponse, UserManagementResponse, UserListResponse, SystemHealthResponse, PlatformStats, BulkOperationResult, BranchResponse } from '../../../types/adminTypes';
export declare class AdminService {
    /**
     * ============================================
     * ORGANIZATION MANAGEMENT
     * ============================================
     */
    static createOrganization(data: CreateOrganizationInput, userId: string, ipAddress: string, userAgent: string): Promise<OrganizationResponse>;
    /**
     * Get organization by ID
     */
    static getOrganizationById(id: string): Promise<OrganizationResponse>;
    /**
     * List organizations
     */
    static listOrganizations(query: OrganizationQueryInput): Promise<OrganizationListResponse>;
    /**
     * Update organization
     */
    static updateOrganization(id: string, data: UpdateOrganizationInput, userId: string): Promise<OrganizationResponse>;
    /**
     * Create branch
     */
    static createBranch(data: CreateBranchInput, userId: string, ipAddress: string, userAgent: string): Promise<BranchResponse>;
    /**
     * ============================================
     * USER MANAGEMENT
     * ============================================
     */
    static createUser(data: CreateUserInput, userId: string, ipAddress: string, userAgent: string): Promise<UserManagementResponse>;
    /**
     * List users
     */
    static listUsers(query: UserQueryInput): Promise<UserListResponse>;
    /**
     * Update user
     */
    static updateUser(id: string, data: UpdateUserInput, userId: string): Promise<UserManagementResponse>;
    /**
     * Bulk user operations
     */
    static bulkUserOperation(data: BulkUserOperationInput, userId: string): Promise<BulkOperationResult>;
    /**
     * ============================================
     * SYSTEM HEALTH
     * ============================================
     */
    static getSystemHealth(): Promise<SystemHealthResponse>;
    /**
     * Get platform statistics
     */
    static getPlatformStats(): Promise<PlatformStats>;
    private static formatOrganizationResponse;
    private static formatBranchResponse;
    private static formatUserResponse;
}
//# sourceMappingURL=adminService.d.ts.map