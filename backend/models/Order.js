const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  product:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name:     { type: String, required: true },
  price:    { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  emoji:    String,
  unit:     String,
});

const orderSchema = new mongoose.Schema({
  orderId: { type: String, unique: true },
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  delivery: {
    name:    { type: String, required: true },
    phone:   { type: String, required: true },
    email:   { type: String, required: true },
    line1:   { type: String, required: true },
    line2:   String,
    city:    { type: String, required: true },
    state:   { type: String, required: true },
    pincode: { type: String, required: true },
    slot:    String,
    notes:   String,
  },
  items:         [itemSchema],
  subtotal:      { type: Number, required: true },
  discount:      { type: Number, default: 0 },
  deliveryFee:   { type: Number, default: 0 },
  total:         { type: Number, required: true },
  promoCode:     String,
  paymentMethod: { type: String, enum: ['COD','UPI','Card','Wallet'], default: 'COD' },
  paymentStatus: { type: String, enum: ['pending','paid','failed','refunded'], default: 'pending' },
  status: {
    type: String,
    enum: ['placed','confirmed','packing','shipped','out_for_delivery','delivered','cancelled','returned'],
    default: 'placed',
  },
  statusHistory: [{ status: String, note: String, updatedAt: { type: Date, default: Date.now } }],
  estimatedDelivery: Date,
  deliveredAt:       Date,
  cancelReason:      String,
}, { timestamps: true });

orderSchema.pre('save', function (next) {
  if (!this.orderId) {
    this.orderId = 'SR-' + Date.now().toString().slice(-8) +
                   Math.floor(Math.random() * 100).toString().padStart(2, '0');
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
