import axios from "axios";

const MODEL_URL = process.env.AI_ENDPOINT;

// Track AI service status
let aiServiceStatus = {
  lastChecked: new Date(),
  isAvailable: false,
  lastError: null
};

// Mock response generator
const getMockResponse = (prompt) => {
  const userMessage = prompt.replace('User:', '').replace('AI:', '').trim();
  
  const mockResponses = [
    `I understand you're asking about "${userMessage}". Currently, I'm operating in mock mode as the AI service is temporarily unavailable.`,
    `Thanks for your message! I'd normally provide a detailed response to "${userMessage}", but the AI service is currently being maintained.`,
    `I've received your question about "${userMessage}". Please check back later when the AI service is restored for full functionality.`,
    `Mock response: I'm processing your input "${userMessage}". The actual AI service will provide more comprehensive answers when available.`,
    `I can see you mentioned "${userMessage}". For now, I'm providing basic responses while the AI system undergoes maintenance.`,
    `Your message about "${userMessage}" has been received. The advanced AI features will be available again shortly.`
  ];
  
  const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];
  
  return {
    text: randomResponse,
    output: randomResponse,
    generated_text: randomResponse,
    isMock: true
  };
};

export const askKivelo = async (prompt) => {
  // If AI endpoint is not configured, use mock immediately
  if (!MODEL_URL) {
    console.warn("🤖 AI_ENDPOINT not set, using mock responses");
    return getMockResponse(prompt);
  }

  try {
    const res = await axios.post(
      MODEL_URL,
      { prompt },
      { 
        headers: { "Content-Type": "application/json" },
        timeout: 10000 // 10 second timeout
      }
    );

    // Update service status on success
    aiServiceStatus = {
      lastChecked: new Date(),
      isAvailable: true,
      lastError: null
    };

    console.log("✅ AI service responded successfully");
    return res.data; 
  } catch (err) {
    // Update service status on error
    aiServiceStatus = {
      lastChecked: new Date(),
      isAvailable: false,
      lastError: err.message
    };

    console.warn(`🤖 AI service unavailable, using mock response. Error: ${err.message}`);
    
    // Return mock response instead of throwing error
    return getMockResponse(prompt);
  }
};

export const sendToAI = async (checkin) => {
  try {
    const aiEndpoint = process.env.AI_ENDPOINT;

    if (!aiEndpoint) {
      console.warn("🤖 AI_ENDPOINT not set in .env file - skipping AI notification");
      return { success: false, message: "AI endpoint not configured", isMock: true };
    }

    const response = await axios.post(aiEndpoint, {
      moodId: checkin._id,
      childId: checkin.childId,
      moodEmoji: checkin.moodEmoji,
      intensity: checkin.intensity,
      notes: checkin.notes || "",
      createdAt: checkin.createdAt,
    }, {
      timeout: 10000
    });

    console.log("✅ Sent mood check-in to AI service successfully.");
    return { success: true, data: response.data };
  } catch (err) {
    console.warn(`🤖 AI notification failed, using mock mode. Error: ${err.message}`);
    return { 
      success: false, 
      message: "AI service unavailable - using mock mode",
      isMock: true 
    };
  }
};

// Export service status for monitoring
export const getAIServiceStatus = () => aiServiceStatus;