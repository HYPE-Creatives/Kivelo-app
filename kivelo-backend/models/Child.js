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

  // Child preferences
  preferences: {
    favoriteActivities: [String],
    learningStyle: String,
    avatarStyle: String,
    notificationSound: String
  }
}, {
  timestamps: true
});

childSchema.index({ parent: 1, points: -1 });
childSchema.index({ 'moodStats.currentStreak': -1 });

export default mongoose.model('Child', childSchema);