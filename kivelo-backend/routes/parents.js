import { Router } from 'express';
const router = Router();
import auth from '../middleware/auth.js';
import {
  getParentProfile,
  updateParentProfile,
  getChildrenList,
  addChild,
  updateChild,
  removeChild,
  getFamilyDashboard,
  getActivityReports,
  getBillingInfo,
  updateBillingInfo,
  getSubscription,
  updateSubscription,
  getNotifications,
  markNotificationAsRead,
  getFamilySettings,
  updateFamilySettings,
  getChildMoods,
  getChildMoodSummary
} from '../controllers/parentControllers.js';
import { isParent, hasAccessToChild } from '../middleware/roleCheck.js';

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     ApiKeyAuth:
 *       type: "apiKey"
 *       in: "header"
 *       name: "x-api-key"
 *       description: "API key required for all backend access"
 *     bearerAuth:
 *       type: "http"
 *       scheme: "bearer"
 *       bearerFormat: "JWT"
 *       description: "JWT Authorization header using the Bearer scheme"
 */

/**
 * @swagger
 * tags:
 *   - name: Parent Dashboard
 *     description: Parent dashboard and family management
 *   - name: Parents
 *     description: Manage parent profiles, children, billing, subscriptions, and family dashboard
 */

/**
 * @swagger
 * /api/parents:
 *   get:
 *     summary: Get parent profile
 *     tags: [Parents]
 *     security:
 *       - ApiKeyAuth: []
 *       - bearerAuth: []
 *     description: Retrieve the logged-in parent's profile information.
 *     responses:
 *       200:
 *         description: Parent profile retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', auth, isParent, getParentProfile);

/**
 * @swagger
 * /api/parents:
 *   put:
 *     summary: Update parent profile
 *     tags: [Parents]
 *     security:
 *       - ApiKeyAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               name: "Fatai Dawodu"
 *               email: "fatai@kivelo.com"
 *               phone: "+2348012345678"
 *     responses:
 *       200:
 *         description: Parent profile updated successfully
 */
router.put('/', auth, isParent, updateParentProfile);

/**
 * @swagger
 * /api/parents/children-list:
 *   get:
 *     summary: Get list of children
 *     tags: [Parents]
 *     security:
 *       - ApiKeyAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved children list
 */
router.get('/children-list', auth, isParent, getChildrenList);

/**
 * @swagger
 * /api/parents/children-list:
 *   post:
 *     summary: Add a new child
 *     tags: [Parents]
 *     security:
 *       - ApiKeyAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - age
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Shalom Dawodu"
 *               age:
 *                 type: number
 *                 example: 9
 *     responses:
 *       201:
 *         description: Child added successfully
 */
router.post('/children-list', auth, isParent, addChild);

/**
 * @swagger
 * /api/parents/children-list/{childId}:
 *   put:
 *     summary: Update child information
 *     tags: [Parents]
 *     security:
 *       - ApiKeyAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: childId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the child to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             example:
 *               name: "Updated Child Name"
 *               age: 10
 *     responses:
 *       200:
 *         description: Child updated successfully
 */
router.put('/children-list/:childId', auth, isParent, hasAccessToChild, updateChild);

/**
 * @swagger
 * /api/parents/children-list/{childId}:
 *   delete:
 *     summary: Remove child from family
 *     tags: [Parents]
 *     security:
 *       - ApiKeyAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: childId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Child removed successfully
 */
router.delete('/children-list/:childId', auth, removeChild);

/**
 * @swagger
 * /api/parents/dashboard:
 *   get:
 *     summary: Get family dashboard
 *     tags: [Parents]
 *     security:
 *       - ApiKeyAuth: []
 *       - bearerAuth: []
 *     description: Get parent dashboard with family summary, children stats, and notifications.
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
 */
router.get('/dashboard', auth, getFamilyDashboard);

/**
 * @swagger
 * /api/parents/reports:
 *   get:
 *     summary: Get activity reports for all children
 *     tags: [Parents]
 *     security:
 *       - ApiKeyAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reports retrieved successfully
 */
router.get('/reports', auth, getActivityReports);

/**
 * @swagger
 * /api/parents/billing:
 *   get:
 *     summary: Get billing information
 *     tags: [Parents]
 *     security:
 *       - ApiKeyAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Billing info retrieved successfully
 */
router.get('/billing', auth, isParent, getBillingInfo);

/**
 * @swagger
 * /api/parents/billing:
 *   put:
 *     summary: Update billing information
 *     tags: [Parents]
 *     security:
 *       - ApiKeyAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             example:
 *               cardNumber: "**** **** **** 1234"
 *               expiryDate: "12/27"
 *               billingAddress: "123 Kivelo St, Lagos"
 *     responses:
 *       200:
 *         description: Billing info updated successfully
 */
router.put('/billing', auth, updateBillingInfo);

/**
 * @swagger
 * /api/parents/subscription:
 *   get:
 *     summary: Get subscription details
 *     tags: [Parents]
 *     security:
 *       - ApiKeyAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription details retrieved successfully
 */
router.get('/subscription', auth, getSubscription);

/**
 * @swagger
 * /api/parents/subscription:
 *   put:
 *     summary: Update subscription plan
 *     tags: [Parents]
 *     security:
 *       - ApiKeyAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             example:
 *               plan: "Premium"
 *               autoRenew: true
 *     responses:
 *       200:
 *         description: Subscription updated successfully
 */
router.put('/subscription', auth, updateSubscription);

/**
 * @swagger
 * /api/parents/notifications:
 *   get:
 *     summary: Get parent notifications
 *     tags: [Parents]
 *     security:
 *       - ApiKeyAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 */
router.get('/notifications', auth, getNotifications);

/**
 * @swagger
 * /api/parents/notifications/{notificationId}/read:
 *   put:
 *     summary: Mark a notification as read
 *     tags: [Parents]
 *     security:
 *       - ApiKeyAuth: []
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
 */
router.put('/notifications/:notificationId/read', auth, markNotificationAsRead);

/**
 * @swagger
 * /api/parents/settings:
 *   get:
 *     summary: Get family settings
 *     tags: [Parents]
 *     security:
 *       - ApiKeyAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Family settings retrieved successfully
 */
router.get('/settings', auth, getFamilySettings);

/**
 * @swagger
 * /api/parents/settings:
 *   put:
 *     summary: Update family settings
 *     tags: [Parents]
 *     security:
 *       - ApiKeyAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             example:
 *               notificationsEnabled: true
 *               theme: "dark"
 *     responses:
 *       200:
 *         description: Family settings updated successfully
 */
router.put('/settings', auth, updateFamilySettings);

/**
 * @swagger
 * /api/parents/moods/{childId}:
 *   get:
 *     summary: Get mood data for a specific child
 *     tags: [Parents]
 *     security:
 *       - ApiKeyAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: childId
 *         required: true
 *         schema:
 *           type: string
 *         description: Child ID
 *     responses:
 *       200:
 *         description: Child mood data retrieved successfully
 */
router.get('/moods/:childId', auth, isParent, hasAccessToChild, getChildMoods);

/**
 * @swagger
 * /api/parents/summary/{childId}:
 *   get:
 *     summary: Get mood summary for a specific child
 *     tags: [Parents]
 *     security:
 *       - ApiKeyAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: childId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Child mood summary retrieved successfully
 */
router.get('/summary/:childId', auth, isParent, hasAccessToChild, getChildMoodSummary);

export default router;