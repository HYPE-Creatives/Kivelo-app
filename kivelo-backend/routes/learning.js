import express from 'express';
import {
  getLearningArticles,
  markArticleComplete,
  getArticleWithQuiz
} from '../controllers/learningController.js';
import auth from '../middleware/auth.js';
import { isParent } from '../middleware/roleCheck.js';

const router = express.Router();


/**
 * @swagger
 * components:
 *   schemas:
 *     LearningArticle:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "507f1f77bcf86cd799439011"
 *         title:
 *           type: string
 *           example: "Effective Communication with Children"
 *         content:
 *           type: string
 *           example: "Full article content in HTML or Markdown format..."
 *         excerpt:
 *           type: string
 *           example: "Learn how to improve communication with your children..."
 *         category:
 *           type: string
 *           enum: [parenting, child_development, education, health, behavior]
 *           example: "parenting"
 *         difficulty:
 *           type: string
 *           enum: [beginner, intermediate, advanced]
 *           example: "beginner"
 *         estimatedReadingTime:
 *           type: integer
 *           minimum: 1
 *           example: 10
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           example: ["communication", "listening", "empathy"]
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         thumbnailUrl:
 *           type: string
 *           format: uri
 *           nullable: true
 * 
 *     QuizQuestion:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         question:
 *           type: string
 *           example: "What is the most effective way to show active listening?"
 *         options:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               text:
 *                 type: string
 *           example:
 *             - id: "1"
 *               text: "Maintaining eye contact"
 *             - id: "2"
 *               text: "Repeating what they said"
 *         correctAnswerId:
 *           type: string
 *           example: "1"
 *         explanation:
 *           type: string
 *           example: "Maintaining eye contact shows you're engaged and paying attention."
 * 
 *     Pagination:
 *       type: object
 *       properties:
 *         total:
 *           type: integer
 *           example: 100
 *         page:
 *           type: integer
 *           example: 1
 *         limit:
 *           type: integer
 *           example: 20
 *         pages:
 *           type: integer
 *           example: 5
 * 
 *   responses:
 *     Unauthorized:
 *       description: Missing or invalid authentication token
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *           example:
 *             success: false
 *             message: "Authentication required"
 *             code: "UNAUTHORIZED"
 * 
 *     Forbidden:
 *       description: User doesn't have required permissions
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *           example:
 *             success: false
 *             message: "Parent access required"
 *             code: "FORBIDDEN"
 * 
 *     BadRequest:
 *       description: Invalid request parameters
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *           example:
 *             success: false
 *             message: "childId is required"
 *             code: "VALIDATION_ERROR"
 * 
 *     ServerError:
 *       description: Internal server error
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *           example:
 *             success: false
 *             message: "Internal server error"
 *             code: "INTERNAL_SERVER_ERROR"
 * 
 *     Error:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *         code:
 *           type: string
 *         details:
 *           type: array
 *           items:
 *             type: object
 * 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: "JWT token for authentication"
 */

/**
 * @swagger
 * tags:
 *   name: Learning Platform
 *   description: Learning articles and educational content management
 */

/**
 * @swagger
 * /api/v1/learning/articles:
 *   get:
 *     summary: Get all learning articles
 *     description: Retrieve a list of learning articles available for parents. Includes filtering by category and progress status.
 *     tags: [Learning Platform]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [parenting, child_development, education, health, behavior]
 *         description: Filter articles by category
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [completed, in_progress, not_started]
 *         description: Filter by completion status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 *         description: Number of articles per page
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *     responses:
 *       200:
 *         description: List of learning articles retrieved successfully
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
 *                     $ref: '#/components/schemas/LearningArticle'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/articles', auth, isParent, getLearningArticles);

/**
 * @swagger
 * /api/v1/learning/articles/{articleId}/complete:
 *   post:
 *     summary: Mark article as complete
 *     description: Mark a learning article as completed by the parent/user. Records completion time and updates progress.
 *     tags: [Learning Platform]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: articleId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: MongoDB ObjectId of the article
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - childId
 *             properties:
 *               childId:
 *                 type: string
 *                 pattern: '^[0-9a-fA-F]{24}$'
 *                 description: ID of the child for whom the article is being marked complete
 *                 example: "507f1f77bcf86cd799439012"
 *               notes:
 *                 type: string
 *                 maxLength: 500
 *                 description: Optional notes about the article completion
 *                 example: "Found the strategies very helpful for my 5-year-old"
 *     responses:
 *       200:
 *         description: Article marked as complete successfully
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
 *                     articleId:
 *                       type: string
 *                     completedAt:
 *                       type: string
 *                       format: date-time
 *                     progress:
 *                       type: number
 *                       minimum: 0
 *                       maximum: 100
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Article not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Article already completed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/articles/:articleId/complete', auth, isParent, markArticleComplete);

/**
 * @swagger
 * /api/v1/learning/articles/{articleId}:
 *   get:
 *     summary: Get article with quiz
 *     description: Retrieve a specific learning article along with its associated quiz questions and answers.
 *     tags: [Learning Platform]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: articleId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: MongoDB ObjectId of the article
 *         example: "507f1f77bcf86cd799439011"
 *       - in: query
 *         name: includeQuiz
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Whether to include quiz questions in the response
 *     responses:
 *       200:
 *         description: Article with quiz retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   allOf:
 *                     - $ref: '#/components/schemas/LearningArticle'
 *                     - type: object
 *                       properties:
 *                         quiz:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/QuizQuestion'
 *                         userProgress:
 *                           type: object
 *                           properties:
 *                             completed:
 *                               type: boolean
 *                               example: false
 *                             completedAt:
 *                               type: string
 *                               format: date-time
 *                             quizScore:
 *                               type: number
 *                               minimum: 0
 *                               maximum: 100
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Article not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/articles/:articleId', auth, isParent, getArticleWithQuiz);

export default router;