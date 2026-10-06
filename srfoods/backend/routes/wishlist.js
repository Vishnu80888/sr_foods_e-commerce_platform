const express  = require('express');
const router   = express.Router();
const mongoose = require('mongoose');
const Wishlist = require('../models/Wishlist');
const Product  = require('../models/Product');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const wl = await Wishlist.findOne({ user: req.user._id }).populate(
      'products',
      'name price originalPrice emoji color bgColor tagline unit badge isActive slug image'
    );
    res.json({ success: true, data: (wl?.products || []).filter((p) => p.isActive) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/toggle/:productId', async (req, res) => {
  try {
    let pid = req.params.productId;
    if (!mongoose.Types.ObjectId.isValid(pid)) {
      const prod = await Product.findOne({ $or: [{ slug: pid }, { name: new RegExp(pid, 'i') }] });
      if (prod) pid = prod._id;
      else return res.status(404).json({ error: 'Product not found' });
    }

    let wl = await Wishlist.findOne({ user: req.user._id });
    if (!wl) wl = await Wishlist.create({ user: req.user._id, products: [] });

    const idx = wl.products.findIndex((p) => p.toString() === pid.toString());
    let action;
    if (idx >= 0) {
      wl.products.splice(idx, 1);
      action = 'removed';
    } else {
      wl.products.push(pid);
      action = 'added';
    }
    await wl.save();
    res.json({ success: true, action, message: `Product ${action} ${action === 'added' ? 'to' : 'from'} wishlist` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/clear', async (req, res) => {
  try {
    await Wishlist.findOneAndUpdate({ user: req.user._id }, { products: [] });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
