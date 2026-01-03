import AuditLog from "../models/AuditLog.js";
import mongoose from "mongoose";
import User from "../models/User.js";

export async function logAudit({
  actor,
  target,
  action,
  resource,
  level = "info",
  outcome = "success",
  metadata,
  req,
}) {
  try {
    await AuditLog.create({
      actor,
      target,
      action,
      resource,
      level,
      outcome,
      metadata,
      request: req
        ? {
            method: req.method,
            path: req.originalUrl,
            userAgent: req.headers["user-agent"],
          }
        : undefined,
    });
  } catch (err) {
    console.error("logAudit failed:", err);
  }
}

/**
 * fetchUserActivityLogs
 * Unified fetch of a user's activity logs from canonical AuditLog documents,
 * legacy fields, and embedded User.activities for backward compatibility.
 */
export async function fetchUserActivityLogs({ userId, days = 90, limit = 500 }) {
  const safeLimit = Math.min(Number(limit) || 500, 1000);
  const numDays = Number(days) || 90;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("INVALID_USER_ID");
  }

  const oid = new mongoose.Types.ObjectId(userId);
  const since = new Date();
  since.setDate(since.getDate() - numDays);

  // Canonical + legacy audit logs
  const auditLogs = await AuditLog.find({
    timestamp: { $gte: since },
    archived: { $ne: true },
    $or: [
      { "actor.id": oid },
      { "target.id": oid },
      // Legacy shape support
      { userId: oid },
      { targetUserId: oid },
    ],
  })
    .sort({ timestamp: -1 })
    .limit(safeLimit)
    .lean();

  // Embedded user.activities (optional, if present)
  const userDoc = await User.findById(oid).select("activities").lean();
  const embedded = (userDoc?.activities || [])
    .filter((a) => a?.createdAt && new Date(a.createdAt) >= since)
    .map((a) => ({
      // Normalize to resemble AuditLog structure for UI
      timestamp: a.createdAt,
      action: a.action,
      outcome: "success",
      level: "info",
      actor: { id: oid, model: "User" },
      target: null,
      resource: null,
      metadata: a.metadata || { description: a.description },
      request: { ip: a.ip },
      _source: "embedded",
    }));

  // Merge and sort by timestamp desc, then cap to limit
  const combined = [...auditLogs, ...embedded]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, safeLimit);

  return { logs: combined, count: combined.length };
}
