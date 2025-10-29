// routes/forgotPassword.js
const express = require('express');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const router = express.Router();

/* ---------- Step 1: Forgot Password (Request) ---------- */
router.get('/forgot-password', (req, res) => {
  res.render('forgot-password', { title: 'Forgot Password', message: null });
});

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.render('forgot-password', { title: 'Forgot Password', message: 'No account found for that email.' });
    }

    // Generate token and expiry
    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save();

    // Create password reset link
    const resetLink = `${process.env.BASE_URL}/reset-password/${token}`;

    // Send email
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: 'Password Reset - Lee High Nexus',
      html: `
        <p>Hello ${user.name || ''},</p>
        <p>You requested to reset your password. Click the link below to set a new one (valid for 15 minutes):</p>
        <p><a href="${resetLink}" style="color:#007bff;">Reset Password</a></p>
        <p>If you didn’t request this, just ignore this email.</p>
        <br><p>— Lee High Nexus</p>
      `,
    });

    console.log(`📧 Password reset email sent to ${user.email}`);
    res.render('forgot-password', { title: 'Forgot Password', message: 'Reset link sent to your email.' });
  } catch (err) {
    console.error('❌ Error sending reset email:', err);
    res.render('forgot-password', { title: 'Forgot Password', message: 'Something went wrong. Try again.' });
  }
});

/* ---------- Step 2: Reset Password (Visit Link) ---------- */
router.get('/reset-password/:token', async (req, res) => {
  try {
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() }, // Check expiry
    });

    if (!user) {
      return res.render('reset-password', { title: 'Reset Password', expired: true });
    }

    res.render('reset-password', { title: 'Reset Password', expired: false, token: req.params.token });
  } catch (err) {
    res.render('reset-password', { title: 'Reset Password', expired: true });
  }
});

/* ---------- Step 3: Save New Password ---------- */
router.post('/reset-password/:token', async (req, res) => {
  const { password } = req.body;
  try {
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.render('reset-password', { title: 'Reset Password', expired: true });
    }

    // Hash and update new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.render('reset-success', { title: 'Password Reset Successful' });
  } catch (err) {
    console.error('❌ Error resetting password:', err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
