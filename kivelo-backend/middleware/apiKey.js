import crypto from "crypto";

// Cache valid keys in memory (fast lookup)
const API_KEYS = JSON.parse(process.env.API_KEYS || "{}");

// Track failed attempts
const failedAttempts = {};

export const apiKeyMiddleware = (req, res, next) => {
  const key =
    req.headers["x-api-key"] ||
    (req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : null);

  const ip = req.ip || req.connection.remoteAddress;

  // 1. Block IP if too many failed attempts
  if (failedAttempts[ip] && failedAttempts[ip] > 10) {
    return res.status(429).json({
      success: false,
      message: "Too many failed attempts. Try again later.",
    });
  }

  // 2. Missing API key
  if (!key) {
    failedAttempts[ip] = (failedAttempts[ip] || 0) + 1;
    return res.status(401).json({
      success: false,
      message: "API key missing",
    });
  }

  // 3. Verify API key exists
  const isValid = Object.values(API_KEYS).includes(key);

  if (!isValid) {
    failedAttempts[ip] = (failedAttempts[ip] || 0) + 1;
    return res.status(403).json({
      success: false,
      message: "Invalid API key",
    });
  }

  // 4. Find which client the key belongs to
  const client = Object.keys(API_KEYS).find((c) => API_KEYS[c] === key);

  // 5. Clear failed attempts on success
  failedAttempts[ip] = 0;

  // 6. Attach client metadata to request
  req.apiClient = {
    name: client,
    key: crypto.createHash("sha256").update(key).digest("hex").slice(0, 16), // Mask key
    ip,
    timestamp: new Date(),
  };

  console.log(
    `🔐 API Access: ${client} (${req.apiClient.ip}) → ${req.method} ${req.originalUrl}`
  );

  next();
};
