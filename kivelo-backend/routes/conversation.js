// routes/conversation.js
import express from 'express';
import auth from '../middleware/auth.js';
import { isChild, isParent } from '../middleware/roleCheck.js';
import {
  getOrCreateAIConversation,
  sendMessage,
  addAIResponse,
  getConversationHistory,
  getFamilyConversations,
  createFamilyConversation,
  markAsRead,
  endAIConversation,
  getFlaggedConversations,
  reviewConversation,
  getChildAIInsights,
  archiveOldMessages
} from '../controllers/conversationController.js';

const router = express.Router();

// ==============================================
// AI CONVERSATION ROUTES (Child)
// ==============================================

/**
 * @swagger
 * tags:
 *   - name: Conversations
 *     description: Family and AI chat management
 *   - name: AI Chat
 *     description: AI conversation with mood context
 *   - name: Family Chat
 *     description: Parent-child and sibling messaging
 *   - name: Parent Oversight
 *     description: Safety monitoring and conversation review
 */

/**
 * @swagger
 * /api/v1/conversations/ai:
 *   get:
 *     summary: Get or create AI conversation
 *     description: |
 *       Gets the active AI conversation for the child, or creates a new one.
 *       Automatically loads mood context including:
 *       - Current mood from latest check-in
 *       - Mood trend (improving/stable/declining)
 *       - Recent journal themes
 *       - Activity engagement stats
 *     tags: [AI Chat, Conversations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: AI conversation retrieved/created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     conversationId:
 *                       type: string
 *                     type:
 *                       type: string
 *                       example: "ai_chat"
 *                     context:
 *                       type: object
 *                       properties:
 *                         currentMood:
 *                           type: object
 *                         moodTrend:
 *                           type: object
 *                         recentJournalThemes:
 *                           type: array
 *                     messages:
 *                       type: array
 *                     moodAtStart:
 *                       type: object
 *       403:
 *         description: Only children can use AI chat
 */
router.get('/ai', auth, isChild, getOrCreateAIConversation);

/**
 * @swagger
 * /api/v1/conversations/ai/{conversationId}/end:
 *   post:
 *     summary: End AI conversation
 *     description: Ends the current AI conversation and calculates session stats
 *     tags: [AI Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Conversation ended
 */
router.post('/ai/:conversationId/end', auth, isChild, endAIConversation);

/**
 * @swagger
 * /api/v1/conversations/ai/response:
 *   post:
 *     summary: Add AI response to conversation
 *     description: |
 *       Adds an AI assistant response to the conversation.
 *       Used after receiving response from external AI service.
 *     tags: [AI Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - conversationId
 *               - content
 *             properties:
 *               conversationId:
 *                 type: string
 *               content:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [text, suggestion, mood_insight, activity]
 *               metadata:
 *                 type: object
 *                 properties:
 *                   confidence:
 *                     type: number
 *                   suggestionType:
 *                     type: string
 *     responses:
 *       200:
 *         description: AI response added
 */
router.post('/ai/response', auth, addAIResponse);

// ==============================================
// FAMILY CONVERSATION ROUTES
// ==============================================

/**
 * @swagger
 * /api/v1/conversations/family:
 *   get:
 *     summary: Get family conversations
 *     description: Get all family chat conversations for the user
 *     tags: [Family Chat, Conversations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Family conversations retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       type:
 *                         type: string
 *                         enum: [family_chat, parent_child, sibling]
 *                       participants:
 *                         type: array
 *                       lastMessage:
 *                         type: object
 *                       unreadCount:
 *                         type: integer
 */
router.get('/family', auth, getFamilyConversations);

/**
 * @swagger
 * /api/v1/conversations/family:
 *   post:
 *     summary: Create family conversation
 *     description: Start a new conversation with family members
 *     tags: [Family Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - participantIds
 *             properties:
 *               participantIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: User IDs of family members to include
 *               type:
 *                 type: string
 *                 enum: [family_chat, parent_child, sibling]
 *                 default: family_chat
 *     responses:
 *       201:
 *         description: Conversation created
 *       200:
 *         description: Conversation already exists
 */
router.post('/family', auth, createFamilyConversation);

// ==============================================
// COMMON CONVERSATION ROUTES
// ==============================================

/**
 * @swagger
 * /api/v1/conversations/{conversationId}:
 *   get:
 *     summary: Get conversation history
 *     description: Get messages from a conversation with pagination
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: before
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Get messages before this timestamp
 *     responses:
 *       200:
 *         description: Conversation history retrieved
 */
router.get('/:conversationId', auth, getConversationHistory);

/**
 * @swagger
 * /api/v1/conversations/message:
 *   post:
 *     summary: Send a message
 *     description: |
 *       Send a message in a conversation (AI or family chat).
 *       Messages are automatically checked for safety concerns.
 *       If concerning content is detected:
 *       - Message is flagged
 *       - High severity triggers parent notification
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - conversationId
 *               - content
 *             properties:
 *               conversationId:
 *                 type: string
 *               content:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [text, image, voice]
 *                 default: text
 *     responses:
 *       200:
 *         description: Message sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: object
 *                     safetyCheck:
 *                       type: object
 *                       nullable: true
 */
router.post('/message', auth, sendMessage);

/**
 * @swagger
 * /api/v1/conversations/{conversationId}/read:
 *   post:
 *     summary: Mark messages as read
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Messages marked as read
 */
router.post('/:conversationId/read', auth, markAsRead);

/**
 * @swagger
 * /api/v1/conversations/{conversationId}/archive:
 *   post:
 *     summary: Archive old messages (hybrid storage)
 *     description: |
 *       Archives older messages and returns them for local device storage.
 *       Keeps recent messages in database for server access.
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               keepCount:
 *                 type: integer
 *                 default: 50
 *                 description: Number of recent messages to keep in DB
 *     responses:
 *       200:
 *         description: Messages archived
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     archivedCount:
 *                       type: integer
 *                     archivedMessages:
 *                       type: array
 *                       description: Messages to store locally
 *                     remainingInDB:
 *                       type: integer
 */
router.post('/:conversationId/archive', auth, archiveOldMessages);

// ==============================================
// PARENT OVERSIGHT ROUTES
// ==============================================

/**
 * @swagger
 * /api/v1/conversations/parent/flagged:
 *   get:
 *     summary: Get flagged conversations for review
 *     description: |
 *       Returns conversations containing flagged messages that need parent review.
 *       Includes child name, flag count, and flagged message excerpts.
 *     tags: [Parent Oversight]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Flagged conversations retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       childName:
 *                         type: string
 *                       flagCount:
 *                         type: integer
 *                       lastFlaggedAt:
 *                         type: string
 *                         format: date-time
 *                       flaggedMessages:
 *                         type: array
 *                 totalFlagged:
 *                   type: integer
 *       403:
 *         description: Parent access only
 */
router.get('/parent/flagged', auth, isParent, getFlaggedConversations);

/**
 * @swagger
 * /api/v1/conversations/parent/review/{conversationId}:
 *   post:
 *     summary: Review flagged conversation
 *     description: Mark a conversation as reviewed and add notes
 *     tags: [Parent Oversight]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *                 description: Parent's notes about the review
 *               acknowledged:
 *                 type: boolean
 *                 description: Mark as no longer requiring review
 *     responses:
 *       200:
 *         description: Conversation reviewed
 */
router.post('/parent/review/:conversationId', auth, isParent, reviewConversation);

/**
 * @swagger
 * /api/v1/conversations/parent/child/{childId}/insights:
 *   get:
 *     summary: Get AI conversation insights for a child
 *     description: |
 *       Analytics and insights from child's AI conversations:
 *       - Total conversations and messages
 *       - Average session duration
 *       - Common mood at conversation start
 *       - Suggestion breakdown
 *       - Flagged message count
 *     tags: [Parent Oversight]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: childId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Insights retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalConversations:
 *                       type: integer
 *                     totalMessages:
 *                       type: integer
 *                     avgSessionDuration:
 *                       type: integer
 *                       description: In seconds
 *                     commonMoodAtStart:
 *                       type: string
 *                     suggestionBreakdown:
 *                       type: object
 *                     flaggedCount:
 *                       type: integer
 *                     recentTopics:
 *                       type: array
 */
router.get('/parent/child/:childId/insights', auth, isParent, getChildAIInsights);

export default router;
