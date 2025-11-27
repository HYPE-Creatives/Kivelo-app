import { askKivelo } from "../../utils/aiTrigger.js";

// In-memory history (you can replace with DB later)
let chatHistory = [];

/**
 * Handle chat messages between user and AI
 */
export const chat = async (req, res) => {
  try {
    const { username, message } = req.body;

    if (!username) {
      return res.status(400).json({ error: "username is required" });
    }

    if (!message) {
      return res.status(400).json({ error: "message is required" });
    }

    // Send EXACT schema expected by AI service
    const payload = { username, message };

    // AI response (or mock)
    const aiResponse = await askKivelo(payload);

    // AI team response shape:
    // { reply: "string" }
    const reply =
      aiResponse.reply || 
      aiResponse.text || 
      aiResponse.output || 
      aiResponse.generated_text || 
      "";

    // Save to history
    chatHistory.push({
      username,
      user: message,
      ai: reply,
      time: new Date(),
      isMock: aiResponse.isMock || false,
    });

    // Trim history
    if (chatHistory.length > 50) {
      chatHistory = chatHistory.slice(-25);
    }

    // 🎯 RETURN EXACT AI TEAM FORMAT
    return res.json({ reply });

  } catch (err) {
    console.error("Chat controller error:", err);

    return res.status(503).json({
      reply: "AI service unavailable. Please try again later."
    });
  }
};

/**
 * Retrieve complete chat history
 */
export const getHistory = (req, res) => {
  return res.json({
    success: true,
    history: chatHistory,
    count: chatHistory.length,
    containsMockResponses: chatHistory.some((item) => item.isMock),
  });
};

/**
 * Clear chat history
 */
export const clearHistory = (req, res) => {
  const removed = chatHistory.length;
  chatHistory = [];

  return res.json({
    success: true,
    message: `Chat history cleared successfully. Removed ${removed} messages.`,
    previousCount: removed,
  });
};
