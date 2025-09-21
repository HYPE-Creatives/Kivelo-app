import Child from '../models/Child.js';
import User from '../models/User.js';
import Activity from '../models/Activity.js';

/**
 * -------------------------------
 * CHILD CONTROLLER
 * -------------------------------
 */

// ✅ Create child profile
export async function createChild(req, res) {
  try {
    if (req.user.role !== 'parent') {
      return res.status(403).json({ message: 'Access denied. Parent only.' });
    }

    const { name, dob, preferences } = req.body;

    // Create linked User document for child
    const user = new User({
      name,
      dob,
      role: 'child'
    });
    await user.save();

    // Create child profile
    const child = new Child({
      user: user._id,
      parent: req.user.id,
      preferences
    });
    await child.save();

    res.status(201).json({
      success: true,
      child,
      message: 'Child profile created successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// ✅ Get child profile
export async function getChildProfile(req, res) {
  try {
    const child = await Child.findOne({ user: req.user.id })
      .populate('user', 'name email phone dob')
      .populate('parent', 'familyCode')
      .populate('activities');

    if (!child) {
      return res.status(404).json({ message: 'Child profile not found' });
    }

    // Check if requester is the child or parent
    if (req.user.role !== 'parent' && child.user._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ success: true, child });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// ✅ Update child profile
export async function updateChildProfile(req, res) {
  try {
    const child = await Child.findOne({ user: req.user.id });
    if (!child) {
      return res.status(404).json({ message: 'Child profile not found' });
    }

    // Check permissions
    if (req.user.role !== 'parent' && child.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update user data
    await User.findByIdAndUpdate(req.user.id, req.body, { new: true });

    const updatedChild = await Child.findOne({ user: req.user.id })
      .populate('user', 'name email phone dob')
      .populate('parent', 'familyCode');

    res.json({
      success: true,
      child: updatedChild,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// ✅ Get child dashboard
export async function getChildDashboard(req, res) {
  try {
    if (req.user.role !== 'child') {
      return res.status(403).json({ message: 'Access denied. Child only.' });
    }

    const child = await Child.findOne({ user: req.user.id })
      .populate('activities')
      .populate('parent', 'familyCode');

    if (!child) {
      return res.status(404).json({ message: 'Child profile not found' });
    }

    const totalActivities = child.activities.length;
    const completedActivities = child.activities.filter(a => a.status === 'completed').length;
    const progressPercentage = totalActivities > 0 ? (completedActivities / totalActivities) * 100 : 0;

    res.json({
      success: true,
      dashboard: {
        child: {
          name: req.user.name,
          points: child.points || 0,
          level: child.level || 1
        },
        activities: {
          total: totalActivities,
          completed: completedActivities,
          pending: totalActivities - completedActivities,
          progress: Math.round(progressPercentage)
        },
        recentActivities: child.activities.slice(-5).reverse(),
        preferences: child.preferences
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// ✅ Get child activities
export async function getChildActivities(req, res) {
  try {
    const child = await Child.findOne({ user: req.user.id }).populate('activities');
    if (!child) {
      return res.status(404).json({ message: 'Child profile not found' });
    }

    // Check permissions
    if (req.user.role !== 'parent' && child.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ success: true, activities: child.activities });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// ✅ Add child activity
export async function addChildActivity(req, res) {
  try {
    if (req.user.role !== 'parent') {
      return res.status(403).json({ message: 'Access denied. Parent only.' });
    }

    const { childId, title, description, type, dueDate, points } = req.body;

    const activity = new Activity({
      title,
      description,
      type,
      dueDate,
      points,
      assignedBy: req.user.id,
      assignedTo: childId
    });
    await activity.save();

    await Child.findByIdAndUpdate(childId, { $push: { activities: activity._id } });

    res.status(201).json({
      success: true,
      activity,
      message: 'Activity added successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// ✅ Update child activity
export async function updateChildActivity(req, res) {
  try {
    const { activityId } = req.params;
    const { status, notes, completedAt } = req.body;

    const activity = await Activity.findById(activityId);
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    // Permissions
    if (req.user.role !== 'parent' && activity.assignedTo.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updatedActivity = await Activity.findByIdAndUpdate(
      activityId,
      { status, notes, completedAt },
      { new: true }
    );

    // Award points if completed
    if (status === 'completed' && activity.status !== 'completed') {
      const child = await Child.findOne({ user: activity.assignedTo });
      child.points = (child.points || 0) + (activity.points || 10);
      await child.save();
    }

    res.json({ success: true, activity: updatedActivity, message: 'Activity updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// ✅ Delete child activity
export async function deleteChildActivity(req, res) {
  try {
    if (req.user.role !== 'parent') {
      return res.status(403).json({ message: 'Access denied. Parent only.' });
    }

    const { activityId } = req.params;
    const activity = await Activity.findById(activityId);
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    await Child.findByIdAndUpdate(activity.assignedTo, { $pull: { activities: activityId } });
    await Activity.findByIdAndDelete(activityId);

    res.json({ success: true, message: 'Activity deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// ✅ Get child progress reports
export async function getChildProgress(req, res) {
  try {
    if (req.user.role !== 'parent') {
      return res.status(403).json({ message: 'Access denied. Parent only.' });
    }

    const { childId } = req.query;
    const child = await Child.findById(childId)
      .populate('activities')
      .populate('user', 'name');

    if (!child) {
      return res.status(404).json({ message: 'Child not found' });
    }

    const activities = child.activities;
    const completed = activities.filter(a => a.status === 'completed');
    const pending = activities.filter(a => a.status === 'pending');

    const progressData = {
      totalActivities: activities.length,
      completed: completed.length,
      pending: pending.length,
      completionRate: activities.length > 0 ? (completed.length / activities.length) * 100 : 0,
      totalPoints: child.points || 0,
      averageCompletionTime: calculateAverageCompletionTime(completed),
      activitiesByType: groupActivitiesByType(activities),
      weeklyProgress: calculateWeeklyProgress(activities)
    };

    res.json({ success: true, child: child.user.name, progress: progressData });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// ✅ Update child preferences
export async function updateChildPreferences(req, res) {
  try {
    if (req.user.role !== 'child') {
      return res.status(403).json({ message: 'Access denied. Child only.' });
    }

    const child = await Child.findOne({ user: req.user.id });
    if (!child) {
      return res.status(404).json({ message: 'Child profile not found' });
    }

    child.preferences = { ...child.preferences, ...req.body };
    await child.save();

    res.json({ success: true, preferences: child.preferences, message: 'Preferences updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * -------------------------------
 * HELPER FUNCTIONS
 * -------------------------------
 */
function calculateAverageCompletionTime(activities) {
  if (activities.length === 0) return 0;
  const totalTime = activities.reduce((sum, a) => {
    if (a.assignedAt && a.completedAt) {
      return sum + (new Date(a.completedAt) - new Date(a.assignedAt));
    }
    return sum;
  }, 0);
  return totalTime / activities.length;
}

function groupActivitiesByType(activities) {
  return activities.reduce((acc, a) => {
    const type = a.type || 'other';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});
}

function calculateWeeklyProgress(activities) {
  return {
    thisWeek: Math.floor(Math.random() * 100),
    lastWeek: Math.floor(Math.random() * 100)
  };
}
