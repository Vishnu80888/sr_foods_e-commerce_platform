const express  = require('express');
const router   = express.Router();
const Wishlist = require('../models/Wishlist');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', async (req,res) => {
  try {
    const wl = await Wishlist.findOne({ user:req.user._id }).populate('products','name price originalPrice emoji color bgColor tagline unit badge isActive slug');
    res.json({ success:true, data:(wl?.products||[]).filter(p=>p.isActive) });
  } catch (err) { res.status(500).json({ error:err.message }); }
});

router.post('/toggle/:productId', async (req,res) => {
  try {
    let wl = await Wishlist.findOne({ user:req.user._id });
    if (!wl) wl = await Wishlist.create({ user:req.user._id, products:[] });
    const pid=req.params.productId;
    const idx=wl.products.findIndex(p=>p.toString()===pid);
    let action;
    if (idx>=0) { wl.products.splice(idx,1); action='removed'; }
    else { wl.products.push(pid); action='added'; }
    await wl.save();
    res.json({ success:true, action, message:`Product ${action} ${action==='added'?'to':'from'} wishlist` });
  } catch (err) { res.status(500).json({ error:err.message }); }
});

router.delete('/clear', async (req,res) => {
  try { await Wishlist.findOneAndUpdate({ user:req.user._id },{ products:[] }); res.json({ success:true }); }
  catch (err) { res.status(500).json({ error:err.message }); }
});

module.exports = router;
