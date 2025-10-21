import express from "express";
import auth from "../middleware/auth.js";
import { recordMood, getMoodsByChild } from "../controllers/moodController.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Moods
 *     description: Manage and track children’s mood records
 */

/**
 * @swagger
 * /api/moods/record:
 *   post:
 *     summary: Record a child's mood
 *     tags: [Moods]
 *     security:
 *       - bearerAuth: []
 *     description: Record a mood entry for a specific child. Accessible by authenticated parents or the child user.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - childId
 *               - mood
 *             properties:
 *               childId:
 *                 type: string
 *                 example: "6721a2b4f0a7de034cd92b12"
 *               mood:
 *                 type: string
 *                 enum: [happy, sad, excited, tired, angry, calm]
 *                 example: "happy"
 *               notes:
 *                 type: string
 *                 example: "Had a great day at school!"
 *     responses:
 *       201:
 *         description: Mood recorded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Mood recorded successfully"
 *                 data:
 *                   _id: "6721bda9b7ef503b6c67a80e"
 *                   childId: "6721a2b4f0a7de034cd92b12"
 *                   mood: "happy"
 *                   notes: "Had a great day at school!"
 *                   createdAt: "2025-10-21T10:24:15.000Z"
 *       400:
 *         description: Invalid input or missing parameters
 *       401:
 *         description: Unauthorized
 */
router.post("/record", auth, recordMood);

/**
 * @swagger
 * /api/moods/{childId}:
 *   get:
 *     summary: Get all moods recorded for a specific child
 *     tags: [Moods]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: childId
 *         required: true
 *         schema:
 *           type: string
 *         description: Child ID to fetch moods for
 *     responses:
 *       200:
 *         description: Successfully retrieved child mood history
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     example: "6721bda9b7ef503b6c67a80e"
 *                   mood:
 *                     type: string
 *                     example: "happy"
 *                   notes:
 *                     type: string
 *                     example: "Played football with friends"
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2025-10-21T10:24:15.000Z"
 *       404:
 *         description: No mood data found for the child
 *       401:
 *         description: Unauthorized
 */
router.get("/:childId", auth, getMoodsByChild);

export default router;
