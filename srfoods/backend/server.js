const express   = require('express');
const mongoose  = require('mongoose');
const cors      = require('cors');
const dotenv    = require('dotenv');
const rateLimit = require('express-rate-limit');

dotenv.config();
const app = express();
app.set('trust proxy', 1);

const path     = require('path');
const fs       = require('fs');

// ── Rate limiting ─────────────────────────────────────────────
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 300,
  message: { error: 'Too many requests – please slow down.' } }));

// ── Middleware ────────────────────────────────────────────────
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map(s => s.trim())
  : ['http://localhost:3000', 'http://localhost:5000'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Dev logger
if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toTimeString().slice(0,8)}] ${req.method} ${req.path}`);
    next();
  });
}

// ── Routes ────────────────────────────────────────────────────
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/products',   require('./routes/products'));
app.use('/api/cart',       require('./routes/cart'));
app.use('/api/orders',     require('./routes/orders'));
app.use('/api/reviews',    require('./routes/reviews'));
app.use('/api/wishlist',   require('./routes/wishlist'));
app.use('/api/contacts',   require('./routes/contacts'));
app.use('/api/newsletter', require('./routes/newsletter'));
app.use('/api/promo',      require('./routes/promo'));
app.use('/api/admin',      require('./routes/admin'));

// ── Health check ──────────────────────────────────────────────
app.get('/api/health', (_req, res) =>
  res.json({ status: 'OK', time: new Date(), env: process.env.NODE_ENV }));

// ── Serve Production Frontend Build (Monolith Deployment) ──────
const buildPath = path.join(__dirname, '../frontend/build');
if (fs.existsSync(buildPath)) {
  app.use(express.static(buildPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(buildPath, 'index.html'));
  });
}

// ── 404 for unmatched API routes ──────────────────────────────
app.use('/api/*', (_req, res) => res.status(404).json({ error: 'API route not found' }));
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

// ── Global error handler ──────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('❌', err.message);
  res.status(err.statusCode || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

// ── Connect & Start ───────────────────────────────────────────
const PORT      = process.env.PORT      || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/srfoods';

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('✅ MongoDB connected');
    const Product = require('./models/Product');
    if ((await Product.countDocuments()) === 0) {
      await require('./config/seed')();
      console.log('🌱 Database seeded with products, promo codes & admin user');
    }
    app.listen(PORT, () =>
      console.log(`\n🚀 SR Foods API running → http://localhost:${PORT}/api/health\n`));
  })
  .catch(err => { console.error('❌ MongoDB connection failed:', err.message); process.exit(1); });
