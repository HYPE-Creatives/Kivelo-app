import express from "express";
import {
  getAuditLogs,
  getAuditLogById,
  createAuditLog,
  exportAuditLogs,
} from "../controllers/auditController.js";

const router = express.Router();

/**
 * @swagger
 * /api/audit:
 *   get:
 *     summary: Get all audit logs
 *     tags: [Audit]
 *     responses:
 *       200:
 *         description: List of all audit logs
 */
router.get("/", getAuditLogs);

/**
 * @swagger
 * /api/audit/{id}:
 *   get:
 *     summary: Get a single audit log by ID
 *     tags: [Audit]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The audit log ID
 *     responses:
 *       200:
 *         description: Audit log found
 *       404:
 *         description: Audit log not found
 */
router.get("/:id", getAuditLogById);

/**
 * @swagger
 * /api/audit:
 *   post:
 *     summary: Create a new audit log
 *     tags: [Audit]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               actor:
 *                 type: object
 *               action:
 *                 type: string
 *               resource:
 *                 type: object
 *               outcome:
 *                 type: string
 *               level:
 *                 type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Audit log created
 */
router.post("/", createAuditLog);

/**
 * @swagger
 * /api/audit/export:
 *   get:
 *     summary: Export audit logs
 *     tags: [Audit]
 *     responses:
 *       200:
 *         description: Export successful
 */
router.get("/export", exportAuditLogs);

export default router;
