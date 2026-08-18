"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const morgan_1 = __importDefault(require("morgan"));
const passport_1 = __importDefault(require("./config/passport"));
const config_1 = require("./config");
const errorMiddleware_1 = require("./middleware/errorMiddleware");
const authRoute_1 = __importDefault(require("../src/modules/auth/routes/authRoute"));
const patientRoute_1 = __importDefault(require("../src/modules/patient/routes/patientRoute"));
const appointmentRoute_1 = __importDefault(require("../src/modules/appoinment/routes/appointmentRoute"));
const doctorRoute_1 = __importDefault(require("../src/modules/doctor/routes/doctorRoute"));
const billingRoute_1 = __importDefault(require("../src/modules/billing/routes/billingRoute"));
const notificationRoute_1 = __importDefault(require("../src/modules/notifications/routes/notificationRoute"));
const analyticsRoute_1 = __importDefault(require("../src/modules/analytics/routes/analyticsRoute"));
const emrRoute_1 = __importDefault(require("../src/modules/emr/routes/emrRoute"));
const blockchainRoute_1 = __importDefault(require("../src/modules/blockchain/routes/blockchainRoute"));
const memoryRoute_1 = __importDefault(require("../src/modules/memory/routes/memoryRoute"));
const inventoryRoute_1 = __importDefault(require("../src/modules/inventory/routes/inventoryRoute"));
const auditRoute_1 = __importDefault(require("../src/modules/auth/routes/auditRoute"));
const adminRoute_1 = __importDefault(require("../src/modules/admin/routes/adminRoute"));
const calllingRoute_1 = __importDefault(require("../src/modules/callingAgent/routes/calllingRoute"));
const ocrRoute_1 = __importDefault(require("../src/modules/ocr/routes/ocrRoute"));
const aiagentRoute_1 = __importDefault(require("../src/modules/aiagent/routes/aiagentRoute"));
const telemedicineRoute_1 = __importDefault(require("../src/modules/telemedicine/routes/telemedicineRoute"));
const chatbotRoute_1 = __importDefault(require("../src/modules/chatbot/routes/chatbotRoute"));
const logger_1 = require("./utils/logger");
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: config_1.config.frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use((0, cookie_parser_1.default)());
app.use((0, compression_1.default)());
app.use((0, morgan_1.default)('combined', { stream: logger_1.morganStream }));
app.use(passport_1.default.initialize());
app.get('/health', (req, res) => {
    res.json({ success: true, status: 'healthy', timestamp: new Date().toISOString(), environment: config_1.config.nodeEnv });
});
app.use('/api/v1/auth', authRoute_1.default);
app.use('/api/v1/patient', patientRoute_1.default);
app.use('/api/v1/appointments', appointmentRoute_1.default);
app.use('/api/v1/billing', billingRoute_1.default);
app.use('/api/v1/doctor', doctorRoute_1.default);
app.use('/api/v1/notifications', notificationRoute_1.default);
app.use('/api/v1/analytics', analyticsRoute_1.default);
app.use('/api/v1/emr', emrRoute_1.default);
app.use('/api/v1/blockchain', blockchainRoute_1.default);
app.use('/api/v1/memory', memoryRoute_1.default);
app.use('/api/v1/inventory', inventoryRoute_1.default);
app.use('/api/v1/audit', auditRoute_1.default);
app.use('/api/v1/ocr', ocrRoute_1.default);
app.use('/api/v1/admin', adminRoute_1.default);
app.use('/api/v1/calling', calllingRoute_1.default);
// IMPORTANT: Twilio webhooks need raw body parsing
app.use('/api/v1/calling/webhook', express_1.default.urlencoded({ extended: false }));
app.use('/api/v1/ai', aiagentRoute_1.default);
app.use('/api/v1/telemedicine', telemedicineRoute_1.default);
app.use('/api/v1/chatbot', chatbotRoute_1.default);
app.use(errorMiddleware_1.notFoundHandler);
app.use(errorMiddleware_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map