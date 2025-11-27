import jwt from "jsonwebtoken";

/**
 * Generate access + refresh tokens for USER or ADMIN
 * @param {string} id - The _id of the User or Admin
 * @param {"user" | "parent" | "child" | "admin" | "super_admin"} role
 */
const generateToken = (id, role) => {
  if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
    throw new Error("JWT secrets not defined");
  }

  // Normalize role for consistency
  const isAdmin = ["admin", "super_admin", "guest_admin"].includes(role);

  const payload = {
    id,
    role,
    type: isAdmin ? "admin" : "user",  // VERY IMPORTANT: avoids mixing
  };

  // ACCESS TOKEN LIFETIME
  const accessExpiresIn = isAdmin
    ? (process.env.ADMIN_ACCESS_EXPIRE || "6h")
    : (process.env.USER_ACCESS_EXPIRE || "24h");

  // REFRESH TOKEN LIFETIME
  const refreshExpiresIn = isAdmin
    ? (process.env.ADMIN_REFRESH_EXPIRE || "7d")
    : (process.env.USER_REFRESH_EXPIRE || "7d");

  // ISSUE ACCESS TOKEN
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: accessExpiresIn,
  });

  // ISSUE REFRESH TOKEN
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: refreshExpiresIn,
  });

  return { accessToken, refreshToken };
};

export default generateToken;
