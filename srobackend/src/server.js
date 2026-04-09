import express from 'express';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/authRoutes.js';
import protectedRoutes from './routes/protectedRoutes.js';

import userActivitiesRoutes from "./routes/userActivitiesRoutes.js";
import activityRequestRoutes from './routes/activityRequestRoutes.js';
import activityEditRoutes from './routes/activityEditRoutes.js';
import activityCancelRoutes from './routes/activityCancelRoutes.js';

import organizationRoutes from './routes/organizationRoutes.js';

import annualReportRoutes from './routes/annualReportRoutes.js';

import adminActivitiesRoutes from "./routes/adminPendingActivitiesRoutes.js";
import adminActivityRoutes from './routes/adminActivityRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';

import orgApplicationRoutes from './routes/orgApplicationRoutes.js';

import adminOrgApplicationsRoutes from "./routes/adminOrgApplicationsRoutes.js";

import emailServicesRoutes from './routes/emailServicesRoutes.js';
import activityApprovalSlipRoutes from './routes/activityApprovalSlipRoutes_new.js';
import adminDocumentsRoutes from './routes/adminDocumentsRoutes.js';


console.log('📋 Activity Approval Slip Routes loaded:', activityApprovalSlipRoutes);


import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const port = process.env.PORT || 3000;

// CORS - restrict to frontend origin
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (server-to-server, curl, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));

// Global rate limit: 100 requests per minute per IP
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use(globalLimiter);

// Stricter rate limit for auth and email endpoints
const strictLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many requests, please try again later.' },
});

// Public routes (strict rate limit)
app.use('/auth', strictLimiter, authRoutes);

// Protected routes
app.use('/api', protectedRoutes);


// Activity Request
app.use('/activityRequest', activityRequestRoutes);
app.use('/activities', userActivitiesRoutes);
app.use('/activityEdit', activityEditRoutes);
app.use('/activityCancel', activityCancelRoutes);

// Organizations
app.use('/api/organization', organizationRoutes);
app.use('/api/orgApplication', orgApplicationRoutes);

app.use('/api/annualReport', annualReportRoutes);

// Admin
app.use("/api/activities", adminActivitiesRoutes);
app.use('/api', adminActivityRoutes);

// Appointments
app.use("/api/appointments", appointmentRoutes);

// Org Application (approve/reject)
app.use('/api/org-applications', adminOrgApplicationsRoutes);

// Email Services (strict rate limit)
app.use('/api', strictLimiter, emailServicesRoutes);

// Activity Approval Slip Generation
app.use('/api', activityApprovalSlipRoutes);
console.log('Activity Approval Slip routes mounted at /api');

// Documents Management (Templates & Forms)
app.use('/api/documents', adminDocumentsRoutes);

// Health check endpoint for connectivity monitoring
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/', (req, res) => {
  res.send('Supabase backend is working!');
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
