import mongoose from 'mongoose';

// Message schema for individual messages in a conversation
const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() { return this.role !== 'system' && this.role !== 'assistant'; }
  },
  role: {
    type: String,
    enum: ['user', 'assistant', 'system', 'parent', 'child'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'suggestion', 'prompt', 'activity', 'mood_insight', 'safety_alert', 'image', 'voice'],
    default: 'text'
  },
  metadata: {
    moodScore: Number,           // Mood at time of message
    trustZone: String,           // Trust zone at time of message
    aiConfidence: Number,        // AI confidence in response
    suggestedActivity: String,   // If AI suggested an activity
    readBy: [{                   // Track who has read this message
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      readAt: { type: Date, default: Date.now }
    }]
  },
  // Safety monitoring
  flagged: {
    type: Boolean,
    default: false
  },
  flagReason: String,            // Why it was flagged
  reviewedByParent: {
    type: Boolean,
    default: false
  },
  reviewedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const conversationSchema = new mongoose.Schema({
  // Conversation type: AI chat or family chat
  type: {
    type: String,
    enum: ['ai_chat', 'family_chat', 'parent_child', 'sibling'],
    required: true,
    default: 'ai_chat'
  },
  
  // For AI chats - the child using the AI
  childId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // For family chats - participants
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['parent', 'child']
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    lastReadAt: Date
  }],
  
  // Family this conversation belongs to
  familyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parent'
  },
  
  // Context for AI conversations
  context: {
    // Latest mood data for AI context
    currentMood: {
      emoji: String,
      moodScore: Number,
      trustZone: String,
      lastCheckinAt: Date
    },
    // Recent mood trends for insights
    moodTrend: {
      weeklyAverage: Number,
      trend: { type: String, enum: ['improving', 'stable', 'declining'] },
      daysTracked: Number
    },
    // Recent journal themes
    recentJournalThemes: [String],
    // Child's interests/preferences
    interests: [String],
    // Activity completion rate
    activityEngagement: {
      completedThisWeek: Number,
      favoriteCategory: String
    }
  },
  
  // Messages in the conversation
  messages: [messageSchema],
  
  // AI-specific fields
  moodAtStart: {
    emoji: String,
    moodScore: Number,
    trustZone: String
  },
  suggestionsGiven: [{
    type: {
      type: String,
      enum: ['game', 'activity', 'journal_prompt', 'breathing_exercise', 'talk_to_parent', 'coping_strategy']
    },
    content: String,
    accepted: Boolean,
    givenAt: { type: Date, default: Date.now }
  }],
  
  // Conversation status
  isActive: {
    type: Boolean,
    default: true
  },
  endedAt: Date,
  
  // Safety monitoring
  safetyFlags: {
    hasConcerningContent: { type: Boolean, default: false },
    flagCount: { type: Number, default: 0 },
    lastFlaggedAt: Date,
    parentNotified: { type: Boolean, default: false },
    parentNotifiedAt: Date,
    requiresReview: { type: Boolean, default: false }
  },
  
  // Parent oversight
  parentReview: {
    reviewed: { type: Boolean, default: false },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: Date,
    notes: String
  },
  
  // Message archival (hybrid storage)
  archiveStatus: {
    isArchived: { type: Boolean, default: false },
    archivedAt: Date,
    messageCountBeforeArchive: Number,
    // Keep last N messages in DB, rest archived to device
    messagesArchived: { type: Number, default: 0 }
  },
  
  // Stats for insights
  stats: {
    totalMessages: { type: Number, default: 0 },
    userMessages: { type: Number, default: 0 },
    aiMessages: { type: Number, default: 0 },
    averageResponseTime: Number,
    sessionDuration: Number // in seconds
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
conversationSchema.index({ childId: 1, type: 1, isActive: 1 });
conversationSchema.index({ familyId: 1, type: 1 });
conversationSchema.index({ 'participants.user': 1 });
conversationSchema.index({ 'safetyFlags.hasConcerningContent': 1, 'safetyFlags.parentNotified': 1 });
conversationSchema.index({ createdAt: -1 });

// Pre-save hook to update stats
conversationSchema.pre('save', function(next) {
  if (this.messages) {
    this.stats.totalMessages = this.messages.length;
    this.stats.userMessages = this.messages.filter(m => m.role === 'user' || m.role === 'child').length;
    this.stats.aiMessages = this.messages.filter(m => m.role === 'assistant').length;
  }
  next();
});

// Method to add a message
conversationSchema.methods.addMessage = async function(messageData) {
  this.messages.push(messageData);
  await this.save();
  return this.messages[this.messages.length - 1];
};

// Method to get recent messages (for AI context)
conversationSchema.methods.getRecentMessages = function(limit = 10) {
  return this.messages.slice(-limit);
};

// Method to flag for safety
conversationSchema.methods.flagForSafety = async function(reason) {
  this.safetyFlags.hasConcerningContent = true;
  this.safetyFlags.flagCount += 1;
  this.safetyFlags.lastFlaggedAt = new Date();
  this.safetyFlags.requiresReview = true;
  
  // Flag the last message
  if (this.messages.length > 0) {
    const lastMessage = this.messages[this.messages.length - 1];
    lastMessage.flagged = true;
    lastMessage.flagReason = reason;
  }
  
  await this.save();
  return this;
};

// Method to archive old messages (hybrid storage)
conversationSchema.methods.archiveOldMessages = async function(keepCount = 50) {
  if (this.messages.length <= keepCount) return { archived: 0 };
  
  const toArchive = this.messages.slice(0, -keepCount);
  this.archiveStatus.messagesArchived += toArchive.length;
  this.archiveStatus.messageCountBeforeArchive = this.messages.length;
  this.messages = this.messages.slice(-keepCount);
  
  await this.save();
  return { archived: toArchive.length, messages: toArchive };
};

// Static method to get or create AI conversation for a child
conversationSchema.statics.getOrCreateAIChat = async function(childId, moodContext = null) {
  let conversation = await this.findOne({
    childId,
    type: 'ai_chat',
    isActive: true
  });
  
  if (!conversation) {
    conversation = new this({
      type: 'ai_chat',
      childId,
      context: moodContext ? { currentMood: moodContext } : {},
      moodAtStart: moodContext
    });
    await conversation.save();
  }
  
  return conversation;
};

// Static method to get conversations needing parent review
conversationSchema.statics.getFlaggedForReview = async function(parentId) {
  const Parent = mongoose.model('Parent');
  const parent = await Parent.findOne({ user: parentId }).populate('children');
  
  if (!parent) return [];
  
  const childUserIds = parent.children.map(c => c.user);
  
  return this.find({
    childId: { $in: childUserIds },
    'safetyFlags.requiresReview': true,
    'parentReview.reviewed': false
  }).sort({ 'safetyFlags.lastFlaggedAt': -1 });
};

export default mongoose.model('Conversation', conversationSchema);