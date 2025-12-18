import { askKivelo } from "../../utils/aiTrigger.js";
import Conversation from "../../models/Conversation.js";
import MoodCheckin from "../../models/MoodCheckin.js";
import JournalEntry from "../../models/JournalEntry.js";
import Child from "../../models/Child.js";
import { checkMessageSafety } from "../../services/safetyMonitoringService.js";

// Legacy in-memory history for backward compatibility
let chatHistory = [];

/**
 * Load mood and journal context for AI
 */
async function loadAIContext(userId) {
  try {
    // Get latest mood
    const latestMood = await MoodCheckin.findOne({ child: userId })
      .sort({ createdAt: -1 })
      .lean();

    // Get mood trend (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weeklyMoods = await MoodCheckin.find({
      child: userId,
      createdAt: { $gte: weekAgo }
    }).sort({ createdAt: -1 }).lean();

    const weeklyAverage = weeklyMoods.length > 0
      ? weeklyMoods.reduce((sum, m) => sum + (m.moodScore || 5), 0) / weeklyMoods.length
      : null;

    // Get recent journal entries
    const recentJournals = await JournalEntry.find({ child: userId })
      .sort({ createdAt: -1 })
      .limit(3)
      .select('content mood tags')
      .lean();

    // Get child preferences
    const child = await Child.findOne({ user: userId }).lean();

    return {
      currentMood: latestMood ? {
        emoji: latestMood.emoji,
        moodScore: latestMood.moodScore,
        trustZone: latestMood.trustZone,
        textNote: latestMood.textNote
      } : null,
      weeklyMoodAverage: weeklyAverage ? Math.round(weeklyAverage * 10) / 10 : null,
      recentJournalThemes: recentJournals.flatMap(j => j.tags || []).slice(0, 5),
      childName: child?.user?.name || null,
      interests: child?.preferences?.interests || []
    };
  } catch (error) {
    console.error('Error loading AI context:', error);
    return null;
  }
}

export const chat = async (req, res) => {
  try {
    const { username, message, conversationId } = req.body;
    const userId = req.user?.id;

    // Input validation
    if (!username) {
      return res.status(400).json({ error: "username is required" });
    }

    if (!message) {
      return res.status(400).json({ error: "message is required" });
    }

    // Load mood context if authenticated
    let moodContext = null;
    let conversation = null;
    
    if (userId) {
      moodContext = await loadAIContext(userId);
      
      // Get or create conversation
      if (conversationId) {
        conversation = await Conversation.findById(conversationId);
      }
      
      if (!conversation) {
        conversation = await Conversation.findOne({
          childId: userId,
          type: 'ai_chat',
          isActive: true
        });
      }
      
      if (!conversation) {
        conversation = new Conversation({
          type: 'ai_chat',
          childId: userId,
          context: moodContext ? { currentMood: moodContext.currentMood } : {},
          moodAtStart: moodContext?.currentMood || null
        });
        await conversation.save();
      }
      
      // Check message safety
      const safetyCheck = await checkMessageSafety(message, userId);
      
      // Add user message to conversation
      await conversation.addMessage({
        sender: userId,
        role: 'user',
        content: message,
        type: 'text',
        metadata: {
          moodScore: moodContext?.currentMood?.moodScore,
          trustZone: moodContext?.currentMood?.trustZone
        },
        flagged: safetyCheck.flagged,
        flagReason: safetyCheck.reason
      });
      
      // Flag conversation if needed
      if (safetyCheck.flagged) {
        await conversation.flagForSafety(safetyCheck.reason);
      }
    }

    // Build payload with mood context for AI
    const payload = { 
      username, 
      message,
      // Include mood context for AI to use
      context: moodContext ? {
        currentMood: moodContext.currentMood?.emoji,
        moodScore: moodContext.currentMood?.moodScore,
        trustZone: moodContext.currentMood?.trustZone,
        weeklyAverage: moodContext.weeklyMoodAverage,
        recentThemes: moodContext.recentJournalThemes
      } : null
    };

    console.log(`📤 Chat request from ${username}: "${message}"`, moodContext ? `(Mood: ${moodContext.currentMood?.emoji})` : '');

    // Call AI and get RAW response
    const aiResponse = await askKivelo(payload);

    // Debug logging
    console.log("📥 AI Response:", {
      isMock: aiResponse.isMock,
      replyLength: aiResponse.reply?.length,
      hasReply: !!aiResponse.reply
    });

    // Save AI response to conversation
    if (conversation && aiResponse.reply) {
      await conversation.addMessage({
        role: 'assistant',
        content: aiResponse.reply,
        type: 'text',
        metadata: {
          aiConfidence: aiResponse.confidence
        }
      });
    }

    // Legacy: Save to in-memory history for backward compatibility
    chatHistory.push({
      username,
      user: message,
      ai: aiResponse,
      time: new Date(),
      isMock: aiResponse.isMock || false,
    });

    if (chatHistory.length > 50) {
      chatHistory = chatHistory.slice(-25);
    }

    // Return response with conversation ID
    return res.json({
      ...aiResponse,
      conversationId: conversation?._id,
      moodContext: moodContext ? {
        currentMood: moodContext.currentMood?.emoji,
        trustZone: moodContext.currentMood?.trustZone
      } : null
    });

  } catch (err) {
    console.error("💥 Chat controller error:", err);

    return res.status(503).json({
      reply: "AI service unavailable. Please try again later.",
      error: err.message,
      isMock: true,
      timestamp: new Date().toISOString()
    });
  }
};

export const getHistory = (req, res) => {
  res.json({
    success: true,
    history: chatHistory,
    count: chatHistory.length,
    containsMockResponses: chatHistory.some((msg) => msg.isMock),
    totalMockResponses: chatHistory.filter((msg) => msg.isMock).length,
  });
};

export const clearHistory = (req, res) => {
  const removed = chatHistory.length;
  chatHistory = [];

  res.json({
    success: true,
    message: `Chat history cleared (${removed} messages removed)`,
  });
};

// New endpoint to check AI service status
export const getServiceStatus = async (req, res) => {
  const { getAIServiceStatus, checkAIHealth } = await import("../../utils/aiTrigger.js");
  
  // Optionally perform a fresh health check
  if (req.query.refresh === 'true') {
    await checkAIHealth();
  }

  const status = getAIServiceStatus();
  
  res.json({
    success: true,
    aiService: status,
    message: status.isAvailable ? 
      "AI service is operational" : 
      status.hasValidEndpoint ? 
        "AI service is currently unavailable" : 
        "AI service is not configured"
  });
};