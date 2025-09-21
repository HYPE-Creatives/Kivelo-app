import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import connectDB from './config/database.js';
import authRoutes from './routes/auth.js';
import parentRoutes from './routes/parents.js';
import childRoutes from './routes/children.js';
import activityRoutes from './routes/activity.js'

// Environment variable for port
const PORT = process.env.PORT || 5000;

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use((req, res, next) => {
  console.log('Incoming request body:', req.body);
  next();
});

// Routes
// Home route
app.get('/', (req, res) => {
  res.send('Welcome to Family Wellness API');
});
app.use('/api/auth', authRoutes);
app.use('/api/parents', parentRoutes);
app.use('/api/children', childRoutes);
app.use('/api/activity', activityRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ message: 'Server is running!' });
});

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
