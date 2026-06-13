const express = require('express');
const router  = express.Router();
const Review  = require('../models/Review');
const Product = require('../models/Product');
const Order   = require('../models/Order');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/:productId', async (req,res) => {
  try {
    const { page=1,limit=10 } = req.query;
    const filter = { product:req.params.productId };
    const total   = await Review.countDocuments(filter);
    const reviews = await Review.find(filter).populate('user','name').sort({ createdAt:-1 }).skip((page-1)*limit).limit(Number(limit));
    let avgRating=0;
    if (total>0) {
      const agg = await Review.aggregate([{ $match:{ product:new (require('mongoose').Types.ObjectId)(req.params.productId) } },{ $group:{ _id:null, avg:{ $avg:'$rating' } } }]);
      avgRating = Math.round((agg[0]?.avg||0)*10)/10;
    }
    res.json({ success:true, total, avgRating, data:reviews });
  } catch (err) { res.status(500).json({ error:err.message }); }
});

router.post('/', protect, async (req,res) => {
  try {
    const { productId,rating,title,text } = req.body;
    if (!productId||!rating||!text) return res.status(400).json({ error:'productId, rating and text required' });
    if (rating<1||rating>5) return res.status(400).json({ error:'Rating must be 1-5' });
    if (await Review.findOne({ user:req.user._id, product:productId })) return res.status(409).json({ error:'You already reviewed this product' });
    const purchased = await Order.findOne({ user:req.user._id, 'items.product':productId, status:'delivered' });
    const review = await Review.create({ user:req.user._id, product:productId, rating, title, text, verified:!!purchased });
    const stats = await Review.aggregate([{ $match:{ product:review.product } },{ $group:{ _id:null, avg:{ $avg:'$rating' }, count:{ $sum:1 } } }]);
    if (stats.length) await Product.findByIdAndUpdate(productId,{ rating:Math.round(stats[0].avg*10)/10, reviewCount:stats[0].count });
    await review.populate('user','name');
    res.status(201).json({ success:true, message:'Review submitted!', data:review });
  } catch (err) { res.status(500).json({ error:err.message }); }
});

router.delete('/:id', protect, adminOnly, async (req,res) => {
  try { await Review.findByIdAndDelete(req.params.id); res.json({ success:true, message:'Review deleted' }); }
  catch (err) { res.status(500).json({ error:err.message }); }
});

module.exports = router;
