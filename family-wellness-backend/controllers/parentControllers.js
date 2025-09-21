import Parent from '../models/Parent.js';
import User from '../models/User.js';
import Child from '../models/Child.js';
import Activity from '../models/Activity.js';
import Notification from '../models/Notification.js';

// Get parent profile
export async function getParentProfile(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized. No user in request." });
    }

    if (req.user.role !== 'parent') {
      return res.status(403).json({ message: 'Access denied. Parent only.' });
    }

    const parent = await Parent.findOne({ user: req.user.id })
      .populate('user', 'name email phone dob')
      .populate('children', 'user oneTimeCode hasSetPassword')
      .populate({
        path: 'children',
        populate: {
          path: 'user',
          select: 'name email'
        }
      });

    if (!parent) {
      return res.status(404).json({ message: 'Parent profile not found' });
    }

    res.json({
      success: true,
      parent
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// Update parent profile
export async function updateParentProfile(req, res) {
  try {
    if (req.user.role !== 'parent') {
      return res.status(403).json({ message: 'Access denied. Parent only.' });
    }

    // Update user data
    await User.findByIdAndUpdate(req.user.id, req.body);

    const parent = await Parent.findOne({ user: req.user.id })
      .populate('user', 'name email phone dob')
      .populate('children');

    res.json({
      success: true,
      parent,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// Get list of children
export async function getChildrenList(req, res) {
  try {
    if (req.user.role !== 'parent') {
      return res.status(403).json({ message: 'Access denied. Parent only.' });
    }

    const parent = await Parent.findOne({ user: req.user.id })
      .populate({
        path: 'children',
        populate: {
          path: 'user',
          select: 'name email dob'
        }
      });

    if (!parent) {
      return res.status(404).json({ message: 'Parent profile not found' });
    }

    res.json({
      success: true,
      children: parent.children,
      totalChildren: parent.children.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// Add a new child
export async function addChild(req, res) {
  try {
    if (req.user.role !== 'parent') {
      return res.status(403).json({ message: 'Access denied. Parent only.' });
    }

    const { email, name, dob } = req.body;

    // Check if child email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Create child user
    const childUser = await User.create({
      email,
      name,
      dob,
      role: 'child'
    });

    // Generate one-time code
    const oneTimeCode = Math.random().toString(36).substr(2, 12).toUpperCase();
    const codeExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create child profile
    const child = await Child.create({
      user: childUser._id,
      parent: req.user.id,
      oneTimeCode,
      codeExpires,
      hasSetPassword: false
    });

    // Add child to parent's children array
    await Parent.findOneAndUpdate(
      { user: req.user.id },
      { $push: { children: child._id } }
    );

    res.status(201).json({
      success: true,
      child: {
        id: child._id,
        user: childUser,
        oneTimeCode,
        codeExpires,
        hasSetPassword: false
      },
      message: 'Child added successfully. Share the one-time code with them.'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// Update child information
export async function updateChild(req, res) {
  try {
    if (req.user.role !== 'parent') {
      return res.status(403).json({ message: 'Access denied. Parent only.' });
    }

    const { childId } = req.params;
    const updateData = req.body;

    // Find child and verify parent ownership
    const child = await Child.findOne({ _id: childId, parent: req.user.id })
      .populate('user');

    if (!child) {
      return res.status(404).json({ message: 'Child not found or access denied' });
    }

    // Update child user data
    if (updateData.name || updateData.dob) {
      await User.findByIdAndUpdate(child.user._id, {
        name: updateData.name,
        dob: updateData.dob
      });
    }

    // Update child preferences if provided
    if (updateData.preferences) {
      child.preferences = { ...child.preferences, ...updateData.preferences };
    }

    await child.save();

    const updatedChild = await Child.findById(childId).populate('user');

    res.json({
      success: true,
      child: updatedChild,
      message: 'Child information updated successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// Remove child from family
export async function removeChild(req, res) {
  try {
    if (req.user.role !== 'parent') {
      return res.status(403).json({ message: 'Access denied. Parent only.' });
    }

    const { childId } = req.params;

    // Find child and verify parent ownership
    const child = await Child.findOne({ _id: childId, parent: req.user.id });

    if (!child) {
      return res.status(404).json({ message: 'Child not found or access denied' });
    }

    // Remove child from parent's children array
    await Parent.findOneAndUpdate(
      { user: req.user.id },
      { $pull: { children: childId } }
    );

    // Delete child user and profile
    await User.findByIdAndDelete(child.user);
    await Child.findByIdAndDelete(childId);

    res.json({
      success: true,
      message: 'Child removed successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// Get family dashboard
export async function getFamilyDashboard(req, res) {
  try {
    if (req.user.role !== 'parent') {
      return res.status(403).json({ message: 'Access denied. Parent only.' });
    }

    const parent = await Parent.findOne({ user: req.user.id })
      .populate({
        path: 'children',
        populate: [
          {
            path: 'user',
            select: 'name email'
          },
          {
            path: 'activities',
            match: { status: 'completed' }
          }
        ]
      });

    if (!parent) {
      return res.status(404).json({ message: 'Parent profile not found' });
    }

    // Calculate dashboard metrics
    const totalChildren = parent.children.length;
    const totalActivities = parent.children.reduce((sum, child) => sum + (child.activities?.length || 0), 0);
    const totalPoints = parent.children.reduce((sum, child) => sum + (child.points || 0), 0);

    const recentActivities = await Activity.find({ assignedTo: { $in: parent.children.map(c => c.user._id) } })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('assignedTo', 'name');

    res.json({
      success: true,
      dashboard: {
        summary: {
          totalChildren,
          totalActivities,
          totalPoints,
          averageCompletion: totalChildren > 0 ? Math.round((totalActivities / totalChildren) * 100) : 0
        },
        children: parent.children.map(child => ({
          id: child._id,
          name: child.user.name,
          points: child.points || 0,
          completedActivities: child.activities?.length || 0,
          hasSetPassword: child.hasSetPassword
        })),
        recentActivities
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// Generate one-time code
// export async function generateOneTimeCode(req, res) {
//   try {
//     if (req.user.role !== 'parent') {
//       return res.status(403).json({ message: 'Access denied. Parent only.' });
//     }

//     const { childId } = req.body;

//     // Generate new code
//     const oneTimeCode = Math.random().toString(36).substr(2, 12).toUpperCase();
//     const codeExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

//     // Update child with new code
//     const child = await Child.findByIdAndUpdate(
//       childId,
//       { 
//         oneTimeCode, 
//         codeExpires,
//         isCodeUsed: false,
//         hasSetPassword: false
//       },
//       { new: true }
//     ).populate('user', 'name email');

//     if (!child) {
//       return res.status(404).json({ message: 'Child not found' });
//     }

//     res.json({
//       success: true,
//       code: oneTimeCode,
//       expiresAt: codeExpires,
//       child: child.user.name,
//       message: 'One-time code generated successfully'
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// }

// Get activity reports
export async function getActivityReports(req, res) {
  try {
    if (req.user.role !== 'parent') {
      return res.status(403).json({ message: 'Access denied. Parent only.' });
    }

    const { period = 'week', childId } = req.query;

    const parent = await Parent.findOne({ user: req.user.id }).populate('children');
    
    let activitiesQuery = { 
      assignedTo: { $in: parent.children.map(c => c.user) } 
    };

    if (childId) {
      const child = await Child.findById(childId);
      if (child && child.parent.toString() === req.user.id) {
        activitiesQuery.assignedTo = child.user;
      }
    }

    // Add date filtering based on period
    if (period === 'week') {
      activitiesQuery.createdAt = { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
    } else if (period === 'month') {
      activitiesQuery.createdAt = { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
    }

    const activities = await Activity.find(activitiesQuery)
      .populate('assignedTo', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      reports: {
        period,
        totalActivities: activities.length,
        completed: activities.filter(a => a.status === 'completed').length,
        activities
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// Get billing information
export async function getBillingInfo(req, res) {
  try {
    if (req.user.role !== 'parent') {
      return res.status(403).json({ message: 'Access denied. Parent only.' });
    }

    const parent = await Parent.findOne({ user: req.user.id });

    res.json({
      success: true,
      billing: parent.billing || {}
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// Update billing information
export async function updateBillingInfo(req, res) {
  try {
    if (req.user.role !== 'parent') {
      return res.status(403).json({ message: 'Access denied. Parent only.' });
    }

    const parent = await Parent.findOneAndUpdate(
      { user: req.user.id },
      { billing: req.body },
      { new: true }
    );

    res.json({
      success: true,
      billing: parent.billing,
      message: 'Billing information updated successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// Get subscription details
export async function getSubscription(req, res) {
  try {
    if (req.user.role !== 'parent') {
      return res.status(403).json({ message: 'Access denied. Parent only.' });
    }

    const parent = await Parent.findOne({ user: req.user.id });

    res.json({
      success: true,
      subscription: parent.subscription || 'free'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// Update subscription plan
export async function updateSubscription(req, res) {
  try {
    if (req.user.role !== 'parent') {
      return res.status(403).json({ message: 'Access denied. Parent only.' });
    }

    const { plan } = req.body;

    if (!['free', 'premium', 'enterprise'].includes(plan)) {
      return res.status(400).json({ message: 'Invalid subscription plan' });
    }

    const parent = await Parent.findOneAndUpdate(
      { user: req.user.id },
      { subscription: plan },
      { new: true }
    );

    res.json({
      success: true,
      subscription: parent.subscription,
      message: 'Subscription updated successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// Get notifications
export async function getNotifications(req, res) {
  try {
    if (req.user.role !== 'parent') {
      return res.status(403).json({ message: 'Access denied. Parent only.' });
    }

    const notifications = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      success: true,
      notifications
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// Mark notification as read
export async function markNotificationAsRead(req, res) {
  try {
    if (req.user.role !== 'parent') {
      return res.status(403).json({ message: 'Access denied. Parent only.' });
    }

    const { notificationId } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, user: req.user.id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({
      success: true,
      notification,
      message: 'Notification marked as read'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// Get family settings
export async function getFamilySettings(req, res) {
  try {
    if (req.user.role !== 'parent') {
      return res.status(403).json({ message: 'Access denied. Parent only.' });
    }

    const parent = await Parent.findOne({ user: req.user.id });

    res.json({
      success: true,
      settings: parent.settings || {}
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// Update family settings
export async function updateFamilySettings(req, res) {
  try {
    if (req.user.role !== 'parent') {
      return res.status(403).json({ message: 'Access denied. Parent only.' });
    }

    const parent = await Parent.findOneAndUpdate(
      { user: req.user.id },
      { settings: req.body },
      { new: true }
    );

    res.json({
      success: true,
      settings: parent.settings,
      message: 'Family settings updated successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}