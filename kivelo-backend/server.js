import cron from 'node-cron';
import User from './models/User.js';

import dotenv from 'dotenv';
dotenv.config();

import helmet from 'helmet';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';   // ✅ ADDED
import { swaggerDocs } from './config/swagger.js';
import connectDB from './config/database.js';

import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import userRoutes from './routes/users.js';
import familyRoutes from './routes/familyRoutes.js';
import parentRoutes from './routes/parents.js';
import childRoutes from './routes/children.js';
import activityRoutes from './routes/activity.js';
import moodRoutes from "./routes/mood.js";
import auditRoutes from "./routes/auditRoutes.js";
import errorHandler from './middleware/errorHandler.js';
import "./jobs/auditRetention.js";
import morgan from "morgan";
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Environment variable for port
const PORT = process.env.PORT || 5000;

// Connect to database
connectDB();

const app = express();

// ========================= SECURITY HEADERS =========================
app.use(helmet());

// ========================= COOKIE PARSER =========================
// MUST BE ADDED BEFORE ROUTES
app.use(cookieParser()); // ✅ REQUIRED FOR SECURE TOKEN REFRESH FLOW

// ========================= CORS CONFIG FOR COOKIES =========================
// ❗ You cannot use origin: "*" when using cookies.
// Replace "*" with allowed frontends (React Native WebView or your domain)
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://localhost:8081",
      "http://localhost:5000",
      "https://kivelo.app",
      "https://family-wellness.onrender.com",
      "http://10.0.2.2:3000",
      "http://10.94.166.34:8081",     // Android emulator
    ],
    credentials: true,            // ✅ ALLOWS COOKIES
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ========================= RATE LIMIT =========================
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
  })
);

// ========================= BODY PARSERS =========================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(morgan("dev"));

app.use((req, res, next) => {
  console.log("Incoming request body:", req.body);
  next();
});

// ========================= STATIC FILES =========================
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.static(path.join(__dirname, "public")));

// ========================= ROUTES =========================
app.get("/", (req, res) => {
  res.send("Welcome to Kivelo API");
});
app.get("/api", (req, res) => {
  res.send("Welcome to Kivelo API");
});

app.use("/api/auth", authRoutes);      // <-- refresh route will read secure cookie
app.use("/api/admin", adminRoutes);
app.use("/api/parents", parentRoutes);
app.use("/api/children", childRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/users", userRoutes);
app.use("/api/families", familyRoutes);
app.use("/api/moods", moodRoutes);
app.use("/api/audit", auditRoutes);

// ========================= ERROR HANDLER =========================
app.use(errorHandler);

// ========================= HEALTH CHECK =========================
app.get("/api/health", (req, res) => {
  res.json({ message: "Server is running!" });
});

// ========================= SWAGGER =========================
swaggerDocs(app, PORT);

// ========================= 404 HANDLER =========================
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
  });
});

// ========================= CRON FOR RETENTION =========================
import "./jobs/auditRetention.js";

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// ========================= CLEANUP JOB FOR UNVERIFIED PARENTS =========================
cron.schedule("0 0 * * *", async () => {
  try {
    const now = new Date();
    const result = await User.deleteMany({
      role: "parent",
      isVerified: false,
      verificationExpires: { $lt: now },
    });
    if (result.deletedCount > 0) {
      console.log(
        `[CLEANUP JOB] Deleted ${result.deletedCount} unverified parent accounts.`
      );
    } else {
      console.log("[CLEANUP JOB] No unverified parents to delete.");
    }
  } catch (err) {
    console.error("[CLEANUP JOB ERROR]", err);
  }
});
