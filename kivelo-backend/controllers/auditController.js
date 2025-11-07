import AuditLog from "../models/AuditLog.js";
import { Parser as Json2csvParser } from "json2csv";

// ========================= CREATE AUDIT LOG =========================
export const createAuditLog = async (req, res) => {
  try {
    const { action, resource, outcome, level = "info", metadata } = req.body;

    // Attach actor automatically from the admin making the call
    const actor = req.admin
      ? {
          id: req.admin._id,
          model: "Admin",
          ip: req.ip || req.headers["x-forwarded-for"] || "unknown",
        }
      : req.body.actor || {};

    const newLog = await AuditLog.create({
      actor,
      action,
      resource,
      outcome,
      level,
      metadata,
      timestamp: new Date(),
    });

    res.status(201).json({
      success: true,
      message: "Audit log created successfully",
      log: newLog,
    });
  } catch (error) {
    console.error("Error creating audit log:", error);
    res
      .status(500)
      .json({ success: false, error: "Server error while creating audit log" });
  }
};

// ========================= GET ALL AUDIT LOGS =========================
export const getAuditLogs = async (req, res) => {
  try {
    const { page = 1, per_page = 50, action, level, from, to } = req.query;
    const filter = {};

    if (action) filter.action = action;
    if (level) filter.level = level;
    if (from || to) {
      filter.timestamp = {};
      if (from) filter.timestamp.$gte = new Date(from);
      if (to) filter.timestamp.$lte = new Date(to);
    }

    const total = await AuditLog.countDocuments(filter);
    const logs = await AuditLog.find(filter)
      .sort({ timestamp: -1 })
      .skip((page - 1) * per_page)
      .limit(Number(per_page));

    res.json({
      success: true,
      total,
      page: Number(page),
      per_page: Number(per_page),
      items: logs,
    });
  } catch (error) {
    console.error("getAuditLogs:", error);
    res.status(500).json({ success: false, error: "Failed to fetch audit logs" });
  }
};

// ========================= GET SINGLE AUDIT LOG =========================
export const getAuditLogById = async (req, res) => {
  try {
    const log = await AuditLog.findById(req.params.id);
    if (!log)
      return res
        .status(404)
        .json({ success: false, error: "Audit log not found" });
    res.json({ success: true, log });
  } catch (error) {
    console.error("getAuditLogById:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// ========================= EXPORT AUDIT LOGS =========================

export const exportAuditLogs = async (req, res) => {
  try {
    const format = (req.query.format || "csv").toLowerCase();
    const { action, from, to, level } = req.query;

    const filter = {};
    if (action) filter.action = action;
    if (level) filter.level = level;
    if (from || to) {
      filter.timestamp = {};
      if (from) filter.timestamp.$gte = new Date(from);
      if (to) filter.timestamp.$lte = new Date(to);
    }

    const logs = await AuditLog.find(filter).sort({ timestamp: -1 }).lean();

    // If no logs found
    if (!logs.length) {
      return res
        .status(404)
        .json({ success: false, message: "No audit logs found for export" });
    }

    // Handle JSON format
    if (format === "json") {
      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=audit-${Date.now()}.json`
      );
      return res.status(200).json(logs);
    }

    // Handle CSV format
    const parser = new Json2csvParser({
      header: true,
      fields: [
        { label: "Timestamp", value: "timestamp" },
        { label: "Actor ID", value: "actor.id" },
        { label: "Actor Model", value: "actor.model" },
        { label: "IP", value: "actor.ip" },
        { label: "Action", value: "action" },
        { label: "Outcome", value: "outcome" },
        { label: "Level", value: "level" },
        { label: "Resource Type", value: "resource.type" },
        { label: "Resource ID", value: "resource.id" },
        { label: "Metadata", value: (row) => JSON.stringify(row.metadata || {}) },
      ],
    });

    const csv = parser.parse(logs);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=audit-${Date.now()}.csv`
    );
    return res.status(200).send(csv);
  } catch (error) {
    console.error("exportAuditLogs:", error);
    res.status(500).json({ success: false, error: "Failed to export audit logs" });
  }
};
