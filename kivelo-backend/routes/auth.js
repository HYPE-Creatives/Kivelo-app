// routes/auth.js
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import auth from '../middleware/auth.js';
import { 
  registerParent, 
  login, 
  verifyEmail,
  resendVerificationCode,
  generateOneTimeCode,
  childLoginWithCode,
  registerChildWithCode,
  setChildPassword,
  resetChildPassword,
  refreshAccessToken,
  verifyToken,
  logout
} from '../controllers/authControllers.js';

const router = express.Router();

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ========================= PUBLIC ROUTES =========================

/**
 * @route   POST /api/auth/register-parent
 * @desc    Register a new parent account
 * @access  Public
 */
router.post('/register-parent', registerParent);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and return JWT token
 * @access  Public
 */
router.post('/login', login);

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify user email with 6-digit code
 * @access  Public
 */
router.post('/verify-email', verifyEmail);

/**
 * @route   POST /api/auth/resend-verification
 * @desc    Resend email verification code
 * @access  Public
 */
router.post('/resend-verification', resendVerificationCode);

/**
 * @route   GET /api/auth/verify-code-page
 * @desc    Serve code verification page where users can enter 6-digit code
 * @access  Public
 */
router.get('/verify-code-page', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/verify-code.html'));
});

/**
 * @route   POST /api/auth/child-login
 * @desc    Login for child using one-time code
 * @access  Public
 */
router.post('/child-login', childLoginWithCode);

/**
 * @route   POST /api/auth/register-child
 * @desc    Register child account using one-time code
 * @access  Public
 */
router.post('/register-child', registerChildWithCode);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Initiate password reset process
 * @access  Public
 */
router.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  
  // TODO: Implement email sending logic for password reset
  res.json({
    success: true,
    message: 'If an account with that email exists, a password reset link has been sent'
  });
});

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password using reset token
 * @access  Public
 */
router.post('/reset-password', (req, res) => {
  const { token, newPassword } = req.body;
  
  // TODO: Implement token verification and password reset logic
  res.json({
    success: true,
    message: 'Password reset successfully'
  });
});

// ========================= PROTECTED ROUTES =========================

/**
 * @route   POST /api/auth/generate-code
 * @desc    Generate one-time code for child registration (Parent only)
 * @access  Private
 */
router.post('/generate-code', auth, generateOneTimeCode);

/**
 * @route   POST /api/auth/set-child-password
 * @desc    Set initial password for child account (Child only)
 * @access  Private
 */
router.post('/set-child-password', auth, setChildPassword);

/**
 * @route   POST /api/auth/reset-child-password
 * @desc    Reset child password (Parent initiated)
 * @access  Private
 */
router.post('/reset-child-password', auth, resetChildPassword);

/**
 * @route   GET /api/auth/verify-token
 * @desc    Validate JWT token and return user data
 * @access  Private
 */
router.get('/verify-token', auth, verifyToken);

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh JWT token with new expiration
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
router.post('/logout', auth, logout);


// ========================= TOKEN REFRESH =========================
/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh access token using refresh token
 * @access  Private
 */ 
router.post('/refresh-token', refreshAccessToken);

// ========================= DEVELOPMENT/DEBUG ROUTES =========================

/**
 * @route   POST /api/auth/test-body-parsing
 * @desc    Test endpoint for debugging body parsing issues
 * @access  Public
 */
router.post('/test-body-parsing', (req, res) => {
  console.log('=== TEST BODY PARSING ===');
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  console.log('Body type:', typeof req.body);
  console.log('=======================');
  
  res.json({
    success: true,
    message: 'Body parsing test',
    receivedHeaders: req.headers,
    receivedBody: req.body,
    bodyExists: !!req.body,
    bodyKeys: req.body ? Object.keys(req.body) : []
  });
});

export default router;