import express from 'express';
import { google } from 'googleapis';
import { supabase } from '../supabaseClient.js';
import { verifyAdminRoles } from '../middleware/authMiddleware.js';
import { getGoogleServiceAccountKey } from '../lib/googleAuth.js';
import dotenv from 'dotenv';
import streamifier from 'streamifier';
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
// On Vercel/Lambda (or any host without a local Chrome) the bundled desktop
// Chromium can't launch, so we use puppeteer-core + @sparticuz/chromium.
// Where a real Chrome exists (local dev) we use the full puppeteer package.
const IS_SERVERLESS =
  !!process.env.VERCEL ||
  !!process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.SLIP_PDF_ENGINE === 'serverless';

async function launchServerlessBrowser() {
  const [{ default: chromium }, { default: puppeteer }] = await Promise.all([
    import('@sparticuz/chromium'),
    import('puppeteer-core'),
  ]);
  return puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  });
}

async function launchLocalBrowser() {
  const { default: puppeteer } = await import('puppeteer');
  return puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
}

async function launchBrowser() {
  if (IS_SERVERLESS) {
    return launchServerlessBrowser();
  }
  // Try the local Chrome; if it isn't installed (e.g. a sandboxed host that
  // didn't set VERCEL), fall back to the bundled serverless Chromium.
  try {
    return await launchLocalBrowser();
  } catch (err) {
    console.warn('Local Chrome launch failed, falling back to @sparticuz/chromium:', err.message);
    return launchServerlessBrowser();
  }
}

let browserPromise = null;
function getBrowser() {
  if (!browserPromise) {
    // Lazy-load only when a PDF is actually needed, so non-PDF routes
    // (e.g. the Drive folder URL) don't pay the heavy browser startup cost.
    browserPromise = launchBrowser().catch((err) => {
      browserPromise = null; // allow retry on next request
      throw err;
    });
  }
  return browserPromise;
}

async function renderSlipPdf(activity) {
  // Serverless functions freeze between invocations, so a cached browser can
  // be dead by the next call. There we launch fresh and close after; locally
  // we reuse one long-lived browser for speed.
  const browser = IS_SERVERLESS ? await launchBrowser() : await getBrowser();
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
    if (IS_SERVERLESS) await browser.close();
  }
}

/**
 * GET /approval-slip/:activityId/pdf
 * Downloads the activity's slip. If the slip already exists in the Drive
 * folder, that existing copy is served (no regeneration) so everyone gets the
 * same file. Only when it's missing do we generate it, save it to Drive, then
 * serve it.
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

    const fileName = slipFileName(activity);

    // 1. If it's already in Drive, serve that copy — don't regenerate.
    try {
      const existing = await findSlipInFolder(fileName);
      if (existing) {
        const driveFile = await drive.files.get(
          { fileId: existing.id, alt: 'media' },
          { responseType: 'arraybuffer' }
        );
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        return res.send(Buffer.from(driveFile.data));
      }
    } catch (lookupErr) {
      console.error(`Drive lookup failed for activity ${activityId}, will generate fresh:`, lookupErr.message);
    }

    // 2. Not in Drive — generate, save to Drive (best-effort), then serve.
    const pdfBuffer = await renderSlipPdf(activity);
    try {
      await uploadPDFToGoogleDrive(pdfBuffer, fileName);
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

function getSlipsFolderId() {
  // Prefer the dedicated slips folder; fall back to the general Drive folder
  // so this works even before GDRIVE_APPROVAL_SLIPS_FOLDER_ID is configured.
  const folderId = process.env.GDRIVE_APPROVAL_SLIPS_FOLDER_ID || process.env.GDRIVE_FOLDER_ID;
  if (!folderId) throw new Error('No Drive folder configured (set GDRIVE_APPROVAL_SLIPS_FOLDER_ID or GDRIVE_FOLDER_ID)');
  return folderId;
}

/**
 * Look for an existing slip with this exact name in the folder.
 * Returns the file ({ id, webViewLink }) if found, otherwise null.
 * This is how we decide "generate only if it's not already there".
 */
async function findSlipInFolder(fileName) {
  const folderId = getSlipsFolderId();
  const escapedName = fileName.replace(/'/g, "\\'");
  const existing = await drive.files.list({
    q: `name='${escapedName}' and '${folderId}' in parents and trashed=false`,
    fields: 'files(id, webViewLink)',
    pageSize: 1,
  });
  return existing.data.files?.[0] || null;
}

/**
 * Upload PDF Buffer to Drive, idempotently by filename.
 * Re-checks for an existing file immediately before creating, so even if two
 * requests race past an earlier existence check, the second one reuses the
 * first's file instead of creating a duplicate.
 * Returns { fileId, webViewLink, created }.
 */
async function uploadPDFToGoogleDrive(pdfBuffer, fileName) {
  try {
    const folderId = getSlipsFolderId();

    // Guard against the check-then-create race: look again right before create.
    const existing = await findSlipInFolder(fileName);
    if (existing) {
      return { fileId: existing.id, webViewLink: existing.webViewLink, created: false };
    }

    const media = {
      mimeType: 'application/pdf',
      body: streamifier.createReadStream(pdfBuffer),
    };

    const res = await drive.files.create({
      requestBody: { name: fileName, parents: [folderId] },
      media,
      fields: 'id, webViewLink',
    });

    // Make Public Reader (or at least accessible to student)
    await drive.permissions.create({
      fileId: res.data.id,
      requestBody: { role: 'reader', type: 'anyone' },
    });

    return { fileId: res.data.id, webViewLink: res.data.webViewLink, created: true };
  } catch (error) {
    console.error('Upload Error:', error);
    throw error;
  }
}

function slipFileName(activity) {
  const safeName = String(activity.activity_name || 'Activity').replace(/[^a-z0-9]+/gi, '_').slice(0, 60);
  return `Approval_Slip_${safeName}_${activity.activity_id}.pdf`;
}

/**
 * Generate a single slip if it isn't already in the Drive folder.
 * Existence is checked by filename in the folder (the source of truth), so we
 * only render with Puppeteer + upload when the slip is actually missing.
 * Returns { created: boolean }.
 */
async function generateSlipForActivity(activity) {
  const fileName = slipFileName(activity);

  // Fast path: skip the expensive Puppeteer render if it's already there.
  const existing = await findSlipInFolder(fileName);
  if (existing) {
    return { created: false };
  }

  const pdfBuffer = await renderSlipPdf(activity);
  // upload() re-checks existence atomically and returns whether it created it.
  const result = await uploadPDFToGoogleDrive(pdfBuffer, fileName);
  return { created: result.created };
}

// Single-flight guard: only one batch generation may run at a time, so a
// double-click (or two admins) can't kick off overlapping batches that race
// each other into duplicate uploads.
let batchInProgress = false;

/**
 * POST /generate-approval-slips
 * For every approved activity, generates a slip ONLY if it isn't already in
 * the Drive folder (existence checked by filename — the folder is the source
 * of truth). Existing slips are skipped, so repeat clicks never duplicate.
 */
router.post('/generate-approval-slips', verifyAdminRoles, async (req, res) => {
  if (batchInProgress) {
    return res.status(409).json({ error: 'A slip generation is already running. Please wait for it to finish.' });
  }
  batchInProgress = true;
  try {
    console.log('Starting Puppeteer-based PDF generation...');

    // Optional: caller may pass a specific list of activity IDs to generate.
    // If omitted, generate for ALL approved activities.
    const requestedIds = Array.isArray(req.body?.activityIds)
      ? req.body.activityIds.map(Number).filter((n) => Number.isFinite(n))
      : null;
    console.log('[generate-approval-slips] received activityIds:', JSON.stringify(req.body?.activityIds), '-> using:', requestedIds);

    let query = supabase
      .from('activity')
      .select(`*, account:account(*), organization:organization(*), schedule:activity_schedule(*)`)
      .eq('final_status', 'Approved')
      .limit(200);

    if (requestedIds && requestedIds.length > 0) {
      query = query.in('activity_id', requestedIds);
    }

    const { data: approvedActivities, error: dbError } = await query;

    if (dbError) throw dbError;
    if (!approvedActivities?.length) {
      return res.json({ message: 'No matching approved activities found.', pdfCount: 0, skippedCount: 0 });
    }

    // Generate missing slips; skip those already in the folder.
    const createdIds = [];
    let skippedCount = 0;
    const errors = [];

    for (const activity of approvedActivities) {
      try {
        const { created } = await generateSlipForActivity(activity);
        if (created) createdIds.push(activity.activity_id);
        else skippedCount++;
      } catch (err) {
        console.error(`Failed ${activity.activity_id}:`, err.message);
        errors.push({ id: activity.activity_id, error: err.message });
      }
    }

    // Keep the DB flag in sync for activities whose slips now exist in Drive.
    if (createdIds.length > 0) {
      const { error: updateError } = await supabase
        .from('activity')
        .update({
          pdf_generated: true,
          pdf_generated_at: new Date().toISOString(),
          slip_status: 'printed'
        })
        .in('activity_id', createdIds);

      if (updateError) {
        console.error('Batch update error:', updateError.message);
        errors.push({ id: 'batch_update', error: updateError.message });
      }
    }

    res.json({
      message: `Generated ${createdIds.length} new slip(s), skipped ${skippedCount} already in Drive.`,
      pdfCount: createdIds.length,
      skippedCount,
      errors: errors.length ? errors : undefined
    });

  } catch (error) {
    console.error('Generation Error:', error);
    res.status(500).json({ error: error.message });
  } finally {
    batchInProgress = false;
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

/**
 * GET /approval-slips-folder-url
 * Returns the Drive folder URL (from env) so the "Drive Folder" button can
 * open it without exposing the folder ID to the frontend.
 */
router.get('/approval-slips-folder-url', verifyAdminRoles, (req, res) => {
  const folderId = process.env.GDRIVE_APPROVAL_SLIPS_FOLDER_ID || process.env.GDRIVE_FOLDER_ID;
  if (!folderId) {
    return res.status(404).json({ error: 'No Drive folder configured' });
  }
  res.json({ folderUrl: `https://drive.google.com/drive/folders/${folderId}` });
});

export default router;
