// routes/notificationRoutes.js
import express from 'express';
import auth from '../middleware/auth.js';
import { isChild, isParent } from '../middleware/roleCheck.js';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

import {
  getNotifications,
  getNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllRead,
  getNotificationStats,
  createNotification,
  getChildNotifications,
  sendMoodAlert,
  sendAISuggestion,
  sendBulkNotifications,
  scheduleNotification
} from '../controllers/notificationController.js';

const router = express.Router();

// Swagger setup for Notification routes
// ====================
// API ROUTES WITH SWAGGER ANNOTATIONS
// ====================

/**
 * All routes require authentication
 */
router.use(auth);

/**
 * @swagger
 * /api/v1/notifications:
 *   get:
 *     summary: Get user's notifications
 *     description: Retrieve paginated list of notifications with filtering options
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: Items per page
 *       - in: query
 *         name: isRead
 *         schema:
 *           type: boolean
 *         description: Filter by read status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [mood_alert, streak_milestone, new_journal, points_earned, badge_earned, system, parent_alert, ai_suggestion, all]
 *         description: Filter by notification type
 *       - in: query
 *         name: priority
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         description: Filter by priority level
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter from date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter to date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     notifications:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Notification'
 *                     stats:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         unread:
 *                           type: integer
 *                         read:
 *                           type: integer
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       500:
 *         description: Internal server error
 */
router.get('/', getNotifications);

/**
 * @swagger
 * /api/v1/notifications/stats:
 *   get:
 *     summary: Get notification statistics
 *     description: Get detailed statistics about user's notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notification statistics retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     summary:
 *                       type: object
 *                     byType:
 *                       type: array
 *                     byPriority:
 *                       type: array
 *                     dailyStats:
 *                       type: array
 *                     mostRecent:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Notification'
 *       500:
 *         description: Internal server error
 */
router.get('/stats', getNotificationStats);

/**
 * @swagger
 * /api/v1/notifications/{notificationId}:
 *   get:
 *     summary: Get single notification
 *     description: Get specific notification by ID (marks as read when retrieved)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Notification'
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Internal server error
 */
router.get('/:notificationId', getNotification);

/**
 * @swagger
 * /api/v1/notifications/{notificationId}/read:
 *   put:
 *     summary: Mark notification as read
 *     description: Mark a specific notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification marked as read
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Notification'
 *                 message:
 *                   type: string
 *                   example: "Notification marked as read"
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Internal server error
 */
router.put('/:notificationId/read', markAsRead);

/**
 * @swagger
 * /api/v1/notifications/read-all:
 *   put:
 *     summary: Mark all notifications as read
 *     description: Mark all unread notifications as read for the current user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     modifiedCount:
 *                       type: integer
 *                     unreadCount:
 *                       type: integer
 *                 message:
 *                   type: string
 *                   example: "5 notifications marked as read"
 *       500:
 *         description: Internal server error
 */
router.put('/read-all', markAllAsRead);

/**
 * @swagger
 * /api/v1/notifications/{notificationId}:
 *   delete:
 *     summary: Delete notification
 *     description: Delete a specific notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification deleted successfully
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
 *                   example: "Notification deleted successfully"
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:notificationId', deleteNotification);

/**
 * @swagger
 * /api/v1/notifications/clear-read:
 *   delete:
 *     summary: Clear all read notifications
 *     description: Delete all read notifications for the current user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Read notifications cleared
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     deletedCount:
 *                       type: integer
 *                     remainingCount:
 *                       type: integer
 *                 message:
 *                   type: string
 *                   example: "10 read notifications cleared"
 *       500:
 *         description: Internal server error
 */
router.delete('/clear-read', clearAllRead);

// ====================
// PARENT-ONLY ROUTES
// ====================

/**
 * @swagger
 * /api/v1/notifications/parent/child/{childId}:
 *   get:
 *     summary: Get child's notifications (Parent view)
 *     description: Parent retrieves notifications related to a specific child
 *     tags: [Notifications, Parents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: childId
 *         required: true
 *         schema:
 *           type: string
 *         description: Child document ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [mood_alert, streak_milestone, new_journal, points_earned, badge_earned, system, parent_alert, ai_suggestion, all]
 *         description: Filter by notification type
 *     responses:
 *       200:
 *         description: Child's notifications retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     notifications:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Notification'
 *                     childInfo:
 *                       type: object
 *                 pagination:
 *                   type: object
 *       403:
 *         description: Access denied
 *       500:
 *         description: Internal server error
 */
router.get('/parent/child/:childId', isParent, getChildNotifications);

/**
 * @swagger
 * /api/v1/notifications/parent/mood-alert:
 *   post:
 *     summary: Send mood alert notification
 *     description: Parent sends a mood alert notification about their child
 *     tags: [Notifications, Parents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [childId, mood]
 *             properties:
 *               childId:
 *                 type: string
 *                 description: Child document ID
 *               mood:
 *                 type: string
 *                 description: Child's mood
 *               intensity:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10
 *                 default: 5
 *               message:
 *                 type: string
 *                 description: Custom message
 *           example:
 *             childId: "65a1b2c3d4e5f67890123456"
 *             mood: "anxious"
 *             intensity: 8
 *             message: "Your child is feeling anxious today"
 *     responses:
 *       200:
 *         description: Mood alert sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Notification'
 *                 message:
 *                   type: string
 *                   example: "Mood alert notification sent"
 *       403:
 *         description: Access denied
 *       500:
 *         description: Internal server error
 */
router.post('/parent/mood-alert', isParent, sendMoodAlert);

/**
 * @swagger
 * /api/v1/notifications/parent/ai-suggestion:
 *   post:
 *     summary: Send AI suggestion notification
 *     description: Parent sends an AI-powered parenting suggestion notification
 *     tags: [Notifications, Parents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [childId, suggestion]
 *             properties:
 *               childId:
 *                 type: string
 *               suggestion:
 *                 type: string
 *                 maxLength: 500
 *               context:
 *                 type: object
 *           example:
 *             childId: "65a1b2c3d4e5f67890123456"
 *             suggestion: "Consider discussing your child's feelings about school today"
 *             context: { trigger: "journal_entry", mood: "anxious" }
 *     responses:
 *       200:
 *         description: AI suggestion sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Notification'
 *                 message:
 *                   type: string
 *                   example: "AI suggestion notification sent"
 *       403:
 *         description: Access denied
 *       500:
 *         description: Internal server error
 */
router.post('/parent/ai-suggestion', isParent, sendAISuggestion);

/**
 * @swagger
 * /api/v1/notifications/parent/bulk:
 *   post:
 *     summary: Send bulk notifications to children
 *     description: Parent sends notifications to multiple children at once
 *     tags: [Notifications, Parents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [childIds, type, title, message]
 *             properties:
 *               childIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of child document IDs
 *               type:
 *                 type: string
 *                 enum: [mood_alert, streak_milestone, new_journal, points_earned, badge_earned, system, parent_alert, ai_suggestion]
 *               title:
 *                 type: string
 *                 maxLength: 200
 *               message:
 *                 type: string
 *                 maxLength: 500
 *               data:
 *                 type: object
 *           example:
 *             childIds: ["65a1b2c3d4e5f67890123456", "65a1b2c3d4e5f67890123457"]
 *             type: "system"
 *             title: "Important Reminder"
 *             message: "Don't forget to complete your homework today!"
 *             data: { reminderType: "homework" }
 *     responses:
 *       200:
 *         description: Bulk notifications sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     sentCount:
 *                       type: integer
 *                     notifications:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Notification'
 *                 message:
 *                   type: string
 *                   example: "2 notifications sent successfully"
 *       400:
 *         description: Invalid request
 *       403:
 *         description: Access denied
 *       500:
 *         description: Internal server error
 */
router.post('/parent/bulk', isParent, sendBulkNotifications);

// ====================
// CREATION ROUTES
// ====================

/**
 * @swagger
 * /api/v1/notifications:
 *   post:
 *     summary: Create a new notification
 *     description: Create a notification for yourself or your children (with proper permissions)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NotificationCreate'
 *           example:
 *             userId: "65a1b2c3d4e5f67890123456"
 *             type: "system"
 *             title: "Welcome to Kivelo!"
 *             message: "We're glad to have you on board"
 *             priority: 3
 *     responses:
 *       201:
 *         description: Notification created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Notification'
 *                 message:
 *                   type: string
 *                   example: "Notification created successfully"
 *       400:
 *         description: Missing required fields
 *       403:
 *         description: Access denied
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.post('/', createNotification);

/**
 * @swagger
 * /api/v1/notifications/schedule:
 *   post:
 *     summary: Schedule a notification for future delivery
 *     description: Create a notification that will be delivered at a specified future time
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, type, title, message, scheduledFor]
 *             properties:
 *               userId:
 *                 type: string
 *               type:
 *                 type: string
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               data:
 *                 type: object
 *               scheduledFor:
 *                 type: string
 *                 format: date-time
 *           example:
 *             userId: "65a1b2c3d4e5f67890123456"
 *             type: "reminder"
 *             title: "Daily Check-in Reminder"
 *             message: "Time for your daily mood check-in!"
 *             scheduledFor: "2024-12-25T09:00:00.000Z"
 *     responses:
 *       201:
 *         description: Notification scheduled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Notification'
 *                 message:
 *                   type: string
 *                   example: "Notification scheduled successfully"
 *       400:
 *         description: Invalid request or past date
 *       403:
 *         description: Access denied
 *       500:
 *         description: Internal server error
 */
router.post('/schedule', scheduleNotification);

export { router as notificationRouter };
export default router;