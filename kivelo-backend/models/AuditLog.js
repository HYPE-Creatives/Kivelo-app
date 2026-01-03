import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    /**
     * WHO performed the action
     */
    actor: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "actor.model",
        index: true,
        required: false, // allows System / Service logs
      },
      model: {
        type: String,
        enum: ["User", "Parent", "Child", "Admin", "System", "Service"],
        default: "User",
        index: true,
      },
      ip: {
        type: String,
        index: true,
      },
    },

    /**
     * WHAT happened
     */
    action: {
      type: String,
      required: true,
      index: true, // e.g. "user.login", "admin.user.update"
    },

    /**
     * WHAT was acted upon
     * (important for admin → user actions)
     */
    target: {
      model: {
        type: String,
        enum: ["User", "Parent", "Child", "Admin", "System", null],
        default: null,
      },
      id: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        index: true,
      },
    },

    /**
     * Resource context (kept from your model)
     */
    resource: {
      type: {
        type: String, // e.g. "profile", "activity", "payment"
      },
      id: {
        type: String,
        default: null,
      },
    },

    /**
     * Result of the action
     */
    outcome: {
      type: String,
      enum: ["success", "failure", "unknown"],
      default: "success",
      index: true,
    },

    /**
     * Severity / importance
     */
    level: {
      type: String,
      enum: ["info", "warning", "critical"],
      default: "info",
      index: true,
    },

    /**
     * HTTP / request context
     * (VERY useful for security audits)
     */
    request: {
      method: { type: String },
      path: { type: String },
      userAgent: { type: String },
    },

    /**
     * Session correlation (login, logout, force logout)
     */
    sessionId: {
      type: String,
      index: true,
    },

    /**
     * Origin of the action
     */
    source: {
      type: String,
      enum: ["web", "mobile", "admin", "system", "api"],
      default: "web",
      index: true,
    },

    /**
     * Flexible metadata
     */
    metadata: {
      type: Object, // keep small; redact PII
    },

    /**
     * Tags for fast filtering & analytics
     */
    tags: {
      type: [String],
      index: true,
    },

    /**
     * Retention / archival
     */
    archived: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: {
      createdAt: "timestamp",
      updatedAt: false,
    },
  }
);

/**
 * INDEXES (optimized for admin dashboards)
 */
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ "actor.id": 1, timestamp: -1 });
auditLogSchema.index({ "target.id": 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ source: 1, timestamp: -1 });
auditLogSchema.index({ archived: 1, timestamp: -1 });

export default mongoose.model("AuditLog", auditLogSchema);
