import jwt from "jsonwebtoken";
import User from '../models/User.js';

const auth = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, message: 'Token missing or malformed.' });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Token expired' });
      }
      if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ success: false, message: 'Invalid token' });
      }
      throw err;
    }

    // Get user from DB
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ success: false, message: 'User not found' });

    // Check account status
    if (!user.isActive) return res.status(401).json({ success: false, message: 'Account is deactivated' });

    // Attach user to request
    req.user = user;

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ success: false, message: 'Server error during authentication' });
  }
};

export default auth;
