// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 12;

const userSchema = new mongoose.Schema({
  fullname: { type: String, required: true },
  age: { type: Number },
  city: { type: String },
  region: { type: String },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String },
  verificationTokenExpires: { type: Date },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

/* ---------- 🔒 Hash password manually ---------- */
userSchema.methods.setPassword = async function (password) {
  this.passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
};

/* ---------- ✅ Compare password for login ---------- */
userSchema.methods.validatePassword = async function (password) {
  if (!this.passwordHash) return false; // prevent undefined errors
  return bcrypt.compare(password, this.passwordHash);
};

module.exports = mongoose.model('User', userSchema);
