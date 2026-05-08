// Import required modules using ES module syntax
import express from 'express';
import nodemailer from 'nodemailer';
import { verifyAdminRoles } from '../middleware/authMiddleware.js';
import { isValidEmail, sanitizeEmailField } from '../lib/sanitize.js';

// Create an Express router
const router = express.Router();

// Create transporter once at module level to reuse SMTP connections
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_SENDER_EMAIL,
    pass: process.env.GMAIL_SENDER_PASSWORD,
  },
});

/**
 * Sends an email using Gmail app password and Nodemailer
 * @param {Object} param0 - Email details
 * @returns {Promise<Object>} - Result of the email send operation
 */
async function sendEmail({ to, subject, text, html }) {
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

// Define POST /send-email endpoint - requires admin auth

router.post('/send-email', verifyAdminRoles, async (req, res) => {
  const { to, subject, text, html } = req.body;

  // Validate recipient email
  if (!to || !isValidEmail(to)) {
    return res.status(400).json({ success: false, error: 'Invalid recipient email' });
  }
  if (!subject) {
    return res.status(400).json({ success: false, error: 'Subject is required' });
  }

  try {
    const result = await sendEmail({
      to: sanitizeEmailField(to),
      subject: sanitizeEmailField(subject),
      text,
      html,
    });
    res.json({ success: true, messageId: result.messageId });
  } catch (err) {
    console.error('Email send error:', err);
    res.status(500).json({ success: false, error: 'Failed to send email' });
  }
});

// Export the router to be used in server.js
export default router;
