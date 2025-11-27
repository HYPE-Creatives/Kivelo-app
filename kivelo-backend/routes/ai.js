import express from "express";
import {
  chat,
  getHistory,
  clearHistory
} from "../controllers/ai/chatController.js";

import { askKivelo, getAIServiceStatus } from "../utils/aiTrigger.js";

const router = express.Router();

/**
 * @swagger
 * /api/ai/chat:
 *   post:
 *     summary: Send a message to the AI model
 *     tags: [AI Chat]
 *     description: Sends { username, message } to the AI model and returns { reply }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/ChatRequest"
 *     responses:
 *       200:
 *         description: AI successful reply
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ChatResponse"
 *       400:
 *         description: Invalid request input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       503:
 *         description: AI service unavailable (mock mode)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ChatResponse"
 */
router.post("/chat", chat);

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
 *               $ref: "#/components/schemas/HistoryResponse"
 */
router.get("/chat/history", getHistory);

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
 *               $ref: "#/components/schemas/ClearHistoryResponse"
 */
router.delete("/chat/clear-history", clearHistory);

/**
 * @swagger
 * /api/ai/status:
 *   get:
 *     summary: Check AI service availability and health
 *     tags: [AI Chat]
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
 *                   example: true
 *                 aiService:
 *                   type: object
 *                   properties:
 *                     isAvailable:
 *                       type: boolean
 *                       example: false
 *                     lastChecked:
 *                       type: string
 *                       format: date-time
 *                     lastError:
 *                       type: string
 *                       example: "socket hang up"
 *                     environment:
 *                       type: string
 *                       example: "AI_BASE + AI_ROUTE configured"
 *                 message:
 *                   type: string
 *                   example: "AI service is operational"
 */
router.get("/status", async (req, res) => {
  const status = getAIServiceStatus();

  res.json({
    success: true,
    aiService: {
      isAvailable: status.isAvailable,
      lastChecked: status.lastChecked,
      lastError: status.lastError,
      environment:
        process.env.AI_BASE && process.env.AI_ROUTE
          ? "AI_BASE + AI_ROUTE configured"
          : "AI config missing",
      endpoint:
        process.env.AI_BASE && process.env.AI_ROUTE
          ? process.env.AI_BASE + process.env.AI_ROUTE
          : "Not configured",
    },
    message: status.isAvailable
      ? "AI service is operational"
      : "AI service is unavailable - using mock responses",
  });
});

/**
 * @swagger
 * /api/ai/test-connection:
 *   get:
 *     summary: Test the connection to the AI service
 *     tags: [AI Chat]
 *     responses:
 *       200:
 *         description: AI connection successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "AI service is connected"
 *                 response:
 *                   reply: "Hello from AI"
 *       500:
 *         description: AI unreachable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 */
router.get("/test-connection", async (req, res) => {
  try {
    const testResponse = await askKivelo({
      username: "system-test",
      message: "Test connection"
    });

    res.json({
      success: true,
      message: "AI service is connected",
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
