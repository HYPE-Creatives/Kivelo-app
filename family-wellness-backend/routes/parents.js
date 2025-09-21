import { Router } from 'express';
const router = Router();
import auth from '../middleware/auth.js';
import { getParentProfile, updateParentProfile, getChildrenList, addChild, updateChild, removeChild, getFamilyDashboard, getActivityReports, getBillingInfo, updateBillingInfo, getSubscription, updateSubscription, getNotifications, markNotificationAsRead, getFamilySettings, updateFamilySettings } from '../controllers/parentControllers.js';

/**
 * @route   GET /api/parents/profile
 * @desc    Get parent profile
 * @access  Private (Parent only)
 */
router.get('/', getParentProfile);

/**
 * @route   PUT /api/parents/profile
 * @desc    Update parent profile
 * @access  Private (Parent only)
 */
router.put('/', auth, updateParentProfile);

/**
 * @route   GET /api/parents/children
 * @desc    Get list of children
 * @access  Private (Parent only)
 */
router.get('/children-list', auth, getChildrenList);

/**
 * @route   POST /api/parents/children
 * @desc    Add a new child
 * @access  Private (Parent only)
 */
router.post('/children-list', auth, addChild);

/**
 * @route   PUT /api/parents/children/:childId
 * @desc    Update child information
 * @access  Private (Parent only)
 */
router.put('/children-list/:childId', auth, updateChild);

/**
 * @route   DELETE /api/parents/children/:childId
 * @desc    Remove child from family
 * @access  Private (Parent only)
 */
router.delete('/children-list/:childId', auth, removeChild);

/**
 * @route   GET /api/parents/dashboard
 * @desc    Get family dashboard
 * @access  Private (Parent only)
 */
router.get('/dashboard', auth, getFamilyDashboard);

/**
 * @route   POST /api/parents/generate-code
 * @desc    Generate one-time code for child registration
 * @access  Private (Parent only)
 */
// router.post('/generate-code', auth, generateOneTimeCode);

/**
 * @route   GET /api/parents/reports
 * @desc    Get activity reports for children
 * @access  Private (Parent only)
 */
router.get('/reports', auth, getActivityReports);

/**
 * @route   GET /api/parents/billing
 * @desc    Get billing information
 * @access  Private (Parent only)
 */
router.get('/billing', auth, getBillingInfo);

/**
 * @route   PUT /api/parents/billing
 * @desc    Update billing information
 * @access  Private (Parent only)
 */
router.put('/billing', auth, updateBillingInfo);

/**
 * @route   GET /api/parents/subscription
 * @desc    Get subscription details
 * @access  Private (Parent only)
 */
router.get('/subscription', auth, getSubscription);

/**
 * @route   PUT /api/parents/subscription
 * @desc    Update subscription plan
 * @access  Private (Parent only)
 */
router.put('/subscription', auth, updateSubscription);

/**
 * @route   GET /api/parents/notifications
 * @desc    Get parent notifications
 * @access  Private (Parent only)
 */
router.get('/notifications', auth, getNotifications);

/**
 * @route   PUT /api/parents/notifications/:notificationId/read
 * @desc    Mark notification as read
 * @access  Private (Parent only)
 */
router.put('/notifications/:notificationId/read', auth, markNotificationAsRead);

/**
 * @route   GET /api/parents/settings
 * @desc    Get family settings
 * @access  Private (Parent only)
 */
router.get('/settings', auth, getFamilySettings);

/**
 * @route   PUT /api/parents/settings
 * @desc    Update family settings
 * @access  Private (Parent only)
 */
router.put('/settings', auth, updateFamilySettings);

export default router;