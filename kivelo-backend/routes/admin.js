import express from 'express';
import {
  // Auth
  setupSuperAdmin,
  adminLogin,

  // Admin Management
  createAdmin,
  getAdmins,
  updateAdmin,
  deleteAdmin,

  // User Management
  getUsers,
  getUserDetails,
  updateUserStatus,

  // Analytics
  getAdminDashboard,
  getSystemAnalytics,

  // System Management
  getSystemSettings,
  updateSystemSettings,
  updateAdminProfile,
  changeAdminPassword
} from '../controllers/adminControllers.js';

import {
  requireAdminAuth,
  requirePermission,
  requireSuperAdmin
} from '../middleware/adminMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Admin Auth
 *     description: Authentication and setup for admins
 *   - name: Admin Management
 *     description: Super Admin routes for managing other admins
 *   - name: User Management
 *     description: Routes for managing users
 *   - name: Analytics
 *     description: Routes for viewing analytics data
 *   - name: System Management
 *     description: System configuration and admin profile management
 */

/**
 * @swagger
 * /api/admin/setup-super-admin:
 *   post:
 *     summary: Initialize system by creating the first Super Admin
 *     tags: [Admin Auth]
 *     description: Run once to create the first Super Admin. Intended to be executed via Postman or setup script.
 *     responses:
 *       201:
 *         description: Super admin successfully created
 *       400:
 *         description: Super admin already exists
 */
router.post('/setup-super-admin', setupSuperAdmin);

/**
 * @swagger
 * /api/admin/login:
 *   post:
 *     summary: Login an admin
 *     tags: [Admin Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: "admin@kivelo.com"
 *               password:
 *                 type: string
 *                 example: "Admin@123"
 *     responses:
 *       200:
 *         description: Admin login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', adminLogin);

// ==================== PROTECTED ROUTES ====================

/**
 * @swagger
 * /api/admin/admins:
 *   post:
 *     summary: Create a new admin
 *     tags: [Admin Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - role
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 example: "john@kivelo.com"
 *               role:
 *                 type: string
 *                 example: "admin"
 *               password:
 *                 type: string
 *                 example: "StrongPass123!"
 *     responses:
 *       201:
 *         description: Admin created successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/admins', requireAdminAuth, requireSuperAdmin, createAdmin);

/**
 * @swagger
 * /api/admin/admins:
 *   get:
 *     summary: Get all admins
 *     tags: [Admin Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved all admins
 *       401:
 *         description: Unauthorized
 */
router.get('/admins', requireAdminAuth, requireSuperAdmin, getAdmins);

/**
 * @swagger
 * /api/admin/admins/{id}:
 *   put:
 *     summary: Update admin details
 *     tags: [Admin Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Admin ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       200:
 *         description: Admin updated successfully
 *       404:
 *         description: Admin not found
 */
router.put('/admins/:id', requireAdminAuth, requireSuperAdmin, updateAdmin);

/**
 * @swagger
 * /api/admin/admins/{id}:
 *   delete:
 *     summary: Delete an admin
 *     tags: [Admin Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Admin ID
 *     responses:
 *       200:
 *         description: Admin deleted successfully
 *       404:
 *         description: Admin not found
 */
router.delete('/admins/:id', requireAdminAuth, requireSuperAdmin, deleteAdmin);

// ==================== USER MANAGEMENT ====================

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/users', requireAdminAuth, requirePermission('users'), getUsers);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   get:
 *     summary: Get user details
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: User details fetched successfully
 *       404:
 *         description: User not found
 */
router.get('/users/:id', requireAdminAuth, requirePermission('users'), getUserDetails);

/**
 * @swagger
 * /api/admin/users/{id}/status:
 *   put:
 *     summary: Update user account status
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 example: "active"
 *     responses:
 *       200:
 *         description: User status updated successfully
 */
router.put('/users/:id/status', requireAdminAuth, requirePermission('users'), updateUserStatus);

// ==================== ANALYTICS ====================

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Get admin dashboard overview
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
 */
router.get('/dashboard', requireAdminAuth, requirePermission('analytics'), getAdminDashboard);

/**
 * @swagger
 * /api/admin/analytics:
 *   get:
 *     summary: Get system analytics data
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Analytics data retrieved successfully
 */
router.get('/analytics', requireAdminAuth, requirePermission('analytics'), getSystemAnalytics);

// ==================== SYSTEM SETTINGS ====================

/**
 * @swagger
 * /api/admin/settings:
 *   get:
 *     summary: Retrieve current system settings
 *     tags: [System Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System settings retrieved successfully
 */
router.get('/settings', requireAdminAuth, requireSuperAdmin, getSystemSettings);

/**
 * @swagger
 * /api/admin/settings:
 *   put:
 *     summary: Update system settings
 *     tags: [System Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               siteName: "Kivelo"
 *               maintenanceMode: false
 *               emailNotifications: true
 *     responses:
 *       200:
 *         description: Settings updated successfully
 */
router.put('/settings', requireAdminAuth, requireSuperAdmin, updateSystemSettings);

/**
 * @swagger
 * /api/admin/profile:
 *   put:
 *     summary: Update admin profile
 *     tags: [System Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               name: "John Admin"
 *               email: "admin@kivelo.com"
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.put('/profile', requireAdminAuth, updateAdminProfile);

/**
 * @swagger
 * /api/admin/change-password:
 *   put:
 *     summary: Change admin password
 *     tags: [System Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 example: "OldPass123"
 *               newPassword:
 *                 type: string
 *                 example: "NewStrongPass456!"
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       401:
 *         description: Incorrect password or unauthorized
 */
router.put('/change-password', requireAdminAuth, changeAdminPassword);

export default router;
