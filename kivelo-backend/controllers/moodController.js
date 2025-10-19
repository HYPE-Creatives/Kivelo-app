import MoodCheckin from "../models/MoodCheckin.js";
import { sendToAI } from "../utils/aiTrigger.js";

// Record a mood check-in
export const recordMood = async (req, res) => {
  try {
    const { childId, moodEmoji, intensity, notes } = req.body;

    if (!childId || !moodEmoji || !intensity)
      return res.status(400).json({ message: "All fields are required" });

    const checkin = await MoodCheckin.create({
      childId,
      moodEmoji,
      intensity,
      notes,
    });

    // Notify AI team or enqueue for analysis later
    // e.g., send to AI microservice or queue
    await sendToAI(checkin);

    res.status(201).json({ success: true, data: checkin });
  } catch (error) {
    console.error("Error recording mood:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all moods for a child
export const getMoodsByChild = async (req, res) => {
  try {
    const { childId } = req.params;
    const moods = await MoodCheckin.find({ childId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: moods });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
