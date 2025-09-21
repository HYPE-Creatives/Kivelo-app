import jwt from "jsonwebtoken";

const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },  // 👈 matches what your middleware expects
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || "1h" }
  );
};

export default generateToken;
