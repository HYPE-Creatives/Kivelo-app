// middlewares/auditMiddleware.js
import AuditLog from "../models/AuditLog.js";

const redactPII = (obj, fields = ["password", "ssn", "creditCard"]) => {
  if (!obj || typeof obj !== "object") return obj;
  const clone = JSON.parse(JSON.stringify(obj));
  fields.forEach((f) => {
    if (f in clone) clone[f] = "[REDACTED]";
  });
  return clone;
};

/**
 * auditLogger(actionNameOrFn)
 * - actionNameOrFn: string or (req,res) => string
 */
export const auditLogger = (actionNameOrFn) => {
  return (req, res, next) => {
    const shouldLog = process.env.AUDIT_LOGGING !== "false"; // default true
    if (!shouldLog) return next();

    // Capture request details now (before they might be mutated)
    const start = Date.now();
    const capturedReq = {
      method: req.method,
      originalUrl: req.originalUrl,
      params: req.params,
      query: req.query,
      // DO NOT capture body blindly in prod; capture selectively or redact
      body: redactPII(req.body, process.env.AUDIT_REDACT_FIELDS ? process.env.AUDIT_REDACT_FIELDS.split(",") : undefined),
      headers: {
        "user-agent": req.headers["user-agent"],
      },
    };

    res.on("finish", () => {
      try {
        const durationMs = Date.now() - start;
        const outcome = res.statusCode < 400 ? "success" : "failure";
        const level = outcome === "failure" ? "warning" : "info";

        // Determine actor from req.user (set by your auth middleware)
        let actorId = null;
        let actorModel = "System";
        if (req.user) {
          actorId = req.user._id;
          actorModel = req.user.role || "User";
        } else if (req.parent) {
          actorId = req.parent._id;
          actorModel = "Parent";
        } else if (req.child) {
          actorId = req.child._id;
          actorModel = "Child";
        }

        const action =
          typeof actionNameOrFn === "function" ? actionNameOrFn(req, res) : actionNameOrFn || `${req.method} ${req.originalUrl}`;

        const logDoc = {
          actor: { id: actorId, model: actorModel, ip: req.ip || req.headers["x-forwarded-for"] || req.connection?.remoteAddress },
          action,
          resource: {
            type: req.baseUrl ? req.baseUrl.replace("/api/", "").replace("/", "") : null,
            id: req.params?.id || null,
          },
          outcome,
          level,
          metadata: {
            statusCode: res.statusCode,
            durationMs,
            request: capturedReq,
          },
        };

        // Fire-and-forget: don't `await` — ensure we catch errors
        AuditLog.create(logDoc).catch((err) => {
          console.error("Audit write failed:", err?.message || err);
          // optionally: push to fallback log queue or file when DB unreachable
        });
      } catch (err) {
        console.error("Audit middleware error:", err?.message || err);
      }
    });

    next();
  };
};
