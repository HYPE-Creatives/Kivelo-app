import mongoose from "mongoose";

const moodSchema = new mongoose.Schema(
  {
    child: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Child", // Keep reference to Child model if you maintain it
      required: true,
      index: true,
    },

    // MODE OF MOOD CHECK-IN (enhanced)
    type: {
      type: String,
      enum: ["emoji", "text", "voice", "drawing", "numeric", "combined"],
      default: "emoji",
    },

    // PRD: Simple daily logging (emoji, voice, drawing, or short text)
    emoji: {
      type: String, // "😊", "😢", "😡", etc.
      default: null
    },
    
    textNote: {
      type: String,
      default: ""
    },
    
    voiceNote: {
      url: String,
      duration: Number, // in seconds
      public_id: String // Cloudinary ID
    },
    
    drawing: {
      url: String,
      public_id: String // Cloudinary ID
    },

    // Mood score for trust zones (1-10 scale)
    moodScore: {
      type: Number,
      min: 1,
      max: 10,
      required: true,
      default: 5
    },

    // Trust zone based on score
    trustZone: {
      type: String,
      enum: ['green', 'yellow', 'orange', 'red'],
      default: 'green'
    },

    // AI analysis for parent suggestions
    aiAnalysis: {
      sentiment: String,
      keywords: [String],
      suggestedResponses: [String],
      confidence: Number
    },

    // Tags for categorization
    tags: [String],

    // Location/context
    context: {
      location: String,
      activity: String,
      people: [String]
    },

    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

// Compound index for faster queries
moodSchema.index({ child: 1, createdAt: -1 });
moodSchema.index({ trustZone: 1, createdAt: -1 });

// Method to calculate trust zone based on score
moodSchema.methods.calculateTrustZone = function() {
  if (this.moodScore >= 8) return 'green';
  if (this.moodScore >= 6) return 'yellow';
  if (this.moodScore >= 4) return 'orange';
  return 'red';
};

// Pre-save middleware to auto-calculate trust zone
moodSchema.pre('save', function(next) {
  if (this.moodScore) {
    this.trustZone = this.calculateTrustZone();
  }
  next();
});

export default mongoose.model("Mood", moodSchema);