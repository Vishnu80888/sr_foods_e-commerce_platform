const express    = require('express');
const router     = express.Router();
const Order      = require('../models/Order');
const Product    = require('../models/Product');
const User       = require('../models/User');
const Review     = require('../models/Review');
const Contact    = require('../models/Contact');
const Newsletter = require('../models/Newsletter');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);

router.get('/dashboard', async (_req,res) => {
  try {
    const now=new Date(), today=new Date(now.getFullYear(),now.getMonth(),now.getDate()), month=new Date(now.getFullYear(),now.getMonth(),1), week=new Date(Date.now()-7*86400000);
    const [totalOrders,todayOrders,monthOrders,totalRevArr,todayRevArr,monthRevArr,totalUsers,newUsersMonth,totalProducts,lowStock,pendingOrders,newContacts,subscribers,ordersByStatus,recentOrders,topProducts,revenueByDay] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ createdAt:{ $gte:today } }),
      Order.countDocuments({ createdAt:{ $gte:month } }),
      Order.aggregate([{ $match:{ status:{ $ne:'cancelled' } } },{ $group:{ _id:null, v:{ $sum:'$total' } } }]),
      Order.aggregate([{ $match:{ createdAt:{ $gte:today }, status:{ $ne:'cancelled' } } },{ $group:{ _id:null, v:{ $sum:'$total' } } }]),
      Order.aggregate([{ $match:{ createdAt:{ $gte:month }, status:{ $ne:'cancelled' } } },{ $group:{ _id:null, v:{ $sum:'$total' } } }]),
      User.countDocuments({ role:'customer' }),
      User.countDocuments({ role:'customer', createdAt:{ $gte:month } }),
      Product.countDocuments({ isActive:true }),
      Product.countDocuments({ isActive:true, stock:{ $lt:20 } }),
      Order.countDocuments({ status:{ $in:['placed','confirmed','packing'] } }),
      Contact.countDocuments({ status:'new' }),
      Newsletter.countDocuments({ active:true }),
      Order.aggregate([{ $group:{ _id:'$status', count:{ $sum:1 } } }]),
      Order.find().sort({ createdAt:-1 }).limit(8).populate('user','name email'),
      Order.aggregate([{ $unwind:'$items' },{ $group:{ _id:'$items.name', totalQty:{ $sum:'$items.quantity' }, revenue:{ $sum:{ $multiply:['$items.price','$items.quantity'] } } } },{ $sort:{ totalQty:-1 } },{ $limit:6 }]),
      Order.aggregate([{ $match:{ createdAt:{ $gte:week }, status:{ $ne:'cancelled' } } },{ $group:{ _id:{ $dateToString:{ format:'%Y-%m-%d', date:'$createdAt' } }, revenue:{ $sum:'$total' }, orders:{ $sum:1 } } },{ $sort:{ _id:1 } }]),
    ]);
    res.json({ success:true, data:{ overview:{ totalOrders,todayOrders,monthOrders, totalRevenue:totalRevArr[0]?.v||0, todayRevenue:todayRevArr[0]?.v||0, monthRevenue:monthRevArr[0]?.v||0, totalUsers,newUsersMonth,totalProducts,lowStock,pendingOrders,newContacts,subscribers }, ordersByStatus:ordersByStatus.reduce((a,s)=>{ a[s._id]=s.count; return a; },{}), recentOrders, topProducts, revenueByDay } });
  } catch (err) { res.status(500).json({ error:err.message }); }
});

router.get('/users', async (req,res) => {
  try {
    const { q,page=1,limit=20 } = req.query;
    const filter = { role:'customer' };
    if (q) filter.$or=[{ name:{ $regex:q,$options:'i' } },{ email:{ $regex:q,$options:'i' } }];
    const total=await User.countDocuments(filter);
    const data=await User.find(filter).select('-password').sort({ createdAt:-1 }).skip((page-1)*limit).limit(Number(limit));
    res.json({ success:true, total, data });
  } catch (err) { res.status(500).json({ error:err.message }); }
});

router.patch('/users/:id', async (req,res) => {
  try {
    const user=await User.findByIdAndUpdate(req.params.id,req.body,{ new:true }).select('-password');
    if (!user) return res.status(404).json({ error:'Not found' });
    res.json({ success:true, data:user });
  } catch (err) { res.status(500).json({ error:err.message }); }
});

router.get('/reviews', async (_req,res) => {
  try { res.json({ success:true, data: await Review.find().populate('user','name email').populate('product','name').sort({ createdAt:-1 }).limit(50) }); }
  catch (err) { res.status(500).json({ error:err.message }); }
});

router.get('/contacts', async (_req,res) => {
  try { res.json({ success:true, data: await require('../models/Contact').find().sort({ createdAt:-1 }).limit(50) }); }
  catch (err) { res.status(500).json({ error:err.message }); }
});

module.exports = router;
