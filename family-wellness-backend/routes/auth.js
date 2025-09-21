import { Router } from 'express';
const router = Router();
import { registerParent, login, generateOneTimeCode, registerChildWithCode, setChildPassword, resetChildPassword } from '../controllers/authControllers.js';
import auth from '../middleware/auth.js';

/**
 * @route   POST /api/auth/register-parent
 * @desc    Register a new parent
 * @access  Public
 */
router.post('/register-parent', registerParent);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', login);

/**
 * @route   POST /api/auth/generate-code
 * @desc    Generate one-time code for child registration
 * @access  Private (Parent only)
 */
router.post('/generate-code', auth, generateOneTimeCode);

/**
 * @route   POST /api/auth/register-child
 * @desc    Register child using one-time code
 * @access  Public
 */
router.post('/register-child', registerChildWithCode);

/**
 * @route   POST /api/auth/set-child-password
 * @desc    Set password for child account
 * @access  Private (Child only)
 */
router.post('/set-child-password', auth, setChildPassword);

/**
 * @route   POST /api/auth/reset-child-password
 * @desc    Reset child password (Parent initiated)
 * @access  Private (Parent only)
 */
router.post('/reset-child-password', auth, resetChildPassword);

/**
 * @route   GET /api/auth/verify-token
 * @desc    Verify JWT token
 * @access  Private
 */
router.get('/verify-token', auth, (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role
    }
  });
});

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh JWT token
 * @access  Private
 */
router.post('/refresh-token', auth, (req, res) => {
  // In a real implementation, you might want to check if the user still exists
  // and generate a new token with a fresh expiration
  const token = require('../utils/generateToken')(req.user._id);
  
  res.json({
    success: true,
    token,
    user: {
      id: req.user._id,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role
    }
  });
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (client-side token removal)
 * @access  Private
 */
router.post('/logout', auth, (req, res) => {
  // Since JWT is stateless, logout is handled client-side by removing the token
  // You might want to add the token to a blacklist here if needed
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post('/forgot-password', (req, res) => {
  // This would typically send a password reset email
  const { email } = req.body;
  
  // TODO: Implement email sending logic
  res.json({
    success: true,
    message: 'If an account with that email exists, a password reset link has been sent'
  });
});

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password', (req, res) => {
  // This would handle password reset with a token from email
  const { token, newPassword } = req.body;
  
  // TODO: Implement token verification and password reset logic
  res.json({
    success: true,
    message: 'Password reset successfully'
  });
});

export default router;