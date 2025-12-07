import { Router } from 'express';
const router = Router();
import auth from '../middleware/auth.js';
import {
  getParentProfile,
  updateParentProfile,
  getChildrenList,
  getChildById,
  updateChild,
  removeChild,
  getFamilyDashboard,
  getChildMoods,
  getChildMoodSummary,
  // Add these new functions as needed
  getActivityReports,
  getBillingInfo,
  updateBillingInfo,
  getSubscription,
  updateSubscription,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getFamilySettings,
  updateFamilySettings
} from '../controllers/parentControllers.js';
import { isParent } from '../middleware/roleCheck.js';

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: JWT token obtained from login
 * 
 *   schemas:
 *     ParentProfile:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "65a1b2c3d4e5f67890123456"
 *         user:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *             name:
 *               type: string
 *               example: "John Parent"
 *             email:
 *               type: string
 *               example: "john@example.com"
 *             phone:
 *               type: string
 *               example: "+1234567890"
 *             dob:
 *               type: string
 *               format: date
 *               example: "1980-01-01"
 *         children:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ChildProfile'
 *         subscription:
 *           type: object
 *           properties:
 *             plan:
 *               type: string
 *               enum: [free, premium, enterprise]
 *               example: "premium"
 *             status:
 *               type: string
 *               example: "active"
 *             renewalDate:
 *               type: string
 *               format: date
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 * 
 *     ChildProfile:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "65a1b2c3d4e5f67890123457"
 *         user:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *             name:
 *               type: string
 *               example: "Alice Child"
 *             email:
 *               type: string
 *               example: "alice@example.com"
 *             dob:
 *               type: string
 *               format: date
 *               example: "2015-05-15"
 *             gender:
 *               type: string
 *               example: "female"
 *         points:
 *           type: integer
 *           example: 1250
 *         streakCount:
 *           type: integer
 *           example: 7
 *         hasSetPassword:
 *           type: boolean
 *           example: true
 *         lastActivity:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 * 
 *     UpdateParentRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: "Updated Parent Name"
 *         phone:
 *           type: string
 *           example: "+1234567890"
 *         dob:
 *           type: string
 *           format: date
 *           example: "1980-01-01"
 *         gender:
 *           type: string
 *           enum: [male, female, other, prefer-not-to-say]
 *           example: "male"
 *         avatar:
 *           type: string
 *           example: "https://example.com/avatar.jpg"
 * 
 *     UpdateChildRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: "Updated Child Name"
 *         dob:
 *           type: string
 *           format: date
 *           example: "2016-06-15"
 *         gender:
 *           type: string
 *           enum: [male, female, other, prefer-not-to-say]
 *           example: "female"
 *         preferences:
 *           type: object
 *           properties:
 *             favoriteActivities:
 *               type: array
 *               items:
 *                 type: string
 *               example: ["drawing", "reading"]
 *             learningStyle:
 *               type: string
 *               example: "visual"
 * 
 *     FamilyDashboard:
 *       type: object
 *       properties:
 *         summary:
 *           type: object
 *           properties:
 *             totalChildren:
 *               type: integer
 *               example: 2
 *             totalActivities:
 *               type: integer
 *               example: 45
 *             totalPoints:
 *               type: integer
 *               example: 2450
 *             averageMoodScore:
 *               type: number
 *               format: float
 *               example: 7.5
 *             totalBadges:
 *               type: integer
 *               example: 12
 *         children:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               name:
 *                 type: string
 *               points:
 *                 type: integer
 *               completedActivities:
 *                 type: integer
 *               hasSetPassword:
 *                 type: boolean
 *               lastMoodCheck:
 *                 type: string
 *                 format: date-time
 *               currentStreak:
 *                 type: integer
 *               avatar:
 *                 type: string
 *         recentActivities:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               childName:
 *                 type: string
 *               activity:
 *                 type: string
 *               points:
 *                 type: integer
 *               date:
 *                 type: string
 *                 format: date-time
 *         notifications:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 * 
 *     MoodEntry:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "65a1b2c3d4e5f67890123458"
 *         type:
 *           type: string
 *           enum: [emoji, text, voice, drawing, numeric, combined]
 *           example: "emoji"
 *         emoji:
 *           type: string
 *           example: "😊"
 *         moodScore:
 *           type: integer
 *           minimum: 1
 *           maximum: 10
 *           example: 8
 *         trustZone:
 *           type: string
 *           enum: [green, yellow, orange, red]
 *           example: "green"
 *         textNote:
 *           type: string
 *           example: "Had a great day at school!"
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           example: ["school", "friends"]
 *         createdAt:
 *           type: string
 *           format: date-time
 * 
 *     MoodSummary:
 *       type: object
 *       properties:
 *         averageScore:
 *           type: number
 *           format: float
 *           example: 7.5
 *         totalEntries:
 *           type: integer
 *           example: 24
 *         trustZoneDistribution:
 *           type: object
 *           properties:
 *             green:
 *               type: integer
 *               example: 15
 *             yellow:
 *               type: integer
 *               example: 6
 *             orange:
 *               type: integer
 *               example: 2
 *             red:
 *               type: integer
 *               example: 1
 *         frequentEmojis:
 *           type: object
 *           additionalProperties:
 *             type: integer
 *           example:
 *             "😊": 10
 *             "😢": 3
 *         currentTrustZone:
 *           type: string
 *           example: "green"
 * 
 *   responses:
 *     UnauthorizedError:
 *       description: Authentication token is missing or invalid
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: false
 *               message:
 *                 type: string
 *                 example: "Please authenticate"
 * 
 *     ForbiddenError:
 *       description: User doesn't have permission to access this resource
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: false
 *               message:
 *                 type: string
 *                 example: "Access denied"
 * 
 *     NotFoundError:
 *       description: Requested resource not found
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: false
 *               message:
 *                 type: string
 *                 example: "Resource not found"
 * 
 *     ValidationError:
 *       description: Request validation failed
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: false
 *               message:
 *                 type: string
 *                 example: "Validation failed"
 *               errors:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     field:
 *                       type: string
 *                     message:
 *                       type: string
 * 
 *     SuccessResponse:
 *       description: Operation successful
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: true
 *               message:
 *                 type: string
 *               data:
 *                 type: object
 */

/**
 * @swagger
 * tags:
 *   - name: Parent Dashboard
 *     description: Parent dashboard and family management
 *   - name: Parents
 *     description: Manage parent profiles, children, and family operations
 */

/**
 * @swagger
 * /api/v1/parents:
 *   get:
 *     summary: Get parent profile
 *     description: Retrieve the logged-in parent's complete profile with children information
 *     tags: [Parents, Parent Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Parent profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 parent:
 *                   $ref: '#/components/schemas/ParentProfile'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Parent profile not found
 *       500:
 *         description: Internal server error
 */
router.get('/', auth, isParent, getParentProfile);

/**
 * @swagger
 * /api/v1/parents:
 *   put:
 *     summary: Update parent profile
 *     description: Update parent's personal information
 *     tags: [Parents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateParentRequest'
 *     responses:
 *       200:
 *         description: Parent profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 parent:
 *                   $ref: '#/components/schemas/ParentProfile'
 *                 message:
 *                   type: string
 *                   example: "Profile updated successfully"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         description: Internal server error
 */
router.put('/', auth, isParent, updateParentProfile);

/**
 * @swagger
 * /api/v1/parents/children-list:
 *   get:
 *     summary: Get list of children
 *     description: Retrieve all children associated with the parent
 *     tags: [Parents, Parent Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved children list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 children:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ChildProfile'
 *                 totalChildren:
 *                   type: integer
 *                   example: 2
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Parent profile not found
 *       500:
 *         description: Internal server error
 */
router.get('/children-list', auth, isParent, getChildrenList);

/**
 * @swagger
 * /api/v1/parents/children-list/{childId}:
 *   get:
 *     summary: Get child by ID
 *     description: Retrieve detailed information about a specific child
 *     tags: [Parents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: childId
 *         required: true
 *         schema:
 *           type: string
 *         description: Child ID (can be User ID or Child document ID)
 *     responses:
 *       200:
 *         description: Child information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 child:
 *                   $ref: '#/components/schemas/ChildProfile'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Child not found
 *       500:
 *         description: Internal server error
 */
router.get('/children-list/:childId', auth, isParent, getChildById);

/**
 * @swagger
 * /api/v1/parents/children-list/{childId}:
 *   put:
 *     summary: Update child information
 *     description: Update child's personal information and preferences
 *     tags: [Parents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: childId
 *         required: true
 *         schema:
 *           type: string
 *         description: Child ID (can be User ID or Child document ID)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateChildRequest'
 *     responses:
 *       200:
 *         description: Child updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 child:
 *                   $ref: '#/components/schemas/ChildProfile'
 *                 message:
 *                   type: string
 *                   example: "Child updated successfully"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Child not found
 *       500:
 *         description: Internal server error
 */
router.put('/children-list/:childId', auth, isParent, updateChild);

/**
 * @swagger
 * /api/v1/parents/children-list/{childId}:
 *   delete:
 *     summary: Remove child from family
 *     description: Permanently remove a child account and all associated data
 *     tags: [Parents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: childId
 *         required: true
 *         schema:
 *           type: string
 *         description: Child ID (can be User ID or Child document ID)
 *     responses:
 *       200:
 *         description: Child removed successfully
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
 *                   example: "Child removed successfully"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Child not found
 *       500:
 *         description: Internal server error
 */
router.delete('/children-list/:childId', auth, isParent, removeChild);

/**
 * @swagger
 * /api/v1/parents/dashboard:
 *   get:
 *     summary: Get family dashboard
 *     description: Get comprehensive family dashboard with statistics, children status, and recent activities
 *     tags: [Parents, Parent Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 dashboard:
 *                   $ref: '#/components/schemas/FamilyDashboard'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Parent profile not found
 *       500:
 *         description: Internal server error
 */
router.get('/dashboard', auth, isParent, getFamilyDashboard);

/**
 * @swagger
 * /api/v1/parents/child/{childId}/moods:
 *   get:
 *     summary: Get child's mood data
 *     description: Retrieve mood check-in history for a specific child
 *     tags: [Parents, Parent Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: childId
 *         required: true
 *         schema:
 *           type: string
 *         description: Child ID (can be User ID or Child document ID)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: Number of mood entries to return
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month, year, all]
 *           default: week
 *         description: Time period for filtering mood entries
 *     responses:
 *       200:
 *         description: Child mood data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MoodEntry'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Child not found
 *       500:
 *         description: Internal server error
 */
router.get('/child/:childId/moods', auth, isParent, getChildMoods);

/**
 * @swagger
 * /api/v1/parents/child/{childId}/mood-summary:
 *   get:
 *     summary: Get child's mood summary
 *     description: Get aggregated mood statistics and insights for a child
 *     tags: [Parents, Parent Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: childId
 *         required: true
 *         schema:
 *           type: string
 *         description: Child ID (can be User ID or Child document ID)
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, quarter, year, all]
 *           default: month
 *         description: Time period for mood analysis
 *       - in: query
 *         name: includeTrends
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include trend analysis in the response
 *     responses:
 *       200:
 *         description: Child mood summary retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 summary:
 *                   $ref: '#/components/schemas/MoodSummary'
 *                 childInfo:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     currentStreak:
 *                       type: integer
 *                     lastMoodCheck:
 *                       type: string
 *                       format: date-time
 *                 insights:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       type:
 *                         type: string
 *                         enum: [warning, alert, suggestion, positive]
 *                       message:
 *                         type: string
 *                       suggestion:
 *                         type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Child not found
 *       500:
 *         description: Internal server error
 */
router.get('/child/:childId/mood-summary', auth, isParent, getChildMoodSummary);

// ============================================================
// ADDITIONAL ROUTES (You'll need to implement these controllers)
// ============================================================

/**
 * @swagger
 * /api/v1/parents/reports:
 *   get:
 *     summary: Get activity reports for all children
 *     description: Generate consolidated activity reports across all children
 *     tags: [Parents, Parent Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for report (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for report (YYYY-MM-DD)
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, csv, pdf]
 *           default: json
 *         description: Report output format
 *     responses:
 *       200:
 *         description: Reports retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         description: Internal server error
 */
router.get('/reports', auth, isParent, getActivityReports);

/**
 * @swagger
 * /api/v1/parents/billing:
 *   get:
 *     summary: Get billing information
 *     tags: [Parents]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Billing info retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         description: Internal server error
 */
router.get('/billing', auth, isParent, getBillingInfo);

/**
 * @swagger
 * /api/v1/parents/billing:
 *   put:
 *     summary: Update billing information
 *     tags: [Parents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cardNumber:
 *                 type: string
 *                 example: "**** **** **** 1234"
 *               expiryDate:
 *                 type: string
 *                 example: "12/27"
 *               billingAddress:
 *                 type: string
 *                 example: "123 Main St, City, Country"
 *               country:
 *                 type: string
 *                 example: "United States"
 *     responses:
 *       200:
 *         description: Billing info updated successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         description: Internal server error
 */
router.put('/billing', auth, isParent, updateBillingInfo);

/**
 * @swagger
 * /api/v1/parents/subscription:
 *   get:
 *     summary: Get subscription details
 *     tags: [Parents]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription details retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         description: Internal server error
 */
router.get('/subscription', auth, isParent, getSubscription);

/**
 * @swagger
 * /api/v1/parents/subscription:
 *   put:
 *     summary: Update subscription plan
 *     tags: [Parents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               plan:
 *                 type: string
 *                 enum: [free, premium, enterprise]
 *                 example: "premium"
 *               autoRenew:
 *                 type: boolean
 *                 example: true
 *               paymentMethod:
 *                 type: string
 *                 example: "credit_card"
 *     responses:
 *       200:
 *         description: Subscription updated successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         description: Internal server error
 */
router.put('/subscription', auth, isParent, updateSubscription);

/**
 * @swagger
 * /api/v1/parents/notifications:
 *   get:
 *     summary: Get parent notifications
 *     description: Retrieve all notifications for the parent
 *     tags: [Parents, Parent Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Return only unread notifications
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: Number of notifications to return
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [all, mood_alert, journal, activity, system, payment]
 *           default: all
 *         description: Filter notifications by type
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         description: Internal server error
 */
router.get('/notifications', auth, isParent, getNotifications);

/**
 * @swagger
 * /api/v1/parents/notifications/{notificationId}/read:
 *   put:
 *     summary: Mark a notification as read
 *     tags: [Parents]
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
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Internal server error
 */
router.put('/notifications/:notificationId/read', auth, isParent, markNotificationAsRead);

/**
 * @swagger
 * /api/v1/parents/notifications/read:
 *   put:
 *     summary: Mark all notifications as read
 *     tags: [Parents]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         description: Internal server error
 */

router.put('/notifications/read', auth, isParent, markAllNotificationsAsRead);

/**
 * @swagger
 * /api/v1/parents/settings:
 *   get:
 *     summary: Get family settings
 *     tags: [Parents]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Family settings retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         description: Internal server error
 */
router.get('/settings', auth, isParent, getFamilySettings);

/**
 * @swagger
 * /api/v1/parents/settings:
 *   put:
 *     summary: Update family settings
 *     tags: [Parents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notificationsEnabled:
 *                 type: boolean
 *                 example: true
 *               theme:
 *                 type: string
 *                 enum: [light, dark, auto]
 *                 example: "dark"
 *               language:
 *                 type: string
 *                 example: "en"
 *               timezone:
 *                 type: string
 *                 example: "America/New_York"
 *               privacySettings:
 *                 type: object
 *                 properties:
 *                   shareAnalytics:
 *                     type: boolean
 *                   allowMarketingEmails:
 *                     type: boolean
 *     responses:
 *       200:
 *         description: Family settings updated successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         description: Internal server error
 */
router.put('/settings', auth, isParent, updateFamilySettings);

export default router;