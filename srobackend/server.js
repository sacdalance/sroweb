import express from 'express';
import cors from 'cors';
import activityRequestRoute from './routes/activityRequest.js';

import dotenv from 'dotenv';
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/activityRequest', activityRequestRoute);

app.get('/', (req, res) => {
  res.send('🎉 Supabase backend is working!');
});

app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
