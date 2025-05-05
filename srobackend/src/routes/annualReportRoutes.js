import express from 'express';
import multer from 'multer';
import streamifier from 'streamifier';
import cors from 'cors';
import { google } from 'googleapis';
import { supabase } from '../supabaseClient.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
router.use(cors());

import dotenv from 'dotenv';
dotenv.config();

// 🔒 Hardcoded parent folder ID — replace this when migrating to .env
const parentFolderId = process.env.GDRIVE_ANNUAL_REPORT_FOLDER_ID; // TODO: Move to .env for production

// 🔑 Google Drive service account auth
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GDRIVE_CLIENT_EMAIL, // TODO: Move to .env
    private_key: process.env.GDRIVE_PRIVATE_KEY.replace(/\\n/g, '\n'), // TODO: Move to .env
  },
  projectId: process.env.GDRIVE_PROJECT_ID, // TODO: Move to .env
  scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

/**
 * ✅ Create Drive folder and share with allowedEmails
 */
async function createDriveFolder(folderName, parentId, allowedEmails = []) {
  console.log("📁 Target Parent Folder ID:", parentId);

  const fileMetadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
    parents: [parentId],
  };

  const folder = await drive.files.create({
    resource: fileMetadata,
    fields: 'id, webViewLink',
  });

  const folderId = folder.data.id;

  // 🧪 Confirm parent is correct
  const folderDetails = await drive.files.get({
    fileId: folderId,
    fields: 'id, name, parents, webViewLink',
  });

  const actualParents = folderDetails.data.parents;
  console.log("📦 Created Folder ID:", folderId);
  console.log("📦 Actual Parent(s):", actualParents);

  if (!actualParents || !actualParents.includes(parentId)) {
    throw new Error(`🚫 Folder was NOT created in the correct parent. Expected: ${parentId}, Got: ${actualParents}`);
  }

  // 🔐 Share folder with allowedEmails
  for (const email of allowedEmails) {
    await drive.permissions.create({
      fileId: folderId,
      requestBody: {
        type: 'user',
        role: 'writer',
        emailAddress: email,
      },
    });
  }

  return folderDetails.data;
}

/**
 * ✅ Upload file to Google Drive folder
 */
async function uploadToGoogleDrive(fileBuffer, fileName, mimeType, folderId) {
  const fileMetadata = {
    name: fileName,
    parents: [folderId],
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

  const file = await drive.files.get({
    fileId: uploadRes.data.id,
    fields: 'webViewLink',
  });

  return file.data.webViewLink;
}

/**
 * ✅ Main route: Upload Annual Report
 */
router.post('/', upload.array('files', 2), async (req, res) => {
  try {
    const { org_id, submitted_by, academic_year } = req.body;
    const files = req.files;

    if (!org_id || !submitted_by || !academic_year) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    if (!files || files.length !== 2) {
      return res.status(400).json({ error: 'Exactly 2 PDF files must be uploaded.' });
    }

    for (const file of files) {
      if (!file.originalname.toLowerCase().endsWith('.pdf') || file.mimetype !== 'application/pdf') {
        return res.status(400).json({ error: 'Only PDF files are allowed.' });
      }
    }

    // 🔎 Get org name
    const { data: orgData, error: orgError } = await supabase
      .from('organization')
      .select('org_name')
      .eq('org_id', org_id)
      .single();

    if (orgError || !orgData) throw new Error('Failed to fetch organization name.');

    // 🔎 Get submitter email
    const { data: accountData, error: accountError } = await supabase
      .from('account')
      .select('email')
      .eq('account_id', submitted_by)
      .single();

    if (accountError || !accountData?.email) {
      throw new Error('Failed to fetch submitter email.');
    }

    const folderName = `${orgData.org_name} - Annual Report ${academic_year}`;
    const allowedEmails = [accountData.email];

    // 📂 Create folder and upload files
    const folder = await createDriveFolder(folderName, parentFolderId, allowedEmails);
    const folderId = folder.id;

    const uploadedLinks = await Promise.all(
      files.map(file =>
        uploadToGoogleDrive(file.buffer, file.originalname, file.mimetype, folderId)
      )
    );

    // 📝 Save to Supabase
    const { error: insertError } = await supabase.from('org_annual_report').insert([{
      org_id: parseInt(org_id),
      submitted_by: parseInt(submitted_by),
      academic_year,
      drive_folder_link: folder.webViewLink,
      submission_file_url: JSON.stringify(uploadedLinks),
      submitted_at: new Date(),
    }]);

    if (insertError) throw insertError;

    res.status(201).json({
      message: 'Annual Report uploaded successfully!',
      folder_link: folder.webViewLink,
      file_links: uploadedLinks,
    });
  } catch (error) {
    console.error('Annual Report Submission Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
