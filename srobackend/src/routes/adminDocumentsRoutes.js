import express from 'express';
import { google } from 'googleapis';
import { authMiddleware } from '../middleware/authMiddleware.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Google Auth Setup
const auth = new google.auth.GoogleAuth({
    credentials: {
        client_email: process.env.GDRIVE_CLIENT_EMAIL,
        private_key: process.env.GDRIVE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
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

export default router;
