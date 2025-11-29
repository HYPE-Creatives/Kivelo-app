import { askKivelo } from "../../utils/aiTrigger.js";

let chatHistory = [];

export const chat = async (req, res) => {
  try {
    const { username, message } = req.body;

    // Input validation
    if (!username) {
      return res.status(400).json({ error: "username is required" });
    }

    if (!message) {
      return res.status(400).json({ error: "message is required" });
    }

    // Payload expected by AI model
    const payload = { username, message };

    console.log(`📤 Chat request from ${username}: "${message}"`);

    // Call AI and get RAW response - no processing
    const aiResponse = await askKivelo(payload);

    // Debug logging
    console.log("📥 AI Response:", {
      isMock: aiResponse.isMock,
      replyLength: aiResponse.reply?.length,
      hasReply: !!aiResponse.reply,
      fullKeys: Object.keys(aiResponse)
    });

    // Save history with full response for debugging
    chatHistory.push({
      username,
      user: message,
      ai: aiResponse,
      time: new Date(),
      isMock: aiResponse.isMock || false,
    });

    // Keep memory optimized
    if (chatHistory.length > 50) {
      chatHistory = chatHistory.slice(-25);
    }

    // Return EXACT AI response without any processing
    return res.json(aiResponse);

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