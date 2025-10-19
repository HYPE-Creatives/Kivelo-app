import mongoose from "mongoose";

const moodCheckinSchema = new mongoose.Schema({
  childId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Child",
    required: true,
  },
  moodEmoji: {
    type: String, // e.g. "😊" or "😢"
    required: true,
  },
  intensity: {
    type: Number, // 1–5
    required: true,
    min: 1,
    max: 5,
  },
  notes: {
    type: String, // optional comment
  },
  aiAnalysis: {
    type: Object, // placeholder for AI team results
    default: null, // e.g. { moodType: "happy", suggestion: "Encourage outdoor play" }
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("MoodCheckin", moodCheckinSchema);
