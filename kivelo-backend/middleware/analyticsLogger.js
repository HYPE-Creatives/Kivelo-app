// middleware/analyticsLogger.js
import AnalyticsLog from "../models/ApiAnalyticsLog.js";
import { getIO } from "../utils/socket.js";
import { delCache } from "../utils/cache.js";

export const analyticsLogger = async (req, res, next) => {
  const start = Date.now();

  res.on("finish", async () => {
    try {
      const entry = {
        route: req.originalUrl || req.url,
        method: req.method,
        clientType: req.apiClient?.name || req.headers["x-api-client"] || "unknown",
        apiKey: req.apiClient?.key || "unknown",
        statusCode: res.statusCode,
        ip: req.ip,
        timestamp: new Date(),
      };

      // Save to DB (non-blocking)
      const saved = await AnalyticsLog.create(entry);

      // Invalidate some cache keys (simple strategy)
      // You can refine keys and prefixes as needed
      await delCache("analytics:summary:latest");
      await delCache("analytics:timeseries:latest");
      // or del all keys starting with prefix if you implement that

      // Emit socket event for real-time frontend update
      const io = getIO();
      if (io) {
        io.emit("analytics:update", {
          route: entry.route,
          method: entry.method,
          clientType: entry.clientType,
          statusCode: entry.statusCode,
          timestamp: entry.timestamp,
        });
      }
    } catch (err) {
      console.error("Analytics logger error:", err.message);
    }
  });

  next();
};
