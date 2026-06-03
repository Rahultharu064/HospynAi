import winston from 'winston';
import path from 'path';
import { config } from '../config';

const logDir = path.join(__dirname, '../../logs');

const logger = winston.createLogger({
  level: config.nodeEnv === 'development' ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.errors({ stack: true }),
    winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'label'] }),
    winston.format.json()
  ),
  defaultMeta: { service: 'voicemed-pro-api' },
  transports: [
    // Console transport for all environments
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize({ all: true }),
        winston.format.printf(({ timestamp, level, message, metadata }) => {
          const meta = metadata && Object.keys(metadata).length 
            ? `\n${JSON.stringify(metadata, null, 2)}` 
            : '';
          return `${timestamp} [${level}]: ${message}${meta}`;
        })
      ),
    }),
    // File transport for production
    ...(config.nodeEnv === 'production'
      ? [
          new winston.transports.File({
            filename: path.join(logDir, 'error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
          }),
          new winston.transports.File({
            filename: path.join(logDir, 'combined.log'),
            maxsize: 5242880,
            maxFiles: 10,
          }),
        ]
      : []),
  ],
  exitOnError: false,
});

// Create a stream for Morgan
export const morganStream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

export default logger;