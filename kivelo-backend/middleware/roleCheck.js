import User from '../models/User.js';

/**
 * Middleware to verify if the authenticated user is a PARENT
 */
export const isParent = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (req.user.role !== 'parent') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Parent privileges required.'
      });
    }

    next();
  } catch (error) {
    console.error('Error in isParent middleware:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during role verification'
    });
  }
};

/**
 * Middleware to verify if the authenticated user is a CHILD
 */
export const isChild = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (req.user.role !== 'child') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Child privileges required.'
      });
    }

    next();
  } catch (error) {
    console.error('Error in isChild middleware:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during role verification'
    });
  }
};

/**
 * Middleware to verify if parent has access to a specific child
 * This is for routes like: /api/parent/child/:childId/...
 */
export const hasAccessToChild = async (req, res, next) => {
  try {
    const parentId = req.user._id;
    const childId = req.params.childId;
    
    if (!childId) {
      return res.status(400).json({
        success: false,
        message: 'Child ID is required'
      });
    }

    // Verify user is a parent
    if (req.user.role !== 'parent') {
      return res.status(403).json({
        success: false,
        message: 'Only parents can access child data'
      });
    }

    // Two ways to check access:
    // 1. Check parent's children array in User model
    // 2. Check Child model's parent reference
    
    // Option 1: Using User model (your current structure)
    const parent = await User.findById(parentId).select('parent.children');
    
    if (!parent) {
      return res.status(404).json({
        success: false,
        message: 'Parent not found'
      });
    }

    // Check if child exists in parent's children array
    const childExists = parent.parent?.children?.some(
      child => child.toString() === childId
    );

    if (!childExists) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this child'
      });
    }

    next();
  } catch (error) {
    console.error('Error in hasAccessToChild middleware:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid Child ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while verifying child access'
    });
  }
};

/**
 * Middleware to check if user is Admin (if you have admin role)
 */
export const isAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Assuming you might add admin role in future
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    next();
  } catch (error) {
    console.error('Error in isAdmin middleware:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during admin verification'
    });
  }
};

/**
 * Middleware to verify if user is either Parent OR Admin
 * Useful for routes that both parents and admins can access
 */
export const isParentOrAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (req.user.role !== 'parent' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Parent or Admin privileges required.'
      });
    }

    next();
  } catch (error) {
    console.error('Error in isParentOrAdmin middleware:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during role verification'
    });
  }
};

/**
 * Middleware to check if user owns the resource (for child accessing their own data)
 * Example: /api/child/profile should only be accessible by the child themselves
 */
export const isSelfOrParent = async (req, res, next) => {
  try {
    const requestingUserId = req.user._id;
    const targetUserId = req.params.userId || req.params.childId;
    
    if (!targetUserId) {
      return next(); // No specific user ID in route, proceed
    }

    // If user is accessing their own data
    if (requestingUserId.toString() === targetUserId) {
      return next();
    }

    // If user is parent, check if they have access to this child
    if (req.user.role === 'parent') {
      const parent = await User.findById(requestingUserId).select('parent.children');
      
      const hasAccess = parent.parent?.children?.some(
        child => child.toString() === targetUserId
      );
      
      if (hasAccess) {
        return next();
      }
    }

    // If user is admin, allow access
    if (req.user.role === 'admin') {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'You do not have permission to access this resource'
    });
    
  } catch (error) {
    console.error('Error in isSelfOrParent middleware:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during permission check'
    });
  }
};