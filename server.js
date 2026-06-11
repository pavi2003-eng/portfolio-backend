require('dotenv').config();

const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();

app.use(express.json());

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST']
}));

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASS = process.env.GMAIL_APP_PASS;

if (!GMAIL_USER || !GMAIL_APP_PASS) {
  console.error('❌ Missing GMAIL_USER or GMAIL_APP_PASS');
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_APP_PASS
  }
});

transporter.verify((err, success) => {
  if (err) {
    console.error('❌ SMTP Error:', err);
  } else {
    console.log('✅ SMTP Ready');
  }
});

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Portfolio Contact API Running'
  });
});

app.post('/send', async (req, res) => {
  try {

    const {
      from_name,
      from_email,
      subject,
      message
    } = req.body;

    if (!from_name || !from_email || !message) {
      return res.status(400).json({
        success: false,
        error: 'Required fields missing'
      });
    }

    const mailOptions = {
      from: `"Portfolio Contact" <${GMAIL_USER}>`,
      to: GMAIL_USER,
      replyTo: from_email,
      subject: subject
        ? `[Portfolio] ${subject}`
        : '[Portfolio] New Contact Request',

      html: `
        <div style="font-family:Arial;padding:20px">

          <h2>📩 New Portfolio Message</h2>

          <p>
            <strong>Name:</strong>
            ${escapeHtml(from_name)}
          </p>

          <p>
            <strong>Email:</strong>
            <a href="mailto:${escapeHtml(from_email)}">
              ${escapeHtml(from_email)}
            </a>
          </p>

          <p>
            <strong>Subject:</strong>
            ${escapeHtml(subject || '-')}
          </p>

          <hr>

          <h3>Message</h3>

          <div style="
            padding:15px;
            background:#f5f5f5;
            border-radius:8px;
          ">
            ${escapeHtml(message).replace(/\n/g, '<br>')}
          </div>

        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    console.log(`✅ Mail Sent From ${from_email}`);

    res.json({
      success: true,
      message: 'Email sent successfully'
    });

  } catch (err) {

    console.error('❌ FULL ERROR =>', err);

    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server Running On Port ${PORT}`);
});
