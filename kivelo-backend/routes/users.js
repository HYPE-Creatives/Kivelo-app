import express from 'express';
import {
  getProfile,
  updateProfile,
  updatePassword,
  deactivateAccount,
  getDashboardStats,
  uploadProfilePicture,
  deleteProfilePicture
} from '../controllers/userControllers.js';
import auth from '../middleware/auth.js';
import { auditLogger } from '../middleware/auditMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// All routes are authed
/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management
 */
router.get('/profile', auth, auditLogger("user.view.profile"), getProfile);

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update user profile
 *     description: Update user profile information
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Invalid request
 */
router.put('/profile', auth, auditLogger((req) => `user.update.profile:${req.user?._id}`), updateProfile);

/**
 * @swagger
 * /api/users/update-password:
 *   put:
 *     summary: Update user password
 *     description: Update user password
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password updated successfully
 *       400:
 *         description: Invalid request
 */
router.put('/update-password', auth, auditLogger("user.update.password"), updatePassword);

/** 
 * @swagger
 * /api/users/deactivate:
 *   put: 
 *     summary: Deactivate user account
 *     description: Deactivate user account
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Account deactivated successfully
 *       400:
 *         description: Invalid request
 */
router.put('/deactivate', auth, auditLogger("user.deactivate"), deactivateAccount);

/** 
 * @swagger
 * /api/users/dashboard:
 *   get:
 *     summary: Get user dashboard statistics
 *     description: Retrieve user-specific dashboard statistics
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 *       400:
 *         description: Invalid request
 */
router.get('/dashboard', auth, auditLogger("user.view.dashboard"), getDashboardStats);

/** 
 * @swagger
 * /api/users/upload-avatar:
 *   post:
 *     summary: Upload user avatar
 *     description: Upload a new avatar for the user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Avatar uploaded successfully
 *       400:
 *         description: Invalid request
 */
router.post('/upload-avatar', auth, upload.single('avatar'), auditLogger("user.upload.avatar"), uploadProfilePicture);

/** 
 * @swagger
 * /api/users/avatar:
 *   delete:
 *     summary: Delete user avatar
 *     description: Remove the user's avatar
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Avatar deleted successfully
 *       400:
 *         description: Invalid request
 */
router.delete('/avatar', auth, auditLogger("user.delete.avatar"), deleteProfilePicture);

export default router;