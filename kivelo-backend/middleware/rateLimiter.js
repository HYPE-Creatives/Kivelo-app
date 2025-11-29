import rateLimit from "express-rate-limit";
import { ipKeyGenerator } from "express-rate-limit";

// Different limits per client type
const CLIENT_LIMITS = {
  "mobile-app": 200,
  "admin-dashboard": 800,
  "internal-service": 2000,
  "partner-client-1": 120,
  default: 100,
};

// Fallback for unknown API clients
const getLimitForClient = (req) => {
  if (!req.apiClient) return CLIENT_LIMITS.default;
  return CLIENT_LIMITS[req.apiClient.name] || CLIENT_LIMITS.default;
};

export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes

  // 🔥 Dynamic limits based on client type
  max: (req) => getLimitForClient(req),

  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },

  // 🔥 FIXED: Now fully compliant with IPv6-safe requirements
  keyGenerator: (req) => {
    // Highest priority → API key
    if (req.apiClient?.key) return req.apiClient.key;

    // Fallback → SAFE IPv6/IPv4 hashing
    return ipKeyGenerator(req);
  },

  handler: (req, res) => {
    return res.status(429).json({
      success: false,
      message: `Rate limit exceeded for client: ${
        req.apiClient?.name || "unknown"
      }`,
    });
  },

  standardHeaders: true,
  legacyHeaders: false,
});
