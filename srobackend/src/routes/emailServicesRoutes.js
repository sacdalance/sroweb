// Import required modules using ES module syntax
import express from 'express';
import { google } from 'googleapis';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Create an Express router
const router = express.Router();

// Initialize OAuth2 client with credentials from .env
const oAuth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  'https://developers.google.com/oauthplayground' // Redirect URI used for manual token generation
);

// Set the refresh token to enable token refresh capability
oAuth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });

/**
 * Sends an email using Gmail's OAuth2 and Nodemailer
 * @param {Object} param0 - Email details
 * @returns {Promise<Object>} - Result of the email send operation
 */
async function sendEmail({ to, subject, text, html }) {
  // Generate access token from the refresh token
  const accessToken = await oAuth2Client.getAccessToken();
  console.log("Access Token:", accessToken.token);

  // Create Nodemailer transporter using OAuth2 credentials
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_SENDER_EMAIL,
        pass: process.env.GMAIL_SENDER_PASSWORD, // your app password
    },
  });

  // Compose email
  const mailOptions = {
    from: `SRO System <${process.env.GMAIL_SENDER_EMAIL}>`,
    to,
    subject,
    text,
    html,
  };

  // Send email and return the result
  const result = await transporter.sendMail(mailOptions);
  return result;
}

// Define POST /send-email endpoint for frontend to trigger email
router.post('/send-email', async (req, res) => {
  const { to, subject, text, html } = req.body;

  try {
    const result = await sendEmail({ to, subject, text, html });
    res.json({ success: true, messageId: result.messageId });
  } catch (err) {
    console.error('Email send error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Export the router to be used in server.js
export default router;
