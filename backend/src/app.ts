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
import patientRoute from "../src/modules/patient/routes/patientRoute"

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
app.use('/api/v1/patient',patientRoute)
app.use(notFoundHandler);
app.use(errorHandler);

export default app;