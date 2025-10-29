// routes/admin.js
const express = require('express');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const User = require('../models/User');
const Member = require('../models/Member');

const router = express.Router();

/* ---------- Middleware ---------- */
function requireAdmin(req, res, next) {
  if (req.session && req.session.adminId) return next();
  return res.redirect('/admin/login');
}

/* ---------- Admin Login Page ---------- */
router.get('/login', (req, res) => {
  res.render('admin/admin-login', {
    title: 'Admin Login - Lee High Nexus',
    page: 'admin-login',
    error: null,
    message: null
  });
});

/* ---------- Admin Login Logic ---------- */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin)
      return res.render('admin/admin-login', {
        title: 'Admin Login - Lee High Nexus',
        page: 'admin-login',
        error: 'Invalid email or password.',
        message: null
      });

    const isMatch = await admin.comparePassword(password);
    if (!isMatch)
      return res.render('admin/admin-login', {
        title: 'Admin Login - Lee High Nexus',
        page: 'admin-login',
        error: 'Invalid email or password.',
        message: null
      });

    req.session.adminId = admin._id;
    res.redirect('/admin/dashboard');
  } catch (err) {
    console.error('❌ Admin login error:', err);
    res.render('admin/admin-login', {
      title: 'Admin Login - Lee High Nexus',
      page: 'admin-login',
      error: 'Something went wrong. Try again.',
      message: null
    });
  }
});

/* ---------- Admin Dashboard ---------- */
router.get('/dashboard', requireAdmin, async (req, res) => {
  try {
    const users = await User.find({}, 'fullname email verified');
    const members = await Member.find({}, 'name email phone message');
    res.render('admin/admin-dashboard', {
      title: 'Admin Dashboard - Lee High Nexus',
      page: 'admin-dashboard',
      users,
      members
    });
  } catch (err) {
    console.error('❌ Error loading admin dashboard:', err);
    res.send('Error loading dashboard');
  }
});

/* ---------- Admin Logout ---------- */
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/admin/login');
  });
});

module.exports = router;
