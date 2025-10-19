import Admin from '../models/Admin.js';

// Middleware to check if user is authenticated as admin
export const requireAdminAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No admin token provided.'
      });
    }

    // Verify token (using the same generateToken utility)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get admin from token
    const admin = await Admin.findById(decoded.id).select('+password');
    
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Admin not found'
      });
    }

    if (!admin.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Admin account is deactivated'
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid admin token'
    });
  }
};

// Middleware to check if admin has specific permission
export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: 'Admin authentication required'
      });
    }

    if (!req.admin.hasPermission(permission)) {
      return res.status(403).json({
        success: false,
        message: `Insufficient permissions. Required: ${permission}`
      });
    }

    next();
  };
};

// Middleware to check if admin is super admin
export const requireSuperAdmin = (req, res, next) => {
  if (!req.admin) {
    return res.status(401).json({
      success: false,
      message: 'Admin authentication required'
    });
  }

  if (req.admin.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: 'Super admin access required'
    });
  }

  next();
};