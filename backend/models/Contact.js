const mongoose = require('mongoose');
const contactSchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true },
  email:     { type: String, required: true, lowercase: true, trim: true },
  phone:     String,
  product:   String,
  subject:   String,
  message:   { type: String, required: true },
  status:    { type: String, enum: ['new','read','replied'], default: 'new' },
  adminNote: String,
}, { timestamps: true });
module.exports = mongoose.model('Contact', contactSchema);
