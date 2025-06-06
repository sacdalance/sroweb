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
      'GET /pdf-status',
      'POST /reset-pdf-status',
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
 * POST /reset-pdf-status - Reset PDF generation status for all or specific activities (for testing)
 */
router.post('/reset-pdf-status', authMiddleware, async (req, res) => {
  try {
    const { activity_ids } = req.body; // Optional array of specific activity IDs to reset
    
    console.log('🔄 Resetting PDF generation status...');
    
    let query = supabase
      .from('activity')
      .update({
        pdf_generated: false,
        pdf_generated_at: null
      });

    // If specific activity IDs provided, only reset those
    if (activity_ids && Array.isArray(activity_ids) && activity_ids.length > 0) {
      query = query.in('activity_id', activity_ids);
      console.log('🎯 Resetting specific activities:', activity_ids);
    } else {
      // Reset all approved activities
      query = query.eq('final_status', 'Approved');
      console.log('🔄 Resetting all approved activities');
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error resetting PDF status:', error);
      throw new Error(`Failed to reset PDF status: ${error.message}`);
    }

    const message = activity_ids && activity_ids.length > 0 
      ? `Reset PDF status for ${activity_ids.length} specific activities`
      : 'Reset PDF status for all approved activities';

    console.log(`✅ ${message}`);

    return res.status(200).json({
      message,
      reset_count: activity_ids ? activity_ids.length : 'all approved activities'
    });

  } catch (error) {
    console.error('Error resetting PDF status:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to reset PDF status',
    });
  }
});

/**
 * GET /pdf-status - Check PDF generation status for all approved activities
 */
router.get('/pdf-status', authMiddleware, async (req, res) => {
  try {
    console.log('📊 Checking PDF generation status...');
    
    // Fetch all approved activities with their PDF status
    const { data: activities, error: fetchError } = await supabase
      .from('activity')
      .select(`
        activity_id,
        activity_name,
        final_status,
        pdf_generated,
        pdf_generated_at,
        organization:organization(org_name)
      `)
      .eq('final_status', 'Approved')
      .order('pdf_generated_at', { ascending: false, nullsFirst: false });

    if (fetchError) {
      console.error('Error fetching activities:', fetchError);
      throw new Error(`Failed to fetch activities: ${fetchError.message}`);
    }

    const pdfGenerated = activities.filter(a => a.pdf_generated === true);
    const pdfNotGenerated = activities.filter(a => a.pdf_generated !== true);

    return res.status(200).json({
      total: activities.length,
      pdfGenerated: pdfGenerated.length,
      pdfNotGenerated: pdfNotGenerated.length,
      activities: activities.map(activity => ({
        activity_id: activity.activity_id,
        activity_name: activity.activity_name,
        organization: activity.organization?.org_name,
        pdf_generated: activity.pdf_generated || false,
        pdf_generated_at: activity.pdf_generated_at,
      }))
    });

  } catch (error) {
    console.error('Error checking PDF status:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to check PDF status',
    });
  }
});

/**
 * POST /generate-approval-slips - Generate PDF approval slips for approved activities
 */
router.post('/generate-approval-slips', authMiddleware, async (req, res) => {
  try {
    console.log('🎯 Starting PDF generation for approved activities...');
      // Fetch all approved activities that haven't had PDFs generated yet
    const { data: approvedActivities, error: fetchError } = await supabase
      .from('activity')
      .select(`
        *,
        account:account(account_name, email),
        organization:organization(org_name),
        schedule:activity_schedule(*)
      `)
      .eq('final_status', 'Approved')
      .or('pdf_generated.is.null,pdf_generated.eq.false');

    if (fetchError) {
      console.error('Error fetching approved activities:', fetchError);
      throw new Error(`Failed to fetch activities: ${fetchError.message}`);
    }    if (!approvedActivities || approvedActivities.length === 0) {
      return res.status(200).json({
        message: 'No approved activities found that need PDF generation',
        pdfCount: 0
      });
    }    console.log(`Found ${approvedActivities.length} approved activities that need PDF generation`);    // Read the HTML template
    const templatePath = path.join(__dirname, '../../../sroapp/OSASROForm1BStudentActivityApprovalSlip.html');
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
        console.log(`Processing activity ID: ${activity.activity_id}`);        // Replace placeholders in template with curly brace format
        let processedHtml = htmlTemplate
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

        // Handle schedule information
        const schedule = activity.schedule?.[0];
        if (schedule) {
          const startDate = schedule.start_date ? new Date(schedule.start_date).toLocaleDateString() : 'N/A';
          const startTime = schedule.start_time || 'N/A';
          const endTime = schedule.end_time || 'N/A';
          
          processedHtml = processedHtml
            .replace(/{activityDate}/g, startDate)
            .replace(/{activityTime}/g, `${startTime} - ${endTime}`);
        } else {
          processedHtml = processedHtml
            .replace(/{activityDate}/g, 'N/A')
            .replace(/{activityTime}/g, 'N/A');
        }// Create new page for each PDF
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

        await page.close();        // Upload PDF to Google Drive
        const fileName = `approval_slip_${activity.organization?.org_name || 'Unknown'}_${activity.activity_name || 'Activity'}_${activity.activity_id}.pdf`;
        const uploadResult = await uploadPDFToGoogleDrive(pdfBuffer, fileName);
        
        // Update database to mark PDF as generated
        const { error: updateError } = await supabase
          .from('activity')
          .update({
            pdf_generated: true,
            pdf_generated_at: new Date().toISOString()
          })
          .eq('activity_id', activity.activity_id);

        if (updateError) {
          console.error(`Error updating PDF status for activity ${activity.activity_id}:`, updateError);
          throw new Error(`Failed to update PDF status: ${updateError.message}`);
        }
        
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
