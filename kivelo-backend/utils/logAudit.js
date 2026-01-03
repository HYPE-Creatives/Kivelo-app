import AuditLog from "../models/AuditLog.js";

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
