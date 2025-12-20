// controllers/conversationController.js
import Conversation from '../models/Conversation.js';
import MoodCheckin from '../models/MoodCheckin.js';
import JournalEntry from '../models/JournalEntry.js';
import User from '../models/User.js';
import Child from '../models/Child.js';
import Parent from '../models/Parent.js';
import Notification from '../models/Notification.js';
import { checkMessageSafety } from '../services/safetyMonitoringService.js';

/* ============================================================
   HELPER: Load mood context for AI conversations
=============================================================== */
async function loadMoodContext(childUserId) {
  try {
    // Get latest mood check-in
    const latestMood = await MoodCheckin.findOne({ child: childUserId })
      .sort({ createdAt: -1 })
      .lean();

    // Get mood trend (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weeklyMoods = await MoodCheckin.find({
      child: childUserId,
      createdAt: { $gte: weekAgo }
    }).sort({ createdAt: -1 }).lean();

    const weeklyAverage = weeklyMoods.length > 0
      ? weeklyMoods.reduce((sum, m) => sum + (m.moodScore || 5), 0) / weeklyMoods.length
      : null;

    // Determine trend
    let trend = 'stable';
    if (weeklyMoods.length >= 3) {
      const recent = weeklyMoods.slice(0, 3).reduce((s, m) => s + (m.moodScore || 5), 0) / 3;
      const older = weeklyMoods.slice(-3).reduce((s, m) => s + (m.moodScore || 5), 0) / 3;
      if (recent - older > 1) trend = 'improving';
      else if (older - recent > 1) trend = 'declining';
    }

    // Get recent journal themes
    const recentJournals = await JournalEntry.find({ child: childUserId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('tags mood')
      .lean();
    const journalThemes = [...new Set(recentJournals.flatMap(j => j.tags || []))].slice(0, 5);

    // Get child preferences
    const child = await Child.findOne({ user: childUserId }).lean();

    return {
      currentMood: latestMood ? {
        emoji: latestMood.emoji,
        moodScore: latestMood.moodScore,
        trustZone: latestMood.trustZone,
        lastCheckinAt: latestMood.createdAt
      } : null,
      moodTrend: {
        weeklyAverage: weeklyAverage ? Math.round(weeklyAverage * 10) / 10 : null,
        trend,
        daysTracked: weeklyMoods.length
      },
      recentJournalThemes: journalThemes,
      interests: child?.preferences?.interests || [],
      activityEngagement: {
        completedThisWeek: child?.activities?.length || 0,
        favoriteCategory: child?.preferences?.favoriteActivities?.[0] || null
      }
    };
  } catch (error) {
    console.error('Error loading mood context:', error);
    return null;
  }
}

/* ============================================================
   1. GET OR CREATE AI CONVERSATION
=============================================================== */
export async function getOrCreateAIConversation(req, res) {
  try {
    const childUserId = req.user.id;
    
    // Load mood context
    const moodContext = await loadMoodContext(childUserId);
    
    // Get or create conversation
    let conversation = await Conversation.findOne({
      childId: childUserId,
      type: 'ai_chat',
      isActive: true
    });

    if (!conversation) {
      conversation = new Conversation({
        type: 'ai_chat',
        childId: childUserId,
        context: moodContext || {},
        moodAtStart: moodContext?.currentMood || null
      });
      await conversation.save();
    } else {
      // Update context with fresh mood data
      conversation.context = moodContext || conversation.context;
      await conversation.save();
    }

    return res.json({
      success: true,
      data: {
        conversationId: conversation._id,
        type: conversation.type,
        context: conversation.context,
        messages: conversation.getRecentMessages(20),
        moodAtStart: conversation.moodAtStart,
        stats: conversation.stats
      }
    });
  } catch (error) {
    console.error('Error in getOrCreateAIConversation:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/* ============================================================
   2. SEND MESSAGE (AI or Family Chat)
=============================================================== */
export async function sendMessage(req, res) {
  try {
    const { conversationId, content, type = 'text' } = req.body;
    const senderId = req.user.id;

    if (!conversationId || !content) {
      return res.status(400).json({ success: false, message: 'conversationId and content are required' });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    // Verify access
    const hasAccess = conversation.childId?.toString() === senderId ||
      conversation.participants?.some(p => p.user.toString() === senderId);
    
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Get sender's current mood for context
    const latestMood = await MoodCheckin.findOne({ child: senderId })
      .sort({ createdAt: -1 })
      .lean();

    // Check message safety
    const safetyCheck = await checkMessageSafety(content, senderId);

    // Create message
    const messageData = {
      sender: senderId,
      role: req.user.role === 'parent' ? 'parent' : 'child',
      content,
      type,
      metadata: {
        moodScore: latestMood?.moodScore,
        trustZone: latestMood?.trustZone
      },
      flagged: safetyCheck.flagged,
      flagReason: safetyCheck.reason
    };

    await conversation.addMessage(messageData);

    // If flagged, handle safety alert
    if (safetyCheck.flagged) {
      await conversation.flagForSafety(safetyCheck.reason);
      
      // Notify parent if severity is high
      if (safetyCheck.severity === 'high') {
        await notifyParentOfSafetyAlert(conversation, safetyCheck);
      }
    }

    return res.json({
      success: true,
      data: {
        message: conversation.messages[conversation.messages.length - 1],
        safetyCheck: safetyCheck.flagged ? { flagged: true, category: safetyCheck.category } : null
      }
    });
  } catch (error) {
    console.error('Error in sendMessage:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/* ============================================================
   3. ADD AI RESPONSE TO CONVERSATION
=============================================================== */
export async function addAIResponse(req, res) {
  try {
    const { conversationId, content, type = 'text', metadata = {} } = req.body;

    if (!conversationId || !content) {
      return res.status(400).json({ success: false, message: 'conversationId and content are required' });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    // Verify this is an AI conversation and requester has access
    if (conversation.type !== 'ai_chat') {
      return res.status(400).json({ success: false, message: 'Not an AI conversation' });
    }

    const messageData = {
      role: 'assistant',
      content,
      type,
      metadata: {
        aiConfidence: metadata.confidence,
        suggestedActivity: metadata.suggestedActivity
      }
    };

    await conversation.addMessage(messageData);

    // Track suggestions given
    if (metadata.suggestionType) {
      conversation.suggestionsGiven.push({
        type: metadata.suggestionType,
        content: metadata.suggestionContent || content,
        accepted: false
      });
      await conversation.save();
    }

    return res.json({
      success: true,
      data: {
        message: conversation.messages[conversation.messages.length - 1]
      }
    });
  } catch (error) {
    console.error('Error in addAIResponse:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/* ============================================================
   4. GET CONVERSATION HISTORY
=============================================================== */
export async function getConversationHistory(req, res) {
  try {
    const { conversationId } = req.params;
    const { limit = 50, before } = req.query;
    const userId = req.user.id;

    const conversation = await Conversation.findById(conversationId)
      .populate('messages.sender', 'name avatar')
      .populate('participants.user', 'name avatar');

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    // Verify access
    const hasAccess = conversation.childId?.toString() === userId ||
      conversation.participants?.some(p => p.user._id.toString() === userId) ||
      (req.user.role === 'parent' && await isParentOfChild(userId, conversation.childId));
    
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    let messages = conversation.messages;
    
    // Pagination: get messages before a certain timestamp
    if (before) {
      messages = messages.filter(m => m.createdAt < new Date(before));
    }
    
    messages = messages.slice(-parseInt(limit));

    return res.json({
      success: true,
      data: {
        conversationId: conversation._id,
        type: conversation.type,
        messages,
        hasMore: conversation.messages.length > messages.length,
        stats: conversation.stats
      }
    });
  } catch (error) {
    console.error('Error in getConversationHistory:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/* ============================================================
   5. GET FAMILY CONVERSATIONS
=============================================================== */
export async function getFamilyConversations(req, res) {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let familyId;
    if (userRole === 'parent') {
      const parent = await Parent.findOne({ user: userId });
      familyId = parent?._id;
    } else {
      const child = await Child.findOne({ user: userId });
      const parent = await Parent.findOne({ user: child?.parent });
      familyId = parent?._id;
    }

    if (!familyId) {
      return res.status(404).json({ success: false, message: 'Family not found' });
    }

    // Query for family conversations where current user is a participant
    // This ensures we only get conversations the user is actually part of
    const conversations = await Conversation.find({
      type: { $in: ['family_chat', 'parent_child', 'sibling'] },
      'participants.user': userId
    })
      .populate('participants.user', 'name email avatar role')
      .sort({ updatedAt: -1 });

    // Deduplicate by conversation ID and filter out self-referential conversations
    const seenIds = new Set();
    const conversationsWithMeta = conversations
      .filter(conv => {
        // Deduplicate
        if (seenIds.has(conv._id.toString())) return false;
        seenIds.add(conv._id.toString());
        
        // Filter out conversations where user is the only participant or 
        // where all "other" participants are also the same user (self-chat)
        const otherParticipants = conv.participants.filter(
          p => p.user?._id?.toString() !== userId
        );
        // Must have at least one other participant
        return otherParticipants.length > 0;
      })
      .map(conv => {
        const lastMessage = conv.messages[conv.messages.length - 1];
        const participant = conv.participants.find(p => p.user?._id?.toString() === userId);
        const unreadCount = participant?.lastReadAt
          ? conv.messages.filter(m => m.createdAt > participant.lastReadAt).length
          : conv.messages.length;

        return {
          _id: conv._id,
          type: conv.type,
          participants: conv.participants,
          lastMessage: lastMessage ? {
            content: lastMessage.content.substring(0, 50),
            createdAt: lastMessage.createdAt,
            senderRole: lastMessage.role
          } : null,
          unreadCount,
          updatedAt: conv.updatedAt
        };
      });

    return res.json({
      success: true,
      data: conversationsWithMeta
    });
  } catch (error) {
    console.error('Error in getFamilyConversations:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/* ============================================================
   6. CREATE FAMILY CONVERSATION
=============================================================== */
export async function createFamilyConversation(req, res) {
  try {
    const { participantIds, type = 'family_chat' } = req.body;
    const userId = req.user.id;

    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
      return res.status(400).json({ success: false, message: 'participantIds array is required' });
    }

    // Get family ID
    let familyId;
    if (req.user.role === 'parent') {
      const parent = await Parent.findOne({ user: userId });
      familyId = parent?._id;
    } else {
      const child = await Child.findOne({ user: userId });
      const parent = await Parent.findOne({ user: child?.parent });
      familyId = parent?._id;
    }

    // Verify all participants are in the same family
    const allParticipantIds = [...new Set([userId, ...participantIds])];
    
    // Build participants array with roles
    const participants = await Promise.all(allParticipantIds.map(async (id) => {
      const user = await User.findById(id).select('role');
      return {
        user: id,
        role: user?.role || 'child',
        joinedAt: new Date()
      };
    }));

    // Check if conversation already exists between these participants
    const existingConv = await Conversation.findOne({
      familyId,
      type,
      'participants.user': { $all: allParticipantIds },
      $expr: { $eq: [{ $size: '$participants' }, allParticipantIds.length] }
    });

    if (existingConv) {
      // Populate user data for the response
      const populatedConv = await Conversation.findById(existingConv._id)
        .populate('participants.user', 'name email avatar role');
      
      return res.json({
        success: true,
        data: populatedConv,
        message: 'Conversation already exists'
      });
    }

    const conversation = new Conversation({
      type,
      familyId,
      participants
    });

    await conversation.save();

    // Populate user data for the response
    const populatedConversation = await Conversation.findById(conversation._id)
      .populate('participants.user', 'name email avatar role');

    return res.status(201).json({
      success: true,
      data: populatedConversation,
      message: 'Conversation created'
    });
  } catch (error) {
    console.error('Error in createFamilyConversation:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/* ============================================================
   7. MARK MESSAGES AS READ
=============================================================== */
export async function markAsRead(req, res) {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    // Update participant's lastReadAt
    const participantIndex = conversation.participants.findIndex(
      p => p.user.toString() === userId
    );

    if (participantIndex !== -1) {
      conversation.participants[participantIndex].lastReadAt = new Date();
      await conversation.save();
    }

    // Mark individual messages as read
    conversation.messages.forEach(msg => {
      if (!msg.metadata) msg.metadata = {};
      if (!msg.metadata.readBy) msg.metadata.readBy = [];
      
      const alreadyRead = msg.metadata.readBy.some(r => r.user.toString() === userId);
      if (!alreadyRead) {
        msg.metadata.readBy.push({ user: userId, readAt: new Date() });
      }
    });

    await conversation.save();

    return res.json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    console.error('Error in markAsRead:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/* ============================================================
   8. END AI CONVERSATION (Start Fresh)
=============================================================== */
export async function endAIConversation(req, res) {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      childId: userId,
      type: 'ai_chat'
    });

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    // Calculate session duration
    const sessionDuration = Math.round(
      (new Date() - conversation.createdAt) / 1000
    );

    conversation.isActive = false;
    conversation.endedAt = new Date();
    conversation.stats.sessionDuration = sessionDuration;
    await conversation.save();

    return res.json({
      success: true,
      message: 'Conversation ended',
      data: {
        sessionDuration,
        totalMessages: conversation.stats.totalMessages
      }
    });
  } catch (error) {
    console.error('Error in endAIConversation:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/* ============================================================
   9. PARENT: GET FLAGGED CONVERSATIONS FOR REVIEW
=============================================================== */
export async function getFlaggedConversations(req, res) {
  try {
    const parentUserId = req.user.id;

    if (req.user.role !== 'parent') {
      return res.status(403).json({ success: false, message: 'Parent access only' });
    }

    const flaggedConversations = await Conversation.getFlaggedForReview(parentUserId);

    // Get child names
    const conversationsWithChildInfo = await Promise.all(
      flaggedConversations.map(async (conv) => {
        const childUser = await User.findById(conv.childId).select('name avatar');
        const flaggedMessages = conv.messages.filter(m => m.flagged);
        
        return {
          _id: conv._id,
          childName: childUser?.name,
          childAvatar: childUser?.avatar,
          flagCount: conv.safetyFlags.flagCount,
          lastFlaggedAt: conv.safetyFlags.lastFlaggedAt,
          flaggedMessages: flaggedMessages.map(m => ({
            content: m.content,
            flagReason: m.flagReason,
            createdAt: m.createdAt
          })),
          requiresReview: conv.safetyFlags.requiresReview
        };
      })
    );

    return res.json({
      success: true,
      data: conversationsWithChildInfo,
      totalFlagged: conversationsWithChildInfo.length
    });
  } catch (error) {
    console.error('Error in getFlaggedConversations:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/* ============================================================
   10. PARENT: REVIEW FLAGGED CONVERSATION
=============================================================== */
export async function reviewConversation(req, res) {
  try {
    const { conversationId } = req.params;
    const { notes, acknowledged } = req.body;
    const parentUserId = req.user.id;

    if (req.user.role !== 'parent') {
      return res.status(403).json({ success: false, message: 'Parent access only' });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    // Verify this parent owns the child
    const isOwner = await isParentOfChild(parentUserId, conversation.childId);
    if (!isOwner) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    conversation.parentReview = {
      reviewed: true,
      reviewedBy: parentUserId,
      reviewedAt: new Date(),
      notes: notes || ''
    };

    if (acknowledged) {
      conversation.safetyFlags.requiresReview = false;
    }

    // Mark flagged messages as reviewed
    conversation.messages.forEach(msg => {
      if (msg.flagged && !msg.reviewedByParent) {
        msg.reviewedByParent = true;
        msg.reviewedAt = new Date();
      }
    });

    await conversation.save();

    return res.json({
      success: true,
      message: 'Conversation reviewed',
      data: {
        reviewedAt: conversation.parentReview.reviewedAt
      }
    });
  } catch (error) {
    console.error('Error in reviewConversation:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/* ============================================================
   11. GET AI CONVERSATION INSIGHTS (For Parent Dashboard)
=============================================================== */
export async function getChildAIInsights(req, res) {
  try {
    const { childId } = req.params;
    const parentUserId = req.user.id;

    if (req.user.role !== 'parent') {
      return res.status(403).json({ success: false, message: 'Parent access only' });
    }

    // Verify parent owns this child
    const isOwner = await isParentOfChild(parentUserId, childId);
    if (!isOwner) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Get recent AI conversations
    const conversations = await Conversation.find({
      childId,
      type: 'ai_chat'
    }).sort({ createdAt: -1 }).limit(10);

    // Aggregate insights
    const totalConversations = conversations.length;
    const totalMessages = conversations.reduce((sum, c) => sum + c.stats.totalMessages, 0);
    const avgSessionDuration = conversations.length > 0
      ? conversations.reduce((sum, c) => sum + (c.stats.sessionDuration || 0), 0) / conversations.length
      : 0;

    // Most common mood at conversation start
    const moodCounts = {};
    conversations.forEach(c => {
      if (c.moodAtStart?.emoji) {
        moodCounts[c.moodAtStart.emoji] = (moodCounts[c.moodAtStart.emoji] || 0) + 1;
      }
    });
    const commonMoodAtStart = Object.entries(moodCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    // Suggestions given
    const allSuggestions = conversations.flatMap(c => c.suggestionsGiven || []);
    const suggestionTypes = {};
    allSuggestions.forEach(s => {
      if (s.type) suggestionTypes[s.type] = (suggestionTypes[s.type] || 0) + 1;
    });

    return res.json({
      success: true,
      data: {
        totalConversations,
        totalMessages,
        avgSessionDuration: Math.round(avgSessionDuration),
        commonMoodAtStart,
        suggestionBreakdown: suggestionTypes,
        flaggedCount: conversations.filter(c => c.safetyFlags.hasConcerningContent).length,
        recentTopics: [...new Set(conversations.flatMap(c => c.context?.recentJournalThemes || []))].slice(0, 5)
      }
    });
  } catch (error) {
    console.error('Error in getChildAIInsights:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/* ============================================================
   12. ARCHIVE OLD MESSAGES (Hybrid Storage)
=============================================================== */
export async function archiveOldMessages(req, res) {
  try {
    const { conversationId } = req.params;
    const { keepCount = 50 } = req.body;
    const userId = req.user.id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    // Verify access
    const hasAccess = conversation.childId?.toString() === userId ||
      conversation.participants?.some(p => p.user.toString() === userId);
    
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const result = await conversation.archiveOldMessages(keepCount);

    return res.json({
      success: true,
      data: {
        archivedCount: result.archived,
        // Return archived messages so client can store them locally
        archivedMessages: result.messages || [],
        remainingInDB: conversation.messages.length
      }
    });
  } catch (error) {
    console.error('Error in archiveOldMessages:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/* ============================================================
   HELPER: Check if user is parent of child
=============================================================== */
async function isParentOfChild(parentUserId, childUserId) {
  const parent = await Parent.findOne({ user: parentUserId }).populate('children');
  if (!parent) return false;
  
  return parent.children.some(c => 
    c.user.toString() === childUserId?.toString() || 
    c._id.toString() === childUserId?.toString()
  );
}

/* ============================================================
   13. EDIT MESSAGE
=============================================================== */
export async function editMessage(req, res) {
  try {
    const { conversationId, messageId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Content is required' });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    // Find the message
    const message = conversation.messages.id(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    // Only message sender can edit (or parent can edit their own messages)
    if (message.sender?.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'You can only edit your own messages' });
    }

    // Can't edit AI messages
    if (message.role === 'assistant') {
      return res.status(403).json({ success: false, message: 'Cannot edit AI messages' });
    }

    // Update message
    message.content = content.trim();
    message.edited = true;
    message.editedAt = new Date();

    await conversation.save();

    return res.json({
      success: true,
      message: 'Message updated',
      data: message
    });
  } catch (error) {
    console.error('Error in editMessage:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/* ============================================================
   14. DELETE MESSAGE
=============================================================== */
export async function deleteMessage(req, res) {
  try {
    const { conversationId, messageId } = req.params;
    const userId = req.user.id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    // Find the message
    const message = conversation.messages.id(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    // Only message sender can delete (or parent has extra privileges)
    const isOwner = message.sender?.toString() === userId;
    const isParentUser = req.user.role === 'parent';
    
    if (!isOwner && !isParentUser) {
      return res.status(403).json({ success: false, message: 'You can only delete your own messages' });
    }

    // Can't delete AI messages
    if (message.role === 'assistant') {
      return res.status(403).json({ success: false, message: 'Cannot delete AI messages' });
    }

    // Remove message from array
    conversation.messages.pull(messageId);
    await conversation.save();

    return res.json({
      success: true,
      message: 'Message deleted'
    });
  } catch (error) {
    console.error('Error in deleteMessage:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/* ============================================================
   HELPER: Notify parent of safety alert
=============================================================== */
async function notifyParentOfSafetyAlert(conversation, safetyCheck) {
  try {
    const child = await Child.findOne({ user: conversation.childId });
    if (!child) return;

    const childUser = await User.findById(conversation.childId).select('name');

    await Notification.create({
      userId: child.parent,
      type: 'safety_alert',
      title: '⚠️ Safety Alert',
      message: `${childUser?.name || 'Your child'} sent a message that may need your attention`,
      data: {
        conversationId: conversation._id,
        category: safetyCheck.category,
        childId: conversation.childId,
        childName: childUser?.name
      },
      priority: 1, // High priority
      createdAt: new Date()
    });

    conversation.safetyFlags.parentNotified = true;
    conversation.safetyFlags.parentNotifiedAt = new Date();
    await conversation.save();
  } catch (error) {
    console.error('Error notifying parent:', error);
  }
}
