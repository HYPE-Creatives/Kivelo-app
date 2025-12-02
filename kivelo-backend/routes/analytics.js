// routes/analytics.js
import express from "express";
import {
  getRoutes,
  getStats,
  getSummary,
  getTimeSeries
} from "../controllers/analyticsController.js";

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     AnalyticsRoute:
 *       type: object
 *       properties:
 *         path:
 *           type: string
 *           example: "/api/auth/login"
 *         method:
 *           type: string
 *           example: "POST"
 *         count:
 *           type: integer
 *           example: 150
 *         averageResponseTime:
 *           type: number
 *           format: float
 *           example: 45.2
 *     SystemStats:
 *       type: object
 *       properties:
 *         totalUsers:
 *           type: integer
 *           example: 1250
 *         activeUsers:
 *           type: integer
 *           example: 342
 *         totalMoodCheckins:
 *           type: integer
 *           example: 5678
 *         aiRequests:
 *           type: integer
 *           example: 892
 *         mockAIResponses:
 *           type: integer
 *           example: 45
 *         uptime:
 *           type: string
 *           example: "5 days, 12 hours"
 *     AnalyticsSummary:
 *       type: object
 *       properties:
 *         period:
 *           type: string
 *           example: "last_7_days"
 *         totalRequests:
 *           type: integer
 *           example: 12500
 *         uniqueUsers:
 *           type: integer
 *           example: 456
 *         mostUsedRoute:
 *           type: string
 *           example: "/api/ai/chat"
 *         errorRate:
 *           type: number
 *           format: float
 *           example: 0.02
 *         averageResponseTime:
 *           type: number
 *           format: float
 *           example: 87.5
 *     TimeSeriesData:
 *       type: object
 *       properties:
 *         timestamp:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T00:00:00Z"
 *         requests:
 *           type: integer
 *           example: 150
 *         users:
 *           type: integer
 *           example: 45
 *         errors:
 *           type: integer
 *           example: 3
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: string
 *           example: "Invalid time range parameter"
 */

/**
 * @swagger
 * /api-analytics/routes:
 *   get:
 *     summary: Get route usage analytics
 *     description: Retrieve statistics about API route usage including request counts and response times
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [today, last_7_days, last_30_days, last_90_days]
 *         description: Time period for analytics data
 *         example: last_7_days
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of routes to return (sorted by request count)
 *         example: 20
 *     responses:
 *       200:
 *         description: Successful retrieval of route analytics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 period:
 *                   type: string
 *                   example: "last_7_days"
 *                 totalRoutes:
 *                   type: integer
 *                   example: 15
 *                 routes:
 *                   type: array
 *                   items:
 *                     $ref: "#/components/schemas/AnalyticsRoute"
 *       400:
 *         description: Invalid parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 */
router.get("/routes", getRoutes);

/**
 * @swagger
 * /api-analytics/stats:
 *   get:
 *     summary: Get system statistics
 *     description: Retrieve overall system statistics including user counts, activity metrics, and AI usage
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: refresh
 *         schema:
 *           type: boolean
 *         description: Force refresh cached statistics
 *         example: false
 *     responses:
 *       200:
 *         description: Successful retrieval of system statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 generatedAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-15T10:30:00Z"
 *                 stats:
 *                   $ref: "#/components/schemas/SystemStats"
 *                 aiService:
 *                   type: object
 *                   properties:
 *                     isAvailable:
 *                       type: boolean
 *                       example: true
 *                     mockResponseRate:
 *                       type: number
 *                       format: float
 *                       example: 5.1
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 */
router.get("/stats", getStats);

/**
 * @swagger
 * /api-analytics/summary:
 *   get:
 *     summary: Get analytics summary
 *     description: Retrieve a comprehensive summary of system analytics for a given period
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [today, yesterday, last_7_days, last_30_days, last_90_days]
 *         description: Time period for the summary
 *         required: true
 *         example: last_7_days
 *       - in: query
 *         name: compareWithPrevious
 *         schema:
 *           type: boolean
 *         description: Include comparison data with previous period
 *         example: true
 *     responses:
 *       200:
 *         description: Successful retrieval of analytics summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 summary:
 *                   $ref: "#/components/schemas/AnalyticsSummary"
 *                 comparison:
 *                   type: object
 *                   properties:
 *                     requestsChange:
 *                       type: number
 *                       format: float
 *                       example: 12.5
 *                     usersChange:
 *                       type: number
 *                       format: float
 *                       example: -2.3
 *                     responseTimeChange:
 *                       type: number
 *                       format: float
 *                       example: -5.7
 *       400:
 *         description: Invalid or missing period parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 */
router.get("/summary", getSummary);

/**
 * @swagger
 * /api-analytics/time-series:
 *   get:
 *     summary: Get time series analytics data
 *     description: Retrieve time-series data for requests, users, and errors over a specified time range
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (YYYY-MM-DD)
 *         required: true
 *         example: "2024-01-01"
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (YYYY-MM-DD)
 *         required: true
 *         example: "2024-01-15"
 *       - in: query
 *         name: granularity
 *         schema:
 *           type: string
 *           enum: [hourly, daily, weekly, monthly]
 *         description: Time granularity for the data points
 *         example: daily
 *       - in: query
 *         name: metric
 *         schema:
 *           type: string
 *           enum: [requests, users, errors, response_time]
 *         description: Specific metric to focus on
 *         example: requests
 *     responses:
 *       200:
 *         description: Successful retrieval of time series data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 timeRange:
 *                   type: object
 *                   properties:
 *                     startDate:
 *                       type: string
 *                       format: date
 *                       example: "2024-01-01"
 *                     endDate:
 *                       type: string
 *                       format: date
 *                       example: "2024-01-15"
 *                 granularity:
 *                   type: string
 *                   example: "daily"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: "#/components/schemas/TimeSeriesData"
 *       400:
 *         description: Invalid date range or parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 */
router.get("/time-series", getTimeSeries);

export default router;