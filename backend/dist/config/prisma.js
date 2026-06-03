"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaService = void 0;
const client_1 = require("@prisma/client");
const config_1 = require("../config");
const logger_1 = __importDefault(require("../utils/logger"));
// Prisma Client Singleton
class PrismaService {
    static getInstance() {
        if (!PrismaService.instance) {
            PrismaService.instance = new client_1.PrismaClient({
                log: config_1.config.nodeEnv === 'development'
                    ? ['query', 'info', 'warn', 'error']
                    : ['error'],
                datasources: {
                    db: {
                        url: config_1.config.database.url,
                    },
                },
            });
            // Log connection
            PrismaService.instance.$connect()
                .then(() => {
                logger_1.default.info('Database connected successfully');
            })
                .catch((error) => {
                logger_1.default.error('Database connection failed:', error);
            });
        }
        return PrismaService.instance;
    }
    static async disconnect() {
        if (PrismaService.instance) {
            await PrismaService.instance.$disconnect();
            logger_1.default.info('Database disconnected');
        }
    }
}
exports.PrismaService = PrismaService;
const prisma = PrismaService.getInstance();
exports.default = prisma;
//# sourceMappingURL=prisma.js.map