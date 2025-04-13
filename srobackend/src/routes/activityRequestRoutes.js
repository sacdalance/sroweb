import express from 'express';
import multer from 'multer';
import cors from 'cors';
import { supabase } from '../supabaseClient.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(cors());

router.get("/", async (req, res) => {
  const { data, error } = await supabase.from('activity').select('*');
  if (error) return res.status(500).json({ error: error.message });
    res.status(200).json(data);
});


router.post('/', upload.single('file'), async (req, res) => {
  try {
    const {
      account_id, org_id, student_position, activity_name, activity_description, category_id,
      sdg_goals, charge_fee, university_partner, partner_name, partner_role, venue,
      venue_approver, venue_approver_contact, is_off_campus, green_monitor_name,
      green_monitor_contact
    } = req.body;

    // Handle file (later integrate Google Drive/Supabase Storage here)
    const file = req.file;
    const drive_folder_id = file ? 'uploaded-file-placeholder-link' : 'placeholder-link';

    const { data, error } = await supabase.from('activity').insert([
      {
        account_id, org_id, student_position, activity_name, activity_description, category_id,
        sdg_goals, charge_fee, university_partner, partner_name, partner_role, venue,
        venue_approver, venue_approver_contact, is_off_campus, green_monitor_name,
        green_monitor_contact, drive_folder_id
      }
    ]);

    if (error) throw error;

    res.status(201).json({ message: 'Activity submitted!', data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
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