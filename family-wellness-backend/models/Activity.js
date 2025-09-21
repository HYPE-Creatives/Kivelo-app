import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['homework', 'chore', 'exercise', 'reading', 'other'],
    default: 'other'
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  points: {
    type: Number,
    default: 10
  },
  dueDate: Date,
  assignedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  notes: String,
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Activity', activitySchema);