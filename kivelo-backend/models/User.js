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
    required: function() {
      return this.role === 'parent' || (this.role === 'child' && this.hasSetPassword);
    },
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
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer-not-to-say'],
    default: null
  },
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
  
  // Reset password fields 
  resetPasswordToken: String,
  resetPasswordExpires: Date,

  // Parent-specific fields
  parent: {
    familyCode: {
      type: String,
      unique: true, // This creates an index automatically
      sparse: true // Allows null values but ensures uniqueness for non-null
    },
    subscription: {
      type: String,
      enum: ['free', 'premium', 'enterprise'],
      default: 'free'
    },
    children: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  
  // Child-specific fields
  child: {
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    oneTimeCode: {
      type: String,
      default: null
    },
    oneTimeCodeExpires: {
      type: Date,
      default: null
    },
    hasSetPassword: {
      type: Boolean,
      default: false
    },
    interests: [String],
    gradeLevel: String,
    points: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true,
});

// REMOVED DUPLICATE INDEXES - they are already created by 'unique: true' above
// userSchema.index({ email: 1 }); // REMOVE THIS LINE
// userSchema.index({ 'parent.familyCode': 1 }); // REMOVE THIS LINE

// Only keep indexes that aren't created by 'unique: true'
userSchema.index({ 'child.parent': 1 }); // This is fine since it's not a duplicate

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash the password if it's modified (or new) and not empty
  if (!this.isModified('password') || !this.password) return next();
  
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
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Check if verification code is expired
userSchema.methods.isVerificationCodeExpired = function() {
  return this.verificationCodeExpires < new Date();
};

// Check if one-time code is expired (for children)
userSchema.methods.isOneTimeCodeExpired = function() {
  if (!this.child?.oneTimeCodeExpires) return true;
  return this.child.oneTimeCodeExpires < new Date();
};

// Generate verification code
userSchema.methods.generateVerificationCode = function() {
  this.verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  this.verificationCodeExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  return this.verificationCode;
};

// Generate one-time code for child
userSchema.methods.generateOneTimeCode = function() {
  if (this.role !== 'child') {
    throw new Error('Only child accounts can have one-time codes');
  }
  
  // Generate a 6-digit code
  this.child.oneTimeCode = Math.floor(100000 + Math.random() * 900000).toString();
  this.child.oneTimeCodeExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  return this.child.oneTimeCode;
};

// Virtual for checking if child has active one-time code
userSchema.virtual('hasActiveOneTimeCode').get(function() {
  if (this.role !== 'child') return false;
  return this.child?.oneTimeCode && !this.isOneTimeCodeExpired();
});

// Method to get user data without sensitive information
userSchema.methods.toSafeObject = function() {
  const userObject = this.toObject();
  
  // Remove sensitive fields
  delete userObject.password;
  delete userObject.verificationCode;
  delete userObject.verificationCodeExpires;
  
  if (userObject.child) {
    delete userObject.child.oneTimeCode;
    delete userObject.child.oneTimeCodeExpires;
  }
  
  return userObject;
};

export default mongoose.model('User', userSchema);