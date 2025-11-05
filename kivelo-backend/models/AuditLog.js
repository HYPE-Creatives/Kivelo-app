import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    actor: {
      id: { type: mongoose.Schema.Types.ObjectId, refPath: "actor.model", index: true },
      model: {
        type: String,
        enum: ["User", "Parent", "Child", "System", "Service"],
        default: "User",
      },
      ip: { type: String },
    },
    action: { type: String, required: true, index: true }, // e.g. "user.login", "parent.update"
    resource: {
      type: { type: String }, // e.g. "profile", "activity", "payment"
      id: { type: String, default: null },
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
      index: true,
    },
    metadata: { type: Object }, // keep small; redact PII before writing if needed
    archived: { type: Boolean, default: false }, // for retention/archive flows
  },
  { timestamps: { createdAt: "timestamp", updatedAt: false } } // createdAt => timestamp
);

// TTL index not created here; retention handled by cron/archive job
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ "actor.id": 1, action: 1, timestamp: -1 });

export default mongoose.model("AuditLog", auditLogSchema);
