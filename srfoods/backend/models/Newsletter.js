const mongoose = require('mongoose');
const newsletterSchema = new mongoose.Schema({
  email:  { type: String, required: true, unique: true, lowercase: true, trim: true },
  name:   String,
  active: { type: Boolean, default: true },
  source: { type: String, default: 'website' },
}, { timestamps: true });
module.exports = mongoose.model('Newsletter', newsletterSchema);
