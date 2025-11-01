const nodemailer = require('nodemailer');
const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM } = process.env;

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: parseInt(SMTP_PORT || 587, 10),
  secure: SMTP_PORT == 465,
  auth: { user: SMTP_USER, pass: SMTP_PASS },
  tls: { rejectUnauthorized: false }
});

async function sendEmail(to, subject, html) {
  try {
    await transporter.sendMail({ from: EMAIL_FROM, to, subject, html });
    console.log(`📧 Email sent to ${to} (${subject})`);
  } catch (err) {
    console.error(`❌ Failed to send email to ${to}:`, err.message);
  }
}

module.exports = sendEmail;
