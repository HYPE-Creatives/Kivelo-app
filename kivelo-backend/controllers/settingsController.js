// controllers/settingsController.js
// controllers/settingsController.js
import Child from '../models/Child.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { resolveChildAccess } from "../utils/resolveChildAccess.js";


/* ---------------------------------------------------
   HELPER: Build the default settings object
--------------------------------------------------- */
const defaultSettingsTemplate = () => ({
  notifications: {
    enabled: true,
    types: {
      moodReminders: true,
      activityReminders: true,
      streakNotifications: true,
      badgeNotifications: true,
      pointsUpdates: true,
      parentMessages: true,
      systemAnnouncements: true
    },
    frequency: 'instant',
    quietHours: {
      enabled: false,
      startTime: '21:00',
      endTime: '07:00'
    }
  },
  privacy: {
    journalVisibility: 'private',
    moodTracking: 'parent-only',
    activityVisibility: 'parent-only',
    shareAchievements: true,
    shareLocation: false
  },
  display: {
    theme: 'auto',
    fontSize: 'medium',
    language: 'en',
    colorBlindMode: false,
    reducedMotion: false,
    avatarVisibility: true
  },
  learning: {
    dailyGoal: 5,
    difficulty: 'adaptive',
    focusMode: {
      enabled: false,
      duration: 25,
      breakDuration: 5
    },
    reminders: {
      morning: true,
      afternoon: true,
      evening: true
    },
    autoSave: true
  },
  social: {
    friendRequests: false,
    shareWithFriends: false,
    leaderboard: true,
    comments: false
  },
  safety: {
    contentFilter: {
      enabled: true,
      level: 'medium'
    },
    timeLimits: {
      enabled: false,
      dailyLimit: 120,
      bedtime: '21:00'
    },
    purchaseRestrictions: {
      enabled: true,
      requirePin: false
    }
  },
  data: {
    autoBackup: true,
    backupFrequency: 'weekly',
    cloudStorage: { enabled: false },
    deleteAfter: 365
  },
  accessibility: {
    screenReader: { enabled: false },
    highContrast: false,
    textToSpeech: { enabled: false, speed: 1 },
    captions: true
  }
});


/**
 * Get child's settings
 */
export const getChildSettings = async (req, res) => {
  try {
    if (req.user.role !== 'child') {
      return res.status(403).json({ success: false, message: 'Child only.' });
    }

    const child = await Child.findOne({ user: req.user._id });
    if (!child) return res.status(404).json({ success: false, message: 'Child profile not found' });

    res.json({
      success: true,
      data: {
        settings: child.settings,
        history: child.settingsHistory || [],
        lastUpdated: child.lastSettingsUpdate,
        canModify: true
      }
    });
  } catch (error) {
    console.error('getChildSettings:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};


/**
 * Update child's settings
 */
export const updateChildSettings = async (req, res) => {
  try {
    if (req.user.role !== 'child')
      return res.status(403).json({ success: false, message: 'Child only.' });

    const child = await Child.findOne({ user: req.user._id });
    if (!child) return res.status(404).json({ success: false, message: 'Child profile not found' });

    const updates = req.body;
    if (!updates || typeof updates !== 'object')
      return res.status(400).json({ success: false, message: 'Invalid settings data' });

    const changes = [];

    const deepMerge = (target, source) => {
      for (const key in source) {
        const val = source[key];

        if (val && typeof val === 'object' && !Array.isArray(val)) {
          if (!target[key]) target[key] = {};
          deepMerge(target[key], val);
        } else {
          if (JSON.stringify(target[key]) !== JSON.stringify(val)) {
            changes.push({ changedAt: new Date(), field: key, old: target[key], new: val });
          }
          target[key] = val;
        }
      }
    };

    deepMerge(child.settings, updates);

    // Track history (limit 10)
    if (changes.length > 0) {
      child.settingsHistory = [...changes, ...(child.settingsHistory || [])].slice(0, 10);
      child.lastSettingsUpdate = new Date();
    }

    await child.save();

    // 📌 Notify parent
    if (child.parent) {
      await Notification.create({
        userId: child.parent,
        type: 'settings_update',
        title: 'Child Settings Updated',
        message: `${req.user.name || 'Your child'} updated their account settings.`,
        data: { childId: child.user, changes }
      });
    }

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: {
        settings: child.settings,
        changes,
        lastUpdated: child.lastSettingsUpdate
      }
    });
  } catch (error) {
    console.error('updateChildSettings:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Reset settings to default
 */
export const resetChildSettings = async (req, res) => {
  try {
    if (req.user.role !== 'child')
      return res.status(403).json({ success: false, message: 'Child only.' });

    const child = await Child.findOne({ user: req.user._id });
    if (!child) return res.status(404).json({ success: false, message: 'Child profile not found' });

    const { section } = req.query;
    const defaults = defaultSettingsTemplate();

    if (section && defaults[section]) {
      child.settingsHistory.push({
        changedAt: new Date(),
        field: section,
        oldValue: child.settings[section],
        newValue: defaults[section]
      });

      child.settings[section] = defaults[section];
    } else {
      child.settingsHistory.push({
        changedAt: new Date(),
        field: 'all',
        oldValue: child.settings,
        newValue: defaults
      });

      child.settings = defaults;
    }

    child.lastSettingsUpdate = new Date();
    await child.save();

    res.json({
      success: true,
      message: `Settings ${section ? `(${section})` : ''} reset to defaults`,
      data: child.settings
    });

  } catch (error) {
    console.error('resetChildSettings:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};


/**
 * Get settings history
 */
export const getSettingsHistory = async (req, res) => {
  try {
    if (req.user.role !== 'child')
      return res.status(403).json({ success: false, message: 'Child only.' });

    const child = await Child.findOne({ user: req.user._id })
      .select('settingsHistory lastSettingsUpdate');

    if (!child)
      return res.status(404).json({ success: false, message: 'Child profile not found' });

    res.json({
      success: true,
      data: {
        history: child.settingsHistory,
        lastUpdate: child.lastSettingsUpdate,
        totalChanges: child.settingsHistory?.length || 0
      }
    });
  } catch (error) {
    console.error('getSettingsHistory:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Export settings
 */
export const exportChildSettings = async (req, res) => {
  try {
    if (req.user.role !== 'child')
      return res.status(403).json({ success: false, message: 'Child only.' });

    const child = await Child.findOne({ user: req.user._id })
      .populate('user', 'name email');

    if (!child)
      return res.status(404).json({ success: false, message: 'Child profile not found' });

    const { format = 'json' } = req.query;

    if (format === 'csv') {
      const flatten = (obj, prefix = '') => {
        let rows = [];
        for (const key in obj) {
          const val = obj[key];
          const full = prefix ? `${prefix}.${key}` : key;

          if (val && typeof val === 'object' && !Array.isArray(val)) {
            rows.push(...flatten(val, full));
          } else {
            rows.push([full, JSON.stringify(val)]);
          }
        }
        return rows;
      };

      const rows = flatten(child.settings);
      const csv = ['Setting,Value', ...rows.map(r => `"${r[0]}","${r[1]}"`)].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=settings_${child.user.name}_${Date.now()}.csv`
      );

      return res.send(csv);
    }

    // JSON export
    return res.json({
      success: true,
      data: {
        child: {
          id: child._id,
          userId: child.user._id,
          name: child.user.name
        },
        settings: child.settings,
        history: child.settingsHistory,
        lastUpdate: child.lastSettingsUpdate
      }
    });

  } catch (error) {
    console.error('exportChildSettings:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};


/**
 * Parent view of child's settings (read-only)
 */
// Parent view of child's settings (read-only)
// Parent view of child's settings (read-only)
export const getChildSettingsParentView = async (req, res) => {
  try {
    if (req.user.role !== "parent") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Parent only."
      });
    }

    const { childId } = req.params;

    // Step 1: Check parent-child relationship
    const resolvedAccess = await resolveChildAccess(req.user._id, childId);

    if (!resolvedAccess) {
      return res.status(403).json({
        success: false,
        message: "Child not found or does not belong to you"
      });
    }

    // Step 2: Fetch real child document safely
    const child = await Child.findOne({
      $or: [
        { _id: childId },              // if route uses Child._id
        { user: resolvedAccess.userId } // if route uses User._id of child
      ],
      parent: req.user._id
    }).populate("user", "name email");

    if (!child) {
      return res.status(404).json({
        success: false,
        message: "Child profile not found"
      });
    }

    // Safe parent-view settings
    const parentViewSettings = {
      notifications: child.settings?.notifications,
      privacy: child.settings?.privacy,
      learning: child.settings?.learning,
      safety: child.settings?.safety,
      lastUpdated: child.lastSettingsUpdate
    };

    return res.json({
      success: true,
      data: {
        childInfo: {
          id: child._id,
          userId: child.user?._id,
          name: child.user?.name
        },
        settings: parentViewSettings,
        canModify: false,
        note: "Parents can view but cannot modify child settings."
      }
    });

  } catch (error) {
    console.error("Error in getChildSettingsParentView:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};



