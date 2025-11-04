import AuditLog from "../models/AuditLog.js";

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
export const exportAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find().lean();
    res.json(logs); // You can later add CSV/JSON download logic here
  } catch (error) {
    res.status(500).json({ error: "Failed to export logs" });
  }
};
