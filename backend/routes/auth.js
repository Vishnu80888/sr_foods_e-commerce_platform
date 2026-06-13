// routes/auth.js
const express  = require('express');
const router   = express.Router();
const User     = require('../models/User');
const { protect, generateToken } = require('../middleware/auth');

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    if (await User.findOne({ email: email.toLowerCase() })) return res.status(409).json({ error: 'Email already registered – please login' });
    const user = await User.create({ name, email, password, phone });
    user.lastLogin = new Date(); await user.save();
    res.status(201).json({ success:true, message:'Account created!', token:generateToken(user._id), user:user.toJSON() });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await user.matchPassword(password))) return res.status(401).json({ error: 'Invalid email or password' });
    if (!user.isActive) return res.status(401).json({ error: 'Account deactivated – contact support' });
    user.lastLogin = new Date(); await user.save();
    res.json({ success:true, message:'Login successful', token:generateToken(user._id), user:user.toJSON() });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/me', protect, (req, res) => res.json({ success:true, user:req.user }));

router.put('/profile', protect, async (req, res) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findById(req.user._id);
    if (name) user.name = name; if (phone) user.phone = phone;
    await user.save();
    res.json({ success:true, message:'Profile updated', user:user.toJSON() });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Both fields required' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters' });
    const user = await User.findById(req.user._id);
    if (!(await user.matchPassword(currentPassword))) return res.status(401).json({ error: 'Current password incorrect' });
    user.password = newPassword; await user.save();
    res.json({ success:true, message:'Password changed', token:generateToken(user._id) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/address', protect, async (req, res) => {
  try {
    const { label, name, phone, line1, line2, city, state, pincode, isDefault } = req.body;
    if (!name||!phone||!line1||!city||!state||!pincode) return res.status(400).json({ error: 'All address fields required' });
    const user = await User.findById(req.user._id);
    if (isDefault) user.addresses.forEach(a => a.isDefault = false);
    user.addresses.push({ label, name, phone, line1, line2, city, state, pincode, isDefault:!!isDefault });
    await user.save();
    res.status(201).json({ success:true, addresses:user.addresses });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/address/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.addresses = user.addresses.filter(a => a._id.toString() !== req.params.id);
    await user.save();
    res.json({ success:true, addresses:user.addresses });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
