import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const adminSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true, // This automatically creates an index
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['super_admin', 'guest_admin'],
    default: 'guest_admin',
    required: true
  },
  permissions: {
    users: { type: Boolean, default: false },
    parents: { type: Boolean, default: false },
    children: { type: Boolean, default: false },
    activities: { type: Boolean, default: false },
    analytics: { type: Boolean, default: false },
    settings: { type: Boolean, default: false }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date
}, {
  timestamps: true
});

// Remove duplicate index definitions - let Mongoose handle indexes from schema definitions
// adminSchema.index({ email: 1 }); // REMOVE THIS - duplicate of unique: true
// adminSchema.index({ role: 1 });  // REMOVE THIS - not necessary unless compound index
// adminSchema.index({ isActive: 1 }); // REMOVE THIS - not necessary unless compound index

// Virtual for checking if account is locked
adminSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Hash password before saving
adminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
adminSchema.methods.comparePassword = async function(candidatePassword) {
  if (this.isLocked) {
    throw new Error('Account is temporarily locked due to too many failed login attempts');
  }
  
  const isMatch = await bcrypt.compare(candidatePassword, this.password);
  
  if (!isMatch) {
    this.loginAttempts += 1;
    if (this.loginAttempts >= 5) {
      this.lockUntil = Date.now() + 30 * 60 * 1000; // 30 minutes lock
    }
    await this.save();
    return false;
  }
  
  // Reset login attempts on successful login
  if (this.loginAttempts > 0) {
    this.loginAttempts = 0;
    this.lockUntil = undefined;
    await this.save();
  }
  
  return true;
};

// Method to check permission
adminSchema.methods.hasPermission = function(permission) {
  if (this.role === 'super_admin') return true;
  return this.permissions[permission] === true;
};

// Method to get safe admin data (without sensitive info)
adminSchema.methods.toSafeObject = function() {
  const admin = this.toObject();
  delete admin.password;
  delete admin.loginAttempts;
  delete admin.lockUntil;
  return admin;
};

export default mongoose.model('Admin', adminSchema);