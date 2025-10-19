import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true, // This creates an index automatically
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['parent', 'child', 'admin'],
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: String,
  dob: Date,
  avatar: String,
  isActive: {
    type: Boolean,
    default: true,
  },
   isVerified: {
    type: Boolean,
    default: false
  },
  verificationCode: {
    type: String,
    default: null
  },
  verificationCodeExpires: {
    type: Date,
    default: null
  },
  lastLogin: Date,
}, {
  timestamps: true,
});

// Remove any explicit index calls if they exist
// userSchema.index({ email: 1 }); // REMOVE THIS if present

// Hash password before saving
userSchema.pre('save', async function(next) {
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
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Check if verification code is expired
userSchema.methods.isVerificationCodeExpired = function() {
  return this.verificationCodeExpires < new Date();
};

// Generate verification code
userSchema.methods.generateVerificationCode = function() {
  this.verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  this.verificationCodeExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  return this.verificationCode;
};

export default mongoose.model('User', userSchema);