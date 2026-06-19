import express from 'express';
import { google } from 'googleapis';
import { supabase } from '../supabaseClient.js';
import { verifyAdminRoles } from '../middleware/authMiddleware.js';
import { getGoogleServiceAccountKey } from '../lib/googleAuth.js';
import dotenv from 'dotenv';
import streamifier from 'streamifier';
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const router = express.Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_PATH = path.join(__dirname, '..', 'templates', 'approvalSlipTemplate.html');
const SEAL_PATH = path.join(__dirname, '..', '..', '..', 'sroapp', 'public', 'UPSeal-BW.jpg');

// Cache the template + seal data URI so we read from disk only once.
let cachedTemplate = null;
let cachedSealDataUri = null;

function loadTemplate() {
  if (cachedTemplate) return cachedTemplate;
  cachedTemplate = fs.readFileSync(TEMPLATE_PATH, 'utf8');
  return cachedTemplate;
}

function loadSealDataUri() {
  if (cachedSealDataUri !== null) return cachedSealDataUri;
  try {
    const buf = fs.readFileSync(SEAL_PATH);
    cachedSealDataUri = `data:image/jpeg;base64,${buf.toString('base64')}`;
  } catch (e) {
    console.warn('UP seal image not found, rendering slip without it:', e.message);
    cachedSealDataUri = ''; // render with no image rather than crash
  }
  return cachedSealDataUri;
}

// Escape user-supplied values so they can't break the HTML/inject markup.
function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Build the filled HTML for one activity using the local template.
 * Placeholders match the template tokens exactly (e.g. {orgName}, {student}).
 */
function buildSlipHtml(activity) {
  const sched = activity.schedule?.[0];
  const activityDate = sched?.start_date
    ? new Date(sched.start_date).toLocaleDateString('en-US', { year: '2-digit', month: '2-digit', day: '2-digit' })
    : 'N/A';
  const activityTime = sched
    ? `${sched.start_time?.slice(0, 5) || 'TBD'} - ${sched.end_time?.slice(0, 5) || 'TBD'}`
    : 'N/A';
  const dateApproved = activity.odsa_approval_date
    ? new Date(activity.odsa_approval_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const replacements = {
    '{formCode}': `SRO-${activity.activity_id}`,
    '{orgName}': activity.organization?.org_name,
    '{student}': activity.account?.account_name,
    '{studentPosition}': activity.student_position,
    '{studentContact}': activity.student_contact,
    '{activityName}': activity.activity_name,
    '{activityDesc}': activity.activity_description,
    '{activityDate}': activityDate,
    '{activityTime}': activityTime,
    '{venue}': activity.venue,
    '{venueApprover}': activity.venue_approver,
    '{partneredBool}': activity.university_partner ? 'Yes' : 'No',
    '{universityPartner}': activity.partner_name,
    '{universityPartnerRole}': activity.partner_role,
    '{campusBool}': activity.is_off_campus ? 'Yes' : 'No',
    '{feesBool}': activity.charge_fee ? 'Yes' : 'No',
    '{greenCampusMonitor}': activity.green_monitor_name,
    '{greenCampusContact}': activity.green_monitor_contact,
    '{adviserName}': activity.organization?.adviser_name,
    '{adviserContact}': activity.organization?.adviser_email,
    '{dateApproved}': dateApproved,
    '{sroComments}': activity.sro_remarks || 'None',
  };

  let html = loadTemplate().replace('{{SEAL_SRC}}', loadSealDataUri());
  for (const [token, value] of Object.entries(replacements)) {
    const safe = (value === undefined || value === null || value === '') ? 'N/A' : escapeHtml(value);
    html = html.split(token).join(safe);
  }
  return html;
}

/**
 * Render filled HTML to a PDF buffer with Puppeteer. No GCP/Drive needed.
 * A single browser instance is reused across requests.
 */
let browserPromise = null;
function getBrowser() {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    }).catch((err) => {
      browserPromise = null; // allow retry on next request
      throw err;
    });
  }
  return browserPromise;
}

async function renderSlipPdf(activity) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(buildSlipHtml(activity), { waitUntil: 'networkidle0' });
    return await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', bottom: '0', left: '0', right: '0' },
    });
  } finally {
    await page.close();
  }
}

/**
 * GET /approval-slip/:activityId/pdf
 * Generates the slip on demand with Puppeteer and streams it to the admin.
 */
router.get('/approval-slip/:activityId/pdf', verifyAdminRoles, async (req, res) => {
  try {
    const { activityId } = req.params;

    const { data: activity, error } = await supabase
      .from('activity')
      .select(`*, account:account(*), organization:organization(*), schedule:activity_schedule(*)`)
      .eq('activity_id', activityId)
      .single();

    if (error || !activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }
    if (activity.final_status !== 'Approved') {
      return res.status(400).json({ error: 'Approval slip is only available for approved activities.' });
    }

    const pdfBuffer = await renderSlipPdf(activity);
    const safeName = String(activity.activity_name || 'Activity').replace(/[^a-z0-9]+/gi, '_').slice(0, 60);
    const fileName = `Approval_Slip_${safeName}_${activity.activity_id}.pdf`;

    // Best-effort: save a copy to Drive. A Drive failure must NOT block the
    // admin's download, so we catch and log rather than throw.
    let driveLink = null;
    try {
      const uploadResult = await uploadPDFToGoogleDrive(pdfBuffer, fileName);
      driveLink = uploadResult.webViewLink;
      await supabase
        .from('activity')
        .update({
          pdf_generated: true,
          pdf_generated_at: new Date().toISOString(),
          slip_status: 'printed',
        })
        .eq('activity_id', activity.activity_id);
    } catch (driveErr) {
      console.error(`Drive save failed for activity ${activity.activity_id} (download still served):`, driveErr.message);
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Slip PDF generation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Google Auth Setup
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GDRIVE_CLIENT_EMAIL,
    private_key: getGoogleServiceAccountKey(),
  },
  scopes: [
    'https://www.googleapis.com/auth/drive',
  ],
});

const drive = google.drive({ version: 'v3', auth });

/**
 * Upload PDF Buffer to Drive
 */
async function uploadPDFToGoogleDrive(pdfBuffer, fileName) {
  try {
    // Prefer the dedicated slips folder; fall back to the general Drive folder
    // so this works even before GDRIVE_APPROVAL_SLIPS_FOLDER_ID is configured.
    const folderId = process.env.GDRIVE_APPROVAL_SLIPS_FOLDER_ID || process.env.GDRIVE_FOLDER_ID;
    if (!folderId) throw new Error('No Drive folder configured (set GDRIVE_APPROVAL_SLIPS_FOLDER_ID or GDRIVE_FOLDER_ID)');

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
 * Generate a single slip with Puppeteer and upload it to the Drive folder.
 * No Google Docs template required.
 */
async function generateSlipForActivity(activity) {
  const pdfBuffer = await renderSlipPdf(activity);
  const safeName = String(activity.activity_name || 'Activity').replace(/[^a-z0-9]+/gi, '_').slice(0, 60);
  const fileName = `Approval_Slip_${safeName}_${activity.activity_id}.pdf`;
  return uploadPDFToGoogleDrive(pdfBuffer, fileName);
}

/**
 * POST /generate-approval-slips
 * Batch-generates slips for every approved activity that doesn't have one yet,
 * renders them with Puppeteer, and saves them to the Drive folder.
 * Activities already generated (pdf_generated = true) are skipped, so a repeat
 * click never creates duplicates in Drive.
 */
router.post('/generate-approval-slips', verifyAdminRoles, async (req, res) => {
  try {
    console.log('Starting Puppeteer-based PDF generation...');

    // Fetch approved activities that have NOT been generated yet (skip existing).
    const { data: approvedActivities, error: dbError } = await supabase
      .from('activity')
      .select(`*, account:account(*), organization:organization(*), schedule:activity_schedule(*)`)
      .eq('final_status', 'Approved')
      .or('pdf_generated.is.null,pdf_generated.eq.false')
      .limit(50);

    if (dbError) throw dbError;
    if (!approvedActivities?.length) {
      return res.json({ message: 'No new slips to generate — all approved activities already have one.', pdfCount: 0 });
    }

    // Generate + upload PDFs, collecting successful IDs for a batch DB update.
    const successIds = [];
    const errors = [];

    for (const activity of approvedActivities) {
      try {
        await generateSlipForActivity(activity);
        successIds.push(activity.activity_id);
      } catch (err) {
        console.error(`Failed ${activity.activity_id}:`, err.message);
        errors.push({ id: activity.activity_id, error: err.message });
      }
    }

    // Mark all successful activities so they're skipped next time.
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
      message: `Generated ${successIds.length} slip(s) and saved to Drive.`,
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
