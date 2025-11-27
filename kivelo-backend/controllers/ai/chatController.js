import { askKivelo } from "../../utils/aiTrigger.js";

// In-memory chat history - can be migrated to database later for persistence
let chatHistory = [];

/**
 * Handle chat messages between user and AI
 * Processes user input and returns AI response
 */
export const chat = async (req, res) => {
  try {
    const { message } = req.body;
    
    // Validate that message exists and is not empty
    if (!message) {
      return res.status(400).json({ success: false, error: "message is required" });
    }

    // Format the prompt for the AI model
    const prompt = `User: ${message}\nAI:`;
    
    // Get response from AI service (or mock if service is unavailable)
    const aiResponse = await askKivelo(prompt);

    // Extract the reply text from various possible response formats
    // Supports: text, output, generated_text, or empty string as fallback
    const reply = aiResponse.text || aiResponse.output || aiResponse.generated_text || "";

    // Save conversation to in-memory history
    chatHistory.push({
      user: message,
      ai: reply,
      time: new Date(),
      // Store whether this was a mock response for transparency
      isMock: aiResponse.isMock || false
    });

    // Limit history size to prevent memory issues (optional enhancement)
    if (chatHistory.length > 50) {
      chatHistory = chatHistory.slice(-25); // Keep last 25 messages
    }

    // Return successful response to client
    res.json({
      success: true,
      response: reply,
      // Include mock flag so frontend knows if this is a real AI response
      isMock: aiResponse.isMock || false
    });
  } catch (err) {
    console.error("Chat controller error:", err);
    
    // Enhanced error handling with specific messages
    let errorMessage = err.message;
    let statusCode = 500;
    
    // Handle specific error types with more user-friendly messages
    if (err.message.includes("network") || err.message.includes("ECONNREFUSED")) {
      errorMessage = "AI service is currently unavailable. Please try again later.";
      statusCode = 503; // Service Unavailable
    }
    
    res.status(statusCode).json({ 
      success: false, 
      error: errorMessage 
    });
  }
};

/**
 * Retrieve complete chat history
 * Returns all stored conversations between user and AI
 */
export const getHistory = (req, res) => {
  res.json({
    success: true,
    history: chatHistory,
    // Add metadata about the history
    count: chatHistory.length,
    // Check if any responses were mock responses
    containsMockResponses: chatHistory.some(chat => chat.isMock)
  });
};

/**
 * Clear all chat history
 * Resets the conversation memory completely
 */
export const clearHistory = (req, res) => {
  const previousCount = chatHistory.length;
  chatHistory = []; // Reset to empty array
  
  res.json({
    success: true,
    message: `Chat history cleared successfully. Removed ${previousCount} messages.`,
    previousCount: previousCount
  });
};