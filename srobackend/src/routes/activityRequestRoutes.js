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

// ACTIVITY REQUEST SUBMISSION
router.post('/', upload.single('file'), async (req, res) => {
  try {
    const {
      account_id, org_id, student_position, activity_name, activity_description, activity_type,
      sdg_goals, charge_fee, university_partner, partner_name, partner_role, venue,
      venue_approver, venue_approver_contact, is_off_campus, green_monitor_name,
      green_monitor_contact
    } = req.body;

    const file = req.file;

    if (file && (!file.originalname.toLowerCase().endsWith('.pdf') || file.mimetype !== 'application/pdf')) {
      return res.status(400).json({ error: 'Only PDF files are allowed.' });
    }

    let drive_folder_id = 'N/A';

    if (file) {
      drive_folder_id = await uploadToGoogleDrive(
        file.buffer,
        file.originalname,
        file.mimetype
      );
    }

    const { data, error } = await supabase.from('activity').insert([{
      account_id,
      org_id,
      student_position,
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
      drive_folder_id, // This now stores the Google Drive viewable link
    }]);

    if (error) throw error;

    res.status(201).json({ message: 'Activity submitted!', data });
  } catch (error) {
    console.error('Submission Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
