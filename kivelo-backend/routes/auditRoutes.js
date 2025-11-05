import express from "express";
import {
  getAuditLogs,
  getAuditLogById,
  createAuditLog,
  exportAuditLogs,
} from "../controllers/auditController.js";
import auth from "../middleware/auth.js";
import isAdmin from "../middleware/isAdmin.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Audit
 *   description: Security Audit and Logs Management
 */

/**
 * @swagger
 * /api/audit:
 *   get:
 *     summary: Retrieve paginated audit logs
 *     description: Returns all system audit logs. Requires admin access.
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number (pagination)
 *       - in: query
 *         name: per_page
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of results per page
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         description: Filter logs by action type (e.g., "user.login")
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [info, warning, critical]
 *         description: Filter by severity level
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date (ISO format)
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date (ISO format)
 *     responses:
 *       200:
 *         description: List of audit logs (paginated)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 per_page:
 *                   type: integer
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AuditLog'
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get("/", auth, isAdmin, getAuditLogs);

/**
 * @swagger
 * /api/audit/export:
 *   get:
 *     summary: Export audit logs (CSV or JSON)
 *     description: Download filtered audit logs. Admin only.
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
 *         name: from
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date (ISO format)
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date (ISO format)
 *     responses:
 *       200:
 *         description: Export successful (file download)
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get("/export", auth, isAdmin, exportAuditLogs);

/**
 * @swagger
 * /api/audit/{id}:
 *   get:
 *     summary: Retrieve a single audit log by ID
 *     description: Fetch details of a specific audit log entry.
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Audit log ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Audit log retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuditLog'
 *       404:
 *         description: Audit log not found
 */
router.get("/:id", auth, isAdmin, getAuditLogById);

/**
 * @swagger
 * /api/audit:
 *   post:
 *     summary: Manually create a new audit log entry
 *     description: Creates a new audit log entry (for internal services).
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
 */
router.post("/", auth, isAdmin, createAuditLog);

export default router;
