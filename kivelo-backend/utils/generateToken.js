import jwt from "jsonwebtoken";

const generateToken = (id, role = "user") => {
  if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
    throw new Error("JWT secrets are not defined in environment variables");
  }

  const payload = {
    id,
    role,
    type: role === "admin" ? "admin" : "user",
  };

  // Access token expiry: environment-based or fallback
  const accessExpiresIn =
    process.env.JWT_EXPIRE?.trim() || (role === "admin" ? "8h" : "24h");

  // Refresh token expiry: typically longer
  const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRE?.trim() || "7d";

  // Generate both tokens
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: accessExpiresIn,
  });

  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: refreshExpiresIn,
  });

  return { accessToken, refreshToken };
};

export default generateToken;
