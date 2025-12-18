import express from 'express';
import {
  submitMoodCheckin,
  getMoodHistory,
  getMoodInsights,
  getMoodStats,
  deleteMoodEntry,
  updateMoodEntry,
  getTodayMood,
  getMoodTrends,
  getTrustZoneSummary
} from '../controllers/moodController.js';
import auth from '../middleware/auth.js';
import { isChild, isParent, isSelfOrParent } from '../middleware/roleCheck.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// ==============================================
// CHILD MOOD CHECK-IN ROUTES
// ==============================================

/**
 * @swagger
 * /api/v1/mood/checkin:
 *   post:
 *     summary: Submit a mood check-in
 *     description: |
 *       Child submits daily mood check-in (emoji, voice, drawing, or short text).
 *       
 *       **Side Effects:**
 *       - Awards 10 points to the child
 *       - Updates streak count
 *       - Syncs points and streak to Child model
 *       - **Always notifies parent** with mood update notification
 *       - Notification includes emoji, mood score, trust zone, and text note preview
 *       - Higher priority notifications for red/orange trust zones
 *     tags: [Mood Tracking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MoodCheckinRequest'
 *     responses:
 *       201:
 *         description: Mood check-in recorded successfully. Parent notified.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/MoodCheckinResponse'
 *                 message:
 *                   type: string
 *                   example: "Mood recorded successfully!"
 *       400:
 *         description: At least one of emoji/textNote/voiceNote/drawing is required
 *       403:
 *         description: Only children can submit mood check-ins
 */
router.post('/checkin', auth, isChild, submitMoodCheckin);

/**
 * @swagger
 * /api/v1/mood/checkin/with-media:
 *   post:
 *     summary: Submit mood check-in with file uploads
 *     description: |
 *       Submit mood with voice recording or drawing attachment.
 *       
 *       **Side Effects:**
 *       - Awards 10 points to the child
 *       - Updates streak count
 *       - Syncs points and streak to Child model
 *       - **Always notifies parent** with mood update notification
 *     tags: [Mood Tracking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               voiceFile:
 *                 type: string
 *                 format: binary
 *                 description: Voice recording file
 *               drawingFile:
 *                 type: string
 *                 format: binary
 *                 description: Drawing image file
 *               moodScore:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10
 *                 description: Mood score (1-10)
 *               emoji:
 *                 type: string
 *                 description: Mood emoji
 *               textNote:
 *                 type: string
 *                 description: Optional text note
 *     responses:
 *       201:
 *         description: Mood check-in with media recorded. Parent notified.
 */
router.post('/checkin/with-media', 
  auth, 
  isChild, 
  upload.fields([
    { name: 'voiceFile', maxCount: 1 },
    { name: 'drawingFile', maxCount: 1 }
  ]),
  submitMoodCheckin
);

/**
 * @swagger
 * /api/v1/mood/history:
 *   get:
 *     summary: Get mood history with filters
 *     tags: [Mood Tracking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: period
 *         in: query
 *         schema:
 *           type: string
 *           enum: [day, week, month, year]
 *           default: week
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Mood history retrieved
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
 *                     $ref: '#/components/schemas/MoodCheckinResponse'
 *                 stats:
 *                   $ref: '#/components/schemas/MoodStats'
 */
router.get('/history', auth, isChild, getMoodHistory);

/**
 * @swagger
 * /api/v1/mood/today:
 *   get:
 *     summary: Get today's mood check-in
 *     tags: [Mood Tracking]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Today's mood status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/MoodCheckinResponse'
 *                 hasCheckedInToday:
 *                   type: boolean
 */
router.get('/today', auth, isChild, getTodayMood);

/**
 * @swagger
 * /api/v1/mood/stats:
 *   get:
 *     summary: Get mood statistics
 *     tags: [Mood Tracking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: childId
 *         in: query
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Mood statistics retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/MoodStats'
 */
router.get('/stats', auth, isSelfOrParent, getMoodStats);

/**
 * @swagger
 * /api/v1/mood/insights:
 *   get:
 *     summary: Get AI-generated mood insights
 *     tags: [Mood Tracking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: days
 *         in: query
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: Mood insights retrieved
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
 *                     stats:
 *                       $ref: '#/components/schemas/MoodStats'
 *                     insights:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/MoodInsight'
 */
router.get('/insights', auth, isChild, getMoodInsights);

/**
 * @swagger
 * /api/v1/mood/trends:
 *   get:
 *     summary: Get mood trends for charts
 *     tags: [Mood Tracking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: childId
 *         in: query
 *         schema:
 *           type: string
 *       - name: range
 *         in: query
 *         schema:
 *           type: integer
 *           default: 7
 *     responses:
 *       200:
 *         description: Mood trends data
 */
router.get('/trends', auth, isSelfOrParent, getMoodTrends);

// ==============================================
// MOOD ENTRY MANAGEMENT ROUTES
// ==============================================

/**
 * @swagger
 * /api/v1/mood/{moodId}:
 *   put:
 *     summary: Update a mood entry
 *     tags: [Mood Tracking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: moodId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               textNote:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Mood entry updated
 *   delete:
 *     summary: Delete a mood entry
 *     tags: [Mood Tracking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: moodId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Mood entry deleted
 */
router.put('/:moodId', auth, isChild, updateMoodEntry);

/**
 * @swagger
 * /api/v1/mood/{moodId}:
 *  delete: 
 *    summary: Delete a mood entry
 *    tags: [Mood Tracking]
 *    security:
 *      - bearerAuth: []
 *    parameters:
 *      - name: moodId
 *        in: path
 *        required: true
 *        schema:
 *          type: string
 *    responses:
 *      200:
 *        description: Mood entry deleted
 */
router.delete('/:moodId', auth, isChild, deleteMoodEntry);

// ==============================================
// PARENT-SPECIFIC ROUTES (Trust Zones)
// ==============================================

/**
 * @swagger
 * /api/v1/mood/trust-zones/{childId}:
 *   get:
 *     summary: Get trust zone summary for a child
 *     tags: [Parent Dashboard, Mood Tracking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: childId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Trust zone summary retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/TrustZoneSummary'
 */
router.get('/trust-zones/:childId', auth, isParent, getTrustZoneSummary);

/**
 * @swagger
 * /api/v1/mood/child/{childId}/history:
 *   get:
 *     summary: Get child's mood history (parent view)
 *     tags: [Parent Dashboard, Mood Tracking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: childId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: period
 *         in: query
 *         schema:
 *           type: string
 *           default: week
 *     responses:
 *       200:
 *         description: Child's mood history retrieved
 */
router.get('/child/:childId/history', auth, isSelfOrParent, getMoodHistory);

// ==============================================
// GAMIFICATION & AI HELPER ROUTES
// ==============================================

/**
 * @swagger
 * /api/v1/mood/streak:
 *   get:
 *     summary: Get current streak info
 *     tags: [Gamification, Mood Tracking]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Streak information
 */
router.get('/streak', auth, isChild, (req, res) => {
  res.json({ 
    success: true,
    data: {
      streakCount: req.user.streakCount || 0,
      points: req.user.points || 0
    }
  });
});

/**
 * @swagger
 * /api/v1/mood/achievements:
 *   get:
 *     summary: Get mood-related achievements
 *     tags: [Gamification, Mood Tracking]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Achievements retrieved
 */
router.get('/achievements', auth, isChild, (req, res) => {
  res.json({ 
    success: true,
    data: {
      badges: req.user.badges || [],
      totalBadges: req.user.badges?.length || 0
    }
  });
});

/**
 * @swagger
 * /api/v1/mood/suggestions:
 *   get:
 *     summary: Get AI suggestions based on current mood
 *     tags: [AI Helper, Mood Tracking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: moodScore
 *         in: query
 *         schema:
 *           type: integer
 *       - name: moodLabel
 *         in: query
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: AI suggestions retrieved
 */
router.get('/suggestions', auth, isChild, (req, res) => {
  const { moodScore, moodLabel } = req.query;
  res.json({ 
    success: true,
    data: {
      suggestions: [
        { type: 'activity', activity: 'Coloring', emoji: '🎨', duration: 10 }
      ],
      message: `Based on your mood (${moodScore}/10)`
    }
  });
});

// ==============================================
// BACKWARD COMPATIBILITY ROUTES
// ==============================================

/**
 * @swagger
 * /api/v1/mood:
 *   post:
 *     summary: Legacy endpoint for mood submission
 *     tags: [Mood Tracking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MoodCheckinRequest'
 *     responses:
 *       201:
 *         description: Mood recorded
 *   get:
 *     summary: Legacy endpoint for getting moods
 *     tags: [Mood Tracking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: period
 *         in: query
 *         schema:
 *           type: string
 *           default: week
 *     responses:
 *       200:
 *         description: Mood history retrieved
 */
router.post('/', auth, isChild, submitMoodCheckin);


/**
 * @swagger
 * /api/v1/mood:
 *   get:
 *     summary: Legacy endpoint for getting moods
 *     tags: [Mood Tracking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: period
 *         in: query
 *         schema:
 *           type: string
 *           default: week
 *     responses:
 *       200:
 *         description: Mood history retrieved
 */
router.get('/', auth, isChild, getMoodHistory);

export default router;