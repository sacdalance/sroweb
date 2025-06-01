// Configuration constants for the SRO application

export const GOOGLE_DRIVE_CONFIG = {
  // TODO: Replace with actual Google Drive folder ID where approval slip PDFs are stored
  // INSTRUCTIONS TO CONFIGURE:
  // 1. Create a Google Drive folder for storing approval slip PDFs
  // 2. Set the folder permissions to allow viewing by relevant users
  // 3. Open the folder in Google Drive
  // 4. Copy the folder ID from the URL (the long string after /folders/)
  //    Example URL: https://drive.google.com/drive/folders/1ABC123DEF456GHI789JKL
  //    Folder ID: 1ABC123DEF456GHI789JKL
  // 5. Replace 'your-folder-id-here' below with the actual folder ID
  // 6. Optionally, add GDRIVE_APPROVAL_SLIPS_FOLDER_ID to backend .env file for dedicated folder
  //    (otherwise it will use the general GDRIVE_FOLDER_ID)
  APPROVAL_SLIPS_FOLDER_ID: 'your-folder-id-here',
  
  // Base URL for Google Drive folders
  BASE_FOLDER_URL: 'https://drive.google.com/drive/folders/'
};

// Generate the full Google Drive folder URL
export const getApprovalSlipsFolderUrl = () => {
  return `${GOOGLE_DRIVE_CONFIG.BASE_FOLDER_URL}${GOOGLE_DRIVE_CONFIG.APPROVAL_SLIPS_FOLDER_ID}`;
};

// Other application constants can be added here
export const APP_CONFIG = {
  NAME: 'Student Records Office',
  VERSION: '1.0.0'
};
