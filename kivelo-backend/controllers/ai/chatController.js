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

    // Call AI
    const aiResponse = await askKivelo(payload);

    // AI team standard output: { reply: "string" }
    const reply =
      aiResponse.reply ||
      aiResponse.text ||
      aiResponse.output ||
      aiResponse.generated_text ||
      "";

    // Save history
    chatHistory.push({
      username,
      user: message,
      ai: reply,
      time: new Date(),
      isMock: aiResponse.isMock || false,
    });

    // Keep memory optimized
    if (chatHistory.length > 50) {
      chatHistory = chatHistory.slice(-25);
    }

    // Return EXACT AI format
    return res.json({ reply });

  } catch (err) {
    console.error("Chat controller error:", err);

    return res.status(503).json({
      reply: "AI service unavailable. Please try again later.",
    });
  }
};

export const getHistory = (req, res) => {
  res.json({
    success: true,
    history: chatHistory,
    count: chatHistory.length,
    containsMockResponses: chatHistory.some((msg) => msg.isMock),
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
