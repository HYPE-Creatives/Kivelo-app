import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";

/**
 * Middleware: Authenticate Admin using JWT
 */
export const requireAdminAuth = async (req, res, next) => {
  try {
    let token;

    // Extract token from "Authorization" header
    if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No admin token provided.",
      });
    }

    // Verify token signature
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch admin from DB
    const admin = await Admin.findById(decoded.id).select("+password");
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Admin not found.",
      });
    }

    // Check account status
    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        message: "Admin account is deactivated.",
      });
    }

    // Attach verified admin to request
    req.admin = admin;
    next();
  } catch (error) {
    console.error("Admin auth error:", error);

    // Handle common JWT errors
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Admin token expired. Please log in again.",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid admin token.",
      });
    }

    // Default catch-all
    res.status(500).json({
      success: false,
      message: "Server error during admin authentication.",
    });
  }
};

/**
 * Middleware: Check specific admin permission
 */
export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: "Admin authentication required.",
      });
    }
     // Super admin has all permissions
    if (req.admin.role === 'super_admin') {
      return next();
    }
    
    if (typeof req.admin.hasPermission !== "function") {
      return res.status(500).json({
        success: false,
        message: "Admin permissions not configured properly.",
      });
    }

    if (!req.admin.hasPermission(permission)) {
      return res.status(403).json({
        success: false,
        message: `Insufficient permissions. Required: ${permission}`,
      });
    }

    next();
  };
};

/**
 * Middleware: Restrict route to Super Admin only
 */
export const requireSuperAdmin = (req, res, next) => {
  if (!req.admin) {
    return res.status(401).json({
      success: false,
      message: "Admin authentication required.",
    });
  }

  if (!["superadmin", "super_admin"].includes(req.admin.role)) {
    return res.status(403).json({
      success: false,
      message: "Super admin access required.",
    });
  }

  next();
};
