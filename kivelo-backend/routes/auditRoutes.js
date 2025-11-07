import express from "express";
import {
  getAuditLogs,
  getAuditLogById,
  createAuditLog,
  exportAuditLogs,
} from "../controllers/auditController.js";
import { requireAdminAuth, requirePermission } from "../middleware/adminMiddleware.js";

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
 *     AuditLog:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "507f1f77bcf86cd799439011"
 *         action:
 *           type: string
 *           example: "user.login"
 *         description:
 *           type: string
 *           example: "User logged in successfully"
 *         level:
 *           type: string
 *           enum: [info, warning, error, critical]
 *           example: "info"
 *         admin:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *             name:
 *               type: string
 *             email:
 *               type: string
 *         user:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *             name:
 *               type: string
 *             email:
 *               type: string
 *         ipAddress:
 *           type: string
 *           example: "192.168.1.100"
 *         userAgent:
 *           type: string
 *           example: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
 *         metadata:
 *           type: object
 *           additionalProperties: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T10:30:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T10:30:00.000Z"
 *     AuditLogInput:
 *       type: object
 *       required:
 *         - action
 *         - description
 *         - level
 *       properties:
 *         action:
 *           type: string
 *           example: "user.login"
 *         description:
 *           type: string
 *           example: "User logged in successfully"
 *         level:
 *           type: string
 *           enum: [info, warning, error, critical]
 *           example: "info"
 *         userId:
 *           type: string
 *           example: "507f1f77bcf86cd799439012"
 *         metadata:
 *           type: object
 *           additionalProperties: true
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
 *   - name: Audit
 *     description: Security Audit Logs Management
 */

// ==================== AUDIT LOGS ROUTES ====================

/**
 * @swagger
 * /api/audit:
 *   get:
 *     summary: Retrieve paginated audit logs
 *     description: Returns system audit logs with filtering and pagination. Accessible by all admins with audit permission.
 *     tags: [Audit]
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
 *           default: 50
 *         description: Number of results per page
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         description: Filter logs by action type (e.g., "user.login", "admin.create")
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [info, warning, error, critical]
 *         description: Filter by severity level
 *       - in: query
 *         name: adminId
 *         schema:
 *           type: string
 *         description: Filter by specific admin ID
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by specific user ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering (YYYY-MM-DD format)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering (YYYY-MM-DD format)
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, action, level]
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of audit logs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 logs:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AuditLog'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                       example: 1
 *                     totalPages:
 *                       type: integer
 *                       example: 5
 *                     totalItems:
 *                       type: integer
 *                       example: 243
 *                     itemsPerPage:
 *                       type: integer
 *                       example: 50
 *                 filters:
 *                   type: object
 *                   description: Applied filters for the query
 *       400:
 *         description: Bad request - Invalid query parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - User doesn't have audit permission
 *       500:
 *         description: Internal server error
 */
router.get("/", requireAdminAuth, requirePermission('audit'), getAuditLogs);

/**
 * @swagger
 * /api/audit/export:
 *   get:
 *     summary: Export audit logs to CSV or JSON
 *     description: Export filtered audit logs for download. Accessible by all admins with audit permission.
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [csv, json]
 *           default: csv
 *         description: Export format
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering (YYYY-MM-DD format)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering (YYYY-MM-DD format)
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         description: Filter logs by action type
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [info, warning, error, critical]
 *         description: Filter by severity level
 *     responses:
 *       200:
 *         description: Export file generated successfully
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *         headers:
 *           Content-Disposition:
 *             schema:
 *               type: string
 *             description: Attachment filename
 *           Content-Type:
 *             schema:
 *               type: string
 *             description: File content type
 *       400:
 *         description: Bad request - Invalid export parameters
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - User doesn't have audit permission
 *       500:
 *         description: Internal server error
 */
router.get("/export", requireAdminAuth, requirePermission('audit'), exportAuditLogs);

/**
 * @swagger
 * /api/audit/{id}:
 *   get:
 *     summary: Retrieve a single audit log by ID
 *     description: Fetch the complete details of a specific audit log entry. Accessible by all admins with audit permission.
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique ID of the audit log
 *     responses:
 *       200:
 *         description: Audit log retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 log:
 *                   $ref: '#/components/schemas/AuditLog'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - User doesn't have audit permission
 *       404:
 *         description: Audit log not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 */
router.get("/:id", requireAdminAuth, requirePermission('audit'), getAuditLogById);

/**
 * @swagger
 * /api/audit:
 *   post:
 *     summary: Create a new audit log entry
 *     description: Manually create a new audit log entry. Typically used for internal system events. Automatically captures the admin making the request.
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuditLogInput'
 *     responses:
 *       201:
 *         description: Audit log created successfully
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
 *                   example: "Audit log created successfully"
 *                 log:
 *                   $ref: '#/components/schemas/AuditLog'
 *       400:
 *         description: Bad request - Missing required fields or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - User doesn't have audit permission
 *       500:
 *         description: Internal server error
 */
router.post("/", requireAdminAuth, requirePermission('audit'), createAuditLog);

export default router;