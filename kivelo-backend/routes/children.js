import { Router } from 'express';
const router = Router();
import auth from '../middleware/auth.js';
import {
  getChildProfile,
  updateChildProfile,
  getChildActivities,
  addChildActivity,
  updateChildActivity,
  deleteChildActivity,
  getChildProgress,
  updateChildPreferences,
  getChildDashboard
} from '../controllers/childControllers.js';

/**
 * @swagger
 * tags:
 *   - name: Children
 *     description: Manage child profiles, activities, and progress
 */

/**
 * @swagger
 * /api/children:
 *   get:
 *     summary: Get child profile
 *     tags: [Children]
 *     security:
 *       - bearerAuth: []
 *     description: Retrieve the logged-in child's profile (accessible to Child or Parent).
 *     responses:
 *       200:
 *         description: Successfully retrieved child profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   example: "6721123ab91c8b0a2e5d4321"
 *                 name:
 *                   type: string
 *                   example: "Shalom Dawodu"
 *                 age:
 *                   type: number
 *                   example: 10
 *                 preferences:
 *                   type: object
 *                   example:
 *                     favoriteSubject: "Math"
 *                     goal: "Improve Physics skills"
 *       401:
 *         description: Unauthorized
 */
router.get('/', auth, getChildProfile);

/**
 * @swagger
 * /api/children:
 *   put:
 *     summary: Update child profile
 *     tags: [Children]
 *     security:
 *       - bearerAuth: []
 *     description: Update profile details of the logged-in child (accessible to Child or Parent).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               name: "Shalom Dawodu"
 *               age: 11
 *               classLevel: "Grade 6"
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Invalid input data
 */
router.put('/', auth, updateChildProfile);

/**
 * @swagger
 * /api/children/dashboard:
 *   get:
 *     summary: Get child dashboard data
 *     tags: [Children]
 *     security:
 *       - bearerAuth: []
 *     description: Retrieve child’s personalized dashboard information such as recent activities, goals, and progress summary.
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/dashboard', auth, getChildDashboard);

/**
 * @swagger
 * /api/children/activities:
 *   get:
 *     summary: Get child activities
 *     tags: [Children]
 *     security:
 *       - bearerAuth: []
 *     description: Retrieve all activities for a child (accessible by Child or Parent).
 *     responses:
 *       200:
 *         description: Activities retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/activities', auth, getChildActivities);

/**
 * @swagger
 * /api/children/activities:
 *   post:
 *     summary: Add a new activity for a child
 *     tags: [Children]
 *     security:
 *       - bearerAuth: []
 *     description: Add a new activity to a child's record (Parent only).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Homework Completion"
 *               description:
 *                 type: string
 *                 example: "Complete math exercises 1–10"
 *     responses:
 *       201:
 *         description: Activity added successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/activities', auth, addChildActivity);

/**
 * @swagger
 * /api/children/activities/{activityId}:
 *   put:
 *     summary: Update a child's activity
 *     tags: [Children]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: activityId
 *         required: true
 *         schema:
 *           type: string
 *         description: Activity ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               title: "Evening Study"
 *               description: "Reviewed science notes and solved 5 problems"
 *     responses:
 *       200:
 *         description: Activity updated successfully
 *       404:
 *         description: Activity not found
 *       401:
 *         description: Unauthorized
 */
router.put('/activities/:activityId', auth, updateChildActivity);

/**
 * @swagger
 * /api/children/activities/{activityId}:
 *   delete:
 *     summary: Delete a child's activity
 *     tags: [Children]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: activityId
 *         required: true
 *         schema:
 *           type: string
 *         description: Activity ID
 *     responses:
 *       200:
 *         description: Activity deleted successfully
 *       404:
 *         description: Activity not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/activities/:activityId', auth, deleteChildActivity);

/**
 * @swagger
 * /api/children/progress:
 *   get:
 *     summary: Get child progress reports
 *     tags: [Children]
 *     security:
 *       - bearerAuth: []
 *     description: Retrieve progress and performance reports for a child (accessible by Parent only).
 *     responses:
 *       200:
 *         description: Progress report retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/progress', auth, getChildProgress);

/**
 * @swagger
 * /api/children/preferences:
 *   put:
 *     summary: Update child preferences
 *     tags: [Children]
 *     security:
 *       - bearerAuth: []
 *     description: Update a child's preferences (Child only).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               favoriteSubject: "Mathematics"
 *               preferredStudyTime: "Evening"
 *     responses:
 *       200:
 *         description: Preferences updated successfully
 *       401:
 *         description: Unauthorized
 */
router.put('/preferences', auth, updateChildPreferences);

export default router;
