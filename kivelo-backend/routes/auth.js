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
 *     description: |
 *       Creates a new parent account with comprehensive validation and sends 6-digit verification code via email.
 *       
 *       **Registration Flow:**
 *       1. User submits registration data with terms acceptance
 *       2. System validates all fields and checks for duplicates
 *       3. Creates parent account with family code
 *       4. Sends 6-digit verification code via email
 *       5. User verifies email using the code
 *       
 *       **Required Fields:** name, email, password, phone, dob, termsAccepted
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
 *               - phone
 *               - dob
 *               - termsAccepted
 *             properties:
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *                 minLength: 2
 *                 maxLength: 100
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "parent@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 pattern: "^(?=.*[A-Z])(?=.*\\d)[A-Za-z\\d]{8,}$"
 *                 example: "Password123"
 *                 description: "Must contain at least 8 characters, one uppercase letter, and one number"
 *               phone:
 *                 type: string
 *                 pattern: "^\\+234[1-9]\\d{9}$"
 *                 example: "+2348012345678"
 *                 description: "Must be in +234XXXXXXXXXX format"
 *               dob:
 *                 type: string
 *                 format: date
 *                 pattern: "^\\d{4}-\\d{2}-\\d{2}$"
 *                 example: "1990-01-01"
 *                 description: "Date of birth in YYYY-MM-DD format"
 *               termsAccepted:
 *                 type: boolean
 *                 example: true
 *                 description: "Must be true to accept Terms & Conditions"
 *           examples:
 *             validRegistration:
 *               summary: Valid parent registration
 *               value:
 *                 name: "John Doe"
 *                 email: "parent@example.com"
 *                 password: "Password123"
 *                 phone: "+2348012345678"
 *                 dob: "1990-01-01"
 *                 termsAccepted: true
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
 *                 message:
 *                   type: string
 *                   example: "Check your email for the verification code."
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
 *                       example: "parent"
 *                     isVerified:
 *                       type: boolean
 *                       example: false
 *                 parent:
 *                   type: object
 *                   properties:
 *                     familyCode:
 *                       type: string
 *       400:
 *         description: Validation error - invalid input data
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
 *                   example: "All fields are required."
 *       409:
 *         description: User already exists with this email or phone
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
 *                   example: "This email is taken."
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
 *     description: |
 *       Authenticate user and return JWT tokens. 
 *       Parent accounts require email verification before login.
 *       Child accounts can login with one-time code or password.
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
 *           examples:
 *             parentLogin:
 *               summary: Parent login
 *               value:
 *                 email: "parent@example.com"
 *                 password: "Password123"
 *             childLogin:
 *               summary: Child login
 *               value:
 *                 email: "child@example.com"
 *                 password: "childpassword123"
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
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Login successful"
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                     familyCode:
 *                       type: string
 *                     subscription:
 *                       type: string
 *                     hasSetPassword:
 *                       type: boolean
 *                     parentId:
 *                       type: string
 *       400:
 *         description: Missing email or password
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Account not verified or deactivated
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
 *                 needsVerification:
 *                   type: boolean
 *                   example: true
 *                 email:
 *                   type: string
 *       500:
 *         description: Server error during login
 */
router.post("/login", login);

// ========================= PASSWORD RESET FLOW =========================

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset code
 *     tags: [Authentication]
 *     description: |
 *       Initiates password reset process by sending a 6-digit verification code to the user's email.
 *       
 *       **Security Note:** Returns success even if email doesn't exist to prevent email enumeration.
 *       
 *       **Flow:**
 *       1. User submits email address
 *       2. System sends 6-digit reset code via email (valid for 1 hour)
 *       3. User enters code on verification page
 *       4. System verifies code validity
 *       5. User sets new password
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
 *         description: Password reset code sent successfully
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
 *       400:
 *         description: Bad request - invalid input data
 *       500:
 *         description: Internal server error
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
 *                 example: "user@example.com"
 *               resetToken:
 *                 type: string
 *                 pattern: '^[0-9]{6}$'
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Reset token is valid and not expired
 *       400:
 *         description: Invalid, expired, or missing token/email
 *       500:
 *         description: Internal server error
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
 *       **Password Requirements:** Minimum 6 characters
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
 *                 example: "user@example.com"
 *               resetToken:
 *                 type: string
 *                 pattern: '^[0-9]{6}$'
 *                 example: "123456"
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 example: "newSecurePassword123"
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Bad request - invalid input data
 *       500:
 *         description: Internal server error
 */
router.post('/reset-password', resetPassword);

// ========================= EMAIL VERIFICATION ROUTES =========================

/**
 * @swagger
 * /api/auth/verify-email:
 *   post:
 *     summary: Verify email with 6-digit code
 *     tags: [Email Verification]
 *     description: |
 *       Verify user's email using the 6-digit code sent to their email.
 *       This is the primary verification method used after parent registration.
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *                 user:
 *                   type: object
 *                 message:
 *                   type: string
 *                   example: "Email verified successfully! Your account is now active."
 *       400:
 *         description: Invalid or expired verification code
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error during verification
 */
router.post("/verify-email", verifyEmail);

/**
 * @swagger
 * /api/auth/verify-email/{token}:
 *   get:
 *     summary: Verify email with JWT token (via link)
 *     tags: [Email Verification]
 *     description: |
 *       Alternative email verification using JWT token from verification link.
 *       Used for verification link resends and external email clients.
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
 *                 user:
 *                   type: object
 *                 redirectUrl:
 *                   type: string
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
 *     description: Generate and send a new email verification link (JWT token based)
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

// ========================= CHILD ACCOUNT ROUTES =========================

/**
 * @swagger
 * /api/auth/generate-code:
 *   post:
 *     summary: Generate one-time registration code for child account
 *     tags: [Child Accounts]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Allows authenticated parents to generate a one-time code for registering their child's account.
 *       Can also regenerate codes for existing child accounts.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - childEmail
 *               - childName
 *               - childDOB
 *             properties:
 *               childEmail:
 *                 type: string
 *                 format: email
 *                 example: "child@example.com"
 *               childName:
 *                 type: string
 *                 example: "Emma Johnson"
 *               childDOB:
 *                 type: string
 *                 format: date
 *                 example: "2015-08-15"
 *               childGender:
 *                 type: string
 *                 enum: [male, female, non_binary, prefer_not_to_say]
 *                 default: prefer_not_to_say
 *                 example: "female"
 *     responses:
 *       201:
 *         description: One-time code generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 code:
 *                   type: string
 *                   example: "123456"
 *                 expiresAt:
 *                   type: string
 *                   format: date-time
 *                 childId:
 *                   type: string
 *                 message:
 *                   type: string
 *                   example: "One-time code generated for Emma"
 *       200:
 *         description: Code regenerated for existing child
 *       400:
 *         description: Missing required fields or invalid data
 *       403:
 *         description: Only parents can generate codes
 *       404:
 *         description: Parent profile not found
 *       500:
 *         description: Server error while generating code
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     hasSetPassword:
 *                       type: boolean
 *                 message:
 *                   type: string
 *                   example: "Login successful with one-time code. Please set your password to continue."
 *       400:
 *         description: Missing email or code, or invalid/expired code
 *       401:
 *         description: Invalid email or code
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
 *                 example: "123456"
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     hasSetPassword:
 *                       type: boolean
 *                       example: false
 *                 message:
 *                   type: string
 *                   example: "Code verified successfully. Please set your password to continue."
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *                 message:
 *                   type: string
 *                   example: "Password set successfully. You can now access your account."
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *       401:
 *         description: Refresh token required
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
 *                   example: true
 *                 user:
 *                   type: object
 *                 message:
 *                   type: string
 *                   example: "Token is valid"
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
 *                   example: "Logged out successfully. Token removed from client storage."
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
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Body parsing test success"
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