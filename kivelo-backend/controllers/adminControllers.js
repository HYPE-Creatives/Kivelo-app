import Admin from '../models/Admin.js';
import User from '../models/User.js';
import Parent from '../models/Parent.js';
import Child from '../models/Child.js';
import Activity from '../models/Activity.js';
import generateToken from '../utils/generateToken.js';
import bcrypt from 'bcryptjs';

// ========================= ADMIN AUTHENTICATION =========================

// Super Admin Initial Setup (Run once to create first super admin)
export const setupSuperAdmin = async (req, res) => {
  try {
    // Check if any super admin already exists
    const existingSuperAdmin = await Admin.findOne({ role: 'super_admin' });
    if (existingSuperAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Super admin already exists'
      });
    }

    const { email, password, name } = req.body;

    // Create super admin with all permissions
    const superAdmin = await Admin.create({
      email,
      password,
      name,
      role: 'super_admin',
      permissions: {
        users: true,
        parents: true,
        children: true,
        activities: true,
        analytics: true,
        settings: true,
        admins: true // Add admins permission for super admin
      }
    });

    const token = generateToken(superAdmin._id, 'admin');

    res.status(201).json({
      success: true,
      message: 'Super admin created successfully',
      token,
      admin: superAdmin.toSafeObject()
    });

  } catch (error) {
    console.error('Setup super admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Error setting up super admin'
    });
  }
};

// Admin Login
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find admin with password
    const admin = await Admin.findOne({ email: email.toLowerCase().trim() }).select('+password');
    
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    if (!admin.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Admin account is deactivated'
      });
    }

    // Check password
    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    const token = generateToken(admin._id, 'admin');

    res.status(200).json({
      success: true,
      message: 'Admin login successful',
      token,
      admin: admin.toSafeObject()
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during admin login'
    });
  }
};

// ========================= ADMIN MANAGEMENT =========================

// Create new admin (Super Admin only)
export const createAdmin = async (req, res) => {
  try {
    const { email, password, name, role, permissions } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and name are required'
      });
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(409).json({
        success: false,
        message: 'Admin with this email already exists'
      });
    }

    // Ensure permissions object includes all fields with defaults
    const adminPermissions = {
      users: false,
      parents: false,
      children: false,
      activities: false,
      analytics: false,
      settings: false,
      admins: false,
      audit: false,
      ...permissions // Override with provided permissions
    };

    const adminData = {
      email,
      password,
      name,
      role: role || 'guest_admin',
      permissions: permissions || {},
      createdBy: req.admin._id
    };

    const admin = await Admin.create(adminData);

    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      admin: admin.toSafeObject()
    });

  } catch (error) {
    console.error('Create admin error:', error);
    
    // Handle validation errors specifically
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    // Handle duplicate email
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Admin with this email already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating admin'
    });
  }
};

// Get all admins (Super Admin only)
export const getAdmins = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, isActive } = req.query;
    
    const filter = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const admins = await Admin.find(filter)
      .select('-password -loginAttempts -lockUntil')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Admin.countDocuments(filter);

    res.status(200).json({
      success: true,
      admins,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Get admins error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching admins'
    });
  }
};

// Update admin
export const updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, permissions, isActive } = req.body;

    // Only super admin can update role and permissions
    if ((role || permissions) && req.admin.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only super admin can update roles and permissions'
      });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (role) updateData.role = role;
    if (permissions) updateData.permissions = permissions;
    if (isActive !== undefined) updateData.isActive = isActive;

    const admin = await Admin.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -loginAttempts -lockUntil');

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Admin updated successfully',
      admin
    });

  } catch (error) {
    console.error('Update admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating admin'
    });
  }
};

// Set admin permissions (Super Admin only)
export const setAdminPermissions = async (req, res) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;

    // Validate permissions object
    if (!permissions || typeof permissions !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Valid permissions object is required'
      });
    }

    // Check if admin exists
    const admin = await Admin.findById(id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Prevent modifying super admin permissions
    if (admin.role === 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot modify super admin permissions'
      });
    }

    // Update permissions
    admin.permissions = {
      ...admin.permissions,
      ...permissions
    };

    await admin.save();

    res.status(200).json({
      success: true,
      message: 'Admin permissions updated successfully',
      admin: admin.toSafeObject()
    });

  } catch (error) {
    console.error('Set admin permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error setting admin permissions'
    });
  }
};

// Get admin permissions (for specific admin)
export const getAdminPermissions = async (req, res) => {
  try {
    const { id } = req.params;

    const admin = await Admin.findById(id).select('permissions role name email');
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    res.status(200).json({
      success: true,
      permissions: admin.permissions,
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });

  } catch (error) {
    console.error('Get admin permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching admin permissions'
    });
  }
};

// Delete admin (Super Admin only)
export const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (id === req.admin._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    const admin = await Admin.findByIdAndDelete(id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Admin deleted successfully'
    });

  } catch (error) {
    console.error('Delete admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting admin'
    });
  }
};

// ========================= USER MANAGEMENT =========================

// Get all users with filtering and pagination
export const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, isActive, search } = req.query;
    
    const filter = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(filter);

    res.status(200).json({
      success: true,
      users,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users'
    });
  }
};

// Get user details
export const getUserDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let additionalData = {};
    
    if (user.role === 'parent') {
      const parent = await Parent.findOne({ user: id }).populate('children');
      additionalData.parent = parent;
    } else if (user.role === 'child') {
      const child = await Child.findOne({ user: id }).populate('parent');
      additionalData.child = child;
    }

    res.status(200).json({
      success: true,
      user: {
        ...user.toObject(),
        ...additionalData
      }
    });

  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user details'
    });
  }
};

// Update user status
export const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user
    });

  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user status'
    });
  }
};

// ========================= ANALYTICS & DASHBOARD =========================

// Get admin dashboard statistics
export const getAdminDashboard = async (req, res) => {
  try {
    const [
      totalUsers,
      totalParents,
      totalChildren,
      totalActivities,
      recentUsers,
      activeToday
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'parent' }),
      User.countDocuments({ role: 'child' }),
      Activity.countDocuments(),
      User.find().sort({ createdAt: -1 }).limit(5).select('name email role createdAt'),
      User.countDocuments({
        lastLogin: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      })
    ]);

    // Weekly signups
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const weeklySignups = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: oneWeekAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.status(200).json({
      success: true,
      dashboard: {
        overview: {
          totalUsers,
          totalParents,
          totalChildren,
          totalActivities,
          activeToday
        },
        recentUsers,
        weeklySignups
      }
    });

  } catch (error) {
    console.error('Get admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data'
    });
  }
};

// Get system analytics
export const getSystemAnalytics = async (req, res) => {
  try {
    // User growth over time
    const userGrowth = await User.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 }
      }
    ]);

    // Activity completion rates
    const activityStats = await Activity.aggregate([
      {
        $group: {
          _id: "$completed",
          count: { $sum: 1 }
        }
      }
    ]);

    // User role distribution
    const roleDistribution = await User.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      analytics: {
        userGrowth,
        activityStats,
        roleDistribution
      }
    });

  } catch (error) {
    console.error('Get system analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching system analytics'
    });
  }
};

// ========================= SYSTEM MANAGEMENT =========================

// Get system settings (placeholder - extend as needed)
export const getSystemSettings = async (req, res) => {
  try {
    // This would typically come from a Settings model
    const settings = {
      appName: "Family Wellness",
      version: "1.0.0",
      maintenanceMode: false,
      maxLoginAttempts: 5,
      sessionTimeout: 24, // hours
      // Add more settings as needed
    };

    res.status(200).json({
      success: true,
      settings
    });

  } catch (error) {
    console.error('Get system settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching system settings'
    });
  }
};

// Update system settings (Super Admin only)
export const updateSystemSettings = async (req, res) => {
  try {
    const { maintenanceMode, sessionTimeout } = req.body;

    // In a real application, you would save these to a Settings model
    // For now, we'll just return success

    res.status(200).json({
      success: true,
      message: 'System settings updated successfully'
    });

  } catch (error) {
    console.error('Update system settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating system settings'
    });
  }
};

// Admin profile update
export const updateAdminProfile = async (req, res) => {
  try {
    const { name, email } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;

    const admin = await Admin.findByIdAndUpdate(
      req.admin._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -loginAttempts -lockUntil');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      admin
    });

  } catch (error) {
    console.error('Update admin profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile'
    });
  }
};

// Change admin password
export const changeAdminPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    // Get admin with password
    const admin = await Admin.findById(req.admin._id).select('+password');
    
    // Verify current password
    const isCurrentPasswordValid = await admin.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    admin.password = newPassword;
    await admin.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (error) {
    console.error('Change admin password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing password'
    });
  }
};