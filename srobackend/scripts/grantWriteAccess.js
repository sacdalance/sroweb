import { google } from 'googleapis';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const auth = new google.auth.GoogleAuth({
    credentials: {
        client_email: process.env.GDRIVE_CLIENT_EMAIL,
        private_key: process.env.GDRIVE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

const folders = [
    { name: 'Templates', id: process.env.GDRIVE_TEMPLATES_FOLDER_ID },
    { name: 'Public Forms', id: process.env.GDRIVE_PUBLIC_FORMS_FOLDER_ID }
];

async function grantAccess(email) {
    console.log(`🔐 Granting WRITE access to: ${email || 'ANYONE (Public)'}`);

    for (const folder of folders) {
        if (!folder.id) {
            console.warn(`⚠️ Skipping ${folder.name} - ID not found in .env`);
            continue;
        }

        try {
            const permission = email
                ? { role: 'writer', type: 'user', emailAddress: email }
                : { role: 'writer', type: 'anyone' };

            await drive.permissions.create({
                fileId: folder.id,
                requestBody: permission,
                fields: 'id',
            });

            console.log(`✅ Granted access to '${folder.name}' (${folder.id})`);
        } catch (error) {
            console.error(`❌ Failed to update '${folder.name}':`, error.message);
        }
    }
}

const targetEmail = process.argv[2]; // Get email from command line arg

if (!targetEmail) {
    console.log('\n⚠️  NO EMAIL PROVIDED. Making folders PUBLICLY WRITABLE.');
    console.log('To limit to a specific user, run: node scripts/grantWriteAccess.js your@email.com\n');
}

grantAccess(targetEmail);
