// utils/tokenCookies.js
import jwt from "jsonwebtoken";

const isProd = process.env.NODE_ENV === "production";

// Default names but can be overridden using env values
export const USER_COOKIE = process.env.REFRESH_COOKIE_NAME || "kivelo_refresh";
export const ADMIN_COOKIE = process.env.ADMIN_REFRESH_COOKIE_NAME || "kivelo_admin_refresh";

// Cookie lifetime
const REFRESH_LIFETIME =
  parseInt(process.env.REFRESH_TOKEN_MAX_AGE_MS, 10) ||
  7 * 24 * 60 * 60 * 1000; // 7 days

// Base cookie options
export const cookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? "none" : "lax",
  maxAge: REFRESH_LIFETIME,
};

// Set refresh cookie
export const setRefreshCookie = (res, cookieName, token, path = "/") => {
  res.cookie(cookieName, token, {
    ...cookieOptions,
    path,
  });
};

// Clear refresh cookie
export const clearRefreshCookie = (res, cookieName, path = "/") => {
  res.clearCookie(cookieName, {
    ...cookieOptions,
    path,
  });
};
