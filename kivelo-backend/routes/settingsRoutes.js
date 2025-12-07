// routes/settingsRoutes.js
import express from 'express';
import auth from '../middleware/auth.js';
import { isChild, isParent } from '../middleware/roleCheck.js';
import {
  getChildSettings,
  updateChildSettings,
  resetChildSettings,
  getSettingsHistory,
  exportChildSettings,
  getChildSettingsParentView
} from '../controllers/settingsController.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// ====================
// SWAGGER DOCUMENTATION
// ====================

/**
 * @swagger
 * tags:
 *   - name: Settings
 *     description: Child settings and preferences management
 *   - name: Children
 *     description: Child-specific operations
 *   - name: Parents
 *     description: Parent-specific operations
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ChildSettings:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "65a1b2c3d4e5f67890123456"
 *           description: Settings document ID
 *         child:
 *           type: string
 *           example: "65a1b2c3d4e5f67890123457"
 *           description: Child user ID reference
 *         preferences:
 *           type: object
 *           properties:
 *             theme:
 *               type: string
 *               enum: [light, dark, auto]
 *               default: auto
 *               example: light
 *             language:
 *               type: string
 *               enum: [en, es, fr, de]
 *               default: en
 *               example: en
 *             fontSize:
 *               type: string
 *               enum: [small, medium, large]
 *               default: medium
 *               example: medium
 *             soundEffects:
 *               type: boolean
 *               default: true
 *               example: true
 *             hapticFeedback:
 *               type: boolean
 *               default: true
 *               example: true
 *           description: User interface preferences
 *         notifications:
 *           type: object
 *           properties:
 *             enabled:
 *               type: boolean
 *               default: true
 *               example: true
 *             pushNotifications:
 *               type: boolean
 *               default: true
 *               example: true
 *             emailNotifications:
 *               type: boolean
 *               default: false
 *               example: false
 *             dailyReminders:
 *               type: boolean
 *               default: true
 *               example: true
 *             moodCheckinReminders:
 *               type: boolean
 *               default: true
 *               example: true
 *             journalPrompts:
 *               type: boolean
 *               default: true
 *               example: true
 *             parentUpdates:
 *               type: boolean
 *               default: true
 *               example: true
 *           description: Notification preferences
 *         privacy:
 *           type: object
 *           properties:
 *             profileVisibility:
 *               type: string
 *               enum: [private, friends-only, public]
 *               default: private
 *               example: private
 *             showActivityStatus:
 *               type: boolean
 *               default: true
 *               example: true
 *             shareWithParent:
 *               type: string
 *               enum: [all, limited, none]
 *               default: all
 *               example: all
 *             dataRetention:
 *               type: string
 *               enum: [30days, 90days, 1year, forever]
 *               default: 90days
 *               example: 90days
 *           description: Privacy settings
 *         contentFilters:
 *           type: object
 *           properties:
 *             safeSearch:
 *               type: boolean
 *               default: true
 *               example: true
 *             blockExplicitContent:
 *               type: boolean
 *               default: true
 *               example: true
 *             allowedCategories:
 *               type: array
 *               items:
 *                 type: string
 *                 enum: [education, games, social, creative, wellness]
 *               example: ["education", "wellness", "creative"]
 *             timeBasedRestrictions:
 *               type: boolean
 *               default: false
 *               example: false
 *           description: Content filtering preferences
 *         timeLimits:
 *           type: object
 *           properties:
 *             dailyLimit:
 *               type: integer
 *               minimum: 0
 *               maximum: 480
 *               default: 120
 *               example: 120
 *               description: Daily usage limit in minutes (0 = no limit)
 *             bedtimeStart:
 *               type: string
 *               pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
 *               default: "21:00"
 *               example: "21:00"
 *             bedtimeEnd:
 *               type: string
 *               pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
 *               default: "07:00"
 *               example: "07:00"
 *             breakReminders:
 *               type: boolean
 *               default: true
 *               example: true
 *             breakInterval:
 *               type: integer
 *               minimum: 15
 *               maximum: 120
 *               default: 45
 *               example: 45
 *               description: Break reminder interval in minutes
 *           description: Screen time and usage limits
 *         accessibility:
 *           type: object
 *           properties:
 *             screenReader:
 *               type: boolean
 *               default: false
 *               example: false
 *             highContrast:
 *               type: boolean
 *               default: false
 *               example: false
 *             reducedMotion:
 *               type: boolean
 *               default: false
 *               example: false
 *             dyslexiaFont:
 *               type: boolean
 *               default: false
 *               example: false
 *             colorBlindMode:
 *               type: string
 *               enum: [none, protanopia, deuteranopia, tritanopia]
 *               default: none
 *               example: none
 *           description: Accessibility features
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T10:30:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-20T14:45:00Z"
 * 
 *     SettingsUpdateRequest:
 *       type: object
 *       properties:
 *         preferences:
 *           type: object
 *           properties:
 *             theme:
 *               type: string
 *               enum: [light, dark, auto]
 *             language:
 *               type: string
 *               enum: [en, es, fr, de]
 *             fontSize:
 *               type: string
 *               enum: [small, medium, large]
 *             soundEffects:
 *               type: boolean
 *             hapticFeedback:
 *               type: boolean
 *         notifications:
 *           type: object
 *           properties:
 *             enabled:
 *               type: boolean
 *             pushNotifications:
 *               type: boolean
 *             emailNotifications:
 *               type: boolean
 *             dailyReminders:
 *               type: boolean
 *             moodCheckinReminders:
 *               type: boolean
 *             journalPrompts:
 *               type: boolean
 *             parentUpdates:
 *               type: boolean
 *         privacy:
 *           type: object
 *           properties:
 *             profileVisibility:
 *               type: string
 *               enum: [private, friends-only, public]
 *             showActivityStatus:
 *               type: boolean
 *             shareWithParent:
 *               type: string
 *               enum: [all, limited, none]
 *             dataRetention:
 *               type: string
 *               enum: [30days, 90days, 1year, forever]
 *         contentFilters:
 *           type: object
 *           properties:
 *             safeSearch:
 *               type: boolean
 *             blockExplicitContent:
 *               type: boolean
 *             allowedCategories:
 *               type: array
 *               items:
 *                 type: string
 *                 enum: [education, games, social, creative, wellness]
 *             timeBasedRestrictions:
 *               type: boolean
 *         timeLimits:
 *           type: object
 *           properties:
 *             dailyLimit:
 *               type: integer
 *               minimum: 0
 *               maximum: 480
 *             bedtimeStart:
 *               type: string
 *               pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
 *             bedtimeEnd:
 *               type: string
 *               pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
 *             breakReminders:
 *               type: boolean
 *             breakInterval:
 *               type: integer
 *               minimum: 15
 *               maximum: 120
 *         accessibility:
 *           type: object
 *           properties:
 *             screenReader:
 *               type: boolean
 *             highContrast:
 *               type: boolean
 *             reducedMotion:
 *               type: boolean
 *             dyslexiaFont:
 *               type: boolean
 *             colorBlindMode:
 *               type: string
 *               enum: [none, protanopia, deuteranopia, tritanopia]
 * 
 *     SettingsHistoryEntry:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "65a1b2c3d4e5f67890123458"
 *         child:
 *           type: string
 *           example: "65a1b2c3d4e5f67890123457"
 *         settingsSnapshot:
 *           $ref: '#/components/schemas/ChildSettings'
 *         changedBy:
 *           type: object
 *           properties:
 *             userId:
 *               type: string
 *               example: "65a1b2c3d4e5f67890123459"
 *             role:
 *               type: string
 *               enum: [child, parent, admin]
 *               example: child
 *             name:
 *               type: string
 *               example: "John Doe"
 *         changeType:
 *           type: string
 *           enum: [created, updated, reset, parent_override]
 *           example: updated
 *         changes:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               field:
 *                 type: string
 *                 example: "preferences.theme"
 *               oldValue:
 *                 type: string
 *                 example: "auto"
 *               newValue:
 *                 type: string
 *                 example: "light"
 *         reason:
 *           type: string
 *           example: "User preferred light mode"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-20T14:45:00Z"
 * 
 *     ExportSettingsResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           properties:
 *             format:
 *               type: string
 *               enum: [json, csv]
 *               example: json
 *             content:
 *               type: string
 *               example: "Base64 encoded or direct content"
 *             filename:
 *               type: string
 *               example: "settings_export_2024-01-20.json"
 *             downloadUrl:
 *               type: string
 *               format: uri
 *               example: "/api/settings/export/download/token123"
 * 
 *   responses:
 *     SettingsNotFound:
 *       description: Settings not found for the specified child
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
 *                 example: "Settings not found for this child"
 * 
 *     SettingsValidationError:
 *       description: Settings validation failed
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
 */

// ====================
// CHILD ROUTES (Full Access)
// ====================

/**
 * @swagger
 * /api/v1/settings:
 *   get:
 *     summary: Get child's current settings
 *     description: Retrieve the authenticated child's settings and preferences
 *     tags: [Settings, Children]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ChildSettings'
 *                 lastUpdated:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-20T14:45:00Z"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/SettingsNotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/', isChild, getChildSettings);

/**
 * @swagger
 * /api/v1/settings:
 *   put:
 *     summary: Update child's settings
 *     description: Update the authenticated child's settings and preferences
 *     tags: [Settings, Children]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SettingsUpdateRequest'
 *           example:
 *             preferences:
 *               theme: "light"
 *               language: "en"
 *               fontSize: "medium"
 *             notifications:
 *               pushNotifications: true
 *               dailyReminders: true
 *               moodCheckinReminders: true
 *             privacy:
 *               profileVisibility: "private"
 *               shareWithParent: "all"
 *             timeLimits:
 *               dailyLimit: 120
 *               bedtimeStart: "21:00"
 *               bedtimeEnd: "07:00"
 *     responses:
 *       200:
 *         description: Settings updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ChildSettings'
 *                 message:
 *                   type: string
 *                   example: "Settings updated successfully"
 *                 changes:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       field:
 *                         type: string
 *                       oldValue:
 *                         type: string
 *                       newValue:
 *                         type: string
 *       400:
 *         $ref: '#/components/responses/SettingsValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/SettingsNotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.put('/', isChild, updateChildSettings);

/**
 * @swagger
 * /api/v1/settings/reset:
 *   delete:
 *     summary: Reset settings to defaults
 *     description: Reset child's settings to default values
 *     tags: [Settings, Children]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Settings reset to defaults
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ChildSettings'
 *                 message:
 *                   type: string
 *                   example: "Settings reset to default values"
 *                 previousSettings:
 *                   type: object
 *                   description: "Snapshot of previous settings before reset"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/SettingsNotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete('/reset', isChild, resetChildSettings);

/**
 * @swagger
 * /api/v1/settings/history:
 *   get:
 *     summary: Get settings change history
 *     description: Retrieve history of settings changes with audit trail
 *     tags: [Settings, Children]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 50
 *         description: Number of history entries to return
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter history from this date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter history to this date (YYYY-MM-DD)
 *       - in: query
 *         name: changeType
 *         schema:
 *           type: string
 *           enum: [created, updated, reset, parent_override, all]
 *           default: all
 *         description: Filter by type of change
 *     responses:
 *       200:
 *         description: Settings history retrieved
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
 *                     $ref: '#/components/schemas/SettingsHistoryEntry'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     total:
 *                       type: integer
 *                       example: 25
 *                     pages:
 *                       type: integer
 *                       example: 3
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/history', isChild, getSettingsHistory);

/**
 * @swagger
 * /api/v1/settings/export:
 *   get:
 *     summary: Export settings (JSON/CSV)
 *     description: Export child's settings in JSON or CSV format
 *     tags: [Settings, Children]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, csv]
 *           default: json
 *         description: Export format
 *       - in: query
 *         name: includeHistory
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include settings change history in export
 *       - in: query
 *         name: timestamp
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Include timestamps in export
 *     responses:
 *       200:
 *         description: Settings exported successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ExportSettingsResponse'
 *           text/csv:
 *             schema:
 *               type: string
 *             example: "Setting,Value,Last Updated\nTheme,light,2024-01-20\nLanguage,en,2024-01-20"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/export', isChild, exportChildSettings);

// ====================
// PARENT ROUTES (Read-Only)
// ====================

/**
 * @swagger
 * /api/v1/settings/parent/child/{childId}:
 *   get:
 *     summary: Parent view of child's settings (read-only)
 *     description: Parent can view (but not modify) their child's settings
 *     tags: [Settings, Parents]
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
 *         name: includeHistory
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include recent changes history
 *     responses:
 *       200:
 *         description: Child's settings retrieved
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
 *                     settings:
 *                       $ref: '#/components/schemas/ChildSettings'
 *                     childInfo:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         age:
 *                           type: integer
 *                     parentOverride:
 *                       type: boolean
 *                       description: Whether parent has overridden any settings
 *                       example: false
 *                     lastChildUpdate:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-20T14:45:00Z"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/parent/child/:childId', isParent, getChildSettingsParentView);

export default router;