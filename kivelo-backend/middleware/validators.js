export const requireBodyFields = (...fields) => {
  return (req, res, next) => {
    const missing = fields.filter((f) => !req.body[f]);

    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missing.join(", ")}`,
      });
    }

    next();
  };
};
