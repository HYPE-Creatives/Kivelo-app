// constants/index.ts

export const STORAGE_KEYS = {
  CURRENT_USER: "user", // Changed to match the key used in AuthContext
  // Removed USERS as we're not storing all users in localStorage
};

export const ROLES = {
  PARENT: "parent",
  CHILD: "child",
  AI: "ai",
  NULL: null, // Added to match the Role type in AuthContext
} as const;

// Generate a random activation code (8 alphanumeric characters)
export const generateAccessCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Expiration in milliseconds (1 hour)
export const CODE_EXPIRATION = 60 * 60 * 1000;

// Password validation regex (at least 6 characters)
export const PASSWORD_REGEX = /^.{6,}$/;

// Email validation regex
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Response messages
export const AUTH_MESSAGES = {
  INVALID_EMAIL: "Invalid email format",
  USER_NOT_FOUND: "User not found",
  INVALID_PASSWORD: "Invalid password",
  EMAIL_TAKEN: "Email already registered",
  PARENT_NOT_FOUND: "Parent not found",
  INVALID_CODE: "Invalid code",
  CODE_EXPIRED: "Code has expired",
  CODE_USED: "Code has already been used",
  PASSWORD_TOO_SHORT: "Password must be at least 6 characters",
  CHILD_SETUP_REQUIRED: "Please use your one-time code to set up your account first",
} as const;