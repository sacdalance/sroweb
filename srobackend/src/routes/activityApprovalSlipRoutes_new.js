import express from 'express';
import { google } from 'googleapis';
import { supabase } from '../supabaseClient.js';
import { verifyAdminRoles } from '../middleware/authMiddleware.js';
import { getGoogleServiceAccountKey } from '../lib/googleAuth.js';
import dotenv from 'dotenv';
import streamifier from 'streamifier';

dotenv.config();

const router = express.Router();

// Google Auth Setup
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GDRIVE_CLIENT_EMAIL,
    private_key: getGoogleServiceAccountKey(),
  },
  scopes: [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/documents' // Docs API
  ],
});

const drive = google.drive({ version: 'v3', auth });
const docs = google.docs({ version: 'v1', auth });

/**
 * Upload PDF Buffer to Drive
 */
async function uploadPDFToGoogleDrive(pdfBuffer, fileName) {
  try {
    const folderId = process.env.GDRIVE_APPROVAL_SLIPS_FOLDER_ID;
    if (!folderId) throw new Error('GDRIVE_APPROVAL_SLIPS_FOLDER_ID not set');

    const fileMetadata = {
      name: fileName,
      parents: [folderId],
    };

    const media = {
      mimeType: 'application/pdf',
      body: streamifier.createReadStream(pdfBuffer),
    };

    const res = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, webViewLink',
    });

    // Make Public Reader (or at least accessible to student)
    await drive.permissions.create({
      fileId: res.data.id,
      requestBody: { role: 'reader', type: 'anyone' },
    });

    return { fileId: res.data.id, webViewLink: res.data.webViewLink };
  } catch (error) {
    console.error('Upload Error:', error);
    throw error;
  }
}

/**
 * Generate Single Slip using Google Docs Logic
 */
async function generateSlipForActivity(activity, templateId) {
  let copyId = null;
  try {
    // 1. Copy Template
    const copyRes = await drive.files.copy({
      fileId: templateId,
      requestBody: {
        name: `TEMP_GEN_${activity.activity_name}`,
      },
    });
    copyId = copyRes.data.id;

    // 2. Prepare Replacements
    // Using simple {} to match user's template exactly
    const replacements = {
      '{activityID}': activity.activity_id,
      '{orgName}': activity.organization?.org_name || 'N/A',
      '{studentName}': activity.account?.account_name || 'N/A', // Changed from {student}
      '{studentPosition}': activity.student_position || 'N/A',
      '{studentContact}': activity.student_contact || 'N/A',
      '{activityName}': activity.activity_name || 'N/A',
      '{activityDesc}': activity.activity_description || 'N/A',
      '{venue}': activity.venue || 'N/A',
      '{venueApprover}': activity.venue_approver || 'N/A',
      '{partneredBool}': activity.university_partner ? 'Yes' : 'No',
      '{universityPartner}': activity.partner_name || 'N/A',
      '{universityPartnerRole}': activity.partner_role || 'N/A',
      '{campusBool}': activity.is_off_campus ? 'Yes' : 'No',
      '{feesBool}': activity.charge_fee ? 'Yes' : 'No',
      '{greenCampusMonitor}': activity.green_monitor_name || 'N/A',
      '{greenCampusContact}': activity.green_monitor_contact || 'N/A',
      '{adviserName}': activity.organization?.adviser_name || 'N/A',
      '{adviserContact}': activity.organization?.adviser_email || 'N/A',
      '{dateApproved}': activity.odsa_approval_date ? new Date(activity.odsa_approval_date).toLocaleDateString() : new Date().toLocaleDateString(),
      '{sroNotes}': activity.sro_remarks || 'None',  // Changed from sroComments
      '{odsaNotes}': activity.odsa_remarks || 'None', // Added odsaNotes
    };

    // Schedule Formatting
    const sched = activity.schedule?.[0];
    if (sched) {
      replacements['{activityDate}'] = sched.start_date ? new Date(sched.start_date).toLocaleDateString() : 'N/A';
      replacements['{activityTime}'] = `${sched.start_time?.slice(0, 5) || 'TBD'} - ${sched.end_time?.slice(0, 5) || 'TBD'}`;
    } else {
      replacements['{activityDate}'] = 'N/A';
      replacements['{activityTime}'] = 'N/A';
    }

    // 3. Batch Update (Replace Text)
    const requests = Object.entries(replacements).map(([key, value]) => ({
      replaceAllText: {
        containsText: { text: key, matchCase: false }, // Case insensitive for safety
        replaceText: String(value || ''),
      },
    }));

    await docs.documents.batchUpdate({
      documentId: copyId,
      requestBody: { requests },
    });

    // 4. Export to PDF
    const exportRes = await drive.files.export({
      fileId: copyId,
      mimeType: 'application/pdf',
      responseType: 'arraybuffer',
    });

    // 5. Upload Result
    const fileName = `Approval_Slip_${activity.activity_name}_${activity.activity_id}.pdf`;
    const uploadResult = await uploadPDFToGoogleDrive(Buffer.from(exportRes.data), fileName);

    // 6. Cleanup Temp Doc
    try {
      await drive.files.delete({ fileId: copyId });
    } catch (cleanupErr) {
      console.warn('Failed to delete temp doc:', copyId);
    }

    return uploadResult;

  } catch (error) {
    // Attempt cleanup on error
    if (copyId) {
      try { await drive.files.delete({ fileId: copyId }); } catch (e) { }
    }
    throw error;
  }
}

/**
 * POST /generate-approval-slips
 */
router.post('/generate-approval-slips', verifyAdminRoles, async (req, res) => {
  try {
    console.log('Starting Google Docs-based PDF generation...');

    // 1. Find Master Template
    const templatesFolderId = process.env.GDRIVE_TEMPLATES_FOLDER_ID;
    if (!templatesFolderId) throw new Error('GDRIVE_TEMPLATES_FOLDER_ID not configured');

    // Look for 'Form_1B' OR 'MASTER_APPROVAL_SLIP'
    const q = `'${templatesFolderId}' in parents and (name contains 'Form_1B' or name contains 'MASTER_APPROVAL_SLIP') and mimeType='application/vnd.google-apps.document' and trashed=false`;
    const templateRes = await drive.files.list({
      q,
      fields: 'files(id, name)',
      orderBy: 'modifiedTime desc' // Pick most recently modified one if multiple
    });

    if (templateRes.data.files.length === 0) {
      return res.status(404).json({
        error: 'Master Template not found',
        message: 'Please search for "Form_1B" or "MASTER_APPROVAL_SLIP" in the Templates folder.'
      });
    }

    const templateId = templateRes.data.files[0].id;
    console.log(`Using Template: ${templateRes.data.files[0].name} (${templateId})`);

    // 2. Fetch Approved Activities (Pending Print) — process in batches of 50
    const { data: approvedActivities, error: dbError } = await supabase
      .from('activity')
      .select(`*, account:account(*), organization:organization(*), schedule:activity_schedule(*)`)
      .eq('final_status', 'Approved')
      .or('pdf_generated.is.null,pdf_generated.eq.false')
      .limit(50);

    if (dbError) throw dbError;
    if (!approvedActivities?.length) {
      return res.json({ message: 'No pending activities to generate.', pdfCount: 0 });
    }

    // 3. Generate PDFs — collect successful IDs for batch DB update
    const successIds = [];
    const errors = [];

    for (const activity of approvedActivities) {
      try {
        await generateSlipForActivity(activity, templateId);
        successIds.push(activity.activity_id);
      } catch (err) {
        console.error(`Failed ${activity.activity_id}:`, err.message);
        errors.push({ id: activity.activity_id, error: err.message });
      }
    }

    // 4. Batch update all successful activities in one query
    if (successIds.length > 0) {
      const { error: updateError } = await supabase
        .from('activity')
        .update({
          pdf_generated: true,
          pdf_generated_at: new Date().toISOString(),
          slip_status: 'printed'
        })
        .in('activity_id', successIds);

      if (updateError) {
        console.error('Batch update error:', updateError.message);
        errors.push({ id: 'batch_update', error: updateError.message });
      }
    }

    res.json({
      message: `Generated ${successIds.length} slips using Google Docs engine.`,
      pdfCount: successIds.length,
      errors: errors.length ? errors : undefined
    });

  } catch (error) {
    console.error('Generation Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Reuse existing routes for status checks
router.get('/pdf-status', verifyAdminRoles, async (req, res) => {
  // ... (Keep existing logic if needed, or simplified)
  // For brevity, just returning standard status query
  const { count } = await supabase
    .from('activity')
    .select('activity_id', { count: 'exact', head: true })
    .eq('final_status', 'Approved')
    .or('pdf_generated.is.null,pdf_generated.eq.false');
  res.json({ pendingCount: count || 0 });
});

export default router;
