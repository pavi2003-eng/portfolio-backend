require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();

app.use(express.json());

app.use(cors({
  origin: [
    'https://pavi2003-eng.github.io'
  ]
}));

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASS
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
    const { from_name, from_email, subject, message } = req.body;

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: process.env.GMAIL_USER,
      replyTo: from_email,
      subject: `[Portfolio] ${subject || 'New Contact'}`,
      html: `
        <h2>New Portfolio Contact</h2>

        <p><b>Name:</b> ${from_name}</p>
        <p><b>Email:</b> ${from_email}</p>
        <p><b>Subject:</b> ${subject}</p>

        <hr>

        <p>${message}</p>
      `
    });

    res.json({
      success: true,
      message: 'Email sent successfully'
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message
    });

  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
