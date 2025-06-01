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
  const templatePath = path.join(__dirname, '../../../sroapp/activityApprovalSlipTemplate.html');
  let htmlTemplate = fs.readFileSync(templatePath, 'utf8');

  // Replace placeholders with actual data
  htmlTemplate = htmlTemplate
    .replace(/\[ORGANIZATION_NAME\]/g, activity.organization?.org_name || 'N/A')
    .replace(/\[ACTIVITY_NAME\]/g, activity.activity_name || 'N/A')
    .replace(/\[ACTIVITY_ID\]/g, activity.activity_id || 'N/A')
    .replace(/\[ACTIVITY_TYPE\]/g, activity.activity_type || 'N/A')
    .replace(/\[VENUE\]/g, activity.venue || 'N/A')
    .replace(/\[STUDENT_POSITION\]/g, activity.student_position || 'N/A')
    .replace(/\[STUDENT_CONTACT\]/g, activity.student_contact || 'N/A')
    .replace(/\[VENUE_APPROVER\]/g, activity.venue_approver || 'N/A')
    .replace(/\[VENUE_APPROVER_CONTACT\]/g, activity.venue_approver_contact || 'N/A')
    .replace(/\[GREEN_MONITOR_NAME\]/g, activity.green_monitor_name || 'N/A')
    .replace(/\[GREEN_MONITOR_CONTACT\]/g, activity.green_monitor_contact || 'N/A')
    .replace(/\[PARTNER_NAME\]/g, activity.partner_name || 'N/A')
    .replace(/\[PARTNER_ROLE\]/g, activity.partner_role || 'N/A')
    .replace(/\[GENERATION_DATE\]/g, new Date().toLocaleDateString());

  // Handle schedule data
  let scheduleRows = '';
  if (activity.schedule && activity.schedule.length > 0) {
    scheduleRows = activity.schedule.map(sched => `
      <tr>
        <td>${sched.start_date || 'N/A'}</td>
        <td>${sched.end_date || sched.start_date || 'N/A'}</td>
        <td>${sched.start_time || 'N/A'}</td>
        <td>${sched.end_time || 'N/A'}</td>
        <td>${sched.is_recurring || 'one-time'}</td>
        <td>${sched.recurring_days || 'N/A'}</td>
      </tr>
    `).join('');
  } else {
    scheduleRows = '<tr><td colspan="6">No schedule information available</td></tr>';
  }
  
  htmlTemplate = htmlTemplate.replace(/\[SCHEDULE_ROWS\]/g, scheduleRows);

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
