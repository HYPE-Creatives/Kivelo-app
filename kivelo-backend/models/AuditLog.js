import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    actor: {
      id: { type: String },
      type: { type: String, enum: ["user", "service", "system"], default: "user" },
      ip: { type: String },
    },
    action: { type: String, required: true },
    resource: {
      type: { type: String },
      id: { type: String },
    },
    outcome: {
      type: String,
      enum: ["success", "failure", "unknown"],
      default: "success",
    },
    level: {
      type: String,
      enum: ["info", "warning", "critical"],
      default: "info",
    },
    metadata: { type: Object },
  },
  { timestamps: { createdAt: "timestamp", updatedAt: false } }
);

export default mongoose.model("AuditLog", auditLogSchema);
