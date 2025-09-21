import mongoose from 'mongoose';
import { hash, compare } from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  role: {
    type: String,
    enum: ['parent', 'child', 'admin'],
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  phone: String,
  dob: Date,
  isActive: {
    type: Boolean,
    default: true,
  },
  lastLogin: Date,
}, {
  timestamps: true,
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);