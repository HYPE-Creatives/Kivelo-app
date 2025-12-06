import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  childId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  context: {
    type: Object,
    default: {}
  },
  messages: [{
    role: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['text', 'suggestion', 'prompt', 'activity'],
      default: 'text'
    },
    metadata: Object,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  moodAtStart: String,
  suggestionsGiven: [{
    type: String,
    enum: ['game', 'activity', 'journal_prompt', 'breathing_exercise']
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  endedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

conversationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Conversation', conversationSchema);