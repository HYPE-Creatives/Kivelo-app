import cron from 'node-cron';
import User from './models/User.js';

import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { swaggerDocs } from './config/swagger.js';
import connectDB from './config/database.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import userRoutes from './routes/users.js';
import parentRoutes from './routes/parents.js';
import childRoutes from './routes/children.js';
import activityRoutes from './routes/activity.js';
import moodRoutes from "./routes/mood.js";
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

// Middleware
app.use(cors(
  {
    origin: "*", // or specific domains
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }
));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.use((req, res, next) => {
  console.log('Incoming request body:', req.body);
  next();
});

// Add this after your middleware but before routes
// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
// Home route
app.get('/', (req, res) => {
  res.send('Welcome to Kivelo API');
});
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/parents', parentRoutes);
app.use('/api/children', childRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/users', userRoutes);
app.use("/api/moods", moodRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ message: 'Server is running!' });
});

// Swagger documentation and setup
swaggerDocs(app, PORT);

// Catch-all for missing routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// ========================= CLEANUP JOB FOR UNVERIFIED PARENTS =========================
// Runs every day at midnight (00:00)
cron.schedule('0 0 * * *', async () => {
  try {
    const now = new Date();
    const result = await User.deleteMany({
      role: 'parent',
      isVerified: false,
      verificationExpires: { $lt: now }
    });
    if (result.deletedCount > 0) {
      console.log(`[CLEANUP JOB] Deleted ${result.deletedCount} unverified parent accounts.`);
    } else {
      console.log('[CLEANUP JOB] No unverified parents to delete.');
    }
  } catch (err) {
    console.error('[CLEANUP JOB ERROR]', err);
  }
});
