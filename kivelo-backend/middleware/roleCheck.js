import { resolveChildAccess } from "../utils/resolveChildAccess.js";

/* -----------------------------------------
   PARENT ONLY
----------------------------------------- */
export const isParent = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required"
    });
  }

  if (req.user.role !== "parent") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Parent privileges required."
    });
  }

  next();
};


/* -----------------------------------------
   CHILD ONLY
----------------------------------------- */
export const isChild = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required"
    });
  }

  if (req.user.role !== "child") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Child privileges required."
    });
  }

  next();
};


/* -----------------------------------------
   PARENT MUST HAVE ACCESS TO CHILD
----------------------------------------- */
export const hasAccessToChild = async (req, res, next) => {
  try {
    const parentId = req.user._id.toString();
    const childId = req.params.childId?.toString();

    if (!childId) {
      return res.status(400).json({ success: false, message: "Child ID is required" });
    }

    if (req.user.role !== "parent") {
      return res.status(403).json({
        success: false,
        message: "Only parents can access child data"
      });
    }

    const resolved = await resolveChildAccess(parentId, childId);

    if (!resolved) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to access this child"
      });
    }

    req.resolvedChild = resolved;
    next();

  } catch (error) {
    console.error("Error in hasAccessToChild:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while verifying child access"
    });
  }
};


/* -----------------------------------------
   ADMIN ONLY
----------------------------------------- */
export const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required"
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin privileges required."
    });
  }

  next();
};


/* -----------------------------------------
   PARENT OR ADMIN
----------------------------------------- */
export const isParentOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required"
    });
  }

  if (req.user.role !== "parent" && req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Parent or Admin privileges required."
    });
  }

  next();
};


/* -----------------------------------------
   SELF OR PARENT ACCESS
----------------------------------------- */
export const isSelfOrParent = async (req, res, next) => {
  try {
    const requesterId = req.user._id.toString();
    const targetId = (req.params.userId || req.params.childId)?.toString();

    if (!targetId) return next();

    // If accessing own data
    if (requesterId === targetId) return next();

    // Parent accessing child's data → use proper validator
    if (req.user.role === "parent") {
      const resolved = await resolveChildAccess(requesterId, targetId);

      if (resolved) {
        req.resolvedChild = resolved;
        return next();
      }
    }

    // Admin allowed
    if (req.user.role === "admin") return next();

    return res.status(403).json({
      success: false,
      message: "You do not have permission to access this resource"
    });

  } catch (error) {
    console.error("Error in isSelfOrParent:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during permission check"
    });
  }
};
