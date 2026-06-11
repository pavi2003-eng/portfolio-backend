require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();

app.use(express.json());
app.use(cors());

// ---------- Your Gmail credentials (hardcoded for quick fix) ----------
const GMAIL_USER = 'paviv592003@gmail.com';
const GMAIL_APP_PASS = 'ckiq xjiq vnan itmz';   // remove spaces: ckiqxjiqvnanitmz

// Remove spaces from the app password (just in case)
const cleanPass = GMAIL_APP_PASS.replace(/\s/g, '');

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: GMAIL_USER,
    pass: cleanPass,
  },
});

// Verify connection at startup
transporter.verify((error) => {
  if (error) {
    console.error('❌ Transporter error:', error.message);
  } else {
    console.log('✅ Ready to send emails via Gmail');
  }
});

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Contact API with Gmail SMTP' });
});

// ---------- POST /send ----------
app.post('/send', async (req, res) => {
  const { from_name, from_email, subject, message } = req.body;

  // Validation
  if (!from_name || !from_email || !message) {
    return res.status(400).json({ success: false, error: 'Missing fields' });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(from_email)) {
    return res.status(400).json({ success: false, error: 'Invalid email' });
  }

  try {
    await transporter.sendMail({
      from: `"Portfolio Contact" <${GMAIL_USER}>`,
      to: GMAIL_USER,                         // sends to your own Gmail
      replyTo: from_email,
      subject: subject ? `[Portfolio] ${subject}` : '[Portfolio] New Contact Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f9f9f9; border-radius: 8px;">
          <h2 style="color: #6366f1;">📬 New Portfolio Message</h2>
          <hr />
          <p><strong>Name:</strong> ${escapeHtml(from_name)}</p>
          <p><strong>Email:</strong> <a href="mailto:${escapeHtml(from_email)}">${escapeHtml(from_email)}</a></p>
          <p><strong>Subject:</strong> ${escapeHtml(subject || '—')}</p>
          <hr />
          <h3>Message</h3>
          <div style="background: #fff; padding: 16px; border-left: 4px solid #6366f1;">
            ${escapeHtml(message).replace(/\n/g, '<br/>')}
          </div>
          <p style="font-size: 12px; color: #666;">Sent from your portfolio contact form.</p>
        </div>
      `,
    });

    console.log(`✅ Email sent from ${from_email}`);
    return res.json({ success: true, message: 'Email sent' });
  } catch (err) {
    console.error('❌ Send error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
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
app.listen(PORT, () => console.log(`🚀 API running on port ${PORT}`));
