const jwt  = require('jsonwebtoken');
const User = require('../models/User');

const SECRET = () => process.env.JWT_SECRET || 'srfoods_dev_secret';

/** Require valid JWT – attaches req.user */
const protect = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer '))
    return res.status(401).json({ error: 'Not authorised – no token' });
  try {
    const decoded = jwt.verify(header.split(' ')[1], SECRET());
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user)          return res.status(401).json({ error: 'User not found' });
    if (!req.user.isActive) return res.status(401).json({ error: 'Account deactivated' });
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token – please login again' });
  }
};

/** Attach user if token present, never block */
const optionalAuth = async (req, _res, next) => {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(header.split(' ')[1], SECRET());
      req.user = await User.findById(decoded.id).select('-password');
    } catch { /* ignore */ }
  }
  next();
};

/** Must be admin */
const adminOnly = (req, res, next) => {
  if (req.user?.role === 'admin') return next();
  return res.status(403).json({ error: 'Admin access required' });
};

/** Sign a JWT for a user _id */
const generateToken = (id) =>
  jwt.sign({ id }, SECRET(), { expiresIn: process.env.JWT_EXPIRE || '7d' });

module.exports = { protect, optionalAuth, adminOnly, generateToken };
