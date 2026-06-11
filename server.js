require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Resend } = require('resend');

const app = express();

app.use(express.json());
app.use(cors());

// ---------- Validate environment ----------
if (!process.env.RESEND_API_KEY) {
  console.error('❌ Missing RESEND_API_KEY environment variable');
  process.exit(1);
}

const resend = new Resend(process.env.RESEND_API_KEY);

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Contact API is running (Resend)' });
});

// ---------- POST /send ----------
app.post('/send', async (req, res) => {
  const { from_name, from_email, subject, message } = req.body;

  if (!from_name || !from_email || !message) {
    return res.status(400).json({ success: false, error: 'Missing fields' });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(from_email)) {
    return res.status(400).json({ success: false, error: 'Invalid email' });
  }

  try {
    await resend.emails.send({
      from: 'Portfolio Contact <onboarding@resend.dev>', // Must be verified in Resend
      to: 'paviv592003@gmail.com',
      reply_to: from_email,
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

    console.log(`✅ Email sent via Resend from ${from_email}`);
    return res.json({ success: true, message: 'Email sent' });
  } catch (err) {
    console.error('❌ Resend error:', err.message);
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
