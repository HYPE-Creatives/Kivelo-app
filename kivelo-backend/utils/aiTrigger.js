// backend/utils/aiTrigger.js
import axios from "axios";

export const sendToAI = async (checkin) => {
  try {
    const aiEndpoint = process.env.AI_ENDPOINT;

    if (!aiEndpoint) {
      console.warn("AI_ENDPOINT not set in .env file");
      return;
    }

    await axios.post(aiEndpoint, {
      moodId: checkin._id,
      childId: checkin.childId,
      moodEmoji: checkin.moodEmoji,
      intensity: checkin.intensity,
      notes: checkin.notes || "",
      createdAt: checkin.createdAt,
    });

    console.log("✅ Sent mood check-in to AI service successfully.");
  } catch (err) {
    console.error("❌ AI notification failed:", err.message);
  }
};
