import express from 'express';
import { supabase } from '../supabaseClient.js';
const router = express.Router();


router.get("/", async (req, res) => {
  const { data, error } = await supabase.from('activity').select('*');
  if (error) return res.status(500).json({ error: error.message });
    res.status(200).json(data);
});

router.post("/", (req, res) => {
    
    res.send("");
});

router.put("/", (req, res) => {
    res.send("");
});

router.delete("/", (req, res) => {
    res.send("");
});

router.get('/test', async (req, res) => {
    const { data, error } = await supabase.from('account').select('*').limit(1);
    if (error) return res.status(500).json({ error: error.message });
    res.status(200).json(data);
  });

export default router;