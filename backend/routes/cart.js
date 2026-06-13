const express = require('express');
const router  = express.Router();
const Cart    = require('../models/Cart');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');

router.use(protect);

const pop = uid => Cart.findOne({ user:uid }).populate('items.product','name emoji color bgColor price originalPrice unit stock isActive slug tagline');

router.get('/', async (req, res) => {
  try {
    const cart = await pop(req.user._id);
    if (!cart) return res.json({ success:true, data:{ items:[], total:0, itemCount:0 } });
    const items = cart.items.filter(i => i.product?.isActive);
    res.json({ success:true, data:{ items, total:items.reduce((s,i)=>s+i.price*i.quantity,0), itemCount:items.reduce((s,i)=>s+i.quantity,0) } });
  } catch (err) { res.status(500).json({ error:err.message }); }
});

router.post('/add', async (req, res) => {
  try {
    const { productId, quantity=1 } = req.body;
    if (!productId) return res.status(400).json({ error:'productId required' });
    const product = await Product.findById(productId);
    if (!product || !product.isActive) return res.status(404).json({ error:'Product not found' });
    if (product.stock < 1) return res.status(400).json({ error:'Out of stock' });
    let cart = await Cart.findOne({ user:req.user._id }) || new Cart({ user:req.user._id, items:[] });
    const ex = cart.items.find(i => i.product.toString() === productId);
    if (ex) { const nq = ex.quantity+quantity; if (nq>product.stock) return res.status(400).json({ error:`Only ${product.stock} available` }); ex.quantity=nq; ex.price=product.price; }
    else { if (quantity>product.stock) return res.status(400).json({ error:`Only ${product.stock} available` }); cart.items.push({ product:productId, quantity, price:product.price }); }
    await cart.save();
    const populated = await pop(req.user._id);
    const total = populated.items.reduce((s,i)=>s+i.price*i.quantity,0);
    res.json({ success:true, message:`${product.name} added to cart`, data:{ items:populated.items, total } });
  } catch (err) { res.status(500).json({ error:err.message }); }
});

router.put('/update', async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    if (!productId || quantity==null) return res.status(400).json({ error:'productId and quantity required' });
    const cart = await Cart.findOne({ user:req.user._id });
    if (!cart) return res.status(404).json({ error:'Cart not found' });
    if (quantity===0) { cart.items = cart.items.filter(i=>i.product.toString()!==productId); }
    else {
      const item = cart.items.find(i=>i.product.toString()===productId);
      if (!item) return res.status(404).json({ error:'Item not in cart' });
      const p = await Product.findById(productId);
      if (quantity>p.stock) return res.status(400).json({ error:`Only ${p.stock} available` });
      item.quantity = quantity;
    }
    await cart.save();
    const populated = await pop(req.user._id);
    res.json({ success:true, data:{ items:populated?.items||[], total:(populated?.items||[]).reduce((s,i)=>s+i.price*i.quantity,0) } });
  } catch (err) { res.status(500).json({ error:err.message }); }
});

router.delete('/remove/:productId', async (req, res) => {
  try {
    const cart = await Cart.findOne({ user:req.user._id });
    if (!cart) return res.status(404).json({ error:'Cart not found' });
    cart.items = cart.items.filter(i=>i.product.toString()!==req.params.productId);
    await cart.save();
    const populated = await pop(req.user._id);
    res.json({ success:true, data:{ items:populated?.items||[], total:(populated?.items||[]).reduce((s,i)=>s+i.price*i.quantity,0) } });
  } catch (err) { res.status(500).json({ error:err.message }); }
});

router.delete('/clear', async (req, res) => {
  try { await Cart.findOneAndUpdate({ user:req.user._id }, { items:[] }); res.json({ success:true, message:'Cart cleared' }); }
  catch (err) { res.status(500).json({ error:err.message }); }
});

module.exports = router;
