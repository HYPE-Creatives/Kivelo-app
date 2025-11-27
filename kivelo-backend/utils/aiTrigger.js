import axios from "axios";

const MODEL_URL = process.env.AI_ENDPOINT;

// Track AI service status
let aiServiceStatus = {
  lastChecked: new Date(),
  isAvailable: false,
  lastError: null
};

// --- MOCK RESPONSE (updated to support object payload) ---
const getMockResponse = (data) => {
  const userMessage = data?.message || "your message";

  const mockResponses = [
    `Mock mode active: I received your message "${userMessage}". The AI service is temporarily unavailable.`,
    `Thanks for your message "${userMessage}". I'm in mock mode until the AI service returns.`,
    `I understand you're asking about "${userMessage}". Real AI responses will resume when the service is back online.`,
    `Mock response: "${userMessage}" noted. The AI server is currently offline.`,
    `Your request "${userMessage}" is being processed in mock mode due to service downtime.`
  ];

  const random = mockResponses[Math.floor(Math.random() * mockResponses.length)];

  return {
    reply: random,
    text: random,
    output: random,
    generated_text: random,
    isMock: true
  };
};

// --- MAIN AI CALLER ---
export const askKivelo = async (data) => {
  // Validate input is object
  if (typeof data !== "object") {
    console.warn("⚠ askKivelo expected object but received:", data);
    return getMockResponse({ message: String(data) });
  }

  // If no endpoint configured → mock
  if (!MODEL_URL) {
    console.warn("🤖 AI_ENDPOINT not set — using mock responses");
    return getMockResponse(data);
  }

  try {
    const response = await axios.post(
      MODEL_URL,
      data, // <-- send { username, message }
      {
        headers: { "Content-Type": "application/json" },
        timeout: 15000
      }
    );

    // Successful response
    aiServiceStatus = {
      lastChecked: new Date(),
      isAvailable: true,
      lastError: null
    };

    console.log("✅ AI service responded successfully");
    return response.data;

  } catch (err) {
    // Update service status
    aiServiceStatus = {
      lastChecked: new Date(),
      isAvailable: false,
      lastError: err.message
    };

    console.warn(`🤖 AI service unavailable, using mock response. Error: ${err.message}`);

    // Return mock instead of throwing
    return getMockResponse(data);
  }
};

// --- SEND MOOD CHECK-IN TO AI (unchanged, cleaned up) ---
export const sendToAI = async (checkin) => {
  try {
    if (!MODEL_URL) {
      console.warn("🤖 AI_ENDPOINT not set — skipping AI mood check-in");
      return { success: false, message: "AI endpoint not configured", isMock: true };
    }

    const response = await axios.post(
      MODEL_URL,
      {
        moodId: checkin._id,
        childId: checkin.childId,
        moodEmoji: checkin.moodEmoji,
        intensity: checkin.intensity,
        notes: checkin.notes || "",
        createdAt: checkin.createdAt,
      },
      { timeout: 15000 }
    );

    console.log("✅ Sent mood check-in to AI successfully.");
    return { success: true, data: response.data };

  } catch (err) {
    console.warn(`🤖 Mood check-in failed, using mock mode. Error: ${err.message}`);
    return { success: false, message: "AI unavailable — mock mode", isMock: true };
  }
};

// --- SERVICE STATUS (for monitoring endpoints) ---
export const getAIServiceStatus = () => aiServiceStatus;
