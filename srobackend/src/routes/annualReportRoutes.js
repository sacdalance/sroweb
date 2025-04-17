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

router.post('/', upload.array('files', 2), async (req, res) => {
  try {
    const { org_id, submitted_by, academic_year } = req.body;
    const files = req.files;

    if (!files || files.length !== 2) {
      return res.status(400).json({ error: 'Exactly 2 PDF files must be uploaded.' });
    }

    // Check if all files are PDFs
    for (const file of files) {
      if (
        !file.originalname.toLowerCase().endsWith('.pdf') ||
        file.mimetype !== 'application/pdf'
      ) {
        return res.status(400).json({ error: 'Only PDF files are allowed.' });
      }
    }

    // Upload files to Google Drive
    const uploadedLinks = await Promise.all(
      files.map((file) =>
        uploadToGoogleDrive(file.buffer, file.originalname, file.mimetype)
      )
    );

    const { error } = await supabase.from('org_annual_report').insert([{
      org_id: parseInt(org_id),
      submitted_by: parseInt(submitted_by),
      academic_year,
      drive_folder_link: uploadedLinks[0],
      submission_file_url: JSON.stringify(uploadedLinks),
      submitted_at: new Date(),
    }]);
    
    if (error) {
      console.error("Supabase error:", error);
      throw error;
    }

    res.status(201).json({
      message: 'Annual Report uploaded successfully!',
      links: uploadedLinks,
    });
  } catch (error) {
    console.error('Annual Report Submission Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});


export default router;
