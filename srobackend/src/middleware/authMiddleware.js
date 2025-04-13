// middleware/authMiddleware.js
import { supabase } from '../supabaseClient.js';
import express from 'express';

const router = express.Router();

export const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({ error: 'Unauthorized access' });
  }

  req.user = user;
  next();
};

router.get('/test', authMiddleware, (req, res) => {
    res.json({ message: 'Auth middleware works!', user: req.user });
});
