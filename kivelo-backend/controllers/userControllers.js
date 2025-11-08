import User from '../models/User.js';
import CloudinaryService from '../services/cloudinaryService.js';
import Parent from '../models/Parent.js';
import Child from '../models/Child.js';
import Activity from '../models/Activity.js';
import bcrypt from 'bcryptjs';

// ========================= GET USER PROFILE =========================
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let additionalData = {};

    // Add role-specific data
    if (user.role === 'parent') {
      const parent = await Parent.findOne({ user: user._id });
      additionalData = {
        familyCode: parent?.familyCode,
        subscription: parent?.subscription,
        childrenCount: parent?.children?.length || 0
      };
    } else if (user.role === 'child') {
      const child = await Child.findOne({ user: user._id }).populate('parent', 'familyCode');
      additionalData = {
        hasSetPassword: child?.hasSetPassword || false,
        parentId: child?.parent?._id,
        familyCode: child?.parent?.familyCode,
        points: child?.points || 0,
        level: child?.level || 1
      };
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        dob: user.dob,
        avatar: user.avatar,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        ...additionalData
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile'
    });
  }
};

// ========================= UPDATE PROFILE =========================
export const updateProfile = async (req, res) => {
  try {
    const { name, phone, dob } = req.body;

    // Validation
    if (!name && !phone && !dob && !req.file) {
      return res.status(400).json({
        success: false,
        message: 'At least one field (name, phone, dob, or avatar) is required to update'
      });
    }

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (phone) updateData.phone = phone.trim();
    if (dob) updateData.dob = dob;

    // Handle avatar update if file is provided
    if (req.file) {
      const user = await User.findById(req.user._id);

      // Upload new avatar to Cloudinary
      const result = await CloudinaryService.uploadImage(req.file.path, 'kivelo-images/avatars');

      updateData.avatar = {
        url: result.secure_url,
        public_id: result.public_id,
      };

      // Delete old avatar from Cloudinary if exists
      if (user?.avatar?.public_id) {
        try {
          await CloudinaryService.deleteImage(user.avatar.public_id);
        } catch (deleteError) {
          console.error('Error deleting old avatar:', deleteError);
          // Continue with update even if deletion fails
        }
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        dob: user.dob,
        avatar: user.avatar
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating profile'
    });
  }
};

// ========================= UPDATE PASSWORD =========================
export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    // Get user with password field
    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Check if new password is different
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from current password'
      });
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating password'
    });
  }
};

// ========================= DEACTIVATE ACCOUNT =========================
export const deactivateAccount = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required to deactivate account'
      });
    }

    // Get user with password field
    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Password is incorrect'
      });
    }

    // Soft delete - set isActive to false
    user.isActive = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Account deactivated successfully. You can reactivate by logging in again.'
    });

  } catch (error) {
    console.error('Deactivate account error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deactivating account'
    });
  }
};

// ========================= GET DASHBOARD STATS =========================
export const getDashboardStats = async (req, res) => {
  try {
    const user = req.user;
    let dashboardData = {};

    if (user.role === 'parent') {
      // Parent dashboard
      const parent = await Parent.findOne({ user: user._id }).populate('children');

      const childrenStats = await Promise.all(
        (parent?.children || []).map(async (childId) => {
          const child = await Child.findById(childId).populate('user', 'name email avatar');
          const completedActivities = await Activity.countDocuments({
            assignedTo: childId,
            completed: true
          });

          return {
            id: child?._id,
            name: child?.user?.name,
            avatar: child?.user?.avatar,
            points: child?.points || 0,
            completedActivities,
            level: child?.level || 1,
            hasSetPassword: child?.hasSetPassword || false
          };
        })
      );

      const totalActivities = await Activity.countDocuments({
        createdBy: user._id
      });

      dashboardData = {
        role: 'parent',
        childrenCount: parent?.children?.length || 0,
        totalActivities,
        children: childrenStats,
        familyCode: parent?.familyCode,
        subscription: parent?.subscription
      };

    } else if (user.role === 'child') {
      // Child dashboard
      const child = await Child.findOne({ user: user._id });

      const completedActivities = await Activity.countDocuments({
        assignedTo: child?._id,
        completed: true
      });

      const pendingActivities = await Activity.countDocuments({
        assignedTo: child?._id,
        completed: false
      });

      const recentActivities = await Activity.find({
        assignedTo: child?._id
      })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title points completed completedAt');

      dashboardData = {
        role: 'child',
        points: child?.points || 0,
        level: child?.level || 1,
        completedActivities,
        pendingActivities,
        currentStreak: child?.currentStreak || 0,
        recentActivities,
        hasSetPassword: child?.hasSetPassword || false
      };
    }

    res.status(200).json({
      success: true,
      dashboard: dashboardData
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard stats'
    });
  }
};

// ========================= UPLOAD PROFILE PICTURE =========================

export const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload an image file",
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // 1️⃣ Delete old avatar if exists
    if (user.avatar?.public_id) {
      await CloudinaryService.deleteImage(user.avatar.public_id);
    }

    // 2️⃣ Upload new avatar
    const result = req.file.path
      ? await CloudinaryService.uploadImage(req.file.path, "avatars")
      : await CloudinaryService.uploadBuffer(req.file.buffer, "avatars");

    // 3️⃣ Save both url and public_id
    user.avatar = {
      url: result.secure_url,
      public_id: result.public_id,
    };
    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        dob: user.dob,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error("Upload profile picture error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while uploading profile picture",
    });
  }
};

// ========================= DELETE PROFILE PICTURE =========================

export const deleteProfilePicture = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ✅ Delete from Cloudinary using stored public_id
    if (user.avatar?.public_id) {
      await CloudinaryService.deleteImage(user.avatar.public_id);
    }

    // ✅ Clear from database
    user.avatar = { url: null, public_id: null };
    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile picture removed successfully",
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        dob: user.dob,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error("Delete profile picture error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while removing profile picture",
    });
  }
};
