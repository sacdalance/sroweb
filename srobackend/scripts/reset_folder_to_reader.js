import { google } from 'googleapis';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const FOLDER_ID = '1dyaa-Ojxw9gn96ksLKwP0VuJuxt3Zbw3';

async function resetToViewOnly() {
    console.log(`🔒 Resetting permissions for folder: ${FOLDER_ID}...`);

    try {
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GDRIVE_CLIENT_EMAIL,
                private_key: process.env.GDRIVE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            },
            scopes: ['https://www.googleapis.com/auth/drive'],
        });

        const drive = google.drive({ version: 'v3', auth });

        // 1. List current permissions
        const res = await drive.permissions.list({
            fileId: FOLDER_ID,
            fields: 'permissions(id, type, role)',
        });

        const permissions = res.data.permissions;
        console.log('Current Permissions:', permissions);

        // 2. Find the 'anyoneWithLink' or 'anyone' permission
        const anyonePerm = permissions.find(p => p.type === 'anyone');

        if (anyonePerm) {
            console.log(`Found public permission: ${anyonePerm.id} (${anyonePerm.role})`);

            if (anyonePerm.role === 'writer' || anyonePerm.role === 'editor') {
                console.log('Downgrading to "reader"...');
                await drive.permissions.update({
                    fileId: FOLDER_ID,
                    permissionId: anyonePerm.id,
                    requestBody: {
                        role: 'reader',
                    },
                });
                console.log('✅ Successfully updated public access to "View Only" (reader).');
            } else if (anyonePerm.role === 'reader') {
                console.log('ℹ️ Folder is already "View Only" for public.');
            } else {
                console.log(`ℹ️ Unknown role "${anyonePerm.role}". Setting to reader.`);
                await drive.permissions.update({
                    fileId: FOLDER_ID,
                    permissionId: anyonePerm.id,
                    requestBody: {
                        role: 'reader',
                    },
                });
                console.log('✅ Updated to reader.');
            }
        } else {
            console.log('⚠️ No "anyone" permission found. Creating it...');
            await drive.permissions.create({
                fileId: FOLDER_ID,
                requestBody: {
                    role: 'reader',
                    type: 'anyone',
                },
            });
            console.log('✅ Created public "View Only" permission.');
        }

    } catch (error) {
        console.error('❌ Error resetting permissions:', error);
    }
}

resetToViewOnly();
