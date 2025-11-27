import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";

// ===============================
// AUTHENTICATE ADMIN ACCESS TOKEN
// ===============================
export const requireAdminAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No admin access token provided",
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired admin token",
      });
    }

    // ROLE MUST BE ADMIN TYPE
    if (!["admin", "super_admin", "guest_admin"].includes(decoded.role)) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized role for admin access",
      });
    }

    const admin = await Admin.findById(decoded.id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        message: "Admin account is deactivated",
      });
    }

    req.admin = admin;
    next();

  } catch (error) {
    console.error("Admin auth error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during admin authentication",
    });
  }
};

// ===============================
// SPECIFIC PERMISSION CHECK
// ===============================
export const requirePermission = (permission) => {
  return (req, res, next) => {
    const admin = req.admin;

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Admin authentication required",
      });
    }

    if (admin.role === "super_admin") {
      return next(); // super admin always allowed
    }

    if (!admin.permissions || !admin.permissions[permission]) {
      return res.status(403).json({
        success: false,
        message: `Permission '${permission}' is required`,
      });
    }

    next();
  };
};

// ===============================
// SUPER ADMIN ONLY
// ===============================
export const requireSuperAdmin = (req, res, next) => {
  const admin = req.admin;

  if (!admin) {
    return res.status(401).json({
      success: false,
      message: "Admin authentication required",
    });
    }

  if (admin.role !== "super_admin") {
    return res.status(403).json({
      success: false,
      message: "Super admin access required",
    });
  }

  next();
};
