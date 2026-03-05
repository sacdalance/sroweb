// routes/adminOrgApplicationsRoutes.js
import express from "express";
import { supabase } from "../supabaseClient.js";
import { createNotification } from '../lib/createNotification.js';

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
    drive_folder_link,
    org_status // Extract the status assigned by the admin
  } = updatedRows;

  if (sro_approved && odsa_approved) {
    // Check if org already exists for this year to handle renewal vs new
    const { data: existing, error: checkError } = await supabase
      .from('organization')
      .select('org_id')
      .eq('org_name', org_name)
      .eq('academic_year', academic_year)
      .maybeSingle();

    const orgData = {
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
      org_status: org_status, // Sync the recognition status
      approved_at: new Date().toISOString()
    };

    if (existing) {
      // ✅ Update existing organization (Renewal)
      const { error: updateError } = await supabase
        .from('organization')
        .update(orgData)
        .eq('org_id', existing.org_id);

      if (updateError) {
        console.error('Update error during migration:', updateError);
        return res.status(500).json({ error: updateError.message });
      }
    } else {
      // ✅ Insert new organization
      const { error: insertError } = await supabase
        .from('organization')
        .insert([orgData]);

      if (insertError) {
        console.error('Insert error during migration:', insertError);
        return res.status(500).json({ error: insertError.message });
      }
    }
  }

  // 3. Send in-app notifications based on status changes
  try {
    const recipientId = updatedRows.submitted_by;
    if (recipientId) {
      const orgLabel = org_name || 'your organization';

      if (sro_approved && odsa_approved) {
        createNotification({
          recipientId,
          type: 'org_approved',
          title: 'Organization recognition approved!',
          message: `"${orgLabel}" has been fully approved and recognized for ${academic_year}.`,
          referenceType: 'org_recognition',
          referenceId: recognition_id,
        });
      } else if (update.sro_approved === true) {
        createNotification({
          recipientId,
          type: 'org_sro_approved',
          title: 'Organization approved by SRO',
          message: `"${orgLabel}" has been approved by SRO and is now pending ODSA review.`,
          referenceType: 'org_recognition',
          referenceId: recognition_id,
        });
      } else if (update.odsa_approved === true) {
        createNotification({
          recipientId,
          type: 'org_odsa_approved',
          title: 'Organization approved by ODSA',
          message: `"${orgLabel}" has been approved by ODSA and is now pending SRO review.`,
          referenceType: 'org_recognition',
          referenceId: recognition_id,
        });
      } else if (update.sro_approved === false || update.odsa_approved === false) {
        createNotification({
          recipientId,
          type: 'org_rejected',
          title: 'Organization recognition rejected',
          message: `"${orgLabel}" recognition application has been rejected. Please check the remarks for details.`,
          referenceType: 'org_recognition',
          referenceId: recognition_id,
        });
      }
    }
  } catch (notifErr) {
    console.error('Notification creation failed:', notifErr);
  }

  return res.status(200).json({ success: true });
});

export default router;
