import { Router } from 'express';
const router = Router();
import auth from '../middleware/auth.js';
import { getChildProfile, updateChildProfile, getChildActivities, addChildActivity, updateChildActivity, deleteChildActivity, getChildProgress, updateChildPreferences, getChildDashboard } from '../controllers/childControllers.js';

/**
 * @route   GET /api/children/profile
 * @desc    Get child profile
 * @access  Private (Child or Parent)
 */
router.get('/', auth, getChildProfile);

/**
 * @route   PUT /api/children/profile
 * @desc    Update child profile
 * @access  Private (Child or Parent)
 */
router.put('/', auth, updateChildProfile);

/**
 * @route   GET /api/children/dashboard
 * @desc    Get child dashboard data
 * @access  Private (Child only)
 */
router.get('/dashboard', auth, getChildDashboard);

/**
 * @route   GET /api/children/activities
 * @desc    Get child activities
 * @access  Private (Child or Parent)
 */
router.get('/activities', auth, getChildActivities);

/**
 * @route   POST /api/children/activities
 * @desc    Add new activity for child
 * @access  Private (Parent only)
 */
router.post('/activities', auth, addChildActivity);

/**
 * @route   PUT /api/children/activities/:activityId
 * @desc    Update child activity
 * @access  Private (Parent only)
 */
router.put('/activities/:activityId', auth, updateChildActivity);

/**
 * @route   DELETE /api/children/activities/:activityId
 * @desc    Delete child activity
 * @access  Private (Parent only)
 */
router.delete('/activities/:activityId', auth, deleteChildActivity);

/**
 * @route   GET /api/children/progress
 * @desc    Get child progress reports
 * @access  Private (Parent only)
 */
router.get('/progress', auth, getChildProgress);

/**
 * @route   PUT /api/children/preferences
 * @desc    Update child preferences
 * @access  Private (Child only)
 */
router.put('/preferences', auth, updateChildPreferences);

export default router;