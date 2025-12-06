import mongoose from 'mongoose';

const trustZoneSchema = new mongoose.Schema({
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  childId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  settings: {
    greenThreshold: {
      type: Number,
      default: 8,
      min: 7,
      max: 10
    },
    yellowThreshold: {
      type: Number,
      default: 6,
      min: 5,
      max: 7
    },
    orangeThreshold: {
      type: Number,
      default: 4,
      min: 3,
      max: 5
    },
    redThreshold: {
      type: Number,
      default: 0,
      min: 0,
      max: 3
    },
    alertEnabled: {
      type: Boolean,
      default: true
    },
    dailyReport: {
      type: Boolean,
      default: true
    },
    weeklySummary: {
      type: Boolean,
      default: true
    }
  },
  currentZone: {
    type: String,
    enum: ['green', 'yellow', 'orange', 'red'],
    default: 'green'
  },
  history: [{
    date: Date,
    zone: String,
    averageScore: Number,
    reason: String
  }],
  lastAlertSent: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date
});

export default mongoose.model('TrustZone', trustZoneSchema);