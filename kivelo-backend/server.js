// at top add:
import { createServer } from "http";
import { Server as IOServer } from "socket.io";
import { setIO } from "./utils/socket.js";

import cron from 'node-cron';
import User from './models/User.js';

import dotenv from 'dotenv';
dotenv.config();

import compression from 'compression';
import helmet from 'helmet';
import express from 'express';
import getProDashboard from "./utils/proDashboard.js";
import getNotFoundPage from './utils/notFoundPage.js';
import { logRequests } from "./middleware/logRequests.js";
import analyticsRoutes from "./routes/analytics.js";
import getAnalyticsDashboard from "./utils/analyticsDashboard.js";
import { analyticsLogger } from "./middleware/analyticsLogger.js";
import cors from 'cors';
import { apiKeyMiddleware } from './middleware/apiKey.js';
import { rateLimiter } from "./middleware/rateLimiter.js";
import cookieParser from 'cookie-parser';
import { swaggerDocs } from './config/swagger.js';
import connectDB from './config/database.js';

import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import userRoutes from './routes/users.js';
import familyRoutes from './routes/familyRoutes.js';
import parentRoutes from './routes/parents.js';
import childRoutes from './routes/children.js';
import aiRoutes from "./routes/ai.js";
import activityRoutes from './routes/activity.js';
import moodRoutes from "./routes/mood.js";
import auditRoutes from "./routes/auditRoutes.js";
import settingsRoutes from './routes/settingsRoutes.js';
import errorHandler from './middleware/errorHandler.js';
import gamificationRoutes from './routes/gamification.js';
import learningRoutes from './routes/learning.js';
import journalRoutes from './routes/journal.js';
import notificationRoute from './routes/notificationRoutes.js';
import "./jobs/auditRetention.js";
import morgan from "morgan";
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ========================= CONFIGURATION =========================
const config = {
  environment: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  cors: {
    origins: process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',') 
      : [
          "http://localhost:3000",
          "http://localhost:5173",
          "http://localhost:8081",
          "http://localhost:5000",
          "https://kivelo.app",
          "https://family-wellness.onrender.com",
          "http://10.0.2.2:3000",
          "http://10.94.166.34:8081",
          "https://hype-creatives.github.io",
          "https://auth.expo.io/@fatai01/family-wellness-app"
        ]
  },
  security: {
    sessionSecret: process.env.SESSION_SECRET || 'fallback-secret-change-in-production',
    cookieSecure: process.env.NODE_ENV === 'production'
  },
  logging: {
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'combined' : 'dev')
  }
};

const PORT = config.port;

// ========================= DATABASE CONNECTION =========================
connectDB();

const app = express();

const httpServer = createServer(app);

const io = new IOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_ORIGIN || "*",
    methods: ["GET", "POST"]
  }
});

// store io instance
setIO(io);

// optional: handle connections
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);
  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

// ========================= SECURITY HEADERS =========================
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// ========================= COMPRESSION =========================
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  }
}));

// ========================= COOKIE PARSER =========================
app.use(cookieParser());

// ========================= ENHANCED CORS =========================
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (config.cors.origins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`🚫 CORS Blocked: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-API-Key"],
    maxAge: 86400 
  })
);

// ========================= RATE LIMITING =========================
app.use(rateLimiter);

// ========================= BODY PARSERS =========================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ========================= ANALYTICS LOGGING =========================
app.use(analyticsLogger);

// ========================= LOGGING =========================
app.use(morgan(config.logging.level));

if (config.environment === 'development') {
  app.use((req, res, next) => {
    console.log("🔍 Incoming request body:", req.body);
    next();
  });
}

// ========================= STATIC FILES =========================
app.use("/uploads", express.static(path.join(__dirname, "uploads"), {
  maxAge: config.environment === 'production' ? '7d' : '0',
  etag: true,
  lastModified: true
}));

app.use(express.static(path.join(__dirname, "public"), {
  maxAge: config.environment === 'production' ? '1d' : '0',
  etag: true,
  lastModified: true
}));

// ========================= PUBLIC ROUTES =========================
app.get("/", (req, res) => {
  res.send(getProDashboard("KIVELO API – Home"));
});

app.get("/api", (req, res) => {
  res.send(getProDashboard("KIVELO API – API Overview"));
});

app.get("/api/v1", (req, res) => {
  res.send(getProDashboard("KIVELO API – API v1 Overview"));
});

// Analytics Dashboard Routes
app.use("/api-analytics/v1", analyticsRoutes);
app.get("/api-analytics/v1", (req, res) => {
  res.send(getAnalyticsDashboard());
});

// Health Check Route
app.get("/api-health", (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: config.environment,
    uptime: process.uptime()
  });
});

// ========================= REQUEST LOGGING MIDDLEWARE =========================
app.use(logRequests);

// ========================= API ROUTES =========================
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/parents", parentRoutes);
app.use("/api/v1/children", childRoutes);
app.use("/api/v1/activities", activityRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/families", familyRoutes);
app.use("/api/v1/ai", aiRoutes);
app.use("/api/v1/mood", moodRoutes);
app.use("/api/v1/audit", auditRoutes);
app.use('/api/v1/gamification', gamificationRoutes);
app.use('/api/v1/learning', learningRoutes);
app.use('/api/v1/journals', journalRoutes);
app.use('/api/v1/notifications', notificationRoute);
app.use('/api/v1/settings', settingsRoutes);

// ===============================================================
// 🔒 STRICT SWAGGER PROTECTION (fixed)
// ===============================================================
app.use((req, res, next) => {
  const p = req.path || "";

  if (p === "/api-docs/v1" || p === "/api-docs/v1/") return next();

  if (p.startsWith("/api-docs/v1/")) {
    const allowed = [
      "/swagger-ui.css",
      "/swagger-ui-init.js",
      "/swagger-ui-bundle.js",
      "/swagger-ui-standalone-preset.js",
      "/favicon-32x32.png",
      "/favicon-16x16.png",
      "/swagger.json"
    ];

    const asset = p.replace("/api-docs/v1", "");

    if (allowed.includes(asset)) return next();

    return res.status(404).send(getNotFoundPage(req.originalUrl));
  }

  next();
});

// ===============================================================
// 🔍 Extract ALL registered routes (deep routing)
// ===============================================================
const getAllRoutes = (app) => {
  const routes = [];

  app._router.stack.forEach((layer) => {
    if (layer.route && layer.route.path) routes.push(layer.route.path);

    if (layer.name === "router" && layer.handle.stack) {
      layer.handle.stack.forEach((nested) => {
        if (nested.route && nested.route.path) {
          routes.push(nested.route.path);
        }
      });
    }
  });

  return routes;
};


// ===============================================================
// 🔐 API KEY PROTECTION (fixed & correct)
// ===============================================================
const PUBLIC_ROUTES = [
  "/",
  "/api",
  "/api/v1",
  "/api-health",
  "/api/v1/auth/login",
  "/api/v1/auth/register",
  "/api/v1/auth/refresh",
  "/api-docs",
  "/api-docs/v1",
  "/api-analytics",
  "/api-analytics/",
  "/api-analytics/v1"
];

app.use((req, res, next) => {
  const p = req.path || "";

  if (PUBLIC_ROUTES.some((r) => p.startsWith(r))) {
    return next();
  }

  const all = getAllRoutes(app);
  const isKnown = all.some((route) => p.startsWith(route));

  if (!isKnown) {
    return res.status(404).send(getNotFoundPage(req.originalUrl));
  }

  return apiKeyMiddleware(req, res, next);
});

// ========================= ERROR HANDLER =========================
app.use(errorHandler);

// ========================= SWAGGER DOCS =========================
swaggerDocs(app, PORT);

// ========================= FINAL 404 HANDLER =========================
app.use((req, res) => {
  res.status(404).send(getNotFoundPage(req.originalUrl));
});

// ========================= CRON JOBS =========================
import "./jobs/auditRetention.js";

// Cleanup job
let isCleanupRunning = false;
const cleanupUnverifiedUsers = async () => {
  if (isCleanupRunning) return;
  
  try {
    isCleanupRunning = true;
    const now = new Date();
    const result = await User.deleteMany({
      role: "parent",
      isVerified: false,
      verificationExpires: { $lt: now },
    });
    if (result.deletedCount > 0) {
      console.log(`[CLEANUP JOB] Deleted ${result.deletedCount} unverified parent accounts.`);
    }
  } catch (err) {
    console.error('[CLEANUP JOB ERROR]', err);
  } finally {
    isCleanupRunning = false;
  }
};

cron.schedule("0 0 * * *", cleanupUnverifiedUsers, {
  scheduled: true,
  timezone: "America/New_York"
});

// ========================= START SERVER =========================
const server = httpServer.listen(PORT, () => {
  console.log(`
🚀 Kivelo Server Started
📍 Port: ${PORT}
🌍 Environment: ${config.environment}
📅 Started: ${new Date().toISOString()}
🔒 Security: Enhanced
💾 CORS Origins: ${config.cors.origins.length} configured
  `);
});

export default app;
