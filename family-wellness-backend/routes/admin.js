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

// ==================== PUBLIC ROUTES ====================
router.post('/setup-super-admin', setupSuperAdmin); // Run once to create first super admin by simple endpoint call i.e. Postman or curl using node scripts/setupSuperAdmin.js 

router.post('/login', adminLogin);

// ==================== PROTECTED ROUTES ====================

// Admin Management (Super Admin only)
router.post('/admins', requireAdminAuth, requireSuperAdmin, createAdmin);
router.get('/admins', requireAdminAuth, requireSuperAdmin, getAdmins);
router.put('/admins/:id', requireAdminAuth, requireSuperAdmin, updateAdmin);
router.delete('/admins/:id', requireAdminAuth, requireSuperAdmin, deleteAdmin);

// User Management (Requires users permission)
router.get('/users', requireAdminAuth, requirePermission('users'), getUsers);
router.get('/users/:id', requireAdminAuth, requirePermission('users'), getUserDetails);
router.put('/users/:id/status', requireAdminAuth, requirePermission('users'), updateUserStatus);

// Analytics (Requires analytics permission)
router.get('/dashboard', requireAdminAuth, requirePermission('analytics'), getAdminDashboard);
router.get('/analytics', requireAdminAuth, requirePermission('analytics'), getSystemAnalytics);

// System Settings (Super Admin only)
router.get('/settings', requireAdminAuth, requireSuperAdmin, getSystemSettings);
router.put('/settings', requireAdminAuth, requireSuperAdmin, updateSystemSettings);

// Admin Profile (Any authenticated admin)
router.put('/profile', requireAdminAuth, updateAdminProfile);
router.put('/change-password', requireAdminAuth, changeAdminPassword);

export default router;