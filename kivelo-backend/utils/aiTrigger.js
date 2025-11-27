import axios from "axios";

const AI_BASE = process.env.AI_BASE;
const AI_ROUTE = process.env.AI_ROUTE;

// Build the FINAL FULL model URL: BASE + ROUTE
const MODEL_URL = `${AI_BASE}${AI_ROUTE}`;
console.log("🚀 MODEL_URL:", MODEL_URL);

let aiServiceStatus = {
  lastChecked: new Date(),
  isAvailable: false,
  lastError: null,
};

// Mock fallback for downtime
const getMockResponse = (data) => {
  const userMessage = data?.message || "your input";

  const responses = [
    `Mock mode: I received "${userMessage}".`,
    `"${userMessage}" received — AI service is currently offline.`,
    `I'm operating in mock mode. Your message: "${userMessage}".`,
    `AI offline. Mock response for: "${userMessage}".`,
    `Thanks! For now I'm in mock mode. You said: "${userMessage}".`,
  ];

  const reply = responses[Math.floor(Math.random() * responses.length)];

  return {
    reply,
    isMock: true
  };
};

export const askKivelo = async (data) => {
  if (!AI_BASE || !AI_ROUTE) {
    console.warn("⚠ AI_BASE or AI_ROUTE missing — running mock mode");
    return getMockResponse(data);
  }

  try {
    const res = await axios.post(MODEL_URL, data, {
      headers: { "Content-Type": "application/json" },
      timeout: 15000,
    });

    // update service status
    aiServiceStatus = {
      lastChecked: new Date(),
      isAvailable: true,
      lastError: null,
    };

    console.log("✅ AI service responded successfully");
    return res.data;

  } catch (err) {
    console.warn(`🤖 AI service unavailable — mock mode enabled. Error: ${err.message}`);

    aiServiceStatus = {
      lastChecked: new Date(),
      isAvailable: false,
      lastError: err.message,
    };

    return getMockResponse(data);
  }
};

// Function to get current AI service status
export const getAIServiceStatus = () => aiServiceStatus;

export const sendToAI = async (checkin) => {
  try {
    if (!AI_BASE || !AI_ROUTE) {
      console.warn("🤖 AI_BASE or AI_ROUTE missing — skipping AI mood check-in");
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
      { timeout: 10000 }
    );

    console.log("✅ Sent mood check-in to AI service successfully.");
    return { success: true, data: response.data };

  } catch (err) {
    console.warn(`🤖 AI mood check-in failed — using mock mode. Error: ${err.message}`);
    return {
      success: false,
      message: "AI service unavailable — mock mode",
      isMock: true,
    };
  }
};


