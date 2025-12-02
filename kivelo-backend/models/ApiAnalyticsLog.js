import mongoose from "mongoose";

const AnalyticsLogSchema = new mongoose.Schema(
  {
    route: { type: String, required: true },
    method: { type: String, required: true },
    client: { type: String, default: "unknown" }, // e.g., mobile-app, admin-dashboard
    ip: { type: String },
    statusCode: { type: Number },
    responseTime: { type: Number }, // ms
    timestamp: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

const AnalyticsLog = mongoose.model("AnalyticsLog", AnalyticsLogSchema);
export default AnalyticsLog;
