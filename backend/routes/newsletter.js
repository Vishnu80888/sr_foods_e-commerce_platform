const express    = require('express');
const router     = express.Router();
const Newsletter = require('../models/Newsletter');
const { protect, adminOnly } = require('../middleware/auth');

router.post('/', async (req,res) => {
  try {
    const { email,name } = req.body;
    if (!email) return res.status(400).json({ error:'Email required' });
    const existing = await Newsletter.findOne({ email:email.toLowerCase() });
    if (existing) {
      if (existing.active) return res.status(409).json({ error:'Already subscribed' });
      existing.active=true; await existing.save();
      return res.json({ success:true, message:'Re-subscribed! Welcome back.' });
    }
    await Newsletter.create({ email,name });
    res.status(201).json({ success:true, message:'Subscribed! Watch for exclusive deals.' });
  } catch (err) { res.status(500).json({ error:err.message }); }
});

router.delete('/unsubscribe/:email', async (req,res) => {
  try { await Newsletter.findOneAndUpdate({ email:req.params.email },{ active:false }); res.json({ success:true, message:'Unsubscribed' }); }
  catch (err) { res.status(500).json({ error:err.message }); }
});

router.get('/', protect, adminOnly, async (_req,res) => {
  try { const subs=await Newsletter.find({ active:true }).sort({ createdAt:-1 }); res.json({ success:true, total:subs.length, data:subs }); }
  catch (err) { res.status(500).json({ error:err.message }); }
});

module.exports = router;
