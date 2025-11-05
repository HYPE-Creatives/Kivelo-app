import AuditLog from "../models/AuditLog.js";
import { Parser as Json2csvParser } from "json2csv";

// ========================= CREATE AUDIT LOG =========================
export const createAuditLog = async (req, res) => {
  try {
    const { actor, action, resource, outcome, level, metadata } = req.body;

    const newLog = await AuditLog.create({
      actor,
      action,
      resource,
      outcome,
      level,
      metadata,
    });

    res.status(201).json(newLog);
  } catch (error) {
    console.error("Error creating audit log:", error);
    res.status(500).json({ error: "Server error while creating audit log" });
  }
};

// ========================= GET ALL AUDIT LOGS =========================
export const getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(100);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch audit logs" });
  }
};

// ========================= GET SINGLE AUDIT LOG =========================
export const getAuditLogById = async (req, res) => {
  try {
    const log = await AuditLog.findById(req.params.id);
    if (!log) return res.status(404).json({ error: "Audit log not found" });
    res.json(log);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// ========================= EXPORT AUDIT LOGS =========================
/**
 * GET /api/audit/export?format=csv|json&from=&to=&action=
 * Admin only
 */
export const exportAuditLogs = async (req, res) => {
  try {
    const format = (req.query.format || "csv").toLowerCase();
    const filter = {}; // similar to listAuditLogs; keep it concise
    if (req.query.action) filter.action = req.query.action;
    if (req.query.from || req.query.to) {
      filter.timestamp = {};
      if (req.query.from) filter.timestamp.$gte = new Date(req.query.from);
      if (req.query.to) filter.timestamp.$lte = new Date(req.query.to);
    }

    const cursor = AuditLog.find(filter).sort({ timestamp: -1 }).cursor();

    if (format === "json") {
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename="audit-${Date.now()}.json"`);
      res.write("[");
      let first = true;
      for await (const doc of cursor) {
        if (!first) res.write(",");
        res.write(JSON.stringify(doc));
        first = false;
      }
      res.write("]");
      return res.end();
    }

    // CSV stream (transform each doc)
    const rows = [];
    for await (const doc of cursor) {
      rows.push({
        timestamp: doc.timestamp,
        actorId: doc.actor?.id,
        actorModel: doc.actor?.model,
        ip: doc.actor?.ip,
        action: doc.action,
        outcome: doc.outcome,
        resourceType: doc.resource?.type,
        resourceId: doc.resource?.id,
        metadata: JSON.stringify(doc.metadata || {}),
      });
      // flush in batches if very large (left as exercise)
    }

    const parser = new Json2csvParser({ header: true });
    const csv = parser.parse(rows);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="audit-${Date.now()}.csv"`);
    return res.send(csv);
  } catch (err) {
    console.error("exportAuditLogs:", err);
    res.status(500).json({ error: "Failed to export audit logs" });
  }
};

/**
 * GET /api/audit
 * Query params: page, per_page, action, actorId, level, from, to
 */
export const listAuditLogs = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || "1"));
    const per_page = Math.min(1000, parseInt(req.query.per_page || "50"));
    const filter = {};

    if (req.query.action) filter.action = req.query.action;
    if (req.query.actorId) filter["actor.id"] = req.query.actorId;
    if (req.query.level) filter.level = req.query.level;
    if (req.query.from || req.query.to) {
      filter.timestamp = {};
      if (req.query.from) filter.timestamp.$gte = new Date(req.query.from);
      if (req.query.to) filter.timestamp.$lte = new Date(req.query.to);
    }

    const total = await AuditLog.countDocuments(filter);
    const items = await AuditLog.find(filter)
      .sort({ timestamp: -1 })
      .skip((page - 1) * per_page)
      .limit(per_page)
      .lean();

    res.json({ total, page, per_page, items });
  } catch (err) {
    console.error("listAuditLogs:", err);
    res.status(500).json({ error: "Failed to fetch audit logs" });
  }
};

