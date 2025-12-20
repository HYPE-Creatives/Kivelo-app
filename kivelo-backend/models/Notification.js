import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'mood_alert',
      'streak_milestone', 
      'new_journal',
      'new_activity',
      'activity_completed',
      'activity_submission',
      'submission_reviewed',
      'points_earned',
      'badge_earned',
      'system',
      'reminder',
      'parent_alert',
      'ai_suggestion',
      'new_message',
      'chat_message'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  data: {
    type: Object,
    default: {}
  },
  priority: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  isRead: {
    type: Boolean,
    default: false
  },
  isSent: {
    type: Boolean,
    default: false
  },
  sentVia: [{
    type: String,
    enum: ['push', 'email', 'sms']
  }],
  scheduledFor: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ scheduledFor: 1, isSent: 1 });

export default mongoose.model('Notification', notificationSchema);