const mongoose = require('mongoose');
require('dotenv').config();

const seedDB = async () => {
  const Product   = require('../models/Product');
  const PromoCode = require('../models/PromoCode');
  const User      = require('../models/User');

  // ── Products ──────────────────────────────────────────────────
  await Product.deleteMany({});
  await Product.insertMany([
    { name:'Chapati', slug:'chapati', tagline:'Soft & Healthy', category:'chapati', price:49, originalPrice:60, unit:'pack of 5', badge:'BESTSELLER', image:'/images/chapati.jpg', color:'#E8620A', bgColor:'#fff5eb', stock:200, isFeatured:true, description:'Hand-rolled from whole chakki fresh atta. Soft chapatis ready in minutes.', ingredients:'Whole Wheat Flour (Chakki Fresh), Water (RO & UV Purified), Vegetable Oil, Iodized Salt', storage:'Refrigerator: 10 days. Without refrigerator: 3 days.', instructions:'Heat on iron tawa 30 sec each side. Press with cloth to puff. Serve warm.', features:['No Preservatives','No Artificial Flavours','100% Whole Wheat','Heat & Eat in 2 min'], nutritionInfo:{ calories:120, protein:3.5, carbs:22, fat:2.5, fiber:2.8 }, tags:['chapati','roti','wheat','healthy','breakfast'] },
    { name:'Poori', slug:'poori', tagline:'Crispy & Delicious', category:'poori', price:59, originalPrice:70, unit:'pack of 6', badge:'POPULAR', image:'/images/poori.jpg', color:'#2D6A2D', bgColor:'#eef7ee', stock:150, isFeatured:true, description:'Golden deep-fried pooris from whole chakki fresh atta. Puffed to perfection.', ingredients:'Whole Wheat Flour (Chakki Fresh), Hydrogenated Vegetable Oil, Water (RO & UV Purified), Iodized Salt', storage:'Refrigerator: 3 days. Without refrigerator: 7 days.', instructions:'Heat oil in deep pan. Slide poori in. Press centre gently. Fry until golden. Drain on paper towel.', features:['No Preservatives','Premium Atta','Perfectly Puffed','Heat & Eat'], nutritionInfo:{ calories:180, protein:3.8, carbs:24, fat:8.2, fiber:2.2 }, tags:['poori','fried','festive','weekend'] },
    { name:'Chitti Poori', slug:'chitti-poori', tagline:'Perfect for Special Meals', category:'special', price:55, originalPrice:65, unit:'pack of 10', badge:'SPECIAL', image:'/images/chitti-poori.jpg', color:'#8B4513', bgColor:'#fff5ee', stock:120, isFeatured:true, description:'Mini bite-sized pooris perfect for festive meals, chaat & special occasions.', ingredients:'Whole Wheat Flour (Chakki Fresh), Hydrogenated Vegetable Oil, Water (RO & UV Purified), Iodized Salt', storage:'Refrigerator: 3 days. Without refrigerator: 7 days.', instructions:'Fry in batches in hot oil until golden and puffed. Drain well. Serve with chutneys.', features:['Bite-Sized','No Preservatives','Festive Ready','Crispy'], nutritionInfo:{ calories:95, protein:2.2, carbs:13, fat:4.1, fiber:1.5 }, tags:['chitti','mini poori','festive','chaat','party'] },
    { name:'Chapati Combo 3x', slug:'chapati-combo-3x', tagline:'Family Value Pack', category:'combo', price:129, originalPrice:180, unit:'3 packs × 5 chapatis', badge:'VALUE', image:'/images/chapati.jpg', color:'#1B3A6B', bgColor:'#e8f0fe', stock:80, description:'3 packs of our bestselling Chapati — 15 chapatis at a great saving.', ingredients:'Whole Wheat Flour, Water, Vegetable Oil, Iodized Salt', storage:'Refrigerator: 10 days.', instructions:'Same as individual Chapati pack.', features:['Best Value','15 Chapatis','Free Delivery','Family Pack'], tags:['combo','family pack','chapati','bulk','value'] },
    { name:'Mixed Combo', slug:'mixed-combo', tagline:'Best of All 3', category:'combo', price:149, originalPrice:220, unit:'3 packs combo', badge:'HOT', image:'/images/chapati.jpg', color:'#7B3B10', bgColor:'#fdf3e7', stock:60, isFeatured:true, description:'1 pack each of Chapati, Poori & Chitti Poori — try everything!', ingredients:'Whole Wheat Flour, Hydrogenated Vegetable Oil, Water, Iodized Salt, Vegetable Oil', storage:'Follow individual product storage.', instructions:'Follow individual product instructions.', features:['3 Products in 1','Biggest Saving','Try Everything','Free Delivery'], tags:['combo','mixed','variety','trial'] },
    { name:'Poori Family Pack', slug:'poori-family-pack', tagline:'Party Ready', category:'combo', price:269, originalPrice:350, unit:'5 packs × 6 pooris', badge:'FAMILY', image:'/images/chapati.jpg', color:'#2D6A2D', bgColor:'#eef7ee', stock:50, description:'30 pooris total — perfect for parties, pujas & family gatherings.', ingredients:'Whole Wheat Flour, Hydrogenated Vegetable Oil, Water, Iodized Salt', storage:'Refrigerator: 3 days.', instructions:'Fry in hot oil until golden and puffed. Drain and serve.', features:['30 Pooris Total','Party Ready','Bulk Price','Free Delivery'], tags:['family pack','poori','party','bulk','celebration'] },
  ]);
  console.log('✅ 6 products seeded');

  // ── Promo Codes ────────────────────────────────────────────────
  await PromoCode.deleteMany({});
  await PromoCode.insertMany([
    { code:'SRFRESH20', description:'20% off all products (max ₹100)',    discountType:'percentage', discountValue:20, maxDiscount:100, minOrderValue:99,  usageLimit:1000, perUserLimit:1, isActive:true, expiresAt:new Date('2026-12-31') },
    { code:'WELCOME10', description:'10% off for new customers (max ₹50)', discountType:'percentage', discountValue:10, maxDiscount:50,  minOrderValue:49,  usageLimit:500,  perUserLimit:1, isActive:true, expiresAt:new Date('2026-12-31') },
    { code:'POORI15',   description:'15% off Poori products (max ₹75)',    discountType:'percentage', discountValue:15, maxDiscount:75,  minOrderValue:59,  applicableTo:'poori', usageLimit:300, perUserLimit:2, isActive:true, expiresAt:new Date('2026-12-31') },
    { code:'FLAT30',    description:'Flat ₹30 off on orders above ₹149',  discountType:'flat',       discountValue:30,                 minOrderValue:149, usageLimit:200,  perUserLimit:1, isActive:true, expiresAt:new Date('2026-12-31') },
    { code:'COMBO25',   description:'25% off combo packs (max ₹120)',      discountType:'percentage', discountValue:25, maxDiscount:120, minOrderValue:129, applicableTo:'combo', usageLimit:150, perUserLimit:1, isActive:true, expiresAt:new Date('2026-12-31') },
  ]);
  console.log('✅ 5 promo codes seeded');

  // ── Admin user ─────────────────────────────────────────────────
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@srfoods.com';
  const adminPass  = process.env.ADMIN_PASSWORD || 'Admin@1234';
  if (!(await User.findOne({ email: adminEmail }))) {
    await User.create({ name:'SR Foods Admin', email:adminEmail, password:adminPass, role:'admin', phone:'9177231026' });
    console.log(`✅ Admin user created → ${adminEmail} / ${adminPass}`);
  }
};

if (require.main === module) {
  mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/srfoods')
    .then(async () => { await seedDB(); await mongoose.disconnect(); console.log('🌱 Done!'); })
    .catch(err => { console.error(err); process.exit(1); });
}

module.exports = seedDB;
