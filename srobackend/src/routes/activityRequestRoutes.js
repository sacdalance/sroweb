import streamifier from 'streamifier';
import express from 'express';
import multer from 'multer';
import cors from 'cors';
import { supabase } from '../supabaseClient.js';
import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(cors());

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
router.post('/', upload.single('file'), async (req, res) => {
  try {
    const {
      account_id, org_id, student_position, student_contact, activity_name, activity_description, activity_type,
      sdg_goals, charge_fee, university_partner, partner_name, partner_role, venue,
      venue_approver, venue_approver_contact, is_off_campus, green_monitor_name,
      green_monitor_contact, is_recurring, start_date, end_date, start_time, end_time, recurring_days
    } = req.body;

    const file = req.file;
    let drive_folder_link = 'N/A';

    if (file) {
      if (!file.originalname.toLowerCase().endsWith('.pdf') || file.mimetype !== 'application/pdf') {
        return res.status(400).json({ error: 'Only PDF files are allowed.' });
      }

      drive_folder_link = await uploadToGoogleDrive(
        file.buffer,
        file.originalname,
        file.mimetype
      );
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
      drive_folder_link
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
