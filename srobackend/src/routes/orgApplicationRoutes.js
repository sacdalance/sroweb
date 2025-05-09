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
const parentFolderId = process.env.GDRIVE_ORG_APP_FOLDER_ID;
const serviceAccountEmail = process.env.GDRIVE_CLIENT_EMAIL;
const privateKey = process.env.GDRIVE_PRIVATE_KEY.replace(/\\n/g, '\n');
const projectId = process.env.GDRIVE_PROJECT_ID;

// 🔐 Google Drive API client setup
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: serviceAccountEmail,
    private_key: privateKey,
  },
  projectId,
  scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

/**
 * ✅ Create a Google Drive folder under the given parent folder
 * and share it only with the org email and SRO to avoid quota limits
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
  
    // 🧪 Confirm folder created in correct parent
    const folderDetails = await drive.files.get({
      fileId: folderId,
      fields: 'id, name, parents, webViewLink, owners',
    });
  
    const actualParents = folderDetails.data.parents;
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
  
    // 🔐 Only share with the org email (limit sharing to avoid quota)
    const orgEmail = allowedEmails.find(email => email !== 'srotest128@gmail.com');
    if (orgEmail) {
      await drive.permissions.create({
        fileId: folderId,
        requestBody: {
          type: 'user',
          role: 'writer',
          emailAddress: orgEmail,
        },
      });
    }
  
    // 📝 Log skipped admins
    const skipped = allowedEmails.filter(email => email !== 'srotest128@gmail.com' && email !== orgEmail);
    if (skipped.length > 0) {
      console.warn(`⚠️ Skipped sharing with admin accounts due to quota limits:`, skipped);
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
 * ✅ POST /api/org-application - Handles uploading org recognition docs and storing metadata
 */
router.post('/', upload.array('files', 6), async (req, res) => {
  try {
    const {
      org_name,
      academic_year,
      org_email,
      chairperson,
      chairperson_email,
      adviser,
      adviser_email,
      co_adviser,
      coadviser_email,
      org_type,
      submitted_by,
    } = req.body;
    const files = req.files;

    console.log("📥 Raw submitted_by from req.body:", submitted_by);
const parsedSubmitter = parseInt(submitted_by);
console.log("✅ Parsed submitted_by as integer:", parsedSubmitter);

    // 🚨 Validate required fields
    if (
      !org_name || !academic_year || !org_email ||
      !chairperson || !chairperson_email ||
      !adviser || !adviser_email ||
      !co_adviser || !coadviser_email || !org_type
    ) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    if (!files || files.length !== 6) {
      return res.status(400).json({ error: "Exactly 6 PDF files must be uploaded." });
    }

    for (const file of files) {
      if (!file.originalname.toLowerCase().endsWith('.pdf') || file.mimetype !== 'application/pdf') {
        return res.status(400).json({ error: "Only PDF files are allowed." });
      }
    }

    // 🔍 Get admin emails (SRO: 2, ODSA: 3, Superadmin: 4)
    const { data: adminAccounts, error: adminError } = await supabase
      .from('account')
      .select('email')
      .in('role_id', [2, 3, 4]);

    if (adminError) throw new Error("Failed to fetch admin emails.");

    const adminEmails = adminAccounts.map(acc => acc.email);
    const allowedEmails = [org_email, ...adminEmails];

    // 📂 Create Google Drive folder
    const folderName = `${org_name} - Recognition ${academic_year}`;
    const folder = await createDriveFolder(folderName, parentFolderId, allowedEmails);
    const folderId = folder.id;

    // 📄 Upload files to Drive
    const uploadedLinks = await Promise.all(
      files.map(file =>
        uploadToGoogleDrive(file.buffer, file.originalname, file.mimetype, folderId)
      )
    );

    const baseYear = parseInt(academic_year.split("-")[0]); // 2025
    const min = baseYear * 10;      // 20250
    const max = baseYear * 10 + 9;  // 20259
    
    const { data: existingOrgs, error: fetchError } = await supabase
      .from("org_recognition")
      .select("organization_id")
      .gte("organization_id", min)
      .lte("organization_id", max);
    
    if (fetchError) throw fetchError;

    const nextSuffix = (existingOrgs?.length || 0) + 1;
    const organization_id = baseYear * 10 + nextSuffix; // e.g., 20251
      

    // 📝 Insert record into Supabase DB
    const { error: insertError } = await supabase.from('org_recognition').insert([{
      organization_id,
      organization_type: org_type,
      academic_year,
      org_email,
      org_chairperson: chairperson,
      chairperson_email,
      org_adviser: adviser,
      adviser_email,
      org_coadviser: co_adviser,
      coadviser_email,
      submission_file_url: JSON.stringify(uploadedLinks),
      drive_folder_id: folder.webViewLink,
      submitted_at: new Date(),
      submitted_by: parseInt(submitted_by),
    }]);

    if (insertError) throw insertError;

    res.status(201).json({
      message: "Organization application submitted.",
      folder_link: folder.webViewLink,
      file_links: uploadedLinks,
    });
  } catch (error) {
    console.error("Org Application Submission Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
