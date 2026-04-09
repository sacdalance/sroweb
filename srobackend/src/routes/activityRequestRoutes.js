import streamifier from 'streamifier';
import express from 'express';
import multer from 'multer';
import cors from 'cors';
import { supabase } from '../supabaseClient.js';
import { google } from 'googleapis';
import { authMiddleware } from '../middleware/authMiddleware.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
});


// GOOGLE DRIVE AUTH
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GDRIVE_CLIENT_EMAIL,
    private_key: process.env.GDRIVE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  },
  projectId: process.env.GDRIVE_PROJECT_ID,
  scopes: ['https://www.googleapis.com/auth/drive.file'],
});

const drive = google.drive({ version: 'v3', auth });

// Upload to Google Drive function
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

  // Make the file viewable by anyone with the link
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
  const random = Math.floor(1000 + Math.random() * 9000); // 4-digit random
  return `${mm}${yy}-${random}`;
}

// ACTIVITY REQUEST SUBMISSION
router.post('/', authMiddleware, upload.fields([
  { name: 'conceptPaper', maxCount: 1 },
  { name: 'form2b', maxCount: 1 }
]), async (req, res) => {
  try {
    const {
      account_id, org_id, student_position, student_contact, activity_name, activity_description, activity_type,
      sdg_goals, charge_fee, university_partner, partner_name, partner_role, venue,
      venue_approver, venue_approver_contact, is_off_campus, green_monitor_name,
      green_monitor_contact, is_recurring, start_date, end_date, start_time, end_time, recurring_days
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

    const activity_id = generateActivityId();

    const { data: activityInsertData, error: activityError } = await supabase.from('activity').insert([{
      activity_id,
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
      concept_paper_link,
      form_2b_link
    }]).select();

    if (activityError) throw activityError;

    const { error: scheduleError } = await supabase.from('activity_schedule').insert([{
      activity_id,
      is_recurring,
      start_date,
      end_date: end_date || null,
      start_time,
      end_time,
      recurring_days: recurring_days || null
    }]);

    if (scheduleError) throw scheduleError;

    res.status(201).json({ message: 'Activity submitted!', data: activityInsertData });

  } catch (error) {
    console.error('Submission Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
