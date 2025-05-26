import express from 'express';
import cors from 'cors';

import authRoutes from './routes/authRoutes.js';
import protectedRoutes from './routes/protectedRoutes.js';

import userActivitiesRoutes from "./routes/userActivitiesRoutes.js";
import activityRequestRoutes from './routes/activityRequestRoutes.js';
import activityEditRoutes from './routes/activityEditRoutes.js';

import organizationRoutes from './routes/organizationRoutes.js';

import annualReportRoutes from './routes/annualReportRoutes.js';

import adminActivitiesRoutes from "./routes/adminPendingActivitiesRoutes.js";
import adminActivityRoutes from './routes/adminActivityRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';

import orgApplicationRoutes from './routes/orgApplicationRoutes.js';

import adminOrgApplicationsRoutes from "./routes/adminOrgApplicationsRoutes.js";

import emailServicesRoutes from './routes/emailServicesRoutes.js';


import dotenv from 'dotenv';
dotenv.config();

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

app.get('/', (req, res) => {
  res.send('🎉 Supabase backend is working!');
});

app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
