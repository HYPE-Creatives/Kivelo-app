// models/Journal.js - UPDATED VERSION
import mongoose from 'mongoose';

const journalSchema = new mongoose.Schema({
  // Required: child reference (User ID)
  child: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Your existing fields
  type: {
    type: String,
    enum: ['text', 'audio', 'video', 'drawing', 'mixed'],
    default: 'text'
  },
  content: {
    type: String,
    required: true
  },
  assets: [{
    type: String // URLs to uploaded assets
  }],
  visibility: {
    type: String,
    enum: ['private', 'parent-only', 'public'],
    default: 'private'
  },
  
  // Additional enhanced fields
  title: {
    type: String,
    default: 'Untitled'
  },
  mood: {
    type: String,
    enum: ['happy', 'sad', 'angry', 'anxious', 'excited', 'calm', 'tired', 'neutral'],
    default: 'neutral'
  },
  moodIntensity: {
    type: Number,
    min: 1,
    max: 10,
    default: 5
  },
  tags: [{
    type: String,
    trim: true
  }],
  isPrivate: {
    type: Boolean,
    default: true
  },
  
  // AI Analysis
  aiAnalysis: {
    summary: String,
    keywords: [String],
    sentiment: {
      type: String,
      enum: ['positive', 'neutral', 'negative']
    },
    suggestions: [String],
    generatedAt: Date
  },
  
  // Analytics
  wordCount: {
    type: Number,
    default: 0
  },
  readTime: {
    type: Number, // in minutes
    default: 0
  },
  
  // Metadata
  lastEditedAt: Date,
  editedCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Calculate word count before saving
journalSchema.pre('save', function(next) {
  if (this.content && this.type === 'text') {
    this.wordCount = this.content.trim().split(/\s+/).length;
    this.readTime = Math.ceil(this.wordCount / 200);
  }
  
  // Sync isPrivate with visibility
  if (this.visibility === 'private') {
    this.isPrivate = true;
  } else {
    this.isPrivate = false;
  }
  
  next();
});

// Update lastEditedAt on updates
journalSchema.pre('findOneAndUpdate', function(next) {
  this.set({ lastEditedAt: new Date() });
  next();
});

export default mongoose.model('Journal', journalSchema);