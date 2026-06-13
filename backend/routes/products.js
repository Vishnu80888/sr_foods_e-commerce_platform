const express = require('express');
const router  = express.Router();
const Product = require('../models/Product');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const { q, category, sort='createdAt', order='asc', page=1, limit=20, featured } = req.query;
    const filter = { isActive:true };
    if (category && category !== 'all') filter.category = category;
    if (featured === 'true') filter.isFeatured = true;
    if (q) filter.$or = [{ name:{$regex:q,$options:'i'} }, { description:{$regex:q,$options:'i'} }, { tags:{$in:[new RegExp(q,'i')]} }];
    const sortObj = { [sort]: order==='desc'?-1:1 };
    const total   = await Product.countDocuments(filter);
    const data    = await Product.find(filter).sort(sortObj).skip((page-1)*limit).limit(Number(limit));
    res.json({ success:true, total, page:Number(page), pages:Math.ceil(total/limit), data });
  } catch (err) { res.status(500).json({ error:err.message }); }
});

router.get('/featured', async (_req, res) => {
  try { res.json({ success:true, data: await Product.find({ isActive:true, isFeatured:true }).limit(6) }); }
  catch (err) { res.status(500).json({ error:err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const isOid = /^[0-9a-fA-F]{24}$/.test(req.params.id);
    const product = await Product.findOne(isOid ? { _id:req.params.id, isActive:true } : { slug:req.params.id, isActive:true });
    if (!product) return res.status(404).json({ error:'Product not found' });
    res.json({ success:true, data:product });
  } catch (err) { res.status(500).json({ error:err.message }); }
});

router.post('/', protect, adminOnly, async (req, res) => {
  try { res.status(201).json({ success:true, data: await Product.create(req.body) }); }
  catch (err) { res.status(400).json({ error:err.message }); }
});

router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new:true, runValidators:true });
    if (!product) return res.status(404).json({ error:'Product not found' });
    res.json({ success:true, data:product });
  } catch (err) { res.status(400).json({ error:err.message }); }
});

router.delete('/:id', protect, adminOnly, async (req, res) => {
  try { await Product.findByIdAndUpdate(req.params.id, { isActive:false }); res.json({ success:true, message:'Product deactivated' }); }
  catch (err) { res.status(500).json({ error:err.message }); }
});

module.exports = router;
