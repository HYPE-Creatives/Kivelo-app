import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['education', 'physical', 'creative', 'chores', 'social', 'mindfulness'],
    required: true
  },
  points: {
    type: Number,
    required: true,
    min: 1
  },
  duration: {
    type: Number, // in minutes
    required: true
  },
  assignedTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Child'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dueDate: Date,
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: Date,
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Child'
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  tags: [String]
}, {
  timestamps: true
});

// Create compound indexes for common queries
activitySchema.index({ createdBy: 1, completed: 1 });
activitySchema.index({ assignedTo: 1, completed: 1 });
activitySchema.index({ category: 1 });
activitySchema.index({ dueDate: 1 });

export default mongoose.model('Activity', activitySchema);