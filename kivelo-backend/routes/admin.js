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
  setAdminPermissions,
  getAdminPermissions,

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
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     Admin:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "507f1f77bcf86cd799439011"
 *         name:
 *           type: string
 *           example: "John Admin"
 *         email:
 *           type: string
 *           example: "admin@kivelo.com"
 *         role:
 *           type: string
 *           enum: [super_admin, admin, guest_admin]
 *           example: "admin"
 *         isActive:
 *           type: boolean
 *           example: true
 *         permissions:
 *           type: object
 *           properties:
 *             users:
 *               type: boolean
 *               example: true
 *             parents:
 *               type: boolean
 *               example: true
 *             children:
 *               type: boolean
 *               example: true
 *             activities:
 *               type: boolean
 *               example: true
 *             analytics:
 *               type: boolean
 *               example: true
 *             settings:
 *               type: boolean
 *               example: false
 *             admins:
 *               type: boolean
 *               example: false
 *         lastLogin:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T10:30:00.000Z"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-01T00:00:00.000Z"
 *     Permissions:
 *       type: object
 *       properties:
 *         users:
 *           type: boolean
 *           description: Permission to manage users
 *           example: true
 *         parents:
 *           type: boolean
 *           description: Permission to manage parents
 *           example: true
 *         children:
 *           type: boolean
 *           description: Permission to manage children
 *           example: true
 *         activities:
 *           type: boolean
 *           description: Permission to manage activities
 *           example: true
 *         analytics:
 *           type: boolean
 *           description: Permission to view analytics
 *           example: true
 *         settings:
 *           type: boolean
 *           description: Permission to modify system settings
 *           example: false
 *         admins:
 *           type: boolean
 *           description: Permission to manage other admins (super admin only)
 *           example: false
 *     Error:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: "Error message describing what went wrong"
 */

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
 *   - name: Admin Permissions
 *     description: Admin permission management endpoints
 */

// ==================== AUTHENTICATION ROUTES ====================

/**
 * @swagger
 * /api/admin/setup-super-admin:
 *   post:
 *     summary: Initialize system by creating the first Super Admin
 *     tags: [Admin Auth]
 *     description: Run once to create the first Super Admin. Intended to be executed via Postman or setup script.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Super Admin"
 *               email:
 *                 type: string
 *                 example: "superadmin@kivelo.com"
 *               password:
 *                 type: string
 *                 example: "SuperAdmin@123"
 *     responses:
 *       201:
 *         description: Super admin successfully created
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
 *                   example: "Super admin created successfully"
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 admin:
 *                   $ref: '#/components/schemas/Admin'
 *       400:
 *         description: Super admin already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 *                   example: "Admin login successful"
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 admin:
 *                   $ref: '#/components/schemas/Admin'
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Invalid credentials or deactivated account
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', adminLogin);

// ==================== ADMIN MANAGEMENT ROUTES ====================

/**
 * @swagger
 * /api/admin/admins:
 *   post:
 *     summary: Create a new admin (Super Admin only)
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
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 example: "john@kivelo.com"
 *               password:
 *                 type: string
 *                 example: "StrongPass123!"
 *               role:
 *                 $ref: '#/components/schemas/Admin/properties/role'
 *               permissions:
 *                 $ref: '#/components/schemas/Permissions'
 *     responses:
 *       201:
 *         description: Admin created successfully
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
 *                   example: "Admin created successfully"
 *                 admin:
 *                   $ref: '#/components/schemas/Admin'
 *       400:
 *         description: Missing required fields or validation error
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - User is not a super admin
 *       409:
 *         description: Conflict - Admin with this email already exists
 *       500:
 *         description: Internal server error
 */
router.post('/admins', requireAdminAuth, requireSuperAdmin, createAdmin);

/**
 * @swagger
 * /api/admin/admins:
 *   get:
 *     summary: Get all admins with pagination (Super Admin only)
 *     tags: [Admin Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: role
 *         schema:
 *           AdminRole:
 *             type: string
 *             enum: [super_admin, admin, guest_admin]
 *             example: "admin"
 *         description: Filter by admin role
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Successfully retrieved all admins
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 admins:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Admin'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     current:
 *                       type: integer
 *                       example: 1
 *                     pages:
 *                       type: integer
 *                       example: 5
 *                     total:
 *                       type: integer
 *                       example: 48
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - User is not a super admin
 *       500:
 *         description: Internal server error
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
 *                 example: "Updated Admin Name"
 *               role:
 *                 type: string
 *                 enum: [admin, guest_admin]
 *                 example: "admin"
 *               permissions:
 *                 $ref: '#/components/schemas/Permissions'
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Admin updated successfully
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
 *                   example: "Admin updated successfully"
 *                 admin:
 *                   $ref: '#/components/schemas/Admin'
 *       400:
 *         description: Bad request - Cannot update super admin or invalid data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Only super admin can update roles and permissions
 *       404:
 *         description: Admin not found
 *       500:
 *         description: Internal server error
 */
router.put('/admins/:id', requireAdminAuth, requireSuperAdmin, updateAdmin);

/**
 * @swagger
 * /api/admin/admins/{id}/permissions:
 *   patch:
 *     summary: Set admin permissions (Super Admin only)
 *     tags: [Admin Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Admin ID to update permissions for
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - permissions
 *             properties:
 *               permissions:
 *                 $ref: '#/components/schemas/Permissions'
 *     responses:
 *       200:
 *         description: Admin permissions updated successfully
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
 *                   example: "Admin permissions updated successfully"
 *                 admin:
 *                   $ref: '#/components/schemas/Admin'
 *       400:
 *         description: Bad request - Invalid permissions object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Only super admin can set permissions or cannot modify super admin
 *       404:
 *         description: Admin not found
 *       500:
 *         description: Internal server error
 */
router.patch('/admins/:id/permissions', requireAdminAuth, requireSuperAdmin, setAdminPermissions);

/**
 * @swagger
 * /api/admin/admins/{id}/permissions:
 *   get:
 *     summary: Get admin permissions
 *     tags: [Admin Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Admin ID to get permissions for
 *     responses:
 *       200:
 *         description: Admin permissions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 permissions:
 *                   $ref: '#/components/schemas/Permissions'
 *                 admin:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439011"
 *                     name:
 *                       type: string
 *                       example: "John Admin"
 *                     email:
 *                       type: string
 *                       example: "admin@kivelo.com"
 *                     role:
 *                       type: string
 *                       example: "admin"
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Admin not found
 *       500:
 *         description: Internal server error
 */
router.get('/admins/:id/permissions', requireAdminAuth, getAdminPermissions);

/**
 * @swagger
 * /api/admin/admins/{id}:
 *   delete:
 *     summary: Delete an admin (Super Admin only)
 *     tags: [Admin Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Admin ID to delete
 *     responses:
 *       200:
 *         description: Admin deleted successfully
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
 *                   example: "Admin deleted successfully"
 *       400:
 *         description: Bad request - Cannot delete your own account
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - User is not a super admin
 *       404:
 *         description: Admin not found
 *       500:
 *         description: Internal server error
 */
router.delete('/admins/:id', requireAdminAuth, requireSuperAdmin, deleteAdmin);

// ==================== USER MANAGEMENT ROUTES ====================

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users with filtering and pagination
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [parent, child]
 *         description: Filter by user role
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in name or email
 *     responses:
 *       200:
 *         description: List of users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     current:
 *                       type: integer
 *                       example: 1
 *                     pages:
 *                       type: integer
 *                       example: 5
 *                     total:
 *                       type: integer
 *                       example: 48
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - User doesn't have users permission
 *       500:
 *         description: Internal server error
 */
router.get('/users', requireAdminAuth, requirePermission('users'), getUsers);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   get:
 *     summary: Get user details including parent/child specific data
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   type: object
 *                   description: Combined user data with role-specific information
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - User doesn't have users permission
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
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
 *             required:
 *               - isActive
 *             properties:
 *               isActive:
 *                 type: boolean
 *                 example: false
 *                 description: Set to true to activate, false to deactivate
 *     responses:
 *       200:
 *         description: User status updated successfully
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
 *                   example: "User deactivated successfully"
 *                 user:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - User doesn't have users permission
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.put('/users/:id/status', requireAdminAuth, requirePermission('users'), updateUserStatus);

// ==================== ANALYTICS ROUTES ====================

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Get admin dashboard overview with statistics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 dashboard:
 *                   type: object
 *                   properties:
 *                     overview:
 *                       type: object
 *                       properties:
 *                         totalUsers:
 *                           type: integer
 *                           example: 150
 *                         totalParents:
 *                           type: integer
 *                           example: 75
 *                         totalChildren:
 *                           type: integer
 *                           example: 75
 *                         totalActivities:
 *                           type: integer
 *                           example: 320
 *                         activeToday:
 *                           type: integer
 *                           example: 45
 *                     recentUsers:
 *                       type: array
 *                       items:
 *                         type: object
 *                     weeklySignups:
 *                       type: array
 *                       items:
 *                         type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - User doesn't have analytics permission
 *       500:
 *         description: Internal server error
 */
router.get('/dashboard', requireAdminAuth, requirePermission('analytics'), getAdminDashboard);

/**
 * @swagger
 * /api/admin/analytics:
 *   get:
 *     summary: Get system analytics data including growth metrics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Analytics data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 analytics:
 *                   type: object
 *                   properties:
 *                     userGrowth:
 *                       type: array
 *                       description: Monthly user growth data
 *                     activityStats:
 *                       type: array
 *                       description: Activity completion statistics
 *                     roleDistribution:
 *                       type: array
 *                       description: Distribution of user roles
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - User doesn't have analytics permission
 *       500:
 *         description: Internal server error
 */
router.get('/analytics', requireAdminAuth, requirePermission('analytics'), getSystemAnalytics);

// ==================== SYSTEM MANAGEMENT ROUTES ====================

/**
 * @swagger
 * /api/admin/settings:
 *   get:
 *     summary: Retrieve current system settings (Super Admin only)
 *     tags: [System Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 settings:
 *                   type: object
 *                   properties:
 *                     appName:
 *                       type: string
 *                       example: "Family Wellness"
 *                     version:
 *                       type: string
 *                       example: "1.0.0"
 *                     maintenanceMode:
 *                       type: boolean
 *                       example: false
 *                     maxLoginAttempts:
 *                       type: integer
 *                       example: 5
 *                     sessionTimeout:
 *                       type: integer
 *                       example: 24
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - User is not a super admin
 *       500:
 *         description: Internal server error
 */
router.get('/settings', requireAdminAuth, requireSuperAdmin, getSystemSettings);

/**
 * @swagger
 * /api/admin/settings:
 *   put:
 *     summary: Update system settings (Super Admin only)
 *     tags: [System Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               maintenanceMode:
 *                 type: boolean
 *                 example: false
 *               sessionTimeout:
 *                 type: integer
 *                 example: 24
 *                 description: Session timeout in hours
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
 *                 message:
 *                   type: string
 *                   example: "System settings updated successfully"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - User is not a super admin
 *       500:
 *         description: Internal server error
 */
router.put('/settings', requireAdminAuth, requireSuperAdmin, updateSystemSettings);

/**
 * @swagger
 * /api/admin/profile:
 *   put:
 *     summary: Update admin profile information
 *     tags: [System Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "John Admin Updated"
 *               email:
 *                 type: string
 *                 example: "admin.updated@kivelo.com"
 *     responses:
 *       200:
 *         description: Profile updated successfully
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
 *                   example: "Profile updated successfully"
 *                 admin:
 *                   $ref: '#/components/schemas/Admin'
 *       400:
 *         description: Bad request - Invalid data or email already exists
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
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
 *                   example: "Password updated successfully"
 *       400:
 *         description: Bad request - Missing fields or current password incorrect
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.put('/change-password', requireAdminAuth, changeAdminPassword);

export default router;