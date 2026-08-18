"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.morganStream = void 0;
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
const config_1 = require("../config");
const logDir = path_1.default.join(__dirname, '../../logs');
const logger = winston_1.default.createLogger({
    level: config_1.config.nodeEnv === 'development' ? 'debug' : 'info',
    format: winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'label'] }), winston_1.default.format.json()),
    defaultMeta: { service: 'hospynai-api' },
    transports: [
        // Console transport for all environments
        new winston_1.default.transports.Console({
            format: winston_1.default.format.combine(winston_1.default.format.colorize({ all: true }), winston_1.default.format.printf(({ timestamp, level, message, metadata }) => {
                const meta = metadata && Object.keys(metadata).length
                    ? `\n${JSON.stringify(metadata, null, 2)}`
                    : '';
                return `${timestamp} [${level}]: ${message}${meta}`;
            })),
        }),
        // File transport for production
        ...(config_1.config.nodeEnv === 'production'
            ? [
                new winston_1.default.transports.File({
                    filename: path_1.default.join(logDir, 'error.log'),
                    level: 'error',
                    maxsize: 5242880, // 5MB
                    maxFiles: 5,
                }),
                new winston_1.default.transports.File({
                    filename: path_1.default.join(logDir, 'combined.log'),
                    maxsize: 5242880,
                    maxFiles: 10,
                }),
            ]
            : []),
    ],
    exitOnError: false,
});
// Create a stream for Morgan
exports.morganStream = {
    write: (message) => {
        logger.http(message.trim());
    },
};
exports.default = logger;
//# sourceMappingURL=logger.js.map