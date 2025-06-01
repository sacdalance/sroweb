import express from 'express';
import { supabase } from '../supabaseClient.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import puppeteer from 'puppeteer';
import streamifier from 'streamifier';
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Google Drive setup
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GDRIVE_CLIENT_EMAIL,
    private_key: process.env.GDRIVE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  },
  projectId: process.env.GDRIVE_PROJECT_ID,
  scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

/**
 * Create a Google Drive folder under the given parent folder
 */
async function createDriveFolder(folderName, parentId) {
  console.log("📁 Creating folder:", folderName, "in parent:", parentId);

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

  // Check parent and ownership
  const folderDetails = await drive.files.get({
    fileId: folderId,
    fields: 'id, name, parents, webViewLink',
  });

  console.log("📦 Created Folder ID:", folderId);

  // Always share with srotest128@gmail.com for access
  await drive.permissions.create({
    fileId: folderId,
    requestBody: {
      type: 'user',
      role: 'writer',
      emailAddress: 'srotest128@gmail.com',
    },
  });

  return folderDetails.data;
}

/**
 * Upload a PDF buffer to Google Drive
 */
async function uploadPDFToDrive(pdfBuffer, fileName, folderId) {
  const fileMetadata = {
    name: fileName,
    parents: [folderId],
  };

  const media = {
    mimeType: 'application/pdf',
    body: streamifier.createReadStream(pdfBuffer),
  };

  const uploadRes = await drive.files.create({
    requestBody: fileMetadata,
    media,
    fields: 'id, webViewLink',
  });

  // Make the file viewable by anyone with the link
  await drive.permissions.create({
    fileId: uploadRes.data.id,
    requestBody: {
      role: 'reader',
      type: 'anyone',
    },
  });

  return uploadRes.data.webViewLink;
}

/**
 * Get the current semester and academic year for folder structure
 */
function getCurrentSemesterAndAcademicYear() {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  const year = now.getFullYear();

  // Determine semester based on month
  let semester;
  if (month >= 6 && month <= 10) {
    semester = "1st";
  } else {
    semester = "2nd";
  }

  // Determine academic year
  let academicYear;
  if (month >= 6) {
    academicYear = `${year} - ${year + 1}`;
  } else {
    academicYear = `${year - 1} - ${year}`;
  }

  return { semester, academicYear };
}

/**
 * Generate PDF from HTML template with activity data
 */
async function generateActivityApprovalPDF(activity) {
  const templatePath = path.join(__dirname, '../../../sroapp/OSASROForm1BStudentActivityApprovalSlip.html');
  let htmlTemplate = fs.readFileSync(templatePath, 'utf8');  // Replace placeholders with actual data using curly brace format
  htmlTemplate = htmlTemplate
    .replace(/{formCode}/g, activity.activity_id)
    .replace(/{orgName}/g, activity.organization?.org_name || 'N/A')
    .replace(/{student}/g, activity.account?.account_name || 'N/A')
    .replace(/{studentPosition}/g, activity.student_position || 'N/A')
    .replace(/{studentContact}/g, activity.student_contact || 'N/A')
    .replace(/{activityName}/g, activity.activity_name || 'N/A')
    .replace(/{activityDesc}/g, activity.activity_description || 'N/A')
    .replace(/{venue}/g, activity.venue || 'N/A')
    .replace(/{venueApprover}/g, activity.venue_approver || 'N/A')
    .replace(/{partneredBool}/g, activity.university_partner ? 'Yes' : 'No')
    .replace(/{universityPartner}/g, activity.partner_name || 'N/A')
    .replace(/{universityPartnerRole}/g, activity.partner_role || 'N/A')
    .replace(/{campusBool}/g, activity.is_off_campus ? 'Yes' : 'No')
    .replace(/{feesBool}/g, activity.charge_fee ? 'Yes' : 'No')
    .replace(/{greenCampusMonitor}/g, activity.green_monitor_name || 'N/A')
    .replace(/{greenCampusContact}/g, activity.green_monitor_contact || 'N/A')
    .replace(/{adviserName}/g, activity.organization?.adviser_name || 'N/A')
    .replace(/{adviserContact}/g, activity.organization?.adviser_email || 'N/A')
    .replace(/{dateApproved}/g, activity.odsa_approval_date ? 
      new Date(activity.odsa_approval_date).toLocaleDateString() : 
      new Date().toLocaleDateString())
    .replace(/{sroComments}/g, activity.sro_comments || 'None.');

  // Handle schedule data
  const schedule = activity.schedule?.[0];
  if (schedule) {
    const startDate = schedule.start_date ? new Date(schedule.start_date).toLocaleDateString() : 'N/A';
    const startTime = schedule.start_time || 'N/A';
    const endTime = schedule.end_time || 'N/A';
    
    htmlTemplate = htmlTemplate
      .replace(/{activityDate}/g, startDate)
      .replace(/{activityTime}/g, `${startTime} - ${endTime}`);
  } else {
    htmlTemplate = htmlTemplate
      .replace(/{activityDate}/g, 'N/A')
      .replace(/{activityTime}/g, 'N/A');
  }

  // Generate PDF using Puppeteer
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  await page.setContent(htmlTemplate, { waitUntil: 'networkidle0' });
  
  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: {
      top: '0.5in',
      right: '0.5in',
      bottom: '0.5in',
      left: '0.5in'
    }
  });

  await browser.close();
  return pdfBuffer;
}

/**
 * GET /test-route - Simple test route
 */
router.get('/test-route', (req, res) => {
  console.log('🎯 Test route hit!');
  res.json({ message: 'Test route works!' });
});

/**
 * POST /generate-approval-slips - Generate PDF approval slips for approved activities
 */
router.post('/generate-approval-slips', async (req, res) => {
  try {
    console.log('🎯 PDF generation endpoint hit successfully!');
    
    // Simple test response first
    return res.status(200).json({ 
      message: 'PDF generation endpoint is working!',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('PDF Generation Error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
