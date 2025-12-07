// routes/journalRoutes.js
import express from 'express';
import auth from '../middleware/auth.js';
import { isChild, isParent } from '../middleware/roleCheck.js';
import {
  createJournal,
  getChildJournals,
  getMyJournals,
  getJournal,
  updateJournal,
  deleteJournal,
  getJournalStats,
  searchJournals,
  getJournalPrompts,
  exportJournals
} from '../controllers/journalController.js';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     JournalCreate:
 *       type: object
 *       required: ["childId", "type", "content", "title"]
 *       properties:
 *         childId:
 *           type: string
 *           example: "65a1b2c3d4e5f67890123456"
 *         type:
 *           type: string
 *           enum: [text, audio, video, drawing, mixed]
 *         content:
 *           type: string
 *           example: "Today was amazing!"
 *         title:
 *           type: string
 *           example: "My School Day"
 *         mood:
 *           type: string
 *           example: "happy"
 *         moodIntensity:
 *           type: integer
 *           minimum: 1
 *           maximum: 10
 *           example: 8
 *         visibility:
 *           type: string
 *           enum: [private, parent-only, public]
 *           default: parent-only
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           example: ["school", "friends"]
 * 
 *     Journal:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "65a1b2c3d4e5f67890123456"
 *         childId:
 *           type: string
 *         type:
 *           type: string
 *         content:
 *           type: string
 *         title:
 *           type: string
 *         mood:
 *           type: string
 *         moodIntensity:
 *           type: integer
 *         visibility:
 *           type: string
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 * 
 *   responses:
 *     BadRequestError:
 *       description: Bad Request
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ErrorResponse'
 * 
 *     ServerError:
 *       description: Internal Server Error
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/v1/journals:
 *   post:
 *     summary: Create a new journal entry
 *     description: Child creates a new journal entry. Awards points and updates streak.
 *     tags: [Journals, Children]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/JournalCreate'
 *           example:
 *             childId: "65a1b2c3d4e5f67890123456"
 *             type: "text"
 *             content: "Today was amazing! I learned so much at school..."
 *             title: "My School Day"
 *             mood: "happy"
 *             moodIntensity: 8
 *             visibility: "parent-only"
 *             tags: ["school", "learning", "friends"]
 *     responses:
 *       201:
 *         description: Journal created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Journal'
 *                 pointsEarned:
 *                   type: integer
 *                   example: 15
 *                 message:
 *                   type: string
 *                   example: "Journal entry created successfully"
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/', auth, isChild, createJournal);

/**
 * @swagger
 * /api/v1/journals/my-journals:
 *   get:
 *     summary: Get child's own journals
 *     description: Retrieve paginated list of child's journals with filtering options
 *     tags: [Journals, Children]
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
 *           default: 10
 *           maximum: 50
 *         description: Items per page
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [text, audio, video, drawing, mixed, all]
 *           default: all
 *         description: Filter by journal type
 *       - in: query
 *         name: visibility
 *         schema:
 *           type: string
 *           enum: [private, parent-only, public, all]
 *           default: all
 *         description: Filter by visibility
 *     responses:
 *       200:
 *         description: List of journals retrieved successfully
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
 *                     $ref: '#/components/schemas/Journal'
 *                 stats:
 *                   type: object
 *                   properties:
 *                     byType:
 *                       type: array
 *                     byVisibility:
 *                       type: array
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/my-journals', auth, isChild, getMyJournals);

/**
 * @swagger
 * /api/v1/journals/prompts:
 *   get:
 *     summary: Get journal prompts for child
 *     description: Returns random journal prompts to help child get started
 *     tags: [Journals, Children]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Journal prompts retrieved
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
 *                     prompts:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["What made you smile today?", "Describe a challenge you faced"]
 *                     totalAvailable:
 *                       type: integer
 *                       example: 15
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/prompts', auth, isChild, getJournalPrompts);

/**
 * @swagger
 * /api/v1/journals/search:
 *   get:
 *     summary: Search child's journals
 *     description: Search through journal titles, content, and tags
 *     tags: [Journals, Children]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [text, audio, video, drawing, mixed, all]
 *           default: all
 *         description: Filter by type
 *       - in: query
 *         name: visibility
 *         schema:
 *           type: string
 *           enum: [private, parent-only, public, all]
 *           default: all
 *         description: Filter by visibility
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: Maximum results to return
 *     responses:
 *       200:
 *         description: Search results
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
 *                     $ref: '#/components/schemas/Journal'
 *                 count:
 *                   type: integer
 *                   example: 5
 *                 query:
 *                   type: string
 *                   example: "school"
 *       400:
 *         description: Missing search query
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/search', auth, isChild, searchJournals);

/**
 * @swagger
 * /api/v1/journals/child/{childId}:
 *   get:
 *     summary: Get child's journals (Parent view)
 *     description: Parent retrieves their child's journals with filtering options
 *     tags: [Journals, Parents]
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
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [text, audio, video, drawing, mixed, all]
 *           default: all
 *         description: Filter by journal type
 *       - in: query
 *         name: visibility
 *         schema:
 *           type: string
 *           enum: [private, parent-only, public, all]
 *           default: all
 *         description: Filter by visibility (parents can't view private journals by default)
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter from date (YYYY-MM-DD)
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter to date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Child's journals retrieved
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
 *                     journals:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Journal'
 *                     childInfo:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         userId:
 *                           type: string
 *                         name:
 *                           type: string
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/child/:childId', auth, isParent, getChildJournals);

/**
 * @swagger
 * /api/v1/journals/stats/{childId}:
 *   get:
 *     summary: Get journal statistics for child
 *     description: Parent view of child's journal statistics and analytics
 *     tags: [Journals, Parents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: childId
 *         required: true
 *         schema:
 *           type: string
 *         description: Child document ID
 *     responses:
 *       200:
 *         description: Journal statistics retrieved
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
 *                     childInfo:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         userId:
 *                           type: string
 *                         name:
 *                           type: string
 *                     frequencyStats:
 *                       type: array
 *                     typeDistribution:
 *                       type: array
 *                     visibilityDistribution:
 *                       type: array
 *                     recentJournals:
 *                       type: array
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalJournals:
 *                           type: integer
 *                         activeDays:
 *                           type: integer
 *                         mostCommonType:
 *                           type: string
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/stats/:childId', auth, isParent, getJournalStats);

/**
 * @swagger
 * /api/v1/journals/export:
 *   get:
 *     summary: Export child's journals
 *     description: Export child's journals in CSV or JSON format (Parent only)
 *     tags: [Journals, Parents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: childId
 *         required: true
 *         schema:
 *           type: string
 *         description: Child document ID
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, csv]
 *           default: json
 *         description: Export format
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Export successful
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
 *           text/csv:
 *             schema:
 *               type: string
 *             example: "Date,Title,Content,Mood\n2024-01-15,My Day,Today was...,happy"
 *       400:
 *         description: Missing childId or invalid parameters
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/export', auth, isParent, exportJournals);

/**
 * @swagger
 * /api/v1/journals/{journalId}:
 *   get:
 *     summary: Get single journal entry
 *     description: Get specific journal entry with permission checks
 *     tags: [Journals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: journalId
 *         required: true
 *         schema:
 *           type: string
 *         description: Journal entry ID
 *     responses:
 *       200:
 *         description: Journal entry retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Journal'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:journalId', auth, getJournal);

/**
 * @swagger
 * /api/v1/journals/{journalId}:
 *   put:
 *     summary: Update journal entry
 *     description: Child updates their own journal entry
 *     tags: [Journals, Children]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: journalId
 *         required: true
 *         schema:
 *           type: string
 *         description: Journal entry ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/JournalCreate'
 *     responses:
 *       200:
 *         description: Journal updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Journal'
 *                 message:
 *                   type: string
 *                   example: "Journal entry updated successfully"
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put('/:journalId', auth, isChild, updateJournal);

/**
 * @swagger
 * /api/v1/journals/{journalId}:
 *   delete:
 *     summary: Delete journal entry
 *     description: Child deletes their own journal entry
 *     tags: [Journals, Children]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: journalId
 *         required: true
 *         schema:
 *           type: string
 *         description: Journal entry ID
 *     responses:
 *       200:
 *         description: Journal deleted successfully
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
 *                   example: "Journal entry deleted successfully"
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete('/:journalId', auth, isChild, deleteJournal);

export default router;