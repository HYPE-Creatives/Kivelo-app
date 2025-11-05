export default function isAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "Not authenticated" });
  if (!["admin", "superadmin"].includes(req.user.role)) return res.status(403).json({ error: "Forbidden" });
  return next();
}
