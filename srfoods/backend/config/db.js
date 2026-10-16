const mongoose = require('mongoose');

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }
  if (!cached.promise) {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/srfoods';
    const opts = {
      bufferCommands: false,
    };
    cached.promise = mongoose.connect(MONGO_URI, opts).then(async (m) => {
      console.log('✅ MongoDB connected');
      try {
        const Product = require('../models/Product');
        if ((await Product.countDocuments()) === 0) {
          await require('./seed')();
          console.log('🌱 Database seeded with products, promo codes & admin user');
        }
      } catch (err) {
        console.warn('Seeder notice:', err.message);
      }
      return m;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

module.exports = connectDB;
