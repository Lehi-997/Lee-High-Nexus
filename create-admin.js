// create-admin.js
require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/Admin');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const existing = await Admin.findOne({ email: 'lehimaina@gmail.com' });
    if (existing) {
      console.log('⚠️ Admin already exists.');
      process.exit();
    }
    const admin = new Admin({
      email: 'lehimaina@gmail.com',
      password: 'lhnexus@2025'
    });
    await admin.save();
    console.log('✅ Admin created successfully!');
    process.exit();
  })
  .catch(err => console.error(err));
