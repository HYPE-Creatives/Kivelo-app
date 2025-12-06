import mongoose from 'mongoose';

const badgeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  iconUrl: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['streak', 'mood', 'creative', 'social', 'achievement'],
    required: true
  },
  category: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum']
  },
  requirements: {
    streakDays: Number,
    moodEntries: Number,
    journalEntries: Number,
    points: Number
  },
  pointsReward: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Badge', badgeSchema);