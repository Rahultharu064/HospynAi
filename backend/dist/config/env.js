"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
// src/config/env.ts
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.env = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parseInt(process.env.PORT || '5000', 10),
    // Database
    DATABASE_URL: process.env.DATABASE_URL,
    // Redis
    REDIS_URL: process.env.REDIS_URL,
    // JWT
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
    JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    // Email
    SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
    FROM_EMAIL: process.env.FROM_EMAIL || 'noreply@voicemed.com',
    // SMS
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
    TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER,
    // Frontend
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:4200',
    // Security
    BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
    RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    // AI — Groq (primary LLM + speech-to-text)
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    GROQ_MODEL: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    GROQ_WHISPER_MODEL: process.env.GROQ_WHISPER_MODEL || 'whisper-large-v3',
    GROQ_BASE_URL: process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1',
    // Optional — embeddings for RAG (Groq does not provide embeddings)
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    // File storage — Cloudinary
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
    CLOUDINARY_FOLDER: process.env.CLOUDINARY_FOLDER || 'hospyn_ai',
    // Blockchain — Polygon / Hardhat local
    BLOCKCHAIN_ENABLED: process.env.BLOCKCHAIN_ENABLED === 'true',
    BLOCKCHAIN_NETWORK_ID: parseInt(process.env.BLOCKCHAIN_NETWORK_ID ||
        (process.env.NODE_ENV === 'production' ? '137' : '80002'), 10),
    BLOCKCHAIN_PRIVATE_KEY: process.env.BLOCKCHAIN_PRIVATE_KEY,
    BLOCKCHAIN_RPC_URL: process.env.BLOCKCHAIN_RPC_URL,
    POLYGON_MAINNET_RPC: process.env.POLYGON_MAINNET_RPC || 'https://polygon-rpc.com',
    POLYGON_AMOY_RPC: process.env.POLYGON_AMOY_RPC || 'https://rpc-amoy.polygon.technology',
    BLOCKCHAIN_DEPLOYMENTS_FILE: process.env.BLOCKCHAIN_DEPLOYMENTS_FILE,
    BLOCKCHAIN_DEFAULT_PROVIDER_ADDRESS: process.env.BLOCKCHAIN_DEFAULT_PROVIDER_ADDRESS,
    MEDICAL_RECORD_ANCHOR_ADDRESS: process.env.MEDICAL_RECORD_ANCHOR_ADDRESS,
    PATIENT_CONSENT_ADDRESS: process.env.PATIENT_CONSENT_ADDRESS,
    PRESCRIPTION_VERIFIER_ADDRESS: process.env.PRESCRIPTION_VERIFIER_ADDRESS,
    MEDICAL_DATA_REGISTRY_ADDRESS: process.env.MEDICAL_DATA_REGISTRY_ADDRESS,
};
//# sourceMappingURL=env.js.map