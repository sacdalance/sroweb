import express from 'express';
import { supabase } from '../supabaseClient.js';
const router = express.Router();


router.get("/", async (req, res) => {
  const { data, error } = await supabase.from('activity').select('*');
  if (error) return res.status(500).json({ error: error.message });
    res.status(200).json(data);
});

router.post('/', async (req, res) => {
    const {
      account_id,
      org_id,
      student_position,
      activity_name,
      activity_description,
      category_id,
      sdg_goals,
      charge_fee,
      university_partner,
      partner_name,
      partner_role,
      venue,
      venue_approver,
      venue_approver_contact,
      is_off_campus,
      green_monitor_name,
      green_monitor_contact,
      drive_folder_id = 'placeholder-link' // Replace this later after Google Drive upload
    } = req.body;

    const { data, error } = await supabase.from('activity').insert([
        {
          account_id,
          org_id,
          student_position,
          activity_name,
          activity_description,
          category_id,
          sdg_goals,
          charge_fee,
          university_partner,
          partner_name,
          partner_role,
          venue,
          venue_approver,
          venue_approver_contact,
          is_off_campus,
          green_monitor_name,
          green_monitor_contact,
          drive_folder_id
        }
      ]);
    
      if (error) return res.status(500).json({ error: error.message });
      res.status(201).json({ message: 'Activity submitted successfully!', data });
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