// controllers/settingsController.js
import Child from '../models/Child.js';
import User from '../models/User.js';

/**
 * Get child's settings
 */
export const getChildSettings = async (req, res) => {
  try {
    if (req.user.role !== 'child') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Child only.'
      });
    }

    const child = await Child.findOne({ user: req.user._id });
    
    if (!child) {
      return res.status(404).json({
        success: false,
        message: 'Child profile not found'
      });
    }

    res.json({
      success: true,
      data: {
        settings: child.settings,
        lastUpdated: child.lastSettingsUpdate,
        canModify: true
      }
    });
  } catch (error) {
    console.error('Error in getChildSettings:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Update child's settings
 */
export const updateChildSettings = async (req, res) => {
  try {
    if (req.user.role !== 'child') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Child only.'
      });
    }

    const child = await Child.findOne({ user: req.user._id });
    
    if (!child) {
      return res.status(404).json({
        success: false,
        message: 'Child profile not found'
      });
    }

    const updates = req.body;
    
    // Validate updates structure
    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Invalid settings data'
      });
    }

    // Track changes
    const changes = [];
    const oldSettings = JSON.parse(JSON.stringify(child.settings));

    // Apply updates (deep merge)
    const deepMerge = (target, source) => {
      for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          if (!target[key]) target[key] = {};
          deepMerge(target[key], source[key]);
        } else {
          // Track change
          if (JSON.stringify(target[key]) !== JSON.stringify(source[key])) {
            changes.push({
              changedAt: new Date(),
              changedField: key,
              oldValue: target[key],
              newValue: source[key]
            });
          }
          target[key] = source[key];
        }
      }
    };

    deepMerge(child.settings, updates);

    // Add changes to history (keep last 10 changes)
    if (changes.length > 0) {
      child.settingsHistory = [...changes, ...child.settingsHistory].slice(0, 10);
      child.lastSettingsUpdate = new Date();
    }

    await child.save();

    res.json({
      success: true,
      data: {
        settings: child.settings,
        changes: changes.length,
        lastUpdated: child.lastSettingsUpdate
      },
      message: 'Settings updated successfully'
    });
  } catch (error) {
    console.error('Error in updateChildSettings:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Reset settings to default
 */
export const resetChildSettings = async (req, res) => {
  try {
    if (req.user.role !== 'child') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Child only.'
      });
    }

    const child = await Child.findOne({ user: req.user._id });
    
    if (!child) {
      return res.status(404).json({
        success: false,
        message: 'Child profile not found'
      });
    }

    const { section } = req.query; // Optional: reset specific section
    
    // Save old settings to history
    if (child.settings) {
      child.settingsHistory.push({
        changedAt: new Date(),
        changedField: section || 'all',
        oldValue: section ? child.settings[section] : child.settings,
        newValue: null // Will be set to defaults
      });
    }

    // Define default settings
    const defaultSettings = {
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
    };

    if (section && defaultSettings[section]) {
      // Reset specific section
      child.settings[section] = defaultSettings[section];
    } else {
      // Reset all settings
      child.settings = defaultSettings;
    }

    child.lastSettingsUpdate = new Date();
    await child.save();

    res.json({
      success: true,
      data: {
        settings: child.settings,
        resetSection: section || 'all'
      },
      message: `Settings${section ? ` (${section})` : ''} reset to default`
    });
  } catch (error) {
    console.error('Error in resetChildSettings:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get settings history
 */
export const getSettingsHistory = async (req, res) => {
  try {
    if (req.user.role !== 'child') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Child only.'
      });
    }

    const child = await Child.findOne({ user: req.user._id })
      .select('settingsHistory lastSettingsUpdate');
    
    if (!child) {
      return res.status(404).json({
        success: false,
        message: 'Child profile not found'
      });
    }

    res.json({
      success: true,
      data: {
        history: child.settingsHistory || [],
        lastUpdate: child.lastSettingsUpdate,
        totalChanges: child.settingsHistory?.length || 0
      }
    });
  } catch (error) {
    console.error('Error in getSettingsHistory:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Export settings
 */
export const exportChildSettings = async (req, res) => {
  try {
    if (req.user.role !== 'child') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Child only.'
      });
    }

    const child = await Child.findOne({ user: req.user._id })
      .populate('user', 'name email');
    
    if (!child) {
      return res.status(404).json({
        success: false,
        message: 'Child profile not found'
      });
    }

    const { format = 'json' } = req.query;
    
    if (format === 'csv') {
      // Convert settings to CSV format
      const csvRows = [];
      
      // Helper to flatten settings
      const flattenObject = (obj, prefix = '') => {
        const rows = [];
        for (const key in obj) {
          const value = obj[key];
          const fullKey = prefix ? `${prefix}.${key}` : key;
          
          if (value && typeof value === 'object' && !Array.isArray(value)) {
            rows.push(...flattenObject(value, fullKey));
          } else {
            rows.push([fullKey, JSON.stringify(value)]);
          }
        }
        return rows;
      };
      
      const settingsRows = flattenObject(child.settings);
      const csvContent = ['Setting,Value', ...settingsRows.map(row => `"${row[0]}","${row[1]}"`)].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 
        `attachment; filename=child_settings_${child.user.name}_${new Date().toISOString().split('T')[0]}.csv`);
      res.send(csvContent);
    } else {
      // JSON format
      res.json({
        success: true,
        data: {
          child: {
            id: child._id,
            userId: child.user._id,
            name: child.user.name,
            email: child.user.email
          },
          settings: child.settings,
          preferences: child.preferences,
          history: child.settingsHistory || [],
          exportDate: new Date(),
          lastUpdate: child.lastSettingsUpdate
        }
      });
    }
  } catch (error) {
    console.error('Error in exportChildSettings:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Parent view of child's settings (read-only)
 */
export const getChildSettingsParentView = async (req, res) => {
  try {
    if (req.user.role !== 'parent') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Parent only.'
      });
    }

    const { childId } = req.params;
    
    const child = await Child.findOne({
      _id: childId,
      parent: req.user._id
    }).populate('user', 'name');
    
    if (!child) {
      return res.status(403).json({
        success: false,
        message: 'Child not found or access denied'
      });
    }

    // Return only non-sensitive settings for parent view
    const parentViewSettings = {
      notifications: child.settings?.notifications,
      privacy: child.settings?.privacy,
      learning: child.settings?.learning,
      safety: child.settings?.safety,
      lastUpdated: child.lastSettingsUpdate
    };

    res.json({
      success: true,
      data: {
        childInfo: {
          id: child._id,
          userId: child.user._id,
          name: child.user.name
        },
        settings: parentViewSettings,
        canModify: false, // Parent can only view, not modify child's settings
        note: 'Parents can view but not modify child settings. Contact support for changes.'
      }
    });
  } catch (error) {
    console.error('Error in getChildSettingsParentView:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};