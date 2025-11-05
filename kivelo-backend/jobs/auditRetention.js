import cron from "node-cron";
import AuditLog from '../models/AuditLog.js';

if (!global.__AUDIT_RETENTION_CRON__) {
  global.__AUDIT_RETENTION_CRON__ = true; // Prevent double-scheduling
  const retentionDays = parseInt(process.env.AUDIT_RETENTION_DAYS || "365", 10);

  cron.schedule("0 2 * * *", async () => {
    try {
      const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
      const result = await AuditLog.updateMany(
        { timestamp: { $lt: cutoff }, archived: false },
        { $set: { archived: true } }
      );
      console.log(`[AUDIT RETENTION] Archived ${result.modifiedCount} logs older than ${retentionDays} days`);
    } catch (err) {
      console.error("[AUDIT RETENTION ERROR]", err);
    }
  });

  console.log("[AUDIT RETENTION] Cron scheduled successfully");
}

// retentionDays default 365 (1 year)
const retentionDays = parseInt(process.env.AUDIT_RETENTION_DAYS || "365", 10);

cron.schedule('0 2 * * *', async () => { // daily at 02:00
  try {
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    // Option 1: mark archived (cheap)
    const r = await AuditLog.updateMany({ timestamp: { $lt: cutoff }, archived: false }, { $set: { archived: true }});
    console.log(`[AUDIT RETENTION] Marked ${r.modifiedCount} logs archived older than ${retentionDays} days`);
    // Option 2: delete older archived logs older than another threshold (per policy)
    // await AuditLog.deleteMany({ timestamp: { $lt: veryOldDate }});
  } catch (err) {
    console.error("[AUDIT RETENTION ERROR]", err);
  }
});
