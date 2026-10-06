const express   = require('express');
const router    = express.Router();
const mongoose  = require('mongoose');
const Order     = require('../models/Order');
const Cart      = require('../models/Cart');
const Product   = require('../models/Product');
const PromoCode = require('../models/PromoCode');
const { protect, optionalAuth, adminOnly } = require('../middleware/auth');

function getDeliveryZone(delivery, subtotal) {
  const city = (delivery?.city || '').trim().toLowerCase();
  const state = (delivery?.state || '').trim().toLowerCase();
  const pincode = (delivery?.pincode || '').trim();

  // Zone 1: Nellore Local
  if (city.includes('nellore') || pincode.startsWith('524')) {
    const fee = subtotal >= 99 ? 0 : 20;
    return {
      zone: 'Nellore Local Express',
      fee,
      freeAbove: 99,
      eta: 'Today (Same Day within 2-4 hrs)',
      estimatedDays: 0,
    };
  }

  // Zone 2: Rest of Andhra Pradesh & Telangana
  if (
    state.includes('andhra') ||
    state.includes('telangana') ||
    city.includes('tirupati') ||
    city.includes('hyderabad') ||
    city.includes('vijayawada') ||
    city.includes('guntur') ||
    city.includes('visakhapatnam') ||
    city.includes('kavali') ||
    city.includes('ongole') ||
    pincode.startsWith('50') ||
    pincode.startsWith('51') ||
    pincode.startsWith('52') ||
    pincode.startsWith('53')
  ) {
    const fee = subtotal >= 149 ? 0 : 35;
    return {
      zone: 'AP & Telangana Regional',
      fee,
      freeAbove: 149,
      eta: 'Tomorrow (Next Day Delivery)',
      estimatedDays: 1,
    };
  }

  // Zone 3: South Neighboring States (Karnataka, Tamil Nadu, Kerala)
  if (
    state.includes('tamil') ||
    state.includes('karnataka') ||
    state.includes('kerala') ||
    city.includes('chennai') ||
    city.includes('bangalore') ||
    city.includes('bengaluru') ||
    pincode.startsWith('56') ||
    pincode.startsWith('60')
  ) {
    const fee = subtotal >= 199 ? 0 : 50;
    return {
      zone: 'South Interstate Express',
      fee,
      freeAbove: 199,
      eta: '1 - 2 Business Days',
      estimatedDays: 2,
    };
  }

  // Zone 4: Rest of India
  const fee = subtotal >= 299 ? 0 : 70;
  return {
    zone: 'National Cold-Chain Delivery',
    fee,
    freeAbove: 299,
    eta: '2 - 3 Business Days',
    estimatedDays: 3,
  };
}

// ── Calculate Delivery Fee endpoint ─────────────────────────
router.post('/calculate-delivery', (req, res) => {
  const { city, state, pincode, subtotal = 0 } = req.body;
  const zoneInfo = getDeliveryZone({ city, state, pincode }, Number(subtotal));
  res.json({ success: true, ...zoneInfo });
});

// ── Place Order ─────────────────────────────────────────────
router.post('/', optionalAuth, async (req, res) => {
  try {
    const {
      delivery,
      paymentMethod = 'PhonePe_QR',
      paymentStatus,
      transactionId,
      utrNumber,
      senderUpiName,
      promoCode,
      useCart = true,
      directItems,
    } = req.body;

    if (paymentMethod === 'COD') {
      return res.status(400).json({ error: 'Cash on Delivery is discontinued. All orders must be prepaid via PhonePe QR / UPI.' });
    }

    const { name, phone, email, line1, city, state, pincode } = delivery || {};
    if (!name || !phone || !email || !line1 || !city || !state || !pincode)
      return res.status(400).json({ error: 'All delivery fields required' });

    let orderItems = [];
    if (useCart && req.user) {
      const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
      if (!cart || !cart.items.length) return res.status(400).json({ error: 'Cart is empty' });
      orderItems = cart.items.map((i) => ({
        product: i.product._id,
        name: i.product.name,
        price: i.price,
        quantity: i.quantity,
        emoji: i.product.emoji,
        unit: i.product.unit,
      }));
    } else {
      if (!directItems?.length) return res.status(400).json({ error: 'No items provided' });
      for (const di of directItems) {
        let p = null;
        if (mongoose.Types.ObjectId.isValid(di.productId)) {
          p = await Product.findById(di.productId);
        }
        if (!p) {
          p = await Product.findOne({ $or: [{ slug: di.productId }, { name: new RegExp(di.productId, 'i') }] });
        }
        if (!p) {
          p = await Product.findOne({ isActive: true });
        }
        if (!p || !p.isActive) return res.status(400).json({ error: 'Product not found' });
        orderItems.push({
          product: p._id,
          name: di.name || p.name,
          price: di.price || p.price,
          quantity: di.quantity,
          emoji: di.emoji || p.emoji,
          unit: di.unit || p.unit,
        });
      }
    }

    for (const item of orderItems) {
      const p = await Product.findById(item.product);
      if (p && p.stock < item.quantity)
        return res.status(400).json({ error: `Insufficient stock for ${p.name}` });
      if (p) await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
    }

    const subtotal = orderItems.reduce((s, i) => s + i.price * i.quantity, 0);
    let discount = 0, appliedPromo = null;
    if (promoCode) {
      const promo = await PromoCode.findOne({ code: promoCode.toUpperCase(), isActive: true });
      if (!promo) return res.status(400).json({ error: 'Invalid promo code' });
      if (promo.expiresAt && promo.expiresAt < new Date())
        return res.status(400).json({ error: 'Promo code expired' });
      if (subtotal < promo.minOrderValue)
        return res.status(400).json({ error: `Min order ₹${promo.minOrderValue} required` });
      if (promo.usageLimit && promo.usedCount >= promo.usageLimit)
        return res.status(400).json({ error: 'Promo limit reached' });

      if (req.user) {
        const used = promo.usedBy.filter((id) => id.toString() === req.user._id.toString()).length;
        if (used >= promo.perUserLimit) return res.status(400).json({ error: 'You already used this code' });
      }

      discount = promo.discountType === 'percentage'
        ? Math.min(Math.round((subtotal * promo.discountValue) / 100), promo.maxDiscount || Infinity)
        : promo.discountValue;
      appliedPromo = promo.code;
      await PromoCode.findByIdAndUpdate(promo._id, {
        $inc: { usedCount: 1 },
        ...(req.user ? { $push: { usedBy: req.user._id } } : {}),
      });
    }

    // Dynamic Delivery Calculation by Location
    const zoneInfo = getDeliveryZone(delivery, subtotal);
    const deliveryFee = zoneInfo.fee;
    const total = Math.max(0, subtotal - discount) + deliveryFee;

    const finalUtr = utrNumber || transactionId || `UTR-${Date.now().toString().slice(-8)}`;
    const computedPaymentStatus = paymentStatus || 'verification_pending';

    const userId = req.user ? req.user._id : undefined;
    const order = await Order.create({
      user: userId,
      delivery,
      items: orderItems,
      subtotal,
      discount,
      deliveryFee,
      total,
      promoCode: appliedPromo,
      paymentMethod,
      paymentStatus: computedPaymentStatus,
      transactionId: finalUtr,
      utrNumber: finalUtr,
      senderUpiName: senderUpiName || delivery.name,
      deliveryZone: zoneInfo.zone,
      deliveryEta: zoneInfo.eta,
      estimatedDelivery: new Date(Date.now() + Math.max(1, zoneInfo.estimatedDays) * 86400000),
      statusHistory: [
        {
          status: 'placed',
          note: `Payment of ₹${total} submitted via ${paymentMethod} (UTR: ${finalUtr}). Awaiting Owner verification.`,
        },
      ],
    });

    if (useCart && req.user) await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });
    res.status(201).json({
      success: true,
      message: 'Order placed! Payment verification in progress.',
      data: {
        orderId: order.orderId,
        _id: order._id,
        total: order.total,
        subtotal: order.subtotal,
        deliveryFee: order.deliveryFee,
        zone: zoneInfo.zone,
        eta: zoneInfo.eta,
        paymentStatus: order.paymentStatus,
        transactionId: order.transactionId,
        utrNumber: order.utrNumber,
        senderUpiName: order.senderUpiName,
        status: order.status,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Get Orders ──────────────────────────────────────────────
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { status, page = 1, limit = 10, email, phone } = req.query;
    let filter = {};

    if (req.user) {
      filter = { $or: [{ user: req.user._id }, { 'delivery.email': req.user.email }] };
    } else if (email) {
      filter = { 'delivery.email': email.toLowerCase() };
    } else if (phone) {
      filter = { 'delivery.phone': phone };
    } else {
      return res.json({ success: true, total: 0, data: [] });
    }

    if (status && status !== 'all') filter.status = status;
    const total = await Order.countDocuments(filter);
    const data = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ success: true, total, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/admin/all', protect, adminOnly, async (req, res) => {
  try {
    const { status, page = 1, limit = 20, q } = req.query;
    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (q) filter.$or = [{ orderId: { $regex: q, $options: 'i' } }, { 'delivery.name': { $regex: q, $options: 'i' } }];
    const total = await Order.countDocuments(filter);
    const data = await Order.find(filter)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ success: true, total, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const isOid = mongoose.Types.ObjectId.isValid(req.params.id);
    const order = await Order.findOne(isOid ? { _id: req.params.id } : { orderId: req.params.id });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/cancel', protect, async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.user?.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ error: 'Not authorised' });
    if (['delivered', 'cancelled'].includes(order.status))
      return res.status(400).json({ error: `Cannot cancel a ${order.status} order` });
    for (const item of order.items)
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
    order.status = 'cancelled';
    order.cancelReason = reason || 'Customer requested';
    order.statusHistory.push({ status: 'cancelled', note: reason || 'Cancelled by customer' });
    await order.save();
    res.json({ success: true, message: 'Order cancelled', data: order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Admin: Verify Payment & Confirm Order ────────────────────
router.put('/:id/verify-payment', protect, adminOnly, async (req, res) => {
  try {
    const isOid = mongoose.Types.ObjectId.isValid(req.params.id);
    const order = await Order.findOne(isOid ? { _id: req.params.id } : { orderId: req.params.id });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    order.paymentStatus = 'paid';
    order.status = 'confirmed';
    order.paymentVerifiedBy = req.user.name || 'Store Owner (Vishnu)';
    order.paymentVerifiedAt = new Date();
    order.statusHistory.push({
      status: 'confirmed',
      note: `Payment of ₹${order.total} (UTR: ${order.utrNumber || order.transactionId}) verified by ${req.user.name || 'Store Owner'}. Order confirmed!`,
    });
    await order.save();
    res.json({ success: true, message: 'Payment verified & order confirmed!', data: order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Admin: Update Order Status ──────────────────────────────
router.put('/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const { status, note, paymentStatus } = req.body;
    const isOid = mongoose.Types.ObjectId.isValid(req.params.id);
    const order = await Order.findOne(isOid ? { _id: req.params.id } : { orderId: req.params.id });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (status) order.status = status;
    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
      if (paymentStatus === 'paid') {
        order.paymentVerifiedBy = req.user.name || 'Store Owner (Vishnu)';
        order.paymentVerifiedAt = new Date();
      }
    }
    order.statusHistory.push({ status: order.status, note: note || `Status updated to ${order.status}` });
    if (order.status === 'delivered') order.deliveredAt = new Date();
    await order.save();
    res.json({ success: true, message: 'Status updated', data: order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
