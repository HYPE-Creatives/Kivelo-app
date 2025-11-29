import axios from "axios";

const MODEL_URL = process.env.AI_ENDPOINT;

// Track AI service status
console.log("🚀 MODEL_URL:", MODEL_URL || "Not configured - using mock mode");

let aiServiceStatus = {
  lastChecked: new Date(),
  isAvailable: false,
  lastError: null,
  environment: MODEL_URL ? "Configured" : "Not configured",
  endpoint: MODEL_URL || "Not set",
};

// Mock fallback for downtime
const getMockResponse = (data) => {
  const userMessage = data?.message || data?.notes || "your input";

  const responses = [
    `[MOCK MODE] I received: "${userMessage}"`,
    `[MOCK RESPONSE] "${userMessage}" — AI service is currently offline.`,
    `[AI UNAVAILABLE] Operating in mock mode. Your message: "${userMessage}".`,
    `[MOCK] Response for: "${userMessage}".`,
  ];

  const reply = responses[Math.floor(Math.random() * responses.length)];

  return {
    reply,
    isMock: true,
    note: "This is a mock response - AI service is unavailable",
    timestamp: new Date().toISOString()
  };
};

// Helper function to update service status
const updateServiceStatus = (isAvailable, error = null) => {
  const hasValidEndpoint = !!MODEL_URL && MODEL_URL !== "undefined" && MODEL_URL.startsWith('http');
  
  aiServiceStatus = {
    lastChecked: new Date(),
    isAvailable: hasValidEndpoint ? isAvailable : false,
    lastError: error?.message || error,
    environment: hasValidEndpoint ? "Configured" : "Not configured",
    endpoint: MODEL_URL || "Not set",
  };
};

export const askKivelo = async (data) => {
  const hasValidEndpoint = !!MODEL_URL && MODEL_URL !== "undefined" && MODEL_URL.startsWith('http');
  
  if (!hasValidEndpoint) {
    console.warn("⚠ MODEL_URL missing or invalid — running mock mode");
    const mockResponse = getMockResponse(data);
    updateServiceStatus(false, "MODEL_URL not configured");
    return mockResponse;
  }

  try {
    console.log(`🔍 Sending to AI endpoint: ${MODEL_URL}`);
    
    const res = await axios.post(MODEL_URL, data, {
      headers: { "Content-Type": "application/json" },
      timeout: 120000, // 2 minutes (120 seconds)
    });

    updateServiceStatus(true);
    console.log("✅ AI service responded successfully");
    
    return {
      ...res.data,
      isMock: false,
      timestamp: new Date().toISOString()
    };

  } catch (err) {
    console.warn(`🤖 AI service error — ${err.code || err.message}`);
    
    // Different handling for timeout vs other errors
    if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
      console.warn(`⏰ AI request timed out after 2 minutes. This is a very long processing time.`);
      updateServiceStatus(false, `Timeout after 2 minutes - AI may be overloaded or experiencing issues`);
    } else {
      updateServiceStatus(false, err);
    }
    
    return getMockResponse(data);
  }
};

// Function to get current AI service status
export const getAIServiceStatus = () => {
  const hasValidEndpoint = !!MODEL_URL && MODEL_URL !== "undefined" && MODEL_URL.startsWith('http');
  
  return {
    ...aiServiceStatus,
    isAvailable: hasValidEndpoint ? aiServiceStatus.isAvailable : false,
    hasValidEndpoint,
    status: hasValidEndpoint ? 
      (aiServiceStatus.isAvailable ? "Operational" : "Unavailable") : 
      "Not Configured"
  };
};

export const sendToAI = async (checkin) => {
  const hasValidEndpoint = !!MODEL_URL && MODEL_URL !== "undefined" && MODEL_URL.startsWith('http');
  
  if (!hasValidEndpoint) {
    console.warn("🤖 MODEL_URL missing — using mock mode for mood check-in");
    return { 
      success: true, 
      data: getMockResponse(checkin),
      isMock: true 
    };
  }

  try {
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
      { 
        headers: { "Content-Type": "application/json" },
        timeout: 120000 // 2 minutes for mood analysis as well
      }
    );

    updateServiceStatus(true);
    console.log("✅ Sent mood check-in to AI service successfully.");
    return { 
      success: true, 
      data: {
        ...response.data,
        isMock: false
      } 
    };

  } catch (err) {
    console.warn(`🤖 AI mood check-in failed — ${err.code || err.message}`);
    updateServiceStatus(false, err);
    return {
      success: true,
      data: getMockResponse(checkin),
      isMock: true,
    };
  }
};

// Health check function with shorter timeout (separate from actual requests)
export const checkAIHealth = async () => {
  const hasValidEndpoint = !!MODEL_URL && MODEL_URL !== "undefined" && MODEL_URL.startsWith('http');
  
  if (!hasValidEndpoint) {
    updateServiceStatus(false, "No valid endpoint configured");
    return false;
  }
  
  try {
    // Use a shorter timeout for health checks (10 seconds)
    await axios.get(MODEL_URL, { timeout: 10000 });
    updateServiceStatus(true);
    return true;
  } catch (err) {
    updateServiceStatus(false, err);
    return false;
  }
};