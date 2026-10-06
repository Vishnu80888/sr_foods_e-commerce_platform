const express = require('express');
const router  = express.Router();
const Contact = require('../models/Contact');
const { protect, adminOnly } = require('../middleware/auth');

router.post('/', async (req,res) => {
  try {
    const { name,email,phone,product,subject,message } = req.body;
    if (!name||!email||!message) return res.status(400).json({ error:'Name, email and message required' });
    const contact = await Contact.create({ name,email,phone,product,subject,message });
    res.status(201).json({ success:true, message:'Message sent! We reply within 24 hours.', data:contact });
  } catch (err) { res.status(500).json({ error:err.message }); }
});

router.get('/', protect, adminOnly, async (req,res) => {
  try {
    const { status,page=1,limit=20 } = req.query;
    const filter = status?{ status }:{};
    const total    = await Contact.countDocuments(filter);
    const contacts = await Contact.find(filter).sort({ createdAt:-1 }).skip((page-1)*limit).limit(Number(limit));
    res.json({ success:true, total, data:contacts });
  } catch (err) { res.status(500).json({ error:err.message }); }
});

router.patch('/:id', protect, adminOnly, async (req,res) => {
  try {
    const contact = await Contact.findByIdAndUpdate(req.params.id,req.body,{ new:true });
    if (!contact) return res.status(404).json({ error:'Not found' });
    res.json({ success:true, data:contact });
  } catch (err) { res.status(500).json({ error:err.message }); }
});

module.exports = router;
