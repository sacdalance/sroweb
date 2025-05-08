import express from 'express';
import multer from 'multer';
import streamifier from 'streamifier';
import cors from 'cors';
import { google } from 'googleapis';
import { supabase } from '../supabaseClient.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
router.use(cors());

// ✅ Load environment variables
const parentFolderId = process.env.GDRIVE_ANNUAL_REPORT_FOLDER_ID;
const serviceAccountEmail = process.env.GDRIVE_CLIENT_EMAIL;
const privateKey = process.env.GDRIVE_PRIVATE_KEY.replace(/\\n/g, '\n');
const projectId = process.env.GDRIVE_PROJECT_ID;

// 🔐 Google Drive API client setup
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: serviceAccountEmail,
    private_key: privateKey,
  },
  projectId: projectId,
  scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

/**
 * ✅ Create a Google Drive folder under the given parent folder
 * and share it with the submitter and admin accounts (writers/editors)
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

  // 🧪 Check parent and ownership
  const folderDetails = await drive.files.get({
    fileId: folderId,
    fields: 'id, name, parents, webViewLink, owners',
  });

  const actualParents = folderDetails.data.parents;
  const folderOwner = folderDetails.data.owners?.[0]?.emailAddress;

  console.log("📦 Created Folder ID:", folderId);
  console.log("📦 Actual Parent(s):", actualParents);
  console.log("👤 Folder Owned By:", folderOwner);

  if (!actualParents || !actualParents.includes(parentId)) {
    throw new Error(`🚫 Folder was NOT created in the correct parent. Expected: ${parentId}, Got: ${actualParents}`);
  }

  // 🔐 Always share with srotest128@gmail.com
  await drive.permissions.create({
    fileId: folderId,
    requestBody: {
      type: 'user',
      role: 'writer',
      emailAddress: 'srotest128@gmail.com',
    },
  });

  // 🔐 Share with remaining allowed emails (submitter + admins)
  for (const email of allowedEmails) {
    if (email === 'srotest128@gmail.com') continue;

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
 * ✅ Upload a file into the created Drive folder
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
 * ✅ POST / - Handles uploading annual report and storing metadata
 */
router.post('/', upload.array('files', 2), async (req, res) => {
  try {
    const { org_id, submitted_by, academic_year } = req.body;
    const files = req.files;

    // 🚨 Validate required fields
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

    // 🔍 Get organization name
    const { data: orgData, error: orgError } = await supabase
      .from('organization')
      .select('org_name')
      .eq('org_id', org_id)
      .single();

    if (orgError || !orgData) throw new Error('Failed to fetch organization name.');

    // 🔍 Get submitter email
    const { data: submitterData, error: submitterError } = await supabase
      .from('account')
      .select('email')
      .eq('account_id', submitted_by)
      .single();

    if (submitterError || !submitterData?.email) {
      throw new Error('Failed to fetch submitter email.');
    }

    // 🔍 Get all SRO (2), ODSA (3), and Superadmin (4) emails
    const { data: adminAccounts, error: adminError } = await supabase
      .from('account')
      .select('email')
      .in('role_id', [2, 3, 4]);

    if (adminError) throw new Error('Failed to fetch admin emails.');

    const adminEmails = adminAccounts.map(acc => acc.email);
    const allowedEmails = [submitterData.email, ...adminEmails];

    // 📂 Create Google Drive folder
    const folderName = `${orgData.org_name} - Annual Report ${academic_year}`;
    const folder = await createDriveFolder(folderName, parentFolderId, allowedEmails);
    const folderId = folder.id;

    // 📄 Upload files to that folder
    const uploadedLinks = await Promise.all(
      files.map(file =>
        uploadToGoogleDrive(file.buffer, file.originalname, file.mimetype, folderId)
      )
    );

    // 📝 Insert record into Supabase
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
