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
import { uploadSingle } from '../middleware/upload.js';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Avatar:
 *       type: object
 *       properties:
 *         url:
 *           type: string
 *           example: "https://res.cloudinary.com/dr75ztciw/image/upload/v1762563780/kivelo-images/avatars/vr0imyzuazecbmwabbps.jpg"
 *         public_id:
 *           type: string
 *           example: "kivelo-images/avatars/vr0imyzuazecbmwabbps"
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         name:
 *           type: string
 *         role:
 *           type: string
 *           enum: [parent, child, admin]
 *         avatar:
 *           $ref: '#/components/schemas/Avatar'
 *         phone:
 *           type: string
 *         dob:
 *           type: string
 *           format: date
 *     Error:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *         errors:
 *           type: array
 *           items:
 *             type: string
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

// All routes are authed
/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management and profile operations
 */
router.get('/profile', auth, auditLogger("user.view.profile"), getProfile);

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update user profile with optional avatar
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               dob:
 *                 type: string
 *                 format: date
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Invalid request
 */
router.put('/profile', auth, uploadSingle('avatar'), auditLogger((req) => `user.update.profile:${req.user?._id}`), updateProfile);

/**
 * @swagger
 * /api/users/update-password:
 *   put:
 *     summary: Update user password
 *     tags: [Users]
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
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password updated successfully
 *       400:
 *         description: Invalid request
 */
router.put('/update-password', auth, auditLogger("user.update.password"), updatePassword);

router.put('/deactivate', auth, auditLogger("user.deactivate"), deactivateAccount);
router.get('/dashboard', auth, auditLogger("user.view.dashboard"), getDashboardStats);

/** 
 * @swagger
 * /api/users/avatar:
 *   post:
 *     summary: Upload user avatar to Cloudinary
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: No file provided
 *       500:
 *         description: Server error
 */
router.post('/avatar', auth, uploadSingle('avatar'), auditLogger("user.upload.avatar"), uploadProfilePicture);

/** 
 * @swagger
 * /api/users/avatar:
 *   delete:
 *     summary: Delete user avatar from Cloudinary and database
 *     description: Permanently removes avatar image from Cloudinary storage and user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Avatar deleted successfully
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
 *                   example: "Profile picture removed successfully"
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.delete('/avatar', auth, auditLogger("user.delete.avatar"), deleteProfilePicture);

export default router;