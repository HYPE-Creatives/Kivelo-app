import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import auth from "../middleware/auth.js";
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
  logout,
} from "../controllers/authControllers.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Authentication and authorization endpoints for Parents and Children
 */

/**
 * @swagger
 * /api/auth/register-parent:
 *   post:
 *     summary: Register a new parent
 *     tags: [Auth]
 *     description: Creates a new parent account.
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
 *                 example: "parent@kivelo.com"
 *               password:
 *                 type: string
 *                 example: "Parent@123"
 *     responses:
 *       201:
 *         description: Parent registered successfully
 *       400:
 *         description: Invalid or missing fields
 */
router.post("/register-parent", registerParent);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login as a user (Parent or Admin)
 *     tags: [Auth]
 *     description: Authenticate a user and issue JWT token.
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
 *                 example: "parent@kivelo.com"
 *               password:
 *                 type: string
 *                 example: "Parent@123"
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post("/login", login);

/**
 * @swagger
 * /api/auth/verify-email:
 *   post:
 *     summary: Verify email
 *     tags: [Auth]
 *     description: Verify user email using a 6-digit code.
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
 *                 example: "parent@kivelo.com"
 *               code:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired verification code
 */
router.post("/verify-email", verifyEmail);

/**
 * @swagger
 * /api/auth/resend-verification:
 *   post:
 *     summary: Resend verification email
 *     tags: [Auth]
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
 *                 example: "parent@kivelo.com"
 *     responses:
 *       200:
 *         description: Verification code resent successfully
 */
router.post("/resend-verification", resendVerificationCode);

/**
 * @swagger
 * /api/auth/verify-code-page:
 *   get:
 *     summary: Serve email verification page
 *     tags: [Auth]
 *     description: Serves an HTML page where users can enter their 6-digit verification code.
 */
router.get("/verify-code-page", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/verify-code.html"));
});

/**
 * @swagger
 * /api/auth/child-login:
 *   post:
 *     summary: Child login using one-time code
 *     tags: [Auth]
 *     description: Authenticate a child using a parent-generated code.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *                 example: "ABC123"
 *     responses:
 *       200:
 *         description: Child login successful
 *       401:
 *         description: Invalid or expired code
 */
router.post("/child-login", childLoginWithCode);

/**
 * @swagger
 * /api/auth/register-child:
 *   post:
 *     summary: Register a new child using one-time code
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 example: "ABC123"
 *     responses:
 *       201:
 *         description: Child registered successfully
 *       400:
 *         description: Invalid or expired code
 */
router.post("/register-child", registerChildWithCode);

/**
 * @swagger
 * /api/auth/generate-code:
 *   post:
 *     summary: Generate one-time child registration code
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     description: Allows a parent to generate a one-time code for their child registration.
 *     responses:
 *       200:
 *         description: Code generated successfully
 */
router.post("/generate-code", auth, generateOneTimeCode);

/**
 * @swagger
 * /api/auth/set-child-password:
 *   post:
 *     summary: Set child's password
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - childId
 *               - password
 *             properties:
 *               childId:
 *                 type: string
 *                 example: "6721b2f0b6c67a00e"
 *               password:
 *                 type: string
 *                 example: "Child@123"
 *     responses:
 *       200:
 *         description: Child password set successfully
 */
router.post("/set-child-password", auth, setChildPassword);

/**
 * @swagger
 * /api/auth/reset-child-password:
 *   post:
 *     summary: Reset child's password (Parent only)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               childId:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 example: "NewChild@123"
 *     responses:
 *       200:
 *         description: Child password reset successfully
 */
router.post("/reset-child-password", auth, resetChildPassword);

/**
 * @swagger
 * /api/auth/verify-token:
 *   get:
 *     summary: Verify JWT token validity
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     description: Checks if provided JWT token is valid.
 *     responses:
 *       200:
 *         description: Token is valid
 *       401:
 *         description: Invalid or expired token
 */
router.get("/verify-token", auth, verifyToken);

/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     summary: Refresh JWT token
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     description: Refreshes the user’s JWT token with a new expiration period.
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 */
router.post("/refresh-token", auth, refreshAccessToken);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     description: Logs out the user (client should discard token).
 *     responses:
 *       200:
 *         description: User logged out successfully
 */
router.post("/logout", auth, logout);

/**
 * @swagger
 * /api/auth/test-body-parsing:
 *   post:
 *     summary: Test request body parsing
 *     tags: [Auth]
 *     description: Debug endpoint to test server body parsing.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             example:
 *               test: "Hello World"
 *     responses:
 *       200:
 *         description: Body parsed successfully
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
