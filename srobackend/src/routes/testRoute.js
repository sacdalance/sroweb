import express from 'express';

const router = express.Router();

router.get('/test', (req, res) => {
  console.log('🎯 Simple test route hit!');
  res.json({ message: 'Simple test works!' });
});

export default router;
