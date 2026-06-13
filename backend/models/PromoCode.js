const mongoose = require('mongoose');
const promoSchema = new mongoose.Schema({
  code:          { type: String, required: true, unique: true, uppercase: true, trim: true },
  description:   String,
  discountType:  { type: String, enum: ['percentage','flat'], default: 'percentage' },
  discountValue: { type: Number, required: true },
  minOrderValue: { type: Number, default: 0 },
  maxDiscount:   Number,
  usageLimit:    { type: Number, default: null },
  usedCount:     { type: Number, default: 0 },
  perUserLimit:  { type: Number, default: 1 },
  applicableTo:  { type: String, enum: ['all','chapati','poori','special','combo'], default: 'all' },
  isActive:      { type: Boolean, default: true },
  expiresAt:     Date,
  usedBy:        [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });
module.exports = mongoose.model('PromoCode', promoSchema);
