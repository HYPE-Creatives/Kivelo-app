import express from "express";
import auth from '../middleware/auth.js';
import {
  chat,
  getHistory,
  clearHistory,
  getServiceStatus
} from "../controllers/ai/chatController.js";
import { requireBodyFields } from "../middleware/validators.js";
import { askKivelo } from "../utils/aiTrigger.js";

const router = express.Router();

/**
 * @swagger
 * /api/ai/chat:
 *   post:
 *     summary: Send a message to the AI model
 *     tags: [AI Chat]
 *     description: Sends { username, message } to the AI model and returns the raw AI response
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - message
 *             properties:
 *               username:
 *                 type: string
 *                 example: "john_doe"
 *               message:
 *                 type: string
 *                 example: "Hello, how are you?"
 *     responses:
 *       200:
 *         description: AI response (raw from model)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reply:
 *                   type: string
 *                   description: AI generated response
 *                 isMock:
 *                   type: boolean
 *                   description: Indicates if this is a mock response
 *                 note:
 *                   type: string
 *                   description: Additional info about the response
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid request input
 *       503:
 *         description: AI service unavailable
 */
router.post("/chat", auth, chat, requireBodyFields("message"));

/**
 * @swagger
 * /api/ai/chat/history:
 *   get:
 *     summary: Retrieve chat history
 *     tags: [AI Chat]
 *     responses:
 *       200:
 *         description: Chat history response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 history:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       username:
 *                         type: string
 *                       user:
 *                         type: string
 *                       ai:
 *                         type: object
 *                         description: Full AI response object
 *                       time:
 *                         type: string
 *                         format: date-time
 *                       isMock:
 *                         type: boolean
 *                 count:
 *                   type: number
 *                 containsMockResponses:
 *                   type: boolean
 *                 totalMockResponses:
 *                   type: number
 */
router.get("/chat/history", auth, getHistory);

/**
 * @swagger
 * /api/ai/chat/clear-history:
 *   delete:
 *     summary: Clear all chat history
 *     tags: [AI Chat]
 *     responses:
 *       200:
 *         description: History cleared successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Chat history cleared (5 messages removed)"
 */
router.delete("/chat/clear-history", auth, clearHistory);

/**
 * @swagger
 * /api/ai/status:
 *   get:
 *     summary: Check AI service availability and health
 *     tags: [AI Chat]
 *     parameters:
 *       - in: query
 *         name: refresh
 *         schema:
 *           type: boolean
 *         description: Whether to perform a fresh health check
 *     responses:
 *       200:
 *         description: AI health status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 aiService:
 *                   type: object
 *                   properties:
 *                     isAvailable:
 *                       type: boolean
 *                     lastChecked:
 *                       type: string
 *                       format: date-time
 *                     lastError:
 *                       type: string
 *                     environment:
 *                       type: string
 *                     endpoint:
 *                       type: string
 *                     hasValidEndpoint:
 *                       type: boolean
 *                     status:
 *                       type: string
 *                       enum: [Operational, Unavailable, Not Configured]
 *                 message:
 *                   type: string
 */
router.get("/status", getServiceStatus);

/**
 * @swagger
 * /api/ai/test-connection:
 *   get:
 *     summary: Test the connection to the AI service
 *     tags: [AI Chat]
 *     responses:
 *       200:
 *         description: AI connection test result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 response:
 *                   type: object
 *                   properties:
 *                     reply:
 *                       type: string
 *                     isMock:
 *                       type: boolean
 *                     note:
 *                       type: string
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       500:
 *         description: AI unreachable
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 */
router.get("/test-connection", async (req, res) => {
  try {
    const testResponse = await askKivelo({
      username: "system-test",
      message: "Test connection - please respond with 'Hello from AI' if working"
    });

    res.json({
      success: true,
      message: testResponse.isMock ? 
        "AI service unavailable - using mock mode" : 
        "AI service is connected and responding",
      response: testResponse,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;