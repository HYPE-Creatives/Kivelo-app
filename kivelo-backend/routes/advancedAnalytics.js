import express from 'express';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import ApiAnalyticsLog from '../models/ApiAnalyticsLog.js';
import Parent from '../models/Parent.js';
import Child from '../models/Child.js';

const router = express.Router();

// User Statistics
router.get('/users/stats', async (req, res) => {
  try {
    const totalParents = await Parent.countDocuments();
    const totalChildren = await Child.countDocuments();
    const totalUsers = await User.countDocuments();
    
    const activeToday = await AuditLog.countDocuments({
      timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
    
    const parentsByRole = await User.aggregate([
      { $match: { role: 'parent' } },
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);
    
    const childrenByRole = await User.aggregate([
      { $match: { role: 'child' } },
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);
    
    res.json({
      success: true,
      data: {
        totalUsers,
        totalParents,
        totalChildren,
        activeToday,
        breakdown: { parents: parentsByRole, children: childrenByRole }
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Authentication Events
router.get('/auth/events', async (req, res) => {
  try {
    const { days = 7, limit = 100 } = req.query;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const logins = await AuditLog.countDocuments({
      action: 'LOGIN',
      timestamp: { $gte: since }
    });
    
    const logouts = await AuditLog.countDocuments({
      action: 'LOGOUT',
      timestamp: { $gte: since }
    });
    
    const passwordChanges = await AuditLog.countDocuments({
      action: 'PASSWORD_CHANGED',
      timestamp: { $gte: since }
    });
    
    const failedLogins = await AuditLog.countDocuments({
      action: 'LOGIN_FAILED',
      timestamp: { $gte: since }
    });
    
    const recentEvents = await AuditLog.find({
      timestamp: { $gte: since }
    })
    .sort({ timestamp: -1 })
    .limit(parseInt(limit))
    .lean();
    
    const loginsByDay = await AuditLog.aggregate([
      { $match: { action: 'LOGIN', timestamp: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    res.json({
      success: true,
      data: {
        logins,
        logouts,
        passwordChanges,
        failedLogins,
        loginsByDay,
        recentEvents: recentEvents.slice(0, 20)
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// API Access by User
router.get('/api/access-by-user', async (req, res) => {
  try {
    const { days = 7, limit = 50 } = req.query;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const accessByUser = await ApiAnalyticsLog.aggregate([
      { $match: { timestamp: { $gte: since } } },
      {
        $group: {
          _id: '$userId',
          count: { $sum: 1 },
          avgResponseTime: { $avg: '$responseTime' },
          routes: { $push: '$route' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: parseInt(limit) }
    ]);
    
    const enrichedData = await Promise.all(
      accessByUser.map(async (item) => {
        const user = await User.findById(item._id).lean();
        return {
          ...item,
          user: user ? { id: user._id, email: user.email, role: user.role } : null
        };
      })
    );
    
    res.json({ success: true, data: enrichedData });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// API Endpoints Distribution
router.get('/api/endpoints', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const endpoints = await ApiAnalyticsLog.aggregate([
      { $match: { timestamp: { $gte: since } } },
      {
        $group: {
          _id: '$route',
          count: { $sum: 1 },
          avgResponseTime: { $avg: '$responseTime' },
          errors: { $sum: { $cond: [{ $gte: ['$statusCode', 400] }, 1, 0] } }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 50 }
    ]);
    
    res.json({ success: true, data: endpoints });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Security Summary
router.get('/security/summary', async (req, res) => {
  try {
    const days = 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const failedLogins = await AuditLog.countDocuments({
      action: 'LOGIN_FAILED',
      timestamp: { $gte: since }
    });
    
    const suspiciousIPs = await AuditLog.aggregate([
      { $match: { timestamp: { $gte: since }, action: 'LOGIN_FAILED' } },
      { $group: { _id: '$ipAddress', count: { $sum: 1 } } },
      { $match: { count: { $gte: 5 } } }
    ]);
    
    const unusualActivityHours = await AuditLog.aggregate([
      { $match: { timestamp: { $gte: since } } },
      { $group: { _id: { $hour: '$timestamp' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    res.json({
      success: true,
      data: {
        failedLogins,
        suspiciousIPs,
        unusualActivityHours
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

export default router;
