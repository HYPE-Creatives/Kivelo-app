import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import auth from "../middleware/auth.js";
import authControllers, {
  registerParent,
  login,
  forgotPassword,
  verifyResetToken,
  resetPassword,
  verifyEmail,
  verifyEmailWithToken,
  generateVerificationLink,
  resendVerificationCode,
  generateOneTimeCode,
  childLoginWithCode,
  registerChildWithCode,
  setChildPassword,
  resetChildPassword,
  refreshAccessToken,
  verifyToken,
  logout,
} from "../controllers/authControllers.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ========================= PUBLIC ROUTES =========================

/**
 * @swagger
 * tags:
 *   - name: Authentication
 *     description: User authentication and authorization endpoints
 *   - name: Email Verification
 *     description: Email verification and account activation
 *   - name: Child Accounts
 *     description: Child account management and authentication
 */

// ========================= REGISTRATION & LOGIN =========================

/**
 * @swagger
 * /api/auth/register-parent:
 *   post:
 *     summary: Register a new parent account
 *     tags: [Authentication]
 *     description: Creates a new parent account and sends verification email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "parent@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 example: "password123"
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *               phone:
 *                 type: string
 *                 example: "+1234567890"
 *               dob:
 *                 type: string
 *                 format: date
 *                 example: "1990-01-01"
 *     responses:
 *       201:
 *         description: Parent registered successfully. Verification code sent to email.
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
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     name:
 *                       type: string
 *                     role:
 *                       type: string
 *                     isVerified:
 *                       type: boolean
 *                 parent:
 *                   type: object
 *                   properties:
 *                     familyCode:
 *                       type: string
 *                     subscription:
 *                       type: string
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation error - invalid input data
 *       409:
 *         description: User already exists with this email
 *       500:
 *         description: Server error during registration
 */
router.post("/register-parent", registerParent);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user (Parent or Child)
 *     tags: [Authentication]
 *     description: Authenticate user and return JWT tokens
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
 *                 format: email
 *                 example: "parent@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *                 data:
 *                   type: object
 *                 message:
 *                   type: string
 *       400:
 *         description: Missing email or password
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Account not verified or deactivated
 *       500:
 *         description: Server error during login
 */
router.post("/login", login);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset code
 *     tags: [Authentication]
 *     description: |
 *       Initiates password reset process by sending a 6-digit verification code to the user's email.
 *       
 *       **Security Note:** For security reasons, this endpoint always returns success (200) 
 *       even if the email doesn't exist to prevent email enumeration attacks.
 *       
 *       **Flow:**
 *       1. User submits email address
 *       2. System sends 6-digit reset code via email (valid for 1 hour)
 *       3. User enters code on verification page
 *       4. System verifies code validity
 *       5. User sets new password
 *     operationId: forgotPassword
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: The email address associated with the account
 *                 example: "jane.doe@example.com"
 *                 minLength: 5
 *                 maxLength: 255
 *           examples:
 *             validRequest:
 *               summary: Valid email request
 *               value:
 *                 email: "jane.doe@example.com"
 *             invalidEmail:
 *               summary: Invalid email format
 *               value:
 *                 email: "invalid-email"
 *     responses:
 *       200:
 *         description: |
 *           Password reset code sent successfully. 
 *           Returns same message whether email exists or not for security.
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
 *                   example: "If an account with that email exists, a password reset code has been sent."
 *             examples:
 *               successResponse:
 *                 summary: Standard success response
 *                 value:
 *                   success: true
 *                   message: "If an account with that email exists, a password reset code has been sent."
 *       400:
 *         description: Bad request - invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *             examples:
 *               missingEmail:
 *                 summary: Email field missing
 *                 value:
 *                   success: false
 *                   message: "Email is required"
 *               invalidEmail:
 *                 summary: Invalid email format
 *                 value:
 *                   success: false
 *                   message: "Please provide a valid email address"
 *               unverifiedAccount:
 *                 summary: Account not verified
 *                 value:
 *                   success: false
 *                   message: "Please verify your email before resetting password"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 *             examples:
 *               serverError:
 *                 summary: Server error
 *                 value:
 *                   success: false
 *                   message: "Failed to process password reset request"
 *                   error: "Email service temporarily unavailable"
 *     security: []
 */
router.post('/forgot-password', forgotPassword);
 
/**
 * @swagger
 * /api/auth/verify-reset-token:
 *   post:
 *     summary: Verify password reset token
 *     tags: [Authentication]
 *     description: |
 *       Verifies that the 6-digit reset code received via email is valid and not expired.
 *       
 *       **Token Validity:** Reset codes expire after 1 hour from generation.
 *       
 *       **Next Steps:** After successful verification, proceed to reset password endpoint.
 *     operationId: verifyResetToken
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - resetToken
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: The email address associated with the account
 *                 example: "jane.doe@example.com"
 *               resetToken:
 *                 type: string
 *                 description: The 6-digit reset code received via email
 *                 example: "123456"
 *                 minLength: 6
 *                 maxLength: 6
 *                 pattern: "^[0-9]{6}$"
 *           examples:
 *             validToken:
 *               summary: Valid token verification
 *               value:
 *                 email: "jane.doe@example.com"
 *                 resetToken: "123456"
 *             invalidToken:
 *               summary: Invalid or expired token
 *               value:
 *                 email: "jane.doe@example.com"
 *                 resetToken: "000000"
 *     responses:
 *       200:
 *         description: Reset token is valid and not expired
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
 *                   example: "Reset token is valid"
 *             examples:
 *               validToken:
 *                 summary: Token verification successful
 *                 value:
 *                   success: true
 *                   message: "Reset token is valid"
 *       400:
 *         description: Invalid, expired, or missing token/email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *             examples:
 *               missingFields:
 *                 summary: Required fields missing
 *                 value:
 *                   success: false
 *                   message: "Email and reset token are required"
 *               invalidToken:
 *                 summary: Invalid or expired token
 *                 value:
 *                   success: false
 *                   message: "Invalid or expired reset token"
 *       404:
 *         description: User not found with the provided email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *             examples:
 *               userNotFound:
 *                 summary: User not found
 *                 value:
 *                   success: false
 *                   message: "User not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 *     security: []
 */
router.post('/verify-reset-token', verifyResetToken);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset user password with verified token
 *     tags: [Authentication]
 *     description: |
 *       Resets the user's password using the verified reset token.
 *       
 *       **Password Requirements:**
 *       - Minimum 6 characters
 *       
 *       **Security Features:**
 *       - Reset token is invalidated after successful password reset
 *       - Confirmation email is sent to the user
 *       - Token automatically expires after 1 hour
 *       - Previous sessions are invalidated (user must log in again)
 *     operationId: resetPassword
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - resetToken
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: The email address associated with the account
 *                 example: "jane.doe@example.com"
 *               resetToken:
 *                 type: string
 *                 description: The 6-digit reset code received via email
 *                 example: "123456"
 *                 minLength: 6
 *                 maxLength: 6
 *                 pattern: "^[0-9]{6}$"
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 description: The new password (minimum 6 characters)
 *                 example: "newSecurePassword123"
 *                 minLength: 6
 *           examples:
 *             validReset:
 *               summary: Valid password reset
 *               value:
 *                 email: "jane.doe@example.com"
 *                 resetToken: "123456"
 *                 newPassword: "newSecurePassword123"
 *             weakPassword:
 *               summary: Password too short
 *               value:
 *                 email: "jane.doe@example.com"
 *                 resetToken: "123456"
 *                 newPassword: "123"
 *     responses:
 *       200:
 *         description: Password reset successfully
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
 *                   example: "Password has been reset successfully. You can now log in with your new password."
 *             examples:
 *               successReset:
 *                 summary: Password reset successful
 *                 value:
 *                   success: true
 *                   message: "Password has been reset successfully. You can now log in with your new password."
 *       400:
 *         description: Bad request - invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *             examples:
 *               missingFields:
 *                 summary: Required fields missing
 *                 value:
 *                   success: false
 *                   message: "Email, reset token, and new password are required"
 *               invalidToken:
 *                 summary: Invalid or expired token
 *                 value:
 *                   success: false
 *                   message: "Invalid or expired reset token"
 *               weakPassword:
 *                 summary: Password too short
 *                 value:
 *                   success: false
 *                   message: "Password must be at least 6 characters long"
 *       404:
 *         description: User not found with the provided email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *             examples:
 *               userNotFound:
 *                 summary: User not found
 *                 value:
 *                   success: false
 *                   message: "User not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 *             examples:
 *               serverError:
 *                 summary: Server error during password reset
 *                 value:
 *                   success: false
 *                   message: "Failed to reset password"
 *                   error: "Database connection failed"
 *     security: []
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: "Error description"
 *         error:
 *           type: string
 *           example: "Detailed error message"
 * 
 *   responses:
 *     ValidationError:
 *       description: Validation error in request parameters
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: false
 *               message:
 *                 type: string
 *                 example: "Validation failed"
 *               errors:
 *                 type: array
 *                 items:
 *                   type: string
 * 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */
router.post('/reset-password', resetPassword);

// ========================= EMAIL VERIFICATION ROUTES =========================

/**
 * @swagger
 * /api/auth/verify-email:
 *   post:
 *     summary: Verify email with 6-digit code
 *     tags: [Email Verification]
 *     description: Verify user's email using the 6-digit code sent to their email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - verificationCode
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *               verificationCode:
 *                 type: string
 *                 pattern: '^[0-9]{6}$'
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired verification code
 *       404:
 *         description: User not found
 */
router.post("/verify-email", verifyEmail);

/**
 * @swagger
 * /api/auth/verify-email/{token}:
 *   get:
 *     summary: Verify email with JWT token (via link)
 *     tags: [Email Verification]
 *     description: Verify email using JWT token from verification link
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: JWT verification token sent via email
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired token
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error during verification
 */
router.get("/verify-email/:token", verifyEmailWithToken);

/**
 * @swagger
 * /api/auth/generate-verification-link:
 *   post:
 *     summary: Generate new verification link
 *     tags: [Email Verification]
 *     description: Generate and send a new email verification link
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *     responses:
 *       200:
 *         description: Verification link sent successfully
 *       400:
 *         description: Email is required or account already verified
 *       404:
 *         description: User not found
 */
router.post("/generate-verification-link", generateVerificationLink);

/**
 * @swagger
 * /api/auth/resend-verification:
 *   post:
 *     summary: Resend verification code
 *     tags: [Email Verification]
 *     description: Resend a new 6-digit verification code to user's email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *     responses:
 *       200:
 *         description: Verification code resent successfully
 *       400:
 *         description: Email is required or account already verified
 *       404:
 *         description: User not found
 */
router.post("/resend-verification", resendVerificationCode);

/**
 * @swagger
 * /api/auth/verify-code-page:
 *   get:
 *     summary: Email verification page
 *     tags: [Email Verification]
 *     description: Serves the email verification page where users can enter their 6-digit code
 *     responses:
 *       200:
 *         description: HTML page served successfully
 */
router.get("/verify-code-page", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/verify-code.html"));
});

// ========================= CHILD ACCOUNT ROUTES =========================

/**
 * @swagger
 * /api/auth/generate-code:
 *   post:
 *     summary: Generate one-time code for child registration
 *     tags: [Child Accounts]
 *     security:
 *       - bearerAuth: []
 *     description: Parent generates a one-time code to register a child account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - childEmail
 *               - childName
 *               - dob
 *             properties:
 *               childEmail:
 *                 type: string
 *                 format: email
 *                 example: "child@example.com"
 *               childName:
 *                 type: string
 *                 example: "Alice Smith"
 *               dob:
 *                 type: string
 *                 format: date
 *                 example: "2015-05-15"
 *     responses:
 *       201:
 *         description: One-time code generated successfully
 *       400:
 *         description: Missing required fields or invalid email
 *       403:
 *         description: Only parents can generate codes
 *       404:
 *         description: Parent profile not found
 */
router.post("/generate-code", auth, generateOneTimeCode);

/**
 * @swagger
 * /api/auth/child-login:
 *   post:
 *     summary: Child login with one-time code
 *     tags: [Child Accounts]
 *     description: Authenticate child using one-time code generated by parent
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - code
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "child@example.com"
 *               code:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Child login successful
 *       400:
 *         description: Missing email or code
 *       401:
 *         description: Invalid or expired code
 */
router.post("/child-login", childLoginWithCode);

/**
 * @swagger
 * /api/auth/register-child:
 *   post:
 *     summary: Register child with one-time code
 *     tags: [Child Accounts]
 *     description: Complete child registration using one-time code
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - email
 *             properties:
 *               code:
 *                 type: string
 *                 example: "ABC123"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "child@example.com"
 *               name:
 *                 type: string
 *                 example: "Alice Smith"
 *     responses:
 *       200:
 *         description: Child registration completed successfully
 *       400:
 *         description: Invalid or expired code, or email mismatch
 */
router.post("/register-child", registerChildWithCode);

/**
 * @swagger
 * /api/auth/set-child-password:
 *   post:
 *     summary: Set child password after initial login
 *     tags: [Child Accounts]
 *     security:
 *       - bearerAuth: []
 *     description: Set permanent password for child account after one-time code login
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 example: "newpassword123"
 *     responses:
 *       200:
 *         description: Password set successfully
 *       400:
 *         description: Invalid password or missing field
 *       403:
 *         description: Only child accounts can set password
 */
router.post("/set-child-password", auth, setChildPassword);

/**
 * @swagger
 * /api/auth/reset-child-password:
 *   post:
 *     summary: Reset child password (Parent only)
 *     tags: [Child Accounts]
 *     security:
 *       - bearerAuth: []
 *     description: Parent resets child's password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - childId
 *               - newPassword
 *             properties:
 *               childId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439011"
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 example: "newsecurepassword123"
 *     responses:
 *       200:
 *         description: Child password reset successfully
 *       400:
 *         description: Missing required fields or invalid password
 *       403:
 *         description: Only parents can reset child passwords
 *       404:
 *         description: Child not found
 */
router.post("/reset-child-password", auth, resetChildPassword);

// ========================= TOKEN MANAGEMENT ROUTES =========================

/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     description: Generate new access token using refresh token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     responses:
 *       200:
 *         description: Tokens refreshed successfully
 *       401:
 *         description: Refresh token required or invalid
 *       403:
 *         description: Invalid refresh token
 */
router.post("/refresh-token", refreshAccessToken);

/**
 * @swagger
 * /api/auth/verify-token:
 *   get:
 *     summary: Verify JWT token validity
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     description: Check if the provided JWT token is valid and return user data
 *     responses:
 *       200:
 *         description: Token is valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   type: object
 *                 message:
 *                   type: string
 *       401:
 *         description: Invalid or expired token
 */
router.get("/verify-token", auth, verifyToken);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     description: Logout user and invalidate refresh token
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       500:
 *         description: Server error during logout
 */
router.post("/logout", auth, logout);

// ========================= DEBUG/UTILITY ROUTES =========================

/**
 * @swagger
 * /api/auth/test-body-parsing:
 *   post:
 *     summary: Test request body parsing
 *     tags: [Authentication]
 *     description: Debug endpoint to test if request body is being parsed correctly
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               test:
 *                 type: string
 *                 example: "Hello World"
 *               number:
 *                 type: number
 *                 example: 42
 *     responses:
 *       200:
 *         description: Body parsed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 received:
 *                   type: object
 */
router.post("/test-body-parsing", (req, res) => {
  console.log("=== TEST BODY PARSING ===");
  console.log("Headers:", req.headers);
  console.log("Body:", req.body);
  res.json({
    success: true,
    message: "Body parsing test success",
    received: req.body,
  });
});

export default router;