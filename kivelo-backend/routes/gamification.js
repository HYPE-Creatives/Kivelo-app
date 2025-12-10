import express from 'express';
import {
  getGamificationStats,
  awardPoints,
  getAvailableBadges,
  redeemReward,
  awardSelfPoints
} from '../controllers/gamificationController.js';
import auth from '../middleware/auth.js';
import { isChild, isParent } from '../middleware/roleCheck.js';

const router = express.Router();

/**
 * @swagger
 * /api/v1/gamification/stats:
 *   get:
 *     summary: Get gamification statistics
 *     description: Get user's points, streak, badges, and level information
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Gamification stats retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/GamificationStats'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         description: Internal server error
 */
router.get('/stats', auth, isChild, getGamificationStats);

/**
 * @swagger
 * /api/v1/gamification/badges:
 *   get:
 *     summary: Get available badges
 *     description: Get list of all available badges that can be earned
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Badges list retrieved successfully
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
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       iconUrl:
 *                         type: string
 *                       pointsRequired:
 *                         type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         description: Internal server error
 */
router.get('/badges', auth, getAvailableBadges);

/**
 * @swagger
 * /api/v1/gamification/award-points:
 *   post:
 *     summary: Award points to child
 *     description: Parent awards points to their child for completing activities
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [childId, points, reason]
 *             properties:
 *               childId:
 *                 type: string
 *                 description: ID of the child user
 *               points:
 *                 type: integer
 *                 description: Number of points to award
 *               reason:
 *                 type: string
 *                 description: Reason for awarding points
 *     responses:
 *       200:
 *         description: Points awarded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 newPointsTotal:
 *                   type: integer
 *       400:
 *         description: Bad request (e.g., invalid child ID, points value)
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         description: Internal server error
 */
router.post('/award-points', auth, isParent, awardPoints);

/**
 * @swagger
 * /api/v1/gamification/rewards/redeem:
 *   post:
 *     summary: Redeem reward with points
 *     description: Child redeems a reward using accumulated points
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rewardId]
 *             properties:
 *               rewardId:
 *                 type: string
 *                 description: ID of the reward to redeem
 *     responses:
 *       200:
 *         description: Reward redeemed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     rewardId:
 *                       type: string
 *                     pointsSpent:
 *                       type: integer
 *                     remainingPoints:
 *                       type: integer
 *       400:
 *         description: Insufficient points or invalid reward
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         description: Internal server error
 */
router.post('/rewards/redeem', auth, isChild, redeemReward);

/**
 * @swagger
 * /api/v1/gamification/self-points:
 *   post:
 *     summary: Award points to self
 *     description: Child awards points to themselves for completing games, activities, etc.
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [points, reason]
 *             properties:
 *               points:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 100
 *                 description: Number of points to award (max 100 per action)
 *               reason:
 *                 type: string
 *                 description: Reason for earning points (e.g., "Memory Match completed!")
 *               source:
 *                 type: string
 *                 description: Source of points (e.g., "game", "activity")
 *     responses:
 *       200:
 *         description: Points awarded successfully
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
 *                     points:
 *                       type: integer
 *                       description: New total points
 *                     pointsAwarded:
 *                       type: integer
 *                     message:
 *                       type: string
 *                     level:
 *                       type: integer
 *                     nextLevelPoints:
 *                       type: integer
 *       400:
 *         description: Invalid points value or missing reason
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         description: Internal server error
 */
router.post('/self-points', auth, isChild, awardSelfPoints);

export default router;