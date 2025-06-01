import express from 'express';
import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { supabase } from '../supabaseClient.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { google } from 'googleapis';
import streamifier from 'streamifier';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Google Drive setup
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GDRIVE_CLIENT_EMAIL,
    private_key: process.env.GDRIVE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  projectId: process.env.GDRIVE_PROJECT_ID,
  scopes: [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/drive'
  ],
});

const drive = google.drive({ version: 'v3', auth });

console.log('🔧 Google Drive setup complete with:');
console.log('📧 Client email:', process.env.GDRIVE_CLIENT_EMAIL);
console.log('🆔 Project ID:', process.env.GDRIVE_PROJECT_ID);
console.log('📁 Approval slips folder ID:', process.env.GDRIVE_APPROVAL_SLIPS_FOLDER_ID);

// Google Drive upload function
async function uploadPDFToGoogleDrive(pdfBuffer, fileName) {
  try {
    const folderId = process.env.GDRIVE_APPROVAL_SLIPS_FOLDER_ID;
    console.log('📁 Using Google Drive folder ID:', folderId);
    
    if (!folderId) {
      throw new Error('Google Drive approval slips folder ID not configured');
    }
    
    const fileMetadata = {
      name: fileName,
      parents: [folderId],
    };

    console.log('📤 Uploading file:', fileName, 'to folder:', folderId);

    const media = {
      mimeType: 'application/pdf',
      body: streamifier.createReadStream(pdfBuffer),
    };

    const uploadRes = await drive.files.create({
      requestBody: fileMetadata,
      media,
      fields: 'id',
    });

    console.log('✅ File uploaded with ID:', uploadRes.data.id);    // Set file permissions to be viewable by anyone with the link
    await drive.permissions.create({
      fileId: uploadRes.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    console.log('🔓 File permissions set to public');

    // Share file with srotest128@gmail.com as writer (doesn't require consent)
    try {
      await drive.permissions.create({
        fileId: uploadRes.data.id,
        requestBody: {
          role: 'writer',
          type: 'user',
          emailAddress: 'srotest128@gmail.com',
        },
      });
      console.log('👤 File shared with srotest128@gmail.com as writer');
    } catch (shareError) {
      console.warn('⚠️ Could not share file with srotest128@gmail.com:', shareError.message);
      // This is not critical, continue
    }

    const file = await drive.files.get({
      fileId: uploadRes.data.id,
      fields: 'webViewLink',
    });

    console.log('🔗 File view link:', file.data.webViewLink);

    return {
      fileId: uploadRes.data.id,
      webViewLink: file.data.webViewLink,
    };
  } catch (error) {
    console.error('Google Drive upload error:', error);
    throw new Error(`Failed to upload PDF to Google Drive: ${error.message}`);
  }
}

/**
 * GET /test-route - Simple test route
 */
router.get('/test-route', (req, res) => {
  console.log('🎯 Test route hit!');
  res.json({ message: 'Test route works!' });
});

/**
 * GET /debug-routes - Debug route to check if routes are working
 */
router.get('/debug-routes', (req, res) => {
  console.log('🐛 Debug route hit - routes are working!');
  res.json({ 
    message: 'Routes are working!',
    availableRoutes: [
      'GET /test-route',
      'GET /approval-slips-folder-url',
      'POST /generate-approval-slips'
    ]
  });
});

/**
 * GET /approval-slips-folder-url - Get Google Drive folder URL for approval slips
 */
router.get('/approval-slips-folder-url', (req, res) => {
  try {
    console.log('📁 Folder URL route hit!');
    const folderId = process.env.GDRIVE_APPROVAL_SLIPS_FOLDER_ID;
    console.log('📁 Using folder ID from env:', folderId);
    
    if (!folderId) {
      console.log('❌ No folder ID configured');
      return res.status(500).json({ 
        error: 'Google Drive folder not configured' 
      });
    }
    
    const folderUrl = `https://drive.google.com/drive/folders/${folderId}`;
    console.log('🔗 Generated folder URL:', folderUrl);
    
    res.json({ 
      folderUrl,
      folderId 
    });
  } catch (error) {
    console.error('Error getting folder URL:', error);
    res.status(500).json({ error: 'Failed to get folder URL' });
  }
});

/**
 * POST /generate-approval-slips - Generate PDF approval slips for approved activities
 */
router.post('/generate-approval-slips', authMiddleware, async (req, res) => {
  try {
    console.log('🎯 Starting PDF generation for approved activities...');
    
    // Fetch all approved activities from Supabase
    const { data: approvedActivities, error: fetchError } = await supabase
      .from('activity')
      .select(`
        *,
        account:account(account_name, email),
        organization:organization(org_name),
        schedule:activity_schedule(*)
      `)
      .eq('final_status', 'Approved');

    if (fetchError) {
      console.error('Error fetching approved activities:', fetchError);
      throw new Error(`Failed to fetch activities: ${fetchError.message}`);
    }

    if (!approvedActivities || approvedActivities.length === 0) {
      return res.status(200).json({
        message: 'No approved activities found to generate PDFs for',
        pdfCount: 0
      });
    }

    console.log(`Found ${approvedActivities.length} approved activities to process`);

    // Read the HTML template
    const templatePath = path.join(__dirname, '../../../sroapp/activityApprovalSlipTemplate.html');
    let htmlTemplate;
    
    try {
      htmlTemplate = await fs.readFile(templatePath, 'utf-8');
    } catch (templateError) {
      console.error('Error reading template:', templateError);
      throw new Error('Could not read PDF template file');
    }

    // Launch Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    let pdfCount = 0;
    const errors = [];

    // Process each approved activity
    for (const activity of approvedActivities) {
      try {
        console.log(`Processing activity ID: ${activity.activity_id}`);

        // Replace placeholders in template
        let processedHtml = htmlTemplate
          .replace(/\[ORGANIZATION_NAME\]/g, activity.organization?.org_name || 'N/A')
          .replace(/\[ACTIVITY_NAME\]/g, activity.activity_name || 'N/A')
          .replace(/\[ACTIVITY_ID\]/g, activity.activity_id || 'N/A')
          .replace(/\[STUDENT_NAME\]/g, activity.account?.account_name || 'N/A')
          .replace(/\[STUDENT_POSITION\]/g, activity.student_position || 'N/A')
          .replace(/\[STUDENT_CONTACT\]/g, activity.student_contact || 'N/A')
          .replace(/\[ACTIVITY_DESCRIPTION\]/g, activity.activity_description || 'N/A')
          .replace(/\[ACTIVITY_TYPE\]/g, activity.activity_type || 'N/A')
          .replace(/\[VENUE\]/g, activity.venue || 'N/A')
          .replace(/\[VENUE_APPROVER\]/g, activity.venue_approver || 'N/A')
          .replace(/\[GREEN_MONITOR_NAME\]/g, activity.green_campus_monitor || 'N/A')
          .replace(/\[ADVISER_NAME\]/g, activity.adviser || 'N/A')
          .replace(/\[PARTNER_ORGANIZATIONS\]/g, activity.partner_name || 'N/A')
          .replace(/\[APPROVAL_DATE\]/g, activity.odsa_approval_date ? 
            new Date(activity.odsa_approval_date).toLocaleDateString() : 
            new Date().toLocaleDateString())
          .replace(/\[GENERATION_DATE\]/g, new Date().toLocaleDateString());

        // Handle schedule information
        const schedule = activity.schedule?.[0];
        if (schedule) {
          processedHtml = processedHtml
            .replace(/\[SCHEDULE_DATE\]/g, schedule.start_date ? 
              new Date(schedule.start_date).toLocaleDateString() : 'N/A')
            .replace(/\[START_TIME\]/g, schedule.start_time || 'N/A')
            .replace(/\[END_TIME\]/g, schedule.end_time || 'N/A')
            .replace(/\[RECURRING_DAYS\]/g, schedule.recurring_days || 'N/A');
        } else {
          processedHtml = processedHtml
            .replace(/\[SCHEDULE_DATE\]/g, 'N/A')
            .replace(/\[START_TIME\]/g, 'N/A')
            .replace(/\[END_TIME\]/g, 'N/A')
            .replace(/\[RECURRING_DAYS\]/g, 'N/A');
        }        // Create new page for each PDF
        const page = await browser.newPage();
        await page.setContent(processedHtml, { waitUntil: 'networkidle0' });

        // Generate PDF
        const pdfBuffer = await page.pdf({
          format: 'A4',
          printBackground: true,
          margin: {
            top: '20mm',
            right: '20mm',
            bottom: '20mm',
            left: '20mm'
          }
        });

        await page.close();

        // Upload PDF to Google Drive
        const fileName = `approval_slip_${activity.organization?.org_name || 'Unknown'}_${activity.activity_name || 'Activity'}_${activity.activity_id}.pdf`;
        const uploadResult = await uploadPDFToGoogleDrive(pdfBuffer, fileName);
        
        pdfCount++;
        
        console.log(`✅ Generated and uploaded PDF for activity ${activity.activity_id} to Google Drive: ${uploadResult.webViewLink}`);

      } catch (activityError) {
        console.error(`Error processing activity ${activity.activity_id}:`, activityError);
        errors.push({
          activityId: activity.activity_id,
          error: activityError.message
        });
      }
    }

    await browser.close();

    console.log(`🎉 PDF generation completed. Generated ${pdfCount} PDFs`);
    
    if (errors.length > 0) {
      console.warn('Some activities had errors:', errors);
    }

    return res.status(200).json({
      message: `Successfully generated ${pdfCount} approval slip PDFs`,
      pdfCount,
      totalActivities: approvedActivities.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('PDF Generation Error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to generate approval slips',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

export default router;
