// routes/auth.js
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const User = require('../models/User');
const nodemailer = require('nodemailer');

/* ---------- ENV VARIABLES ---------- */
const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  EMAIL_FROM,
  BASE_URL,
  ADMIN_EMAIL
} = process.env;

/* ---------- EMAIL TRANSPORT ---------- */
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: parseInt(SMTP_PORT || 587, 10),
  secure: SMTP_PORT == 465,
  auth: { user: SMTP_USER, pass: SMTP_PASS },
  tls: { rejectUnauthorized: false }
});

/* ---------- SEND EMAIL UTILITY ---------- */
async function sendEmail(to, subject, html) {
  try {
    await transporter.sendMail({ from: EMAIL_FROM, to, subject, html });
    console.log(`📧 Email sent to ${to} (${subject})`);
  } catch (err) {
    console.error(`❌ Failed to send email to ${to}:`, err.message);
  }
}

/* ---------- SEND VERIFICATION EMAIL ---------- */
async function sendVerificationEmail(user, req) {
  const base = BASE_URL || `http://${req.headers.host}`;
  const verifyUrl = `${base}/verify-email?token=${user.verificationToken}`;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <p>Hi ${user.fullname?.split(' ')[0] || 'there'},</p>
      <p>Welcome to <b>Lee High Nexus</b>! Please verify your email below:</p>
      <p>
        <a href="${verifyUrl}"
          style="background:#007b5e;color:#fff;padding:10px 20px;text-decoration:none;border-radius:5px;">
          Verify Email
        </a>
      </p>
      <p>This link expires in 15 minutes.</p>
    </div>`;
  await sendEmail(user.email, 'Verify your Lee High Nexus account', html);
}

/* ---------- SIGNUP ---------- */
router.get('/signup', (req, res) => {
  const next = req.query.next || '/projects';
  res.render('login', { title: 'Sign Up', page: 'signup', error: null, message: null, next });
});

router.post('/signup', async (req, res) => {
  try {
    const { fullname, email, password, confirmPassword, phone, region, city, age, next } = req.body;
    const redirectTo = next || '/projects';

    // Validation
    if (!fullname || !email || !password || !confirmPassword) {
      return res.render('login', {
        title: 'Sign Up',
        page: 'signup',
        error: 'Please fill all required fields.',
        message: null,
        next: redirectTo
      });
    }

    if (password !== confirmPassword) {
      return res.render('login', {
        title: 'Sign Up',
        page: 'signup',
        error: 'Passwords do not match.',
        message: null,
        next: redirectTo
      });
    }

    // Check if email already exists
    const existing = await User.findOne({ email });
    if (existing) {
      console.log(`⚠️ Duplicate signup attempt for: ${email}`);
      return res.render('login', {
        title: 'Login',
        page: 'login',
        message: 'This email is already registered. Please log in instead.',
        error: null,
        next: '/projects'
      });
    }

    // Create user
    const user = new User({
      fullname,
      email,
      phone,
      region,
      city,
      age,
      verificationToken: crypto.randomBytes(32).toString('hex'),
      verificationTokenExpires: Date.now() + 15 * 60 * 1000
    });

    await user.setPassword(password);

    // Auto-verify admin
    if (email === (ADMIN_EMAIL || 'admin@leehighnexus.com')) {
      user.isVerified = true;
      user.role = 'admin';
    }

    await user.save();

    // Send verification email if not verified
    if (!user.isVerified) {
      await sendVerificationEmail(user, req);
      return res.redirect(`/thank-you?email=${encodeURIComponent(user.email)}`);
    }

    // Auto-login admin
    req.session.userId = user._id;
    req.session.userName = user.fullname;
    res.redirect(redirectTo);

  } catch (err) {
    console.error('❌ Signup error:', err);
    res.render('login', {
      title: 'Sign Up',
      page: 'signup',
      error: 'Something went wrong. Try again.',
      message: null,
      next: '/projects'
    });
  }
});

/* ---------- VERIFY EMAIL ---------- */
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.render('verify-emails', {
        title: 'Verify Email',
        page: 'verify',
        verified: false,
        email: null,
        error: 'Invalid or expired verification link.',
        message: null
      });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    console.log(`✅ Verified: ${user.email}`);
    return res.redirect(`/thank-you?verified=true&email=${encodeURIComponent(user.email)}`);
  } catch (err) {
    console.error('❌ Verification error:', err);
    res.status(500).send('Something went wrong during verification.');
  }
});

/* ---------- LOGIN ---------- */
router.get('/login', (req, res) => {
  const next = req.query.next || '/projects';
  res.render('login', { title: 'Login', page: 'login', message: null, error: null, next });
});

router.post('/login', async (req, res) => {
  try {
    const { email, password, next } = req.body;
    const redirectTo = next || '/projects';

    const user = await User.findOne({ email });
    if (!user) {
      return res.render('login', {
        title: 'Login',
        page: 'login',
        error: 'Invalid email or password.',
        message: null,
        next: redirectTo
      });
    }

    const isMatch = await user.validatePassword(password);
    if (!isMatch) {
      return res.render('login', {
        title: 'Login',
        page: 'login',
        error: 'Invalid email or password.',
        message: null,
        next: redirectTo
      });
    }

    if (!user.isVerified) {
      return res.render('login', {
        title: 'Login',
        page: 'login',
        error: 'Please verify your email first.',
        message: null,
        next: redirectTo
      });
    }

    req.session.userId = user._id;
    req.session.userName = user.fullname;
    res.redirect(redirectTo);
  } catch (err) {
    console.error('❌ Login error:', err);
    res.render('login', {
      title: 'Login',
      page: 'login',
      error: 'Something went wrong. Try again.',
      message: null,
      next: '/projects'
    });
  }
});

/* ---------- LOGOUT ---------- */
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('❌ Logout error:', err);
      return res.redirect('/projects');
    }
    res.clearCookie('connect.sid');
    res.redirect('/login');
  });
});

/* ---------- CHECK VERIFICATION (AJAX) ---------- */
router.get('/check-verification', async (req, res) => {
  try {
    const email = req.query.email;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ verified: user.isVerified });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
