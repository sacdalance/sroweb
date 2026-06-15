import express from 'express';
import { supabase } from '../supabaseClient.js';
import { authMiddleware, verifyAdminRoles } from '../middleware/authMiddleware.js';
import streamifier from 'streamifier';
import multer from 'multer';
import { google } from 'googleapis';
import { getGoogleServiceAccountKey } from '../lib/googleAuth.js';
import dotenv from 'dotenv';

dotenv.config();
const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
});

// Google Drive setup
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GDRIVE_CLIENT_EMAIL,
    private_key: getGoogleServiceAccountKey(),
  },
  projectId: process.env.GDRIVE_PROJECT_ID,
  scopes: ['https://www.googleapis.com/auth/drive.file'],
});

const drive = google.drive({ version: 'v3', auth });

async function uploadToGoogleDrive(fileBuffer, fileName, mimeType) {
  const fileMetadata = {
    name: fileName,
    parents: [process.env.GDRIVE_FOLDER_ID],
  };

  const media = {
    mimeType,
    body: streamifier.createReadStream(fileBuffer),
  };

  const uploadRes = await drive.files.create({
    requestBody: fileMetadata,
    media,
    fields: 'id',
  });

  await drive.permissions.create({
    fileId: uploadRes.data.id,
    requestBody: {
      role: 'reader',
      type: 'anyone',
    },
  });

  const file = await drive.files.get({
    fileId: uploadRes.data.id,
    fields: 'webViewLink',
  });

  return file.data.webViewLink;
}

function generateActivityId() {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yy = String(now.getFullYear()).slice(2);
  const random = Math.floor(10000 + Math.random() * 90000);
  return `${mm}${yy}-${random}`;
}

async function insertActivityWithRetry(activityData, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const activity_id = generateActivityId();
    const { data, error } = await supabase.from('activity').insert([{
      ...activityData,
      activity_id,
    }]).select();

    if (!error) return { data, activity_id };
    if (error.code !== '23505') throw error;
  }
  throw new Error('Failed to generate unique activity ID after retries');
}

router.post('/admin/activity', verifyAdminRoles, upload.fields([
  { name: 'conceptPaper', maxCount: 1 },
  { name: 'form2b', maxCount: 1 }
]), async (req, res) => {
  try {
    const {
      org_id, student_position, student_contact, activity_name, activity_description, activity_type,
      sdg_goals, charge_fee, university_partner, partner_name, partner_role, venue,
      venue_approver, venue_approver_contact, is_off_campus, green_monitor_name,
      green_monitor_contact, has_outside_visitors, is_recurring, start_date, end_date, start_time, end_time, recurring_days
    } = req.body;

    let concept_paper_link = null;
    let form_2b_link = null;

    const conceptPaperFile = req.files?.conceptPaper?.[0];
    const form2bFile = req.files?.form2b?.[0];

    if (conceptPaperFile) {
      if (!conceptPaperFile.originalname.toLowerCase().endsWith('.pdf') || conceptPaperFile.mimetype !== 'application/pdf') {
        return res.status(400).json({ error: 'Only PDF files are allowed for Concept Paper.' });
      }
      concept_paper_link = await uploadToGoogleDrive(conceptPaperFile.buffer, conceptPaperFile.originalname, conceptPaperFile.mimetype);
    }

    if (form2bFile) {
      if (!form2bFile.originalname.toLowerCase().endsWith('.pdf') || form2bFile.mimetype !== 'application/pdf') {
        return res.status(400).json({ error: 'Only PDF files are allowed for Form 2B.' });
      }
      form_2b_link = await uploadToGoogleDrive(form2bFile.buffer, form2bFile.originalname, form2bFile.mimetype);
    }

    const user = req.user;
    const { data: accountData, error: accountError } = await supabase
      .from("account")
      .select("account_id")
      .eq("email", user.email)
      .single();

    if (accountError || !accountData) {
      return res.status(404).json({ message: "User not found in account table." });
    }

    const account_id = accountData.account_id;

    const { data: activityInsertData, activity_id } = await insertActivityWithRetry({
      account_id,
      org_id,
      student_position,
      student_contact,
      activity_name,
      activity_description,
      activity_type,
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
      has_outside_visitors: has_outside_visitors === 'true' || has_outside_visitors === true,
      concept_paper_link,
      form_2b_link,
      sro_approval_status: 'Approved',
      odsa_approval_status: 'Approved',
      final_status: 'Approved'
    });

    const { error: scheduleError } = await supabase.from('activity_schedule').insert([{
      activity_id,
      is_recurring: is_recurring || 'one-time',
      start_date: start_date || new Date().toISOString().split("T")[0],
      end_date: end_date || null,
      start_time: start_time || "00:00",
      end_time: end_time || "00:00",
      recurring_days: recurring_days || null
    }]);

    if (scheduleError) {
      await supabase.from('activity').delete().eq('activity_id', activity_id);
      throw scheduleError;
    }

    res.status(201).json({ message: 'Admin activity submitted and auto-approved.', data: activityInsertData });

  } catch (error) {
    console.error('Submission Error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
