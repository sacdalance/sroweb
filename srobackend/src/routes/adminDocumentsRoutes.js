import express from 'express';
import { google } from 'googleapis';
import { authMiddleware, verifyAdminRoles } from '../middleware/authMiddleware.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Google Auth Setup
const auth = new google.auth.GoogleAuth({
    credentials: {
        client_email: process.env.GDRIVE_CLIENT_EMAIL,
        private_key: process.env.GDRIVE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

/**
 * GET /forms
 * Lists all PDFs in the "Public Forms" folder
 */
router.get('/forms', async (req, res) => {
    try {
        const folderId = process.env.GDRIVE_PUBLIC_FORMS_FOLDER_ID;
        if (!folderId) {
            return res.status(500).json({ error: 'Public Forms Folder ID not configured' });
        }

        // Query: Inside folder, not trashed
        const q = `'${folderId}' in parents and trashed=false`;

        const response = await drive.files.list({
            q,
            fields: 'files(id, name, webViewLink, iconLink, thumbnailLink, mimeType)',
            orderBy: 'name',
        });

        const files = response.data.files || [];

        res.json({
            folderId,
            files: files.map(f => ({
                id: f.id,
                name: f.name,
                link: f.webViewLink,
                icon: f.iconLink,
                thumbnail: f.thumbnailLink,
                type: f.mimeType
            }))
        });

    } catch (error) {
        console.error('Error fetching forms:', error);
        res.status(500).json({ error: 'Failed to fetch forms from Drive' });
    }
});

/**
 * GET /templates/check
 * Checks if Master Template exists
 */
router.get('/templates/check', authMiddleware, async (req, res) => {
    try {
        const folderId = process.env.GDRIVE_TEMPLATES_FOLDER_ID;
        if (!folderId) return res.status(500).json({ error: 'Templates Folder ID not configured' });

        // Look for 'Form_1B' OR 'MASTER_APPROVAL_SLIP'
        const q = `'${folderId}' in parents and (name contains 'Form_1B' or name contains 'MASTER_APPROVAL_SLIP') and trashed=false`;

        const response = await drive.files.list({
            q,
            fields: 'files(id, name, webViewLink, mimeType)',
            orderBy: 'modifiedTime desc'
        });

        if (response.data.files.length > 0) {
            const file = response.data.files[0];
            const isGoogleDoc = file.mimeType === 'application/vnd.google-apps.document';

            res.json({
                exists: true,
                valid: isGoogleDoc,
                template: file,
                folderId,
                message: isGoogleDoc ? 'Ready' : 'Incorrect format (Word Doc)'
            });
        } else {
            res.json({ exists: false, folderId });
        }

    } catch (error) {
        console.error('Template check error:', error);
        res.status(500).json({ error: 'Failed to check template' });
    }
});


/**
 * GET /templates/preview-html
 * Exports the Master Template as HTML for frontend preview
 */
router.get('/templates/preview-html', authMiddleware, async (req, res) => {
    try {
        const folderId = process.env.GDRIVE_TEMPLATES_FOLDER_ID;
        if (!folderId) return res.status(500).json({ error: 'Templates Folder ID not configured' });

        // Look for Master Template
        const q = `'${folderId}' in parents and (name contains 'Form_1B' or name contains 'MASTER_APPROVAL_SLIP') and mimeType='application/vnd.google-apps.document' and trashed=false`;

        const listRes = await drive.files.list({
            q,
            fields: 'files(id, name)',
            orderBy: 'modifiedTime desc'
        });

        if (listRes.data.files.length === 0) {
            return res.status(404).json({ error: 'Template not found' });
        }

        const templateId = listRes.data.files[0].id;

        // Export as HTML
        const exportRes = await drive.files.export({
            fileId: templateId,
            mimeType: 'text/html',
        });

        res.send(exportRes.data);

    } catch (error) {
        console.error('HTML Preview error:', error);
        res.status(500).json({ error: 'Failed to generate preview' });
    }
});

/**
 * GET /permissions
 * Lists usage permissions for the Public Forms folder
 */
router.get('/permissions', verifyAdminRoles, async (req, res) => {
    try {
        const folderId = process.env.GDRIVE_PUBLIC_FORMS_FOLDER_ID;
        if (!folderId) return res.status(500).json({ error: 'Folder ID not configured' });

        const response = await drive.permissions.list({
            fileId: folderId,
            fields: 'permissions(id, type, role, emailAddress, displayName, photoLink)',
        });

        // Filter out the service account or non-user permissions if needed, 
        // but showing all helps debugging.
        // We typically want to show 'writers' who are 'users'.
        res.json({ permissions: response.data.permissions });

    } catch (error) {
        console.error('Error fetching permissions:', error);
        res.status(500).json({ error: 'Failed to fetch permissions' });
    }
});

/**
 * POST /permissions
 * Adds a new 'writer' (editor) to the folder
 */
router.post('/permissions', verifyAdminRoles, async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    try {
        const folderId = process.env.GDRIVE_PUBLIC_FORMS_FOLDER_ID;
        if (!folderId) return res.status(500).json({ error: 'Folder ID not configured' });

        const response = await drive.permissions.create({
            fileId: folderId,
            requestBody: {
                role: 'writer',
                type: 'user',
                emailAddress: email,
            },
            fields: 'id, type, role, emailAddress, displayName',
            sendNotificationEmail: false, // Service accounts cannot send email notifications
        });

        res.json({ success: true, permission: response.data });

    } catch (error) {
        console.error('Error adding permission:', error);
        // Log detailed error from Google API if available
        if (error.response) {
            console.error('Google Drive API Error Details:', JSON.stringify(error.response.data, null, 2));
        }

        const errorMessage = error.response?.data?.error?.message || error.message || 'Failed to add permission';
        res.status(500).json({ error: errorMessage, details: error.response?.data });
    }
});

/**
 * DELETE /permissions/:permissionId
 * Removes a permission
 */
router.delete('/permissions/:permissionId', verifyAdminRoles, async (req, res) => {
    const { permissionId } = req.params;

    try {
        const folderId = process.env.GDRIVE_PUBLIC_FORMS_FOLDER_ID;
        if (!folderId) return res.status(500).json({ error: 'Folder ID not configured' });

        await drive.permissions.delete({
            fileId: folderId,
            permissionId: permissionId,
        });

        res.json({ success: true });

    } catch (error) {
        console.error('Error removing permission:', error);
        res.status(500).json({ error: 'Failed to remove permission' });
    }
});

export default router;
