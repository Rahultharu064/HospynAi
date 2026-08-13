import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import passport from './config/passport';
import { config } from './config';
import { errorHandler, notFoundHandler } from './middleware/errorMiddleware';
import authRoutes from '../src/modules/auth/routes/authRoute';
import patientRoutes from "../src/modules/patient/routes/patientRoute"
import appointmentRoutes from "../src/modules/appoinment/routes/appointmentRoute"
import doctorRoutes from '../src/modules/doctor/routes/doctorRoute'
import billingRoutes from '../src/modules/billing/routes/billingRoute'
import notificationRoutes from '../src/modules/notifications/routes/notificationRoute'
import analyticsRoutes from '../src/modules/analytics/routes/analyticsRoute'
import emrRoutes from '../src/modules/emr/routes/emrRoute'
import blockchainRoutes from '../src/modules/blockchain/routes/blockchainRoute'
import memoryRoutes from '../src/modules/memory/routes/memoryRoute'
import inventoryRoutes from '../src/modules/inventory/routes/inventoryRoute'
import auditRoutes from '../src/modules/auth/routes/auditRoute'
import adminRoutes from '../src/modules/admin/routes/adminRoute'
import callingRoutes from '../src/modules/callingAgent/routes/calllingRoute'
import ocrRoutes from '../src/modules/ocr/routes/ocrRoute'
import aiRoutes from '../src/modules/aiagent/routes/aiagentRoute'
import telemedicineRoutes from '../src/modules/telemedicine/routes/telemedicineRoute'
import chatbotRoutes from '../src/modules/chatbot/routes/chatbotRoute'
import logger, { morganStream } from './utils/logger';

const app = express();

app.use(helmet());
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(compression());
app.use(morgan('combined', { stream: morganStream }));
app.use(passport.initialize());

app.get('/health', (req, res) => {
  res.json({ success: true, status: 'healthy', timestamp: new Date().toISOString(), environment: config.nodeEnv });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/patient', patientRoutes)
app.use('/api/v1/appointments', appointmentRoutes);
app.use('/api/v1/billing', billingRoutes)
app.use('/api/v1/doctor', doctorRoutes)
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/emr', emrRoutes);
app.use('/api/v1/blockchain', blockchainRoutes);
app.use('/api/v1/memory', memoryRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/audit', auditRoutes);
app.use('/api/v1/ocr', ocrRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/calling', callingRoutes);
// IMPORTANT: Twilio webhooks need raw body parsing
app.use('/api/v1/calling/webhook', express.urlencoded({ extended: false }));
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/telemedicine', telemedicineRoutes);
app.use('/api/v1/chatbot', chatbotRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;