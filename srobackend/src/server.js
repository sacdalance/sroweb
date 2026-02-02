import express from 'express';
import cors from 'cors';

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


console.log('📋 Activity Approval Slip Routes loaded:', activityApprovalSlipRoutes);


import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Public routes
app.use('/auth', authRoutes);

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

// Email Services
app.use('/api', emailServicesRoutes);

// Activity Approval Slip Generation
app.use('/api', activityApprovalSlipRoutes);
console.log('Activity Approval Slip routes mounted at /api');

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
