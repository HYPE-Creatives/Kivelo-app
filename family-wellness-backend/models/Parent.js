import mongoose from 'mongoose';

const parentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true // This creates an index
  },
  familyCode: {
    type: String,
    required: true,
    unique: true // This creates an index
  },
  subscription: {
    type: String,
    enum: ['free', 'premium', 'enterprise'],
    default: 'free'
  },
  children: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Child'
  }],
  billing: {
    plan: {
      type: String,
      enum: ['free', 'premium', 'enterprise'],
      default: 'free'
    },
    paymentMethod: String,
    billingAddress: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    nextBillingDate: Date
  },
  settings: {
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      activityReminders: { type: Boolean, default: true },
      progressReports: { type: Boolean, default: true }
    },
    privacy: {
      shareProgress: { type: Boolean, default: false },
      showInSearch: { type: Boolean, default: false }
    },
    limits: {
      dailyScreenTime: { type: Number, default: 120 },
      maxActivitiesPerDay: { type: Number, default: 5 }
    }
  }
}, {
  timestamps: true
});

// Remove any explicit index calls for fields with unique: true
// parentSchema.index({ user: 1 }); // REMOVE - duplicate of unique: true
// parentSchema.index({ familyCode: 1 }); // REMOVE - duplicate of unique: true

export default mongoose.model('Parent', parentSchema);