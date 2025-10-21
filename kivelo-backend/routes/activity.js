import express from 'express';
import {
  getUserActivities,
  createActivity,
  updateActivity,
  deleteActivity
} from '../controllers/activityControllers.js';
import auth from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Activities
 *   description: User activity management
 */

/**
 * @swagger
 * /api/activities:
 *   get:
 *     summary: Get all user activities
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved user activities
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     example: "6715b0fae8f93c45ac1d21b2"
 *                   title:
 *                     type: string
 *                     example: "Morning workout"
 *                   description:
 *                     type: string
 *                     example: "Cardio session for 30 minutes"
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Unauthorized - missing or invalid token
 */
router.get('/', auth, getUserActivities);

/**
 * @swagger
 * /api/activities:
 *   post:
 *     summary: Create a new activity
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
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
 *                 example: "Study Session"
 *               description:
 *                 type: string
 *                 example: "Read two chapters of physics textbook"
 *     responses:
 *       201:
 *         description: Activity created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post('/', auth, createActivity);

/**
 * @swagger
 * /api/activities/{id}:
 *   put:
 *     summary: Update an existing activity
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The activity ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Evening walk"
 *               description:
 *                 type: string
 *                 example: "Walked for 45 minutes around the neighborhood"
 *     responses:
 *       200:
 *         description: Activity updated successfully
 *       404:
 *         description: Activity not found
 *       401:
 *         description: Unauthorized
 */
router.put('/:id', auth, updateActivity);

/**
 * @swagger
 * /api/activities/{id}:
 *   delete:
 *     summary: Delete an activity
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The activity ID
 *     responses:
 *       200:
 *         description: Activity deleted successfully
 *       404:
 *         description: Activity not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/:id', auth, deleteActivity);

export default router;
