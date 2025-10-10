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
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// All routes are authed
router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);
router.put('/update-password', auth, updatePassword);
router.put('/deactivate', auth, deactivateAccount);
router.get('/dashboard', auth, getDashboardStats);
router.post('/upload-avatar', auth, upload.single('avatar'), uploadProfilePicture);
router.delete('/avatar', auth, deleteProfilePicture);

export default router;