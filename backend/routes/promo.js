const express   = require('express');
const router    = express.Router();
const PromoCode = require('../models/PromoCode');
const { protect, adminOnly } = require('../middleware/auth');

router.post('/validate', protect, async (req,res) => {
  try {
    const { code,subtotal } = req.body;
    if (!code||!subtotal) return res.status(400).json({ error:'code and subtotal required' });
    const promo = await PromoCode.findOne({ code:code.toUpperCase(), isActive:true });
    if (!promo) return res.status(404).json({ error:'Invalid promo code' });
    if (promo.expiresAt&&promo.expiresAt<new Date()) return res.status(400).json({ error:'Code expired' });
    if (subtotal<promo.minOrderValue) return res.status(400).json({ error:`Min order ₹${promo.minOrderValue} required` });
    if (promo.usageLimit&&promo.usedCount>=promo.usageLimit) return res.status(400).json({ error:'Usage limit reached' });
    const used=promo.usedBy.filter(id=>id.toString()===req.user._id.toString()).length;
    if (used>=promo.perUserLimit) return res.status(400).json({ error:'You already used this code' });
    let discount = promo.discountType==='percentage' ? Math.round(subtotal*promo.discountValue/100) : promo.discountValue;
    if (promo.maxDiscount) discount=Math.min(discount,promo.maxDiscount);
    res.json({ success:true, discount, code:promo.code, description:promo.description, finalTotal:Math.max(0,subtotal-discount) });
  } catch (err) { res.status(500).json({ error:err.message }); }
});

router.get('/', async (_req,res) => {
  try { res.json({ success:true, data: await PromoCode.find({ isActive:true }).select('-usedBy').sort({ discountValue:-1 }) }); }
  catch (err) { res.status(500).json({ error:err.message }); }
});

router.post('/', protect, adminOnly, async (req,res) => {
  try { res.status(201).json({ success:true, data: await PromoCode.create({ ...req.body, code:req.body.code?.toUpperCase() }) }); }
  catch (err) { res.status(400).json({ error:err.message }); }
});

router.put('/:id', protect, adminOnly, async (req,res) => {
  try {
    const promo = await PromoCode.findByIdAndUpdate(req.params.id,req.body,{ new:true });
    if (!promo) return res.status(404).json({ error:'Not found' });
    res.json({ success:true, data:promo });
  } catch (err) { res.status(400).json({ error:err.message }); }
});

module.exports = router;
