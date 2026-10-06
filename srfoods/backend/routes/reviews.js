const express  = require('express');
const router   = express.Router();
const mongoose = require('mongoose');
const Review   = require('../models/Review');
const Product  = require('../models/Product');
const Order    = require('../models/Order');
const { protect, adminOnly, optionalAuth } = require('../middleware/auth');

router.get('/:productId', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    let pid = req.params.productId;

    if (!mongoose.Types.ObjectId.isValid(pid)) {
      const prod = await Product.findOne({ $or: [{ slug: pid }, { name: new RegExp(pid, 'i') }] });
      if (prod) {
        pid = prod._id;
      } else {
        return res.json({ success: true, total: 0, avgRating: 0, data: [] });
      }
    }

    const filter = { product: pid };
    const total = await Review.countDocuments(filter);
    const reviews = await Review.find(filter)
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    let avgRating = 0;
    if (total > 0) {
      const agg = await Review.aggregate([
        { $match: { product: new mongoose.Types.ObjectId(pid.toString()) } },
        { $group: { _id: null, avg: { $avg: '$rating' } } },
      ]);
      avgRating = Math.round((agg[0]?.avg || 0) * 10) / 10;
    }
    res.json({ success: true, total, avgRating, data: reviews });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', optionalAuth, async (req, res) => {
  try {
    let { productId, rating, title, text, userName } = req.body;
    if (!productId || !rating || !text)
      return res.status(400).json({ error: 'productId, rating and text required' });
    if (rating < 1 || rating > 5)
      return res.status(400).json({ error: 'Rating must be 1-5' });

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      const prod = await Product.findOne({ $or: [{ slug: productId }, { name: new RegExp(productId, 'i') }] });
      if (prod) productId = prod._id;
      else {
        const firstProd = await Product.findOne();
        if (firstProd) productId = firstProd._id;
        else return res.status(400).json({ error: 'Product not found' });
      }
    }

    const userId = req.user ? req.user._id : undefined;
    if (userId && (await Review.findOne({ user: userId, product: productId }))) {
      return res.status(409).json({ error: 'You already reviewed this product' });
    }

    const purchased = userId
      ? await Order.findOne({ user: userId, 'items.product': productId, status: 'delivered' })
      : false;

    const review = await Review.create({
      user: userId,
      product: productId,
      rating,
      title: title || '',
      text,
      verified: !!purchased,
    });

    const stats = await Review.aggregate([
      { $match: { product: review.product } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    if (stats.length) {
      await Product.findByIdAndUpdate(productId, {
        rating: Math.round(stats[0].avg * 10) / 10,
        reviewCount: stats[0].count,
      });
    }

    if (userId) await review.populate('user', 'name');
    res.status(201).json({ success: true, message: 'Review submitted!', data: review });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Review deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
