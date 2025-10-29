const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: String,
  message: String,
  joinedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Member', memberSchema);
