import { PrismaClient } from '@prisma/client';
declare class PrismaService {
    private static instance;
    static getInstance(): PrismaClient;
    static disconnect(): Promise<void>;
}
declare const prisma: PrismaClient<import(".prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
export default prisma;
export { PrismaService };
//# sourceMappingURL=prisma.d.ts.map