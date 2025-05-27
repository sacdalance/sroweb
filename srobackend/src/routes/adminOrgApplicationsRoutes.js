// routes/adminOrgApplicationsRoutes.js
import express from "express";
import { supabase } from "../supabaseClient.js";

const router = express.Router();

router.post('/update-status', async (req, res) => {
  const { recognition_id, update } = req.body;
  if (!recognition_id || !update) {
    return res.status(400).json({ error: 'Missing data' });
  }

  // 1. Update org_recognition and fetch the updated row
  const { data: updatedRows, error } = await supabase
    .from('org_recognition')
    .update(update)
    .eq('recognition_id', recognition_id)
    .select()
    .single();

  if (error) {
    console.error('Supabase update error:', error);
    return res.status(500).json({ error: error.message });
  }

  // 2. Check if both SRO and ODSA are approved
  const {
    sro_approved,
    odsa_approved,
    org_name,
    academic_year,
    org_type,
    org_chairperson,
    chairperson_email,
    org_email,
    org_adviser,
    adviser_email,
    org_coadviser,
    coadviser_email,
    drive_folder_link
  } = updatedRows;

  if (sro_approved && odsa_approved) {
    // Check if org already exists for this year
    const { data: existing, error: checkError } = await supabase
      .from('organization')
      .select('org_id')
      .eq('org_name', org_name)
      .eq('academic_year', academic_year)
      .maybeSingle();

    if (!existing) {
      // Insert organization, map fields correctly and use a timestamp for approved_at
      const { error: insertError } = await supabase
        .from('organization')
        .insert([{
          org_name,
          academic_year,
          org_type,
          chairperson_name: org_chairperson,
          chairperson_email,
          org_email,
          adviser_name: org_adviser,
          adviser_email,
          coadviser_name: org_coadviser,
          coadviser_email,
          drive_folder_link,
          approved_at: new Date().toISOString() // Full timestamp
        }]);
      if (insertError) {
        console.error('Insert error during migration:', insertError);
        return res.status(500).json({ error: insertError.message });
      }
    }
  }

  return res.status(200).json({ success: true });
});

export default router;
