// models/Child.js
import mongoose from 'mongoose';

const childSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dob: { type: Date, required: true },
  activities: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Activity'
  }],
  // Gamification (sync with User model)
  streakCount: {
    type: Number,
    default: 0
  },
  points: {
    type: Number,
    default: 0
  },

  // Badges earned
  badges: [{
    badgeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Badge'
    },
    earnedAt: Date,
    progress: Number
  }],

  // Mood history summary
  moodStats: {
    averageScore: { type: Number, default: 0 },
    totalEntries: { type: Number, default: 0 },
    lastEntry: Date,
    currentStreak: { type: Number, default: 0 }
  },

  // One-time code for setup
  oneTimeCode: String,
  codeExpires: Date,
  isCodeUsed: {
    type: Boolean,
    default: false
  },
  hasSetPassword: {
    type: Boolean,
    default: false
  },

  // Child preferences (content preferences)
  preferences: {
    favoriteActivities: [String],
    learningStyle: String,
    avatarStyle: String,
    notificationSound: String
  },

  // Child settings (account/app settings)
  settings: {
    // Notification settings
    notifications: {
      enabled: {
        type: Boolean,
        default: true
      },
      types: {
        moodReminders: { type: Boolean, default: true },
        activityReminders: { type: Boolean, default: true },
        streakNotifications: { type: Boolean, default: true },
        badgeNotifications: { type: Boolean, default: true },
        pointsUpdates: { type: Boolean, default: true },
        parentMessages: { type: Boolean, default: true },
        systemAnnouncements: { type: Boolean, default: true }
      },
      frequency: {
        type: String,
        enum: ['instant', 'daily', 'weekly'],
        default: 'instant'
      },
      quietHours: {
        enabled: { type: Boolean, default: false },
        startTime: { type: String, default: '21:00' }, // 9:00 PM
        endTime: { type: String, default: '07:00' }    // 7:00 AM
      }
    },

    // Privacy settings
    privacy: {
      journalVisibility: {
        type: String,
        enum: ['private', 'parent-only', 'public'],
        default: 'private'
      },
      moodTracking: {
        type: String,
        enum: ['private', 'parent-only', 'public'],
        default: 'parent-only'
      },
      activityVisibility: {
        type: String,
        enum: ['private', 'parent-only', 'public'],
        default: 'parent-only'
      },
      shareAchievements: {
        type: Boolean,
        default: true
      },
      shareLocation: {
        type: Boolean,
        default: false
      }
    },

    // Display settings
    display: {
      theme: {
        type: String,
        enum: ['light', 'dark', 'auto'],
        default: 'auto'
      },
      fontSize: {
        type: String,
        enum: ['small', 'medium', 'large', 'x-large'],
        default: 'medium'
      },
      language: {
        type: String,
        default: 'en'
      },
      colorBlindMode: {
        type: Boolean,
        default: false
      },
      reducedMotion: {
        type: Boolean,
        default: false
      },
      avatarVisibility: {
        type: Boolean,
        default: true
      }
    },

    // Learning & activity settings
    learning: {
      dailyGoal: {
        type: Number,
        min: 1,
        max: 20,
        default: 5
      },
      difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard', 'adaptive'],
        default: 'adaptive'
      },
      focusMode: {
        enabled: { type: Boolean, default: false },
        duration: { type: Number, default: 25 }, // minutes
        breakDuration: { type: Number, default: 5 } // minutes
      },
      reminders: {
        morning: { type: Boolean, default: true },
        afternoon: { type: Boolean, default: true },
        evening: { type: Boolean, default: true }
      },
      autoSave: {
        type: Boolean,
        default: true
      }
    },

    // Social settings
    social: {
      friendRequests: {
        type: Boolean,
        default: false // Children can't have friend requests by default
      },
      shareWithFriends: {
        type: Boolean,
        default: false
      },
      leaderboard: {
        type: Boolean,
        default: true
      },
      comments: {
        type: Boolean,
        default: false
      }
    },

    // Safety & parental controls
    safety: {
      contentFilter: {
        enabled: { type: Boolean, default: true },
        level: {
          type: String,
          enum: ['low', 'medium', 'high'],
          default: 'medium'
        }
      },
      timeLimits: {
        enabled: { type: Boolean, default: false },
        dailyLimit: { type: Number, default: 120 }, // minutes
        bedtime: { type: String, default: '21:00' } // 9:00 PM
      },
      purchaseRestrictions: {
        enabled: { type: Boolean, default: true },
        requirePin: { type: Boolean, default: false }
      }
    },

    // Data & storage settings
    data: {
      autoBackup: {
        type: Boolean,
        default: true
      },
      backupFrequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly'],
        default: 'weekly'
      },
      cloudStorage: {
        enabled: { type: Boolean, default: false },
        provider: String
      },
      deleteAfter: {
        type: Number,
        default: 365 // days
      }
    },

    // Accessibility settings
    accessibility: {
      screenReader: {
        enabled: { type: Boolean, default: false }
      },
      highContrast: {
        type: Boolean,
        default: false
      },
      textToSpeech: {
        enabled: { type: Boolean, default: false },
        speed: {
          type: Number,
          min: 0.5,
          max: 3,
          default: 1
        }
      },
      captions: {
        type: Boolean,
        default: true
      }
    }
  },

  // 👇 UPDATED: Settings History - Stores COMPLETE snapshots of OLD settings only
  settingsHistory: [{
    // The entire settings object AS IT WAS BEFORE the change
    settingsSnapshot: { type: Object, required: true },
    changedAt: { type: Date, default: Date.now },
    // Track who triggered the change
    changedBy: { 
      type: String, 
      enum: ['child', 'parent', 'system', 'admin'], 
      default: 'system' 
    },
    // Optional: Brief note about the change
    note: String
  }],

  // Track last settings update
  lastSettingsUpdate: Date

}, {
  timestamps: true
});

// Indexes
childSchema.index({ parent: 1, points: -1 });
childSchema.index({ 'moodStats.currentStreak': -1 });
childSchema.index({ 'settings.notifications.enabled': 1 });
childSchema.index({ 'settings.privacy.journalVisibility': 1 });

// 👇 UPDATED: Middleware to AUTO-CAPTURE history when settings change
childSchema.pre('save', function(next) {
  // Only proceed if 'settings' were modified AND this is not a brand new document
  if (this.isModified('settings') && !this.isNew) {
    const oldSettings = this._originalSettings || this.settings;
    
    // Initialize history array if needed
    if (!Array.isArray(this.settingsHistory)) {
      this.settingsHistory = [];
    }

    // Push the OLD settings snapshot into history (not current settings)
    this.settingsHistory.push({
      settingsSnapshot: oldSettings,
      changedAt: new Date(),
      changedBy: 'system', // Default value
      note: 'Automatic save'
    });

    // Limit history size to last 30 changes
    const MAX_HISTORY = 30;
    if (this.settingsHistory.length > MAX_HISTORY) {
      this.settingsHistory = this.settingsHistory.slice(-MAX_HISTORY);
    }

    // Store current settings for next comparison
    this._originalSettings = this.settings;
    
    // Update the timestamp
    this.lastSettingsUpdate = new Date();
  }
  next();
});

// 👇 NEW: Helper Method for controlled settings updates from your code
childSchema.statics.updateChildSettings = async function(childId, newSettings, options = {}) {
  const { changedBy = 'system', note = '' } = options;
  
  const child = await this.findById(childId);
  if (!child) {
    throw new Error('Child not found');
  }

  // Store the OLD settings
  const oldSettings = child.settings;

  // Update to NEW settings
  child.settings = newSettings;

  // Manually push old settings to history
  if (!Array.isArray(child.settingsHistory)) {
    child.settingsHistory = [];
  }
  
  child.settingsHistory.push({
    settingsSnapshot: oldSettings,
    changedAt: new Date(),
    changedBy: changedBy,
    note: note
  });

  // Limit history
  const MAX_HISTORY = 30;
  if (child.settingsHistory.length > MAX_HISTORY) {
    child.settingsHistory = child.settingsHistory.slice(-MAX_HISTORY);
  }

  // Update timestamp
  child.lastSettingsUpdate = new Date();

  // Save the document
  await child.save();
  return child;
};

export default mongoose.model('Child', childSchema);