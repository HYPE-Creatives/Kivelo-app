// controllers/notificationController.js
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import Child from '../models/Child.js';
import Parent from '../models/Parent.js';
import Journal from '../models/JournalEntry.js';

/**
 * Get all notifications for current user
 */
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const { 
      page = 1, 
      limit = 20, 
      isRead, 
      type, 
      priority,
      startDate, 
      endDate 
    } = req.query;
    
    const skip = (page - 1) * limit;
    
    // Build query
    const query = { userId };
    
    if (isRead !== undefined) {
      query.isRead = isRead === 'true';
    }
    
    if (type && type !== 'all') {
      query.type = type;
    }
    
    if (priority) {
      query.priority = parseInt(priority);
    }
    
    // Date range filtering
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    // Get notifications
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Notification.countDocuments(query);
    
    // Get unread count
    const unreadCount = await Notification.countDocuments({
      userId,
      isRead: false
    });
    
    res.json({
      success: true,
      data: {
        notifications,
        stats: {
          total,
          unread: unreadCount,
          read: total - unreadCount
        }
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error in getNotifications:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get notification by ID
 */
export const getNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id;
    
    const notification = await Notification.findOne({
      _id: notificationId,
      userId
    });
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    // Mark as read when retrieved (optional)
    if (!notification.isRead) {
      notification.isRead = true;
      await notification.save();
    }
    
    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Error in getNotification:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Mark notification as read
 */
export const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id;
    
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    res.json({
      success: true,
      data: notification,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Error in markAsRead:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const result = await Notification.updateMany(
      { userId, isRead: false },
      { $set: { isRead: true } }
    );
    
    // Get updated unread count
    const unreadCount = await Notification.countDocuments({
      userId,
      isRead: false
    });
    
    res.json({
      success: true,
      data: {
        modifiedCount: result.modifiedCount,
        unreadCount
      },
      message: `${result.modifiedCount} notifications marked as read`
    });
  } catch (error) {
    console.error('Error in markAllAsRead:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Delete notification
 */
export const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id;
    
    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      userId
    });
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Error in deleteNotification:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Clear all read notifications
 */
export const clearAllRead = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const result = await Notification.deleteMany({
      userId,
      isRead: true
    });
    
    // Get remaining notifications count
    const remainingCount = await Notification.countDocuments({ userId });
    
    res.json({
      success: true,
      data: {
        deletedCount: result.deletedCount,
        remainingCount
      },
      message: `${result.deletedCount} read notifications cleared`
    });
  } catch (error) {
    console.error('Error in clearAllRead:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get notification statistics
 */
export const getNotificationStats = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get counts by type
    const typeStats = await Notification.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$type',
          total: { $sum: 1 },
          unread: {
            $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] }
          }
        }
      },
      { $sort: { total: -1 } }
    ]);
    
    // Get counts by priority
    const priorityStats = await Notification.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$priority',
          total: { $sum: 1 },
          unread: {
            $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Get daily stats for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const dailyStats = await Notification.aggregate([
      {
        $match: {
          userId,
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 },
          read: {
            $sum: { $cond: [{ $eq: ['$isRead', true] }, 1, 0] }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);
    
    // Get total counts
    const totalCount = await Notification.countDocuments({ userId });
    const unreadCount = await Notification.countDocuments({ 
      userId, 
      isRead: false 
    });
    
    res.json({
      success: true,
      data: {
        summary: {
          total: totalCount,
          unread: unreadCount,
          read: totalCount - unreadCount
        },
        byType: typeStats,
        byPriority: priorityStats,
        dailyStats,
        mostRecent: await Notification.find({ userId })
          .sort({ createdAt: -1 })
          .limit(5)
          .select('title type isRead createdAt')
      }
    });
  } catch (error) {
    console.error('Error in getNotificationStats:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Create notification (for internal use, but exposed for testing)
 */
export const createNotification = async (req, res) => {
  try {
    const { userId, type, title, message, data, priority, sentVia } = req.body;
    
    // Validate required fields
    if (!userId || !type || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'userId, type, title, and message are required'
      });
    }
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // For child notifications, check if parent is accessing
    if (req.user.role === 'child') {
      // Child can only create notifications for themselves
      if (userId !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only create notifications for yourself'
        });
      }
    } else if (req.user.role === 'parent') {
      // Parent can create notifications for their children
      const child = await Child.findOne({
        user: userId,
        parent: req.user._id
      });
      
      if (!child && userId !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only create notifications for yourself or your children'
        });
      }
    }
    
    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      data: data || {},
      priority: priority || 3,
      isRead: false,
      isSent: false,
      sentVia: sentVia || [],
      createdAt: new Date()
    });
    
    res.status(201).json({
      success: true,
      data: notification,
      message: 'Notification created successfully'
    });
  } catch (error) {
    console.error('Error in createNotification:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get parent notifications for child activities
 */
export const getChildNotifications = async (req, res) => {
  try {
    if (req.user.role !== 'parent') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Parent only.'
      });
    }
    
    const { childId } = req.params;
    const parentId = req.user._id;
    
    // Verify child belongs to parent
    const child = await Child.findOne({
      _id: childId,
      parent: parentId
    });
    
    if (!child) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - child not found or does not belong to you'
      });
    }
    
    const { page = 1, limit = 20, type } = req.query;
    const skip = (page - 1) * limit;
    
    // Get child's user ID
    const childUser = await User.findById(child.user);
    
    // Find notifications related to this child
    // Either notifications sent to parent about child, or child's own notifications
    const query = {
      $or: [
        { userId: parentId, 'data.childId': child.user },
        { userId: child.user }
      ]
    };
    
    if (type && type !== 'all') {
      query.type = type;
    }
    
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Notification.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        notifications,
        childInfo: {
          id: child._id,
          userId: child.user,
          name: childUser?.name
        }
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error in getChildNotifications:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Send mood alert notification
 */
export const sendMoodAlert = async (req, res) => {
  try {
    if (req.user.role !== 'parent') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Parent only.'
      });
    }
    
    const { childId, mood, intensity, message } = req.body;
    const parentId = req.user._id;
    
    // Verify child belongs to parent
    const child = await Child.findOne({
      _id: childId,
      parent: parentId
    });
    
    if (!child) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - child not found or does not belong to you'
      });
    }
    
    const childUser = await User.findById(child.user);
    
    // Create mood alert notification for parent
    const notification = await Notification.create({
      userId: parentId,
      type: 'mood_alert',
      title: `${childUser?.name}'s Mood Alert`,
      message: message || `${childUser?.name} is feeling ${mood} (Intensity: ${intensity}/10)`,
      data: {
        childId: child.user,
        childName: childUser?.name,
        mood,
        intensity,
        timestamp: new Date()
      },
      priority: intensity >= 7 ? 1 : intensity <= 3 ? 2 : 3
    });
    
    res.json({
      success: true,
      data: notification,
      message: 'Mood alert notification sent'
    });
  } catch (error) {
    console.error('Error in sendMoodAlert:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Send AI suggestion notification
 */
export const sendAISuggestion = async (req, res) => {
  try {
    const { childId, suggestion, context } = req.body;
    const parentId = req.user._id;
    
    // Verify parent access
    const child = await Child.findOne({
      _id: childId,
      parent: parentId
    });
    
    if (!child) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - child not found or does not belong to you'
      });
    }
    
    const childUser = await User.findById(child.user);
    
    // Create AI suggestion notification for parent
    const notification = await Notification.create({
      userId: parentId,
      type: 'ai_suggestion',
      title: 'AI Parenting Suggestion',
      message: suggestion,
      data: {
        childId: child.user,
        childName: childUser?.name,
        context: context || {},
        timestamp: new Date()
      },
      priority: 2
    });
    
    res.json({
      success: true,
      data: notification,
      message: 'AI suggestion notification sent'
    });
  } catch (error) {
    console.error('Error in sendAISuggestion:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Bulk send notifications to multiple users
 */
export const sendBulkNotifications = async (req, res) => {
  try {
    if (req.user.role !== 'parent') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Parent only.'
      });
    }
    
    const { childIds, type, title, message, data } = req.body;
    
    if (!childIds || !Array.isArray(childIds) || childIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'childIds array is required'
      });
    }
    
    if (!type || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'type, title, and message are required'
      });
    }
    
    const notifications = [];
    
    for (const childId of childIds) {
      // Verify each child belongs to parent
      const child = await Child.findOne({
        _id: childId,
        parent: req.user._id
      });
      
      if (child) {
        const childUser = await User.findById(child.user);
        
        const notification = {
          userId: child.user, // Send to child's account
          type,
          title: title.replace('{childName}', childUser?.name || 'Child'),
          message: message.replace('{childName}', childUser?.name || 'Child'),
          data: {
            ...data,
            childId: child.user,
            childName: childUser?.name,
            sentBy: req.user._id,
            timestamp: new Date()
          },
          priority: 3,
          createdAt: new Date()
        };
        
        notifications.push(notification);
      }
    }
    
    if (notifications.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid child IDs found'
      });
    }
    
    // Bulk insert
    const result = await Notification.insertMany(notifications);
    
    res.json({
      success: true,
      data: {
        sentCount: result.length,
        notifications: result
      },
      message: `${result.length} notifications sent successfully`
    });
  } catch (error) {
    console.error('Error in sendBulkNotifications:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Schedule notification for future delivery
 */
export const scheduleNotification = async (req, res) => {
  try {
    const { userId, type, title, message, data, scheduledFor } = req.body;
    
    if (!userId || !type || !title || !message || !scheduledFor) {
      return res.status(400).json({
        success: false,
        message: 'userId, type, title, message, and scheduledFor are required'
      });
    }
    
    // Validate scheduled date is in future
    const scheduledDate = new Date(scheduledFor);
    if (scheduledDate <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'scheduledFor must be a future date'
      });
    }
    
    // Check user access
    if (req.user.role === 'child' && userId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only schedule notifications for yourself'
      });
    }
    
    if (req.user.role === 'parent') {
      const child = await Child.findOne({
        user: userId,
        parent: req.user._id
      });
      
      if (!child && userId !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only schedule notifications for yourself or your children'
        });
      }
    }
    
    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      data: data || {},
      scheduledFor: scheduledDate,
      isRead: false,
      isSent: false,
      priority: 3,
      createdAt: new Date()
    });
    
    res.status(201).json({
      success: true,
      data: notification,
      message: 'Notification scheduled successfully'
    });
  } catch (error) {
    console.error('Error in scheduleNotification:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};