import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Create Supabase client with secret keys (DO NOT expose these in frontend)
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Example endpoint
app.get('/', (req, res) => {
  res.send('🎉 Supabase backend is working!');
});

app.listen(port, () => {
  console.log(`✅ Server is running at http://localhost:${port}`);
});
