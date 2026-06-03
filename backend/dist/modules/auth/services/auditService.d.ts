export declare class AuditService {
    static log(data: {
        userId?: string;
        organizationId?: string;
        action: string;
        resource: string;
        resourceId?: string;
        ipAddress: string;
        userAgent: string;
        metadata?: Record<string, any>;
    }): Promise<void>;
    static getUserAuditLogs(userId: string, page?: number, limit?: number): Promise<{
        logs: {
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            id: string;
            organizationId: string | null;
            createdAt: Date;
            userId: string | null;
            ipAddress: string;
            userAgent: string;
            action: string;
            resource: string;
            resourceId: string | null;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
}
//# sourceMappingURL=auditService.d.ts.map