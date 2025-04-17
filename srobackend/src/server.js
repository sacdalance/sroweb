import express from 'express';
import cors from 'cors';

import authRoutes from './routes/authRoutes.js';
import protectedRoutes from './routes/protectedRoutes.js';

import userActivitiesRoutes from "./routes/userActivitiesRoutes.js";
import activityRequestRoutes from './routes/activityRequestRoutes.js';

import organizationRoutes from './routes/organizationRoutes.js';

import annualReportRoutes from './routes/annualReportRoutes.js';

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

// Organizations
app.use('/api/organization', organizationRoutes);

app.use('/api/annual-report', annualReportRoutes);

app.get('/', (req, res) => {
  res.send('🎉 Supabase backend is working!');
});

app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
