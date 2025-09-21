import mongoose from 'mongoose';

const childSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parent',
    required: true,
  },
  oneTimeCode: {
    type: String,
    unique: true,
  },
  codeExpires: Date,
  isCodeUsed: {
    type: Boolean,
    default: false,
  },
  hasSetPassword: {
    type: Boolean,
    default: false,
  },
  activities: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Activity',
  }],
  preferences: {
    theme: {
      type: String,
      default: 'light',
    },
    notifications: {
      type: Boolean,
      default: true,
    },
  },
}, {
  timestamps: true,
});

export default mongoose.model('Child', childSchema);