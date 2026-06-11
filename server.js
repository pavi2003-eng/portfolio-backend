require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
app.use(express.json());
app.use(cors());

// Read from environment variables
const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASS = process.env.GMAIL_APP_PASS;

if (!GMAIL_USER || !GMAIL_APP_PASS) {
  console.error('❌ Missing GMAIL_USER or GMAIL_APP_PASS in environment');
  process.exit(1);
}

// Explicit SMTP configuration for reliability
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // STARTTLS
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_APP_PASS,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
});

// Health check
app.get('/', (req, res) => res.json({ status: 'ok' }));

// POST /send
app.post('/send', async (req, res) => {
  const { from_name, from_email, subject, message } = req.body;

  if (!from_name || !from_email || !message) {
    return res.status(400).json({ success: false, error: 'Missing fields' });
  }

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(from_email)) {
    return res.status(400).json({ success: false, error: 'Invalid email address' });
  }

  try {
    await transporter.sendMail({
      from: `"Portfolio Contact" <${GMAIL_USER}>`,
      to: GMAIL_USER,
      replyTo: from_email,
      subject: subject ? `[Portfolio] ${subject}` : '[Portfolio] New message',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>New message from your portfolio</h2>
          <p><strong>Name:</strong> ${escapeHtml(from_name)}</p>
          <p><strong>Email:</strong> <a href="mailto:${escapeHtml(from_email)}">${escapeHtml(from_email)}</a></p>
          <p><strong>Subject:</strong> ${escapeHtml(subject || '—')}</p>
          <hr/>
          <p><strong>Message:</strong></p>
          <p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
        </div>
      `,
    });
    console.log(`✅ Email sent from ${from_email}`);
    res.json({ success: true, message: 'Email sent successfully' });
  } catch (err) {
    console.error('❌ Send error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

function escapeHtml(str = '') {
  return String(str).replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
