// ─────────────────────────────────────────────────────────────────────────────
// Portfolio Contact API – Send emails via Gmail SMTP
// ─────────────────────────────────────────────────────────────────────────────

require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();

// ---------- Middleware ----------
app.use(express.json());

// CORS: allow only your GitHub Pages domain (change if needed)
const allowedOrigin = process.env.ALLOWED_ORIGIN || 'https://pavi2003-eng.github.io';
app.use(cors());            // allows all origins by default

// ---------- Validate environment variables ----------
const requiredEnv = ['GMAIL_USER', 'GMAIL_APP_PASS'];
for (const env of requiredEnv) {
  if (!process.env[env]) {
    console.error(`❌ Missing environment variable: ${env}`);
    process.exit(1);
  }
}

// ---------- Gmail transporter ----------
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASS,
  },
});

// Verify connection on startup
transporter.verify((err) => {
  if (err) {
    console.error('❌ Email transporter error:', err.message);
  } else {
    console.log('✅ Email transporter ready');
  }
});

// ---------- Health check ----------
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Contact API is running' });
});

// ---------- POST /send – receive contact form ----------
app.post('/send', async (req, res) => {
  const { from_name, from_email, subject, message } = req.body;

  // Basic validation
  if (!from_name || !from_email || !message) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: from_name, from_email, message',
    });
  }

  // Email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(from_email)) {
    return res.status(400).json({ success: false, error: 'Invalid email address' });
  }

  try {
    await transporter.sendMail({
      from: `"Portfolio Contact" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER,               // sends to your Gmail
      replyTo: from_email,                      // reply goes to the visitor
      subject: subject ? `[Portfolio] ${subject}` : '[Portfolio] New Contact Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f9f9f9; border-radius: 8px;">
          <h2 style="color: #6366f1; margin-bottom: 4px;">📬 New Portfolio Message</h2>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;" />
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151; width: 90px;">Name</td>
              <td style="padding: 8px 0; color: #111827;">${escapeHtml(from_name)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151;">Email</td>
              <td style="padding: 8px 0;">
                <a href="mailto:${escapeHtml(from_email)}" style="color: #6366f1;">${escapeHtml(from_email)}</a>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151;">Subject</td>
              <td style="padding: 8px 0; color: #111827;">${escapeHtml(subject || '—')}</td>
            </tr>
           </table>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;" />
          <h3 style="color: #374151; margin-bottom: 8px;">Message</h3>
          <div style="background: #ffffff; padding: 16px; border-radius: 6px; border-left: 4px solid #6366f1; color: #1f2937; line-height: 1.7;">
            ${escapeHtml(message).replace(/\n/g, '<br/>')}
          </div>
          <p style="margin-top: 24px; font-size: 12px; color: #9ca3af;">
            Sent via your portfolio contact form. Reply directly to this email to respond to ${escapeHtml(from_name)}.
          </p>
        </div>
      `,
    });

    console.log(`✅ Email sent from ${from_email} (${from_name})`);
    return res.json({ success: true, message: 'Email sent successfully' });
  } catch (err) {
    console.error('❌ Failed to send email:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to send email. Please try again later.',
    });
  }
});

// ---------- Helper: escape HTML to prevent injection ----------
function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ---------- Start server ----------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Contact API running on port ${PORT}`);
});
