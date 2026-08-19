"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const blockchainNetworkId = parseInt(process.env.BLOCKCHAIN_NETWORK_ID ||
    (process.env.NODE_ENV === 'production' ? '137' : '80002'), 10);
function normalizePrivateKey(key) {
    if (!key)
        return '';
    return key.startsWith('0x') ? key : `0x${key}`;
}
/** Prefer localhost.json for Hardhat (31337); ignore stale unknown.json from old deploys. */
function resolveBlockchainDeploymentsFile() {
    const configured = process.env.BLOCKCHAIN_DEPLOYMENTS_FILE || '';
    const isStaleUnknown = !configured || configured.includes('unknown.json');
    if (blockchainNetworkId === 31337 && isStaleUnknown) {
        return '../blockchain/deployments/localhost.json';
    }
    return configured;
}
exports.config = {
    port: process.env.PORT || 5000,
    nodeEnv: process.env.NODE_ENV || 'development',
    database: {
        url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/voicemed_pro',
        poolMin: parseInt(process.env.DB_POOL_MIN || '2'),
        poolMax: parseInt(process.env.DB_POOL_MAX || '10'),
    },
    jwt: {
        accessTokenSecret: process.env.JWT_ACCESS_SECRET || 'access-secret-key-change-in-production',
        refreshTokenSecret: process.env.JWT_REFRESH_SECRET || 'refresh-secret-key-change-in-production',
        accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
        refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
        issuer: 'voicemed-pro',
        audience: 'voicemed-pro-api',
    },
    otp: {
        length: parseInt(process.env.OTP_LENGTH || '6'),
        expiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES || '10'),
        maxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS || '3'),
    },
    google: {
        clientId: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        callbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/v1/auth/google/callback',
    },
    security: {
        bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
        rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
        rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100'),
        maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5'),
        loginLockoutMinutes: parseInt(process.env.LOGIN_LOCKOUT_MINUTES || '15'),
    },
    email: {
        from: process.env.FROM_EMAIL || process.env.EMAIL_FROM || 'noreply@voicemedpro.com',
        /** smtp | sendgrid — use smtp for Gmail / Mailtrap */
        provider: (process.env.EMAIL_PROVIDER || 'smtp').toLowerCase(),
        sendgridApiKey: process.env.SENDGRID_API_KEY || '',
        smtp: {
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            user: process.env.SMTP_USER || '',
            password: (process.env.SMTP_PASSWORD || '').replace(/\s+/g, ''),
        },
    },
    twilio: {
        accountSid: process.env.TWILIO_ACCOUNT_SID || '',
        authToken: process.env.TWILIO_AUTH_TOKEN || '',
        phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
    },
    upload: {
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'),
        allowedMimeTypes: (process.env.ALLOWED_MIME_TYPES || 'image/jpeg,image/png,image/webp,application/pdf').split(','),
        provider: 'cloudinary',
        cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
        cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || '',
        cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || '',
        cloudinaryFolder: process.env.CLOUDINARY_FOLDER || 'hospyn_ai',
    },
    redis: {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        password: process.env.REDIS_PASSWORD || '',
    },
    groq: {
        apiKey: process.env.GROQ_API_KEY || '',
        baseUrl: process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1',
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        whisperModel: process.env.GROQ_WHISPER_MODEL || 'whisper-large-v3',
    },
    /** Vectorless RAG — chunks stored in PostgreSQL, no Qdrant/embeddings required */
    rag: {
        chunkSize: parseInt(process.env.RAG_CHUNK_SIZE || '1000', 10),
        chunkOverlap: parseInt(process.env.RAG_CHUNK_OVERLAP || '200', 10),
        defaultMaxResults: parseInt(process.env.RAG_MAX_RESULTS || '5', 10),
    },
    /** Optional — only if you add embedding-based features later */
    openai: {
        apiKey: process.env.OPENAI_API_KEY || '',
        embeddingModel: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
    },
    anthropic: {
        apiKey: process.env.ANTHROPIC_API_KEY || '',
        model: process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307',
    },
    blockchain: {
        enabled: process.env.BLOCKCHAIN_ENABLED === 'true',
        networkId: blockchainNetworkId,
        privateKey: normalizePrivateKey(process.env.BLOCKCHAIN_PRIVATE_KEY || ''),
        rpcUrl: process.env.BLOCKCHAIN_RPC_URL || '',
        polygonMainnetRpc: process.env.POLYGON_MAINNET_RPC || 'https://polygon-rpc.com',
        polygonAmoyRpc: process.env.POLYGON_AMOY_RPC || 'https://rpc-amoy.polygon.technology',
        deploymentsFile: resolveBlockchainDeploymentsFile(),
        defaultProviderAddress: process.env.BLOCKCHAIN_DEFAULT_PROVIDER_ADDRESS || '',
        contracts: {
            medicalRecordAnchor: process.env.MEDICAL_RECORD_ANCHOR_ADDRESS || '',
            patientConsent: process.env.PATIENT_CONSENT_ADDRESS || '',
            prescriptionVerifier: process.env.PRESCRIPTION_VERIFIER_ADDRESS || '',
            medicalDataRegistry: process.env.MEDICAL_DATA_REGISTRY_ADDRESS || '',
        },
    },
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:4200',
};
//# sourceMappingURL=index.js.map