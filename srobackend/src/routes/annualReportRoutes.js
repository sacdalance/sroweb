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

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GDRIVE_CLIENT_EMAIL,
    private_key: process.env.GDRIVE_PRIVATE_KEY.replace(/\\n/g, '\n'),
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

router.post('/', upload.single('file'), async (req, res) => {
  try {
    const { org_name, org_email } = req.body;
    const file = req.file;

    if (!file || !file.originalname.toLowerCase().endsWith('.pdf') || file.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'Only PDF files are allowed.' });
    }

    const drive_folder_link = await uploadToGoogleDrive(
      file.buffer,
      file.originalname,
      file.mimetype
    );

    const { error } = await supabase.from('org_annual_report').insert([{
      org_name,
      org_email,
      drive_folder_link,
    }]);

    if (error) throw error;

    res.status(201).json({ message: 'Annual Report uploaded successfully!', drive_folder_link });
  } catch (error) {
    console.error('Annual Report Submission Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
