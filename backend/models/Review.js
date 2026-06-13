const mongoose = require('mongoose');
const reviewSchema = new mongoose.Schema({
  user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  product:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  rating:   { type: Number, required: true, min: 1, max: 5 },
  title:    { type: String, trim: true },
  text:     { type: String, required: true, trim: true },
  verified: { type: Boolean, default: false },
  helpful:  { type: Number, default: 0 },
}, { timestamps: true });
reviewSchema.index({ user: 1, product: 1 }, { unique: true });
module.exports = mongoose.model('Review', reviewSchema);
