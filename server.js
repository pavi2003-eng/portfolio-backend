const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
app.use(express.json());
app.use(cors());

// Your Gmail credentials (app password without spaces)
const GMAIL_USER = 'paviv592003@gmail.com';
const GMAIL_APP_PASS = 'ckiqxjiqvnanitmz';   // spaces removed

// Explicit SMTP configuration (not using "service" shortcut)
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for 587
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_APP_PASS,
  },
  connectionTimeout: 5000,  // 5 seconds timeout
  greetingTimeout: 5000,
  socketTimeout: 5000,
});

// Health check
app.get('/', (req, res) => res.json({ status: 'ok' }));

// POST /send
app.post('/send', async (req, res) => {
  const { from_name, from_email, subject, message } = req.body;

  if (!from_name || !from_email || !message) {
    return res.status(400).json({ success: false, error: 'Missing fields' });
  }

  try {
    // Send email (no separate verify needed)
    await transporter.sendMail({
      from: `"Portfolio" <${GMAIL_USER}>`,
      to: GMAIL_USER,
      replyTo: from_email,
      subject: subject || 'Portfolio Contact',
      html: `<p><strong>${from_name}</strong> (${from_email}) wrote:</p><p>${message.replace(/\n/g, '<br>')}</p>`
    });
    console.log(`✅ Email sent from ${from_email}`);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Send error:', err.message);
    // Return a proper 500 with details
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Running on port ${PORT}`));
