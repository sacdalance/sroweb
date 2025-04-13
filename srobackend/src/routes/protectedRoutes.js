// routes/protectedRoutes.js
import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Use authMiddleware to protect routes
router.get('/dashboard', authMiddleware, (req, res) => {
  res.json({ message: `Hello, ${req.user.email}! Welcome to the dashboard.` });
});

export default router;
