// controllers/analyticsController.js
import ApiAnalytics from "../models/ApiAnalyticsLog.js";
import { getCache, setCache } from "../utils/cache.js";

/**
 * Build mongo filter
 */
const buildFilter = ({ from, to, route, client }) => {
  const q = {};
  if (from || to) {
    q.timestamp = {};
    if (from) q.timestamp.$gte = new Date(from);
    if (to) q.timestamp.$lte = new Date(to);
  }
  if (route) q.route = route;
  if (client) q.clientType = client;
  return q;
};

const makeCacheKey = (prefix, obj) => {
  // stable representation of query
  const parts = [];
  Object.keys(obj).sort().forEach(k => {
    if (obj[k]) parts.push(`${k}=${obj[k]}`);
  });
  return `${prefix}:${parts.join("&") || "all"}`;
};

// GET /api/analytics/routes
export const getRoutes = async (req, res, next) => {
  try {
    const cacheKey = makeCacheKey("analytics:routes", {});
    const cached = await getCache(cacheKey);
    if (cached) return res.json({ routes: cached });

    const routes = await ApiAnalytics.distinct("route");
    await setCache(cacheKey, routes, 300); // 5 min
    res.json({ routes });
  } catch (err) {
    next(err);
  }
};

// GET /api/analytics/stats  (for dashboard cards + chart)
export const getStats = async (req, res, next) => {
  try {
    const { from, to, route, client } = req.query;
    const filter = buildFilter({ from, to, route, client });
    const cacheKey = makeCacheKey("analytics:stats", { from, to, route, client });
    const cached = await getCache(cacheKey);
    if (cached) return res.json(cached);

    const logs = await ApiAnalytics.find(filter).sort({ timestamp: 1 });

    const totalRequests = logs.length;
    const uniqueRoutes = new Set(logs.map(l => l.route)).size;
    const uniqueClients = new Set(logs.map(l => l.clientType)).size;

    // Group by date (day) — adjust to hour if needed
    const map = new Map();
    logs.forEach(l => {
      const d = l.timestamp.toISOString().slice(0, 10);
      map.set(d, (map.get(d) || 0) + 1);
    });

    const chartLabels = Array.from(map.keys());
    const chartData = Array.from(map.values());

    const result = { totalRequests, uniqueRoutes, uniqueClients, chartLabels, chartData };
    await setCache(cacheKey, result, 30); // 30s
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// GET /api/analytics/summary (aggregated routes count)
export const getSummary = async (req, res, next) => {
  try {
    const { from, to, route, client } = req.query;
    const filter = buildFilter({ from, to, route, client });
    const cacheKey = makeCacheKey("analytics:summary", { from, to, route, client });
    const cached = await getCache(cacheKey);
    if (cached) return res.json(cached);

    const summary = await ApiAnalytics.aggregate([
      { $match: filter },
      { $group: { _id: "$route", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    await setCache(cacheKey, summary, 30);
    res.json(summary);
  } catch (err) {
    next(err);
  }
};

// GET /api/analytics/time-series?unit=hour|day
export const getTimeSeries = async (req, res, next) => {
  try {
    const { from, to, route, client, unit = "hour" } = req.query;
    const filter = buildFilter({ from, to, route, client });
    const cacheKey = makeCacheKey("analytics:timeseries", { from, to, route, client, unit });
    const cached = await getCache(cacheKey);
    if (cached) return res.json(cached);

    const groupFormat = unit === "day"
      ? { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } }
      : { $dateToString: { format: "%Y-%m-%d %H:00", date: "$timestamp" } };

    const series = await ApiAnalytics.aggregate([
      { $match: filter },
      { $group: { _id: groupFormat, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    await setCache(cacheKey, series, 20);
    res.json(series);
  } catch (err) {
    next(err);
  }
};
