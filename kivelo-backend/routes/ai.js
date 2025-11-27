import express from "express";
import { chat, getHistory, clearHistory } from "../controllers/ai/chatController.js";

const router = express.Router();

/**
 * @swagger
 * /api/ai/chat:
 *   post:
 *     summary: Send a message to AI and get response
 *     description: Processes user message through AI model and returns response while storing the conversation in history
 *     tags: [Chat]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChatRequest'
 *     responses:
 *       200:
 *         description: Successful AI response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChatResponse'
 *       400:
 *         description: Bad request - missing message
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/chat", chat);

/**
 * @swagger
 * /api/ai/chat/history:
 *   get:
 *     summary: Get chat history
 *     description: Retrieve the complete conversation history between user and AI
 *     tags: [Chat History]
 *     responses:
 *       200:
 *         description: Successful retrieval of chat history
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HistoryResponse'
 */
router.get("/chat/history", getHistory);

/**
 * @swagger
 * /api/ai/chat/clear-history:
 *   delete:
 *     summary: Clear chat history
 *     description: Clear all stored conversation history
 *     tags: [Chat History]
 *     responses:
 *       200:
 *         description: Chat history cleared successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ClearHistoryResponse'
 */
router.delete("/chat/clear-history", clearHistory);

/**
 * @swagger
 * /api/ai/status:
 *   get:
 *     summary: Check AI service status
 *     description: Get the current status and health of the AI service
 *     tags: [AI Chat]
 *     responses:
 *       200:
 *         description: AI service status information
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
 *                       example: "AI_ENDPOINT configured"
 */
router.get("/status", async (req, res) => {
  const status = getAIServiceStatus();
  
  res.json({
    success: true,
    aiService: {
      isAvailable: status.isAvailable,
      lastChecked: status.lastChecked,
      lastError: status.lastError,
      environment: process.env.AI_ENDPOINT ? "AI_ENDPOINT configured" : "AI_ENDPOINT not set",
      endpoint: process.env.AI_ENDPOINT ? "***" + process.env.AI_ENDPOINT.slice(-20) : "Not set"
    },
    message: status.isAvailable 
      ? "AI service is operational" 
      : "AI service is unavailable - using mock responses"
  });
});

// In your chatRoutes.js, add a test endpoint
/**
 * @swagger
 * /api/ai/test-connection:
 *   get:
 *     summary: Test connection to AI service
 *     tags: [Chat]
 *     responses:
 *       200:
 *         description: Connection test result
 */
router.get("/test-connection", async (req, res) => {
  try {
    const testResponse = await askKivelo("Test connection");
    res.json({
      success: true,
      message: "AI service is connected",
      response: testResponse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;