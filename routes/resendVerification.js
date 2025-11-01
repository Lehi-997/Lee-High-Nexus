// routes/resendVerification.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

router.get('/', async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.render('message', { msg: 'Email is required.' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.render('message', { msg: 'No account found with that email.' });
    }

    if (user.isVerified) {
      return res.render('message', { msg: 'This account is already verified.' });
    }

    // Create a new verification token
    const token = crypto.randomBytes(32).toString('hex');
    user.verificationToken = token;
    user.save();

    const verifyUrl = `${process.env.BASE_URL}/verify/${token}`;

    const html = `
      <h2>Verify Your Email</h2>
      <p>Click the link below to verify your email:</p>
      <a href="${verifyUrl}">Verify Now</a>
    `;

    await sendEmail(user.email, 'Verify Your Account', html);

    res.render('message', { msg: 'A new verification email has been sent. Please check your inbox.' });
  } catch (err) {
    console.error(err);
    res.render('message', { msg: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
