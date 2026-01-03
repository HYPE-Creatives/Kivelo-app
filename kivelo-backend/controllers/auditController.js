import AuditLog from "../models/AuditLog.js";
import { Parser as Json2csvParser } from "json2csv";
import mongoose from "mongoose";

// ========================= CREATE AUDIT LOG =========================
// ========================= CREATE AUDIT LOG =========================
export const createAuditLog = async (req, res) => {
  try {
    const {
      action,
      resource,
      outcome = "success",
      level = "info",
      metadata,
      target,
      source = "admin",
    } = req.body;

    const actor = req.admin
      ? {
          id: req.admin._id,
          model: "Admin",
          ip: req.ip || req.headers["x-forwarded-for"] || "unknown",
        }
      : undefined;

    const log = await AuditLog.create({
      actor,
      action,
      target,              // 🔑 CRITICAL FIX
      resource,
      outcome,
      level,
      metadata,
      source,
      request: {
        method: req.method,
        path: req.originalUrl,
        userAgent: req.headers["user-agent"],
      },
    });

    res.status(201).json({
      success: true,
      log,
    });
  } catch (error) {
    console.error("createAuditLog:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create audit log",
    });
  }
};


// ========================= GET ALL AUDIT LOGS =========================
// ========================= GET ALL AUDIT LOGS =========================
export const getAuditLogs = async (req, res) => {
  try {
    const {
      page = 1,
      per_page = 50,
      action,
      level,
      actorId,
      targetId,
      from,
      to,
    } = req.query;

    const filter = {};

    if (action) filter.action = action;
    if (level) filter.level = level;
    if (actorId) filter["actor.id"] = actorId;
    if (targetId) filter["target.id"] = targetId;

    if (from || to) {
      filter.timestamp = {};
      if (from) filter.timestamp.$gte = new Date(from);
      if (to) filter.timestamp.$lte = new Date(to);
    }

    const total = await AuditLog.countDocuments(filter);

    const logs = await AuditLog.find(filter)
      .sort({ timestamp: -1 })
      .skip((page - 1) * per_page)
      .limit(Number(per_page))
      .lean();

    res.json({
      success: true,
      total,
      page: Number(page),
      per_page: Number(per_page),
      items: logs,
    });
  } catch (error) {
    console.error("getAuditLogs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch audit logs",
    });
  }
};


// ========================= GET SINGLE AUDIT LOG =========================
// ========================= GET SINGLE AUDIT LOG =========================
export const getAuditLogById = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent CastError crashes
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid audit log ID",
      });
    }

    const log = await AuditLog.findById(id).lean();

    if (!log) {
      return res.status(404).json({
        success: false,
        message: "Audit log not found",
      });
    }

    res.status(200).json({
      success: true,
      log,
    });
  } catch (error) {
    console.error("getAuditLogById:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch audit log",
    });
  }
};


// ========================= EXPORT AUDIT LOGS =========================

// ========================= EXPORT AUDIT LOGS =========================
export const exportAuditLogs = async (req, res) => {
  try {
    const format = (req.query.format || "csv").toLowerCase();
    const { action, level, actorId, targetId, from, to } = req.query;

    const filter = {};

    if (action) filter.action = action;
    if (level) filter.level = level;
    if (actorId) filter["actor.id"] = actorId;
    if (targetId) filter["target.id"] = targetId;

    if (from || to) {
      filter.timestamp = {};
      if (from) filter.timestamp.$gte = new Date(from);
      if (to) filter.timestamp.$lte = new Date(to);
    }

    const logs = await AuditLog.find(filter)
      .sort({ timestamp: -1 })
      .lean();

    if (!logs.length) {
      return res.status(404).json({
        success: false,
        message: "No audit logs found",
      });
    }

    if (format === "json") {
      return res.json(logs);
    }

    const parser = new Json2csvParser({
      fields: [
        "timestamp",
        "actor.id",
        "actor.model",
        "actor.ip",
        "action",
        "outcome",
        "level",
        "target.model",
        "target.id",
      ],
    });

    const csv = parser.parse(logs);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=audit-${Date.now()}.csv`
    );
    res.send(csv);
  } catch (error) {
    console.error("exportAuditLogs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to export audit logs",
    });
  }
};


// ========================= GET USER ACTIVITY LOGS ========================
export const getUserActivityLogs = async (req, res) => {
  try {
    const { userId } = req.params;
    const { days = 90, limit = 500 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const since = new Date();
    since.setDate(since.getDate() - Number(days));

    const logs = await AuditLog.find({
      timestamp: { $gte: since },
      archived: false,
      $or: [
        { "actor.id": userId },
        { "target.id": userId },
      ],
    })
      .sort({ timestamp: -1 })
      .limit(Number(limit));

    res.json({
      success: true,
      logs,
      count: logs.length,
    });
  } catch (error) {
    console.error("getUserActivityLogs error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user activity logs",
    });
  }
};