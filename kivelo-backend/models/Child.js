import mongoose from 'mongoose';

const childSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true // This creates an index
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parent',
    required: true
  },
  dob: { type: Date, required: true },
  points: {
    type: Number,
    default: 0
  },
  level: {
    type: Number,
    default: 1
  },
  currentStreak: {
    type: Number,
    default: 0
  },
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
  preferences: {
    favoriteActivities: [String],
    learningStyle: String
  }
}, {
  timestamps: true
});

// Only create compound indexes if needed for query performance
// For example, if you frequently query by parent and points:
childSchema.index({ parent: 1, points: -1 });

// Or if you frequently query by oneTimeCode and isCodeUsed:
childSchema.index({ oneTimeCode: 1, isCodeUsed: 1 });

export default mongoose.model('Child', childSchema);