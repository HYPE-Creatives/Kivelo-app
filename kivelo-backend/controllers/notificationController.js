// controllers/notificationController.js

import Notification from "../models/Notification.js";
import User from "../models/User.js";
import Child from "../models/Child.js";
import { resolveChildAccess } from "../utils/resolveChildAccess.js";

/* -------------------------------------------------------------
   HELPER — normalize child access using resolveChildAccess()
---------------------------------------------------------------*/
async function verifyParentChildAccess(parentId, providedId) {
  const resolved = await resolveChildAccess(parentId, providedId);
  if (!resolved) return null;
  return resolved.userId; // always child userId
}


//-------------------------------------------------------------
// Create Notification - Only Administered via System or Parents
//---------------------------------------------------------------
export const createNotification = async (req, res) => {
  try {
    const { userId, type, title, message, data, priority = 3 } = req.body;

    if (!userId || !type || !title || !message) {
      return res.status(400).json({
        success: false,
        message: "userId, type, title, and message are required"
      });
    }

    // SECURITY: Prevent parent from creating notifications for non-children
    if (req.user.role === "parent") {
      const resolved = await resolveChildAccess(req.user._id, userId);
      if (!resolved && userId !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "You can only create notifications for yourself or your children"
        });
      }
    }

    const notif = await Notification.create({
      userId,
      type,
      title,
      message,
      data: data || {},
      priority,
      isRead: false
    });

    return res.status(201).json({
      success: true,
      data: notif,
      message: "Notification created successfully"
    });

  } catch (error) {
    console.error("createNotification:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* -------------------------------------------------------------
   1. GET ALL NOTIFICATIONS FOR LOGGED IN USER
---------------------------------------------------------------*/
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    const { page = 1, limit = 20, isRead, type, priority, startDate, endDate } = req.query;
    const skip = (page - 1) * limit;

    const query = { userId };

    if (isRead !== undefined) query.isRead = isRead === "true";
    if (type && type !== "all") query.type = type;
    if (priority) query.priority = parseInt(priority);

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Notification.countDocuments(query);
    const unread = await Notification.countDocuments({ userId, isRead: false });

    return res.json({
      success: true,
      data: {
        notifications,
        stats: {
          total,
          unread,
          read: total - unread,
        }
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      }
    });

  } catch (err) {
    console.error("getNotifications:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* -------------------------------------------------------------
   2. GET SINGLE NOTIFICATION (auto mark as read)
---------------------------------------------------------------*/
export const getNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findOne({
      _id: notificationId,
      userId: req.user._id
    });

    if (!notification)
      return res.status(404).json({ success: false, message: "Notification not found" });

    if (!notification.isRead) {
      notification.isRead = true;
      await notification.save();
    }

    return res.json({ success: true, data: notification });

  } catch (err) {
    console.error("getNotification:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* -------------------------------------------------------------
   3. MARK AS READ
---------------------------------------------------------------*/
export const markAsRead = async (req, res) => {
  try {
    const updated = await Notification.findOneAndUpdate(
      { _id: req.params.notificationId, userId: req.user._id },
      { isRead: true },
      { new: true }
    );

    if (!updated)
      return res.status(404).json({ success: false, message: "Notification not found" });

    return res.json({
      success: true,
      data: updated,
      message: "Notification marked as read"
    });

  } catch (err) {
    console.error("markAsRead:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* -------------------------------------------------------------
   4. MARK ALL READ
---------------------------------------------------------------*/
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await Notification.updateMany(
      { userId, isRead: false },
      { $set: { isRead: true } }
    );

    return res.json({
      success: true,
      data: {
        modifiedCount: result.modifiedCount,
      },
      message: `${result.modifiedCount} notifications marked as read`
    });

  } catch (err) {
    console.error("markAllAsRead:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* -------------------------------------------------------------
   5. DELETE NOTIFICATION
---------------------------------------------------------------*/
export const deleteNotification = async (req, res) => {
  try {
    const deleted = await Notification.findOneAndDelete({
      _id: req.params.notificationId,
      userId: req.user._id
    });

    if (!deleted)
      return res.status(404).json({ success: false, message: "Notification not found" });

    return res.json({ success: true, message: "Notification deleted" });

  } catch (err) {
    console.error("deleteNotification:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* -------------------------------------------------------------
   6. CLEAR ALL READ
---------------------------------------------------------------*/
export const clearAllRead = async (req, res) => {
  try {
    const result = await Notification.deleteMany({
      userId: req.user._id,
      isRead: true
    });

    return res.json({
      success: true,
      data: { deletedCount: result.deletedCount },
      message: "Cleared all read notifications"
    });

  } catch (err) {
    console.error("clearAllRead:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* -------------------------------------------------------------
   7. GET NOTIFICATION STATS
---------------------------------------------------------------*/
export const getNotificationStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const total = await Notification.countDocuments({ userId });
    const unread = await Notification.countDocuments({ userId, isRead: false });

    const byType = await Notification.aggregate([
      { $match: { userId } },
      { $group: {
          _id: "$type",
          total: { $sum: 1 },
          unread: { $sum: { $cond: [{ $eq: ["$isRead", false] }, 1, 0] } }
      }},
      { $sort: { total: -1 } }
    ]);

    const byPriority = await Notification.aggregate([
      { $match: { userId } },
      { $group: {
          _id: "$priority",
          total: { $sum: 1 },
          unread: { $sum: { $cond: [{ $eq: ["$isRead", false] }, 1, 0] } }
      }},
      { $sort: { _id: 1 } }
    ]);

    return res.json({
      success: true,
      data: {
        summary: { total, unread, read: total - unread },
        byType,
        byPriority
      }
    });

  } catch (err) {
    console.error("getNotificationStats:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* -------------------------------------------------------------
   8. GET CHILD NOTIFICATIONS (Parent Only)
   Uses resolveChildAccess()
---------------------------------------------------------------*/
export const getChildNotifications = async (req, res) => {
  try {
    if (req.user.role !== "parent")
      return res.status(403).json({ success: false, message: "Parent only" });

    const childUserId = await verifyParentChildAccess(req.user._id, req.params.childId);
    if (!childUserId)
      return res.status(403).json({ success: false, message: "Not your child" });

    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ userId: childUserId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Notification.countDocuments({ userId: childUserId });

    const childUser = await User.findById(childUserId).select("name");

    return res.json({
      success: true,
      data: {
        child: {
          userId: childUserId,
          name: childUser?.name
        },
        notifications,
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (err) {
    console.error("getChildNotifications:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* -------------------------------------------------------------
   9. SEND MOOD ALERT (Parent → System)
   Uses resolveChildAccess()
---------------------------------------------------------------*/
export const sendMoodAlert = async (req, res) => {
  try {
    if (req.user.role !== "parent")
      return res.status(403).json({ success: false, message: "Parent only" });

    const { childId, mood, intensity, message } = req.body;

    const childUserId = await verifyParentChildAccess(req.user._id, childId);
    if (!childUserId)
      return res.status(403).json({ success: false, message: "Not your child" });

    const childUser = await User.findById(childUserId).select("name");

    const notif = await Notification.create({
      userId: req.user._id,
      type: "mood_alert",
      title: `${childUser?.name}'s Mood Alert`,
      message: message || `${childUser?.name} is feeling ${mood} (${intensity}/10)`,
      priority: intensity >= 7 ? 1 : intensity <= 3 ? 2 : 3,
      data: {
        childId: childUserId,
        childName: childUser?.name,
        mood,
        intensity
      }
    });

    return res.json({ success: true, data: notif });

  } catch (err) {
    console.error("sendMoodAlert:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* -------------------------------------------------------------
   10. SEND AI SUGGESTION (Parent Only)
---------------------------------------------------------------*/
export const sendAISuggestion = async (req, res) => {
  try {
    const { childId, suggestion, context } = req.body;

    const childUserId = await verifyParentChildAccess(req.user._id, childId);
    if (!childUserId)
      return res.status(403).json({ success: false, message: "Not your child" });

    const childUser = await User.findById(childUserId).select("name");

    const notif = await Notification.create({
      userId: req.user._id,
      type: "ai_suggestion",
      title: "AI Parenting Suggestion",
      message: suggestion,
      priority: 2,
      data: {
        childId: childUserId,
        childName: childUser?.name,
        context
      }
    });

    return res.json({ success: true, data: notif });

  } catch (err) {
    console.error("sendAISuggestion:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* -------------------------------------------------------------
   11. BULK NOTIFICATION (Parent → Children)
   Integrated with resolveChildAccess()
---------------------------------------------------------------*/
export const sendBulkNotifications = async (req, res) => {
  try {
    if (req.user.role !== "parent")
      return res.status(403).json({ success: false, message: "Parent only" });

    const { childIds, type, title, message, data } = req.body;

    if (!Array.isArray(childIds) || childIds.length === 0)
      return res.status(400).json({ success: false, message: "childIds[] required" });

    const results = [];

    for (const id of childIds) {
      const childUserId = await verifyParentChildAccess(req.user._id, id);
      if (!childUserId) continue;

      const childUser = await User.findById(childUserId).select("name");

      const notif = {
        userId: childUserId,
        type,
        title: title.replace("{childName}", childUser?.name || "Child"),
        message: message.replace("{childName}", childUser?.name || "Child"),
        data: {
          ...data,
          childId: childUserId,
          childName: childUser?.name,
          sentBy: req.user._id
        },
        priority: 3
      };

      results.push(notif);
    }

    if (results.length === 0)
      return res.status(400).json({ success: false, message: "No valid child IDs" });

    const inserted = await Notification.insertMany(results);

    return res.json({
      success: true,
      sentCount: inserted.length,
      notifications: inserted
    });

  } catch (err) {
    console.error("sendBulkNotifications:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* -------------------------------------------------------------
   12. SCHEDULED NOTIFICATION
---------------------------------------------------------------*/
export const scheduleNotification = async (req, res) => {
  try {
    const { userId, type, title, message, data, scheduledFor } = req.body;

    const date = new Date(scheduledFor);
    if (isNaN(date) || date <= new Date())
      return res.status(400).json({ success: false, message: "scheduledFor must be a future date" });

    if (req.user.role === "child" && req.user._id.toString() !== userId)
      return res.status(403).json({ success: false, message: "Children can only schedule for themselves" });

    if (req.user.role === "parent") {
      const ok =
        userId === req.user._id.toString() ||
        (await verifyParentChildAccess(req.user._id, userId));

      if (!ok)
        return res.status(403).json({ success: false, message: "You can only schedule for yourself or your children" });
    }

    const notif = await Notification.create({
      userId,
      type,
      title,
      message,
      data: data || {},
      scheduledFor: date,
      priority: 3,
      isRead: false
    });

    return res.json({ success: true, data: notif });

  } catch (err) {
    console.error("scheduleNotification:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
