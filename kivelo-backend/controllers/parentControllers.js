// controllers/parentController.js
import mongoose from "mongoose";
import Parent from "../models/Parent.js";
import User from "../models/User.js";
import Child from "../models/Child.js";
import Activity from "../models/Activity.js";
import Notification from "../models/Notification.js";
import MoodCheckin from "../models/MoodCheckin.js";
import { resolveChildAccess } from "../utils/resolveChildAccess.js";

/* ============================================================
   Helpers
=============================================================== */
const toObjectId = (id) => {
  try { return new mongoose.Types.ObjectId(id); } 
  catch { return null; }
};

/* ============================================================
   1. GET PARENT PROFILE
=============================================================== */
export async function getParentProfile(req, res) {
  try {
    if (req.user.role !== "parent") return res.status(403).json({ message: "Parent only" });

    const parent = await Parent.findOne({ user: req.user.id })
      .populate("user", "name email phone dob")
      .populate({
        path: "children",
        populate: { path: "user", select: "name email dob gender" }
      });

    if (!parent) return res.status(404).json({ message: "Parent profile not found" });

    return res.json({ success: true, parent });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

/* ============================================================
   2. UPDATE PARENT PROFILE
=============================================================== */
export async function updateParentProfile(req, res) {
  try {
    if (req.user.role !== "parent") return res.status(403).json({ message: "Parent only" });

    await User.findByIdAndUpdate(req.user.id, req.body, { new: true });

    const parent = await Parent.findOne({ user: req.user.id })
      .populate("user", "name email phone dob")
      .populate({
        path: "children",
        populate: { path: "user", select: "name email dob gender" }
      });

    return res.json({ success: true, parent, message: "Profile updated successfully" });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

/* ============================================================
   3. GET ALL CHILDREN FOR PARENT
=============================================================== */
export async function getChildrenList(req, res) {
  try {
    if (req.user.role !== "parent") return res.status(403).json({ message: "Parent only" });

    const parent = await Parent.findOne({ user: req.user.id })
      .populate({
        path: "children",
        populate: { path: "user", select: "name email dob gender avatar" }
      });

    if (!parent) return res.status(404).json({ message: "Parent profile not found" });

    return res.json({ success: true, children: parent.children, totalChildren: parent.children.length });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

/* ============================================================
   4. GET SINGLE CHILD (BY ID)
=============================================================== */
export async function getChildById(req, res) {
  try {
    if (req.user.role !== "parent") return res.status(403).json({ message: "Parent only" });

    const { childId } = req.params;
    const access = await resolveChildAccess(req.user.id, childId);
    if (!access) return res.status(403).json({ message: "Child not found or access denied" });

    // access.userId is child's user id (string). The Child doc id may differ.
    const childDoc = await Child.findOne({ $or: [{ _id: childId }, { user: access.userId }] })
      .populate("user", "name email dob gender avatar");

    if (!childDoc) return res.status(404).json({ message: "Child not found" });

    return res.json({ success: true, child: childDoc });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

/* ============================================================
   5. UPDATE CHILD
=============================================================== */
export async function updateChild(req, res) {
  try {
    if (req.user.role !== "parent") return res.status(403).json({ message: "Parent only" });

    const { childId } = req.params;
    const access = await resolveChildAccess(req.user.id, childId);
    if (!access) return res.status(403).json({ message: "Access denied" });

    const child = await Child.findById(access.childId || childId).populate("user");
    if (!child) return res.status(404).json({ message: "Child not found" });

    const { name, dob, gender, preferences } = req.body;

    if (name || dob || gender) {
      await User.findByIdAndUpdate(child.user._id, {
        ...(name && { name }),
        ...(dob && { dob }),
        ...(gender && { gender })
      }, { new: true });
    }

    if (preferences) {
      child.preferences = { ...child.preferences, ...preferences };
      await child.save();
    }

    const updatedChild = await Child.findById(child._id).populate("user", "name email dob gender");
    return res.json({ success: true, child: updatedChild, message: "Child updated successfully" });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

/* ============================================================
   6. REMOVE CHILD
=============================================================== */
export async function removeChild(req, res) {
  try {
    if (req.user.role !== "parent") return res.status(403).json({ message: "Parent only" });

    const { childId } = req.params;
    const access = await resolveChildAccess(req.user.id, childId);
    if (!access) return res.status(403).json({ message: "Access denied" });

    const child = await Child.findById(access.childId || childId);
    if (!child) return res.status(404).json({ message: "Child not found" });

    // remove child ref from parent
    await Parent.findOneAndUpdate({ user: req.user.id }, { $pull: { children: child._id } });

    // remove child user and profile
    await User.findByIdAndDelete(child.user);
    await Child.findByIdAndDelete(child._id);

    return res.json({ success: true, message: "Child removed successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

/* ============================================================
   7. FAMILY DASHBOARD
=============================================================== */
export async function getFamilyDashboard(req, res) {
  try {
    if (req.user.role !== "parent") return res.status(403).json({ message: "Parent only" });

    const parent = await Parent.findOne({ user: req.user.id })
      .populate({
        path: "children",
        populate: [
          { path: "user", select: "name email" },
          { path: "activities", match: { completed: true } }
        ]
      });

    if (!parent) return res.status(404).json({ message: "Parent profile not found" });

    const children = parent.children.map(child => ({
      id: child._id,
      name: child.user?.name,
      points: child.points || 0,
      completedActivities: child.activities?.length || 0,
      hasSetPassword: child.hasSetPassword
    }));

    // recentActivities: recent activities assigned to parent's children (using child's user id)
    const childUserIds = parent.children.map(c => c.user);
    const recentActivities = await Activity.find({ assignedTo: { $in: childUserIds } })
      .sort({ createdAt: -1 })
      .limit(6)
      .populate("assignedTo", "name");

    return res.json({
      success: true,
      dashboard: {
        summary: {
          totalChildren: children.length,
          totalActivities: children.reduce((s, c) => s + c.completedActivities, 0),
          totalPoints: children.reduce((s, c) => s + c.points, 0)
        },
        children,
        recentActivities
      }
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

/* ============================================================
   8. GET ACTIVITIES FOR A CHILD
   (Parent can view activities assigned to a specific child)
=============================================================== */
export async function getChildActivities(req, res) {
  try {
    if (req.user.role !== "parent") return res.status(403).json({ message: "Parent only" });

    const { childId } = req.params;
    const access = await resolveChildAccess(req.user.id, childId);
    if (!access) return res.status(403).json({ message: "Access denied" });

    // access.userId is child's User._id (string)
    const childUserId = toObjectId(access.userId);
    if (!childUserId) return res.status(400).json({ message: "Invalid child id" });

    const { page = 1, limit = 20, status } = req.query;
    const skip = (page - 1) * limit;

    const query = { assignedTo: childUserId };
    if (status) query.status = status;

    const activities = await Activity.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("createdBy", "name email")
      .populate("assignedTo", "name");

    const total = await Activity.countDocuments(query);

    return res.json({
      success: true,
      data: { activities, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) } }
    });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

/* ============================================================
   9. CREATE ACTIVITY & NOTIFY CHILD (CONVENIENCE WRAPPER)
   (If you prefer parents to create via activityController, you can skip this)
=============================================================== */
export async function createActivityAndNotify(req, res) {
  try {
    if (req.user.role !== "parent") return res.status(403).json({ message: "Parent only" });

    const parentId = req.user.id;
    const {
      title,
      description,
      category,
      points,
      duration,
      assignedTo, // user ids OR child doc ids
      dueDate,
      difficulty,
      tags
    } = req.body;

    if (!title || !description || !assignedTo) return res.status(400).json({ message: "Missing required fields" });

    // normalize assigned children to user IDs:
    const assignedChildren = Array.isArray(assignedTo) ? assignedTo : [assignedTo];
    const resolvedUserIds = [];

    for (const cid of assignedChildren) {
      const r = await resolveChildAccess(parentId, cid);
      if (!r) return res.status(403).json({ message: `Child ${cid} does not belong to you` });
      resolvedUserIds.push(r.userId);
    }

    // create activity
    const newActivity = await Activity.create({
      title,
      description,
      category,
      points: parseInt(points) || 0,
      duration: parseInt(duration) || 0,
      assignedTo: resolvedUserIds,
      createdBy: parentId,
      dueDate: dueDate ? new Date(dueDate) : null,
      difficulty: difficulty || "medium",
      tags: tags || []
    });

    // create notifications for each child user
    const notifications = [];
    for (const childUserId of resolvedUserIds) {
      notifications.push({
        userId: childUserId,
        type: "new_activity",
        title: "New Activity Assigned",
        message: `You have a new activity: "${title}"`,
        data: { activityId: newActivity._id, points: newActivity.points, dueDate: newActivity.dueDate, assignedBy: parentId },
        priority: 3,
        createdAt: new Date()
      });
    }
    if (notifications.length) await Notification.insertMany(notifications);

    const populated = await Activity.findById(newActivity._id).populate("createdBy", "name email").populate("assignedTo", "name");

    return res.status(201).json({ success: true, activity: populated, message: "Activity created and notifications sent" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

/* ============================================================
   10. NOTIFICATIONS: SEND SINGLE OR BULK NOTIFICATIONS
=============================================================== */
export async function sendNotificationToChild(req, res) {
  try {
    if (req.user.role !== "parent") return res.status(403).json({ message: "Parent only" });

    const { childId } = req.params; // child doc id or child user id
    const { type, title, message, data = {}, priority = 3 } = req.body;

    if (!type || !title || !message) return res.status(400).json({ message: "type, title and message required" });

    // Resolve child
    const access = await resolveChildAccess(req.user.id, childId);
    if (!access) return res.status(403).json({ message: "Child not found or access denied" });

    const notification = await Notification.create({
      userId: access.userId,
      type,
      title,
      message,
      data: { ...data, childId: access.userId },
      priority,
      isRead: false,
      isSent: false,
      createdAt: new Date()
    });

    return res.status(201).json({ success: true, notification, message: "Notification created" });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function sendBulkNotifications(req, res) {
  try {
    if (req.user.role !== "parent") return res.status(403).json({ message: "Parent only" });

    const { childIds, type, title, message: msg, data = {}, priority = 3 } = req.body;
    if (!Array.isArray(childIds) || childIds.length === 0) return res.status(400).json({ message: "childIds array required" });
    if (!type || !title || !msg) return res.status(400).json({ message: "type, title and message required" });

    const notifications = [];
    for (const cid of childIds) {
      const access = await resolveChildAccess(req.user.id, cid);
      if (!access) continue;
      const childUser = access.userId;
      notifications.push({
        userId: childUser,
        type,
        title: title.replace("{childName}", ""),
        message: msg.replace("{childName}", ""),
        data: { ...data, childId: childUser, sentBy: req.user.id },
        priority,
        isRead: false,
        isSent: false,
        createdAt: new Date()
      });
    }

    if (!notifications.length) return res.status(400).json({ message: "No valid childIds found" });

    const inserted = await Notification.insertMany(notifications);
    return res.json({ success: true, sentCount: inserted.length, notifications: inserted });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

/* ============================================================
   11. MOODS & JOURNALS (already present)
=============================================================== */
export const getChildMoods = async (req, res) => {
  try {
    const { childId } = req.params;
    const access = await resolveChildAccess(req.user.id, childId);
    if (!access) return res.status(403).json({ message: "Access denied" });

    // Query MoodCheckin using child's user id
    const moods = await MoodCheckin.find({ child: access.userId }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: moods });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getChildMoodSummary = async (req, res) => {
  try {
    const { childId } = req.params;
    const access = await resolveChildAccess(req.user.id, childId);
    if (!access) return res.status(403).json({ message: "Access denied" });

    const cid = toObjectId(access.userId);
    
    // Get the latest mood check-in
    const latestMood = await MoodCheckin.findOne({ child: cid })
      .sort({ createdAt: -1 })
      .lean();

    // Get aggregated summary by emoji
    const summary = await MoodCheckin.aggregate([
      { $match: { child: cid } },
      { $group: { _id: "$emoji", avgScore: { $avg: "$moodScore" }, count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get mood stats for the past week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weeklyMoods = await MoodCheckin.find({ 
      child: cid, 
      createdAt: { $gte: weekAgo } 
    }).sort({ createdAt: -1 }).lean();

    const avgMoodScore = weeklyMoods.length > 0
      ? weeklyMoods.reduce((sum, m) => sum + (m.moodScore || 5), 0) / weeklyMoods.length
      : null;

    return res.status(200).json({ 
      success: true, 
      data: {
        childId: childId,
        childName: access.name || 'Child',
        latestMood,
        summary,
        weeklyStats: {
          totalCheckins: weeklyMoods.length,
          avgMoodScore: avgMoodScore ? Math.round(avgMoodScore * 10) / 10 : null,
          moods: weeklyMoods
        },
        weeklyAverage: avgMoodScore ? Math.round(avgMoodScore * 10) / 10 : null,
        trustZone: latestMood?.trustZone || null,
        totalCheckins: weeklyMoods.length
      }
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/* ============================================================
   12. BILLING / SUBSCRIPTION / SETTINGS / NOTIFICATIONS GETTERS
   (these are present in your previous controller; keep unchanged)
=============================================================== */

export async function getBillingInfo(req, res) {
  try {
    if (req.user.role !== "parent") return res.status(403).json({ message: "Parent only" });
    const parent = await Parent.findOne({ user: req.user.id });
    return res.json({ success: true, billing: parent?.billing || {} });
  } catch (error) { return res.status(500).json({ message: error.message }); }
}

export async function updateBillingInfo(req, res) {
  try {
    if (req.user.role !== "parent") return res.status(403).json({ message: "Parent only" });
    const parent = await Parent.findOneAndUpdate({ user: req.user.id }, { billing: req.body }, { new: true });
    return res.json({ success: true, billing: parent.billing, message: "Billing updated" });
  } catch (error) { return res.status(500).json({ message: error.message }); }
}

export async function getSubscription(req, res) {
  try {
    if (req.user.role !== "parent") return res.status(403).json({ message: "Parent only" });
    const parent = await Parent.findOne({ user: req.user.id });
    return res.json({ success: true, subscription: parent?.subscription || "free" });
  } catch (error) { return res.status(500).json({ message: error.message }); }
}

export async function updateSubscription(req, res) {
  try {
    if (req.user.role !== "parent") return res.status(403).json({ message: "Parent only" });
    const { plan } = req.body;
    if (!["free", "premium", "enterprise"].includes(plan)) return res.status(400).json({ message: "Invalid plan" });
    const parent = await Parent.findOneAndUpdate({ user: req.user.id }, { subscription: plan }, { new: true });
    return res.json({ success: true, subscription: parent.subscription, message: "Subscription updated" });
  } catch (error) { return res.status(500).json({ message: error.message }); }
}

export async function getNotifications(req, res) {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const notifications = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(50);
    return res.json({ success: true, notifications });
  } catch (error) { return res.status(500).json({ message: error.message }); }
}

export async function markNotificationAsRead(req, res) {
  try {
    const { notificationId } = req.params;
    const notification = await Notification.findOneAndUpdate({ _id: notificationId, userId: req.user.id }, { isRead: true }, { new: true });
    if (!notification) return res.status(404).json({ message: "Notification not found" });
    return res.json({ success: true, notification, message: "Marked as read" });
  } catch (error) { return res.status(500).json({ message: error.message }); }
}

export async function markAllNotificationsAsRead(req, res) {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const result = await Notification.updateMany(
      { userId: req.user.id, isRead: false },
      { $set: { isRead: true } }
    );

    const unreadCount = await Notification.countDocuments({
      userId: req.user.id,
      isRead: false
    });

    return res.json({
      success: true,
      data: {
        modifiedCount: result.modifiedCount,
        unreadCount
      },
      message: `${result.modifiedCount} notifications marked as read`
    });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}


export async function getFamilySettings(req, res) {
  try {
    if (req.user.role !== "parent") return res.status(403).json({ message: "Parent only" });
    const parent = await Parent.findOne({ user: req.user.id });
    return res.json({ success: true, settings: parent?.settings || {} });
  } catch (error) { return res.status(500).json({ message: error.message }); }
}

export async function updateFamilySettings(req, res) {
  try {
    if (req.user.role !== "parent") return res.status(403).json({ message: "Parent only" });
    const parent = await Parent.findOneAndUpdate({ user: req.user.id }, { settings: req.body }, { new: true });
    return res.json({ success: true, settings: parent.settings, message: "Settings updated" });
  } catch (error) { return res.status(500).json({ message: error.message }); }
}

/* ============================================================
   13. Activity reports (kept from original)
=============================================================== */
export async function getActivityReports(req, res) {
  try {
    if (req.user.role !== "parent") return res.status(403).json({ message: "Parent only" });

    const { period = "week", childId } = req.query;
    const parent = await Parent.findOne({ user: req.user.id }).populate("children");

    let activitiesQuery = { assignedTo: { $in: parent.children.map(c => c.user) } };

    if (childId) {
      const access = await resolveChildAccess(req.user.id, childId);
      if (access) activitiesQuery.assignedTo = access.userId;
    }

    if (period === "week") activitiesQuery.createdAt = { $gte: new Date(Date.now() - 7 * 86400000) };
    else if (period === "month") activitiesQuery.createdAt = { $gte: new Date(Date.now() - 30 * 86400000) };

    const activities = await Activity.find(activitiesQuery).populate("assignedTo", "name").sort({ createdAt: -1 });

    return res.json({
      success: true,
      reports: { period, totalActivities: activities.length, completed: activities.filter(a => a.status === "completed").length, activities }
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}
