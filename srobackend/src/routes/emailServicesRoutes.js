const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const nodemailer = require('nodemailer');
require('dotenv').config();

// OAuth2 setup using your naming convention
const oAuth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  'https://developers.google.com/oauthplayground'
);

oAuth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });

async function sendEmail({ to, subject, text, html }) {
  const accessToken = await oAuth2Client.getAccessToken();

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: process.env.GMAIL_SENDER_EMAIL,
      clientId: process.env.GMAIL_CLIENT_ID,
      clientSecret: process.env.GMAIL_CLIENT_SECRET,
      refreshToken: process.env.GMAIL_REFRESH_TOKEN,
      accessToken: accessToken.token,
    },
  });

  const mailOptions = {
    from: `SRO System <${process.env.GMAIL_SENDER_EMAIL}>`,
    to,
    subject,
    text,
    html,
  };

  const result = await transporter.sendMail(mailOptions);
  return result;
}

// Express route handler
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

module.exports = router;
