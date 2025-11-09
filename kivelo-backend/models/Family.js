import mongoose from "mongoose";

const familySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Family name is required"],
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    familyPhoto: {
      url: { type: String, default: "" },
      public_id: { type: String, default: "" },
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // ✅ Fix: allow null temporarily during registration
    },

    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

// ✅ Optional safeguard: auto-clean members array
familySchema.pre("save", function (next) {
  this.members = [...new Set(this.members.map(String))]; // remove duplicates
  next();
});

export default mongoose.model("Family", familySchema);
