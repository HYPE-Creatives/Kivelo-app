import rateLimit from "express-rate-limit";            // Import rate limiter library

// dynamic per-key limits
export const rateLimiter = rateLimit({                 // Create a dynamic rate limiter
  windowMs: 15 * 60 * 1000,                            // 15-minute window for rate limits

  max: (req, res) => {                                 // Dynamic max requests function
    if (!req.clientId) return 100;                     // Before API key auth → lower limit (100)

    // Custom rate limits per client
    const limits = {
      "mobile-app": 500,                               // Mobile app allowed 500 req/15min
      "admin-dashboard": 1000,                         // Admin dashboard gets higher quota
      "internal-service": 5000,                        // Your internal service has very high limit
      "partner-client-1": 200,                         // External partner gets smaller limit
    };

    return limits[req.clientId] || 100;                // Fallback to default 100 if no match
  },

  message: { error: "Rate limit exceeded. Try again later." }, // Response when exceeded
});
