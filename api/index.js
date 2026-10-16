const dotenv = require('dotenv');
dotenv.config();

const connectDB = require('../srfoods/backend/config/db');
const app = require('../srfoods/backend/server');

module.exports = async (req, res) => {
  try {
    await connectDB();
  } catch (err) {
    console.error('❌ Serverless MongoDB connection error:', err.message);
    return res.status(500).json({
      error: 'Database connection failed',
      details: err.message,
    });
  }
  return app(req, res);
};
