const express   = require('express');
const router    = express.Router();
const Order     = require('../models/Order');
const Cart      = require('../models/Cart');
const Product   = require('../models/Product');
const PromoCode = require('../models/PromoCode');
const { protect, adminOnly } = require('../middleware/auth');

router.post('/', protect, async (req, res) => {
  try {
    const { delivery, paymentMethod='COD', promoCode, useCart=true, directItems } = req.body;
    const { name,phone,email,line1,city,state,pincode } = delivery||{};
    if (!name||!phone||!email||!line1||!city||!state||!pincode)
      return res.status(400).json({ error:'All delivery fields required' });

    let orderItems=[];
    if (useCart) {
      const cart = await Cart.findOne({ user:req.user._id }).populate('items.product');
      if (!cart||!cart.items.length) return res.status(400).json({ error:'Cart is empty' });
      orderItems = cart.items.map(i=>({ product:i.product._id, name:i.product.name, price:i.price, quantity:i.quantity, emoji:i.product.emoji, unit:i.product.unit }));
    } else {
      if (!directItems?.length) return res.status(400).json({ error:'No items provided' });
      for (const di of directItems) {
        const p = await Product.findById(di.productId);
        if (!p||!p.isActive) return res.status(400).json({ error:`Product not found` });
        orderItems.push({ product:p._id, name:p.name, price:p.price, quantity:di.quantity, emoji:p.emoji, unit:p.unit });
      }
    }

    for (const item of orderItems) {
      const p = await Product.findById(item.product);
      if (p.stock<item.quantity) return res.status(400).json({ error:`Insufficient stock for ${p.name}` });
      await Product.findByIdAndUpdate(item.product, { $inc:{ stock:-item.quantity } });
    }

    const subtotal = orderItems.reduce((s,i)=>s+i.price*i.quantity,0);
    let discount=0, appliedPromo=null;
    if (promoCode) {
      const promo = await PromoCode.findOne({ code:promoCode.toUpperCase(), isActive:true });
      if (!promo) return res.status(400).json({ error:'Invalid promo code' });
      if (promo.expiresAt&&promo.expiresAt<new Date()) return res.status(400).json({ error:'Promo code expired' });
      if (subtotal<promo.minOrderValue) return res.status(400).json({ error:`Min order ₹${promo.minOrderValue} required` });
      if (promo.usageLimit&&promo.usedCount>=promo.usageLimit) return res.status(400).json({ error:'Promo limit reached' });
      const used = promo.usedBy.filter(id=>id.toString()===req.user._id.toString()).length;
      if (used>=promo.perUserLimit) return res.status(400).json({ error:'You already used this code' });
      discount = promo.discountType==='percentage'
        ? Math.min(Math.round(subtotal*promo.discountValue/100), promo.maxDiscount||Infinity)
        : promo.discountValue;
      appliedPromo = promo.code;
      await PromoCode.findByIdAndUpdate(promo._id, { $inc:{ usedCount:1 }, $push:{ usedBy:req.user._id } });
    }

    const total = Math.max(0,subtotal-discount);
    const order = await Order.create({ user:req.user._id, delivery, items:orderItems, subtotal, discount, deliveryFee:0, total, promoCode:appliedPromo, paymentMethod, estimatedDelivery:new Date(Date.now()+2*86400000), statusHistory:[{ status:'placed', note:'Order placed successfully' }] });
    if (useCart) await Cart.findOneAndUpdate({ user:req.user._id },{ items:[] });
    res.status(201).json({ success:true, message:'Order placed!', data:{ orderId:order.orderId, _id:order._id, total } });
  } catch (err) { res.status(500).json({ error:err.message }); }
});

router.get('/', protect, async (req,res) => {
  try {
    const { status,page=1,limit=10 } = req.query;
    const filter = { user:req.user._id };
    if (status&&status!=='all') filter.status=status;
    const total = await Order.countDocuments(filter);
    const data  = await Order.find(filter).sort({ createdAt:-1 }).skip((page-1)*limit).limit(Number(limit));
    res.json({ success:true, total, data });
  } catch (err) { res.status(500).json({ error:err.message }); }
});

router.get('/admin/all', protect, adminOnly, async (req,res) => {
  try {
    const { status,page=1,limit=20,q } = req.query;
    const filter = {};
    if (status&&status!=='all') filter.status=status;
    if (q) filter.$or=[{ orderId:{$regex:q,$options:'i'} },{ 'delivery.name':{$regex:q,$options:'i'} }];
    const total = await Order.countDocuments(filter);
    const data  = await Order.find(filter).populate('user','name email').sort({ createdAt:-1 }).skip((page-1)*limit).limit(Number(limit));
    res.json({ success:true, total, data });
  } catch (err) { res.status(500).json({ error:err.message }); }
});

router.get('/:id', protect, async (req,res) => {
  try {
    const isOid = /^[0-9a-fA-F]{24}$/.test(req.params.id);
    const order = await Order.findOne(isOid?{ _id:req.params.id }:{ orderId:req.params.id });
    if (!order) return res.status(404).json({ error:'Order not found' });
    if (req.user.role!=='admin'&&order.user?.toString()!==req.user._id.toString()) return res.status(403).json({ error:'Not authorised' });
    res.json({ success:true, data:order });
  } catch (err) { res.status(500).json({ error:err.message }); }
});

router.post('/:id/cancel', protect, async (req,res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error:'Order not found' });
    if (order.user?.toString()!==req.user._id.toString()&&req.user.role!=='admin') return res.status(403).json({ error:'Not authorised' });
    if (['delivered','cancelled'].includes(order.status)) return res.status(400).json({ error:`Cannot cancel a ${order.status} order` });
    for (const item of order.items) await Product.findByIdAndUpdate(item.product,{ $inc:{ stock:item.quantity } });
    order.status='cancelled'; order.cancelReason=reason||'Cancelled by customer';
    order.statusHistory.push({ status:'cancelled', note:reason||'Cancelled by customer' });
    await order.save();
    res.json({ success:true, message:'Order cancelled', data:order });
  } catch (err) { res.status(500).json({ error:err.message }); }
});

router.put('/:id/status', protect, adminOnly, async (req,res) => {
  try {
    const { status,note } = req.body;
    const valid = ['placed','confirmed','packing','shipped','out_for_delivery','delivered','cancelled','returned'];
    if (!valid.includes(status)) return res.status(400).json({ error:'Invalid status' });
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error:'Order not found' });
    order.status=status;
    if (status==='delivered') { order.deliveredAt=new Date(); order.paymentStatus='paid'; }
    order.statusHistory.push({ status, note:note||`Status updated to ${status}` });
    await order.save();
    res.json({ success:true, message:`Order → ${status}`, data:order });
  } catch (err) { res.status(500).json({ error:err.message }); }
});

module.exports = router;
