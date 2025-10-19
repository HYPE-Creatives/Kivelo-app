import jwt from "jsonwebtoken";

const generateToken = (id, role = 'user') => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined');
  }

  const payload = { 
    id, 
    role, 
    type: role === 'admin' ? 'admin' : 'user'}; // Matches what middleware expects

  // Prefer env-configured expiry; otherwise use role-based defaults
  const expiresIn = (process.env.JWT_EXPIRE && process.env.JWT_EXPIRE.trim())
    ? process.env.JWT_EXPIRE.trim()
    : (role === 'admin' ? '8h' : '24h');

  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

export default generateToken;
