import express from 'express';
import {
  getUserActivities,
  createActivity,
  updateActivity,
  deleteActivity,
  completeActivity,
  submitActivityAnswer,
  getActivitySubmissions,
  getAllChildrenSubmissions,
  reviewSubmission,
  getMySubmission
} from '../controllers/activityControllers.js';
import auth from '../middleware/auth.js';
import { isChild, isParent } from '../middleware/roleCheck.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Activities
 *   description: Activity management for parents and children
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Activity:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "6715b0fae8f93c45ac1d21b2"
 *         title:
 *           type: string
 *           example: "Morning workout"
 *         description:
 *           type: string
 *           example: "Cardio session for 30 minutes"
 *         category:
 *           type: string
 *           enum: [education, physical, creative, chores, social, mindfulness]
 *           example: "physical"
 *         points:
 *           type: number
 *           example: 20
 *         duration:
 *           type: number
 *           example: 30
 *         assignedTo:
 *           type: array
 *           items:
 *             type: string
 *           example: ["65a1b2c3d4e5f67890123456"]
 *         createdBy:
 *           type: string
 *           example: "65a1b2c3d4e5f67890123457"
 *         dueDate:
 *           type: string
 *           format: date
 *           example: "2024-12-31"
 *         completed:
 *           type: boolean
 *           default: false
 *         completedAt:
 *           type: string
 *           format: date-time
 *         completedBy:
 *           type: string
 *         difficulty:
 *           type: string
 *           enum: [easy, medium, hard]
 *           default: medium
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           example: ["exercise", "health"]
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 * 
 *     ActivityCreateRequest:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - category
 *         - points
 *         - duration
 *         - assignedTo
 *       properties:
 *         title:
 *           type: string
 *           example: "Study Session"
 *           maxLength: 200
 *         description:
 *           type: string
 *           example: "Read two chapters of physics textbook"
 *           maxLength: 1000
 *         category:
 *           type: string
 *           enum: [education, physical, creative, chores, social, mindfulness]
 *           example: "education"
 *         points:
 *           type: number
 *           minimum: 1
 *           example: 15
 *         duration:
 *           type: number
 *           minimum: 1
 *           example: 60
 *         assignedTo:
 *           type: array
 *           items:
 *             type: string
 *           example: ["65a1b2c3d4e5f67890123456"]
 *         dueDate:
 *           type: string
 *           format: date
 *           example: "2024-12-31"
 *         difficulty:
 *           type: string
 *           enum: [easy, medium, hard]
 *           example: "medium"
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           example: ["homework", "physics"]
 * 
 *     ActivityUpdateRequest:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           maxLength: 200
 *         description:
 *           type: string
 *           maxLength: 1000
 *         category:
 *           type: string
 *           enum: [education, physical, creative, chores, social, mindfulness]
 *         points:
 *           type: number
 *           minimum: 1
 *         duration:
 *           type: number
 *           minimum: 1
 *         assignedTo:
 *           type: array
 *           items:
 *             type: string
 *         dueDate:
 *           type: string
 *           format: date
 *         difficulty:
 *           type: string
 *           enum: [easy, medium, hard]
 *         tags:
 *           type: array
 *           items:
 *             type: string
 */

/**
 * @swagger
 * /api/v1/activities:
 *   get:
 *     summary: Get user's activities
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved user activities
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 activities:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Activity'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/', auth, getUserActivities);

/**
 * @swagger
 * /api/v1/activities:
 *   post:
 *     summary: Create a new activity (Parent only)
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ActivityCreateRequest'
 *     responses:
 *       201:
 *         description: Activity created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 activity:
 *                   $ref: '#/components/schemas/Activity'
 *                 message:
 *                   type: string
 *                   example: "Activity created successfully"
 *       400:
 *         description: Missing required fields or validation error
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Only parents can create activities
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/', auth, isParent, createActivity);

/**
 * @swagger
 * /api/v1/activities/{id}:
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
 *             $ref: '#/components/schemas/ActivityUpdateRequest'
 *     responses:
 *       200:
 *         description: Activity updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 activity:
 *                   $ref: '#/components/schemas/Activity'
 *                 message:
 *                   type: string
 *                   example: "Activity updated successfully"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.put('/:id', auth, updateActivity);

/**
 * @swagger
 * /api/v1/activities/{id}/complete:
 *   patch:
 *     summary: Mark activity as completed (Child only)
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
 *         description: Activity marked as completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 activity:
 *                   $ref: '#/components/schemas/Activity'
 *                 pointsEarned:
 *                   type: number
 *                   example: 20
 *                 message:
 *                   type: string
 *                   example: "Activity marked as completed"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *   post:
 *     summary: Mark activity as completed (Child only) - Alternative to PATCH
 *     description: Same as PATCH method. Provided for client convenience.
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
 *         description: Activity marked as completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 activity:
 *                   $ref: '#/components/schemas/Activity'
 *                 pointsEarned:
 *                   type: number
 *                   example: 20
 *                 message:
 *                   type: string
 *                   example: "Activity marked as completed"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.patch('/:id/complete', auth, isChild, completeActivity);
router.post('/:id/complete', auth, isChild, completeActivity);

/**
 * @swagger
 * /api/v1/activities/{id}:
 *   delete:
 *     summary: Delete an activity (Creator only)
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
 *                   example: "Activity deleted successfully"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete('/:id', auth, deleteActivity);

/**
 * @swagger
 * /api/v1/activities/{id}/submit:
 *   post:
 *     summary: Submit answers/response for an activity (Child only)
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
 *               answers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     questionId:
 *                       type: string
 *                     answer:
 *                       type: string
 *               textResponse:
 *                 type: string
 *                 description: General text response
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Submission received
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post('/:id/submit', auth, isChild, submitActivityAnswer);

/**
 * @swagger
 * /api/v1/activities/{id}/my-submission:
 *   get:
 *     summary: Get child's own submission for an activity (Child only)
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
 *         description: Submission details
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:id/my-submission', auth, isChild, getMySubmission);

/**
 * @swagger
 * /api/v1/activities/submissions/all:
 *   get:
 *     summary: Get all children's submissions across all activities (Parent only)
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all submissions
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/submissions/all', auth, isParent, getAllChildrenSubmissions);

/**
 * @swagger
 * /api/v1/activities/{activityId}/submissions:
 *   get:
 *     summary: Get all submissions for an activity (Parent only)
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: activityId
 *         required: true
 *         schema:
 *           type: string
 *         description: The activity ID
 *     responses:
 *       200:
 *         description: List of submissions
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/:activityId/submissions', auth, isParent, getActivitySubmissions);

/**
 * @swagger
 * /api/v1/activities/{activityId}/submissions/{submissionId}/review:
 *   patch:
 *     summary: Review a child's submission (Parent only)
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: activityId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: submissionId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [approved, needs_revision]
 *               feedback:
 *                 type: string
 *               pointsAwarded:
 *                 type: number
 *     responses:
 *       200:
 *         description: Submission reviewed
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.patch('/:activityId/submissions/:submissionId/review', auth, isParent, reviewSubmission);

export default router;