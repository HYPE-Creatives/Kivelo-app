import User from '../models/User.js';
import Parent from '../models/Parent.js';
import Child from '../models/Child.js';
import generateToken from '../utils/generateToken.js';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

// ========================= PARENT REGISTRATION =========================
export const registerParent = async (req, res, next) => {
  try {
    const { email, password, name, phone, dob } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      phone,
      dob,
      role: 'parent',
    });

    const familyCode = crypto.randomBytes(6).toString('hex').toUpperCase();

    const parent = await Parent.create({
      user: user._id,
      familyCode,
      subscription: 'free',
      billing: { plan: 'free', paymentMethod: '', billingAddress: {}, nextBillingDate: null },
      settings: {
        notifications: { email: true, push: true, activityReminders: true, progressReports: true },
        privacy: { shareProgress: false, showInSearch: false },
        limits: { dailyScreenTime: 120, maxActivitiesPerDay: 5 }
      }
    });

    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      token,
      user: { id: user._id, email: user.email, name: user.name, role: user.role, phone: user.phone, dob: user.dob },
      parent: { familyCode: parent.familyCode, subscription: parent.subscription },
      message: 'Registration successful! Welcome to Family Wellness.'
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'A user with this email already exists' });
    }
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }
    res.status(500).json({ success: false, message: 'Server error during registration. Please try again.' });
  }
};

// ========================= LOGIN =========================
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });

    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ success: false, message: 'Invalid email or password' });

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account is deactivated. Please contact support.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid email or password' });

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id, user.role);

    let additionalData = {};
    if (user.role === 'parent') {
      const parent = await Parent.findOne({ user: user._id });
      additionalData = { familyCode: parent?.familyCode, subscription: parent?.subscription };
    } else if (user.role === 'child') {
      const child = await Child.findOne({ user: user._id });
      additionalData = { hasSetPassword: child?.hasSetPassword || false, parentId: child?.parent };
    }

    res.json({
      success: true,
      token,
      user: { id: user._id, email: user.email, name: user.name, role: user.role, phone: user.phone, dob: user.dob },
      ...additionalData,
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login. Please try again.' });
  }
};

// ========================= GENERATE ONE-TIME CODE (PARENT) =========================
export const generateOneTimeCode = async (req, res) => {
  try {
    const { childEmail, childName } = req.body;
    const parentId = req.user._id;

    if (req.user.role !== 'parent') {
      return res.status(403).json({ success: false, message: 'Only parents can generate codes' });
    }

    const parent = await Parent.findOne({ user: parentId });
    if (!parent) return res.status(404).json({ success: false, message: 'Parent not found' });

    const existingUser = await User.findOne({ email: childEmail });
    if (existingUser) return res.status(400).json({ success: false, message: 'User with this email exists' });

    const oneTimeCode = crypto.randomBytes(4).toString('hex').toUpperCase();
    const codeExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    const hashedPassword = await bcrypt.hash(oneTimeCode, 10);

    const childUser = await User.create({
      email: childEmail,
      name: childName,
      password: hashedPassword,
      role: 'child',
      isActive: true
    });

    const child = await Child.create({
      user: childUser._id,
      parent: parentId,
      oneTimeCode,
      codeExpires,
      isCodeUsed: false,
      hasSetPassword: false
    });

    parent.children.push(child._id);
    await parent.save();

    res.json({
      success: true,
      code: oneTimeCode,
      expiresAt: codeExpires,
      childId: childUser._id,
      message: `One-time code generated for ${childName}`
    });
  } catch (error) {
    console.error('Code generation error:', error);
    res.status(500).json({ success: false, message: 'Server error while generating code' });
  }
};

// ========================= CHILD LOGIN WITH CODE =========================
export const childLoginWithCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ success: false, message: 'Email and code required' });

    const user = await User.findOne({ email });
    if (!user || user.role !== 'child') {
      return res.status(401).json({ success: false, message: 'Invalid email or code' });
    }

    const child = await Child.findOne({
      user: user._id,
      oneTimeCode: code,
      isCodeUsed: false,
      codeExpires: { $gt: new Date() }
    });

    if (!child) return res.status(400).json({ success: false, message: 'Invalid or expired code' });

    child.isCodeUsed = true;
    await child.save();

    const token = generateToken(user._id, user.role);

    res.json({
      success: true,
      token,
      user: { id: user._id, email: user.email, name: user.name, role: user.role, hasSetPassword: child.hasSetPassword },
      message: 'Login successful with one-time code. Please set your password to continue.'
    });
  } catch (error) {
    console.error('Child login with code error:', error);
    res.status(500).json({ success: false, message: 'Server error during child login with code' });
  }
};

// ========================= REGISTER CHILD WITH CODE =========================
export const registerChildWithCode = async (req, res) => {
  try {
    const { code, email, name } = req.body;
    if (!code || !email) return res.status(400).json({ success: false, message: 'Code and email required' });

    const child = await Child.findOne({
      oneTimeCode: code,
      isCodeUsed: false,
      codeExpires: { $gt: new Date() }
    }).populate('user');

    if (!child) return res.status(400).json({ success: false, message: 'Invalid or expired code' });
    if (child.user.email !== email) return res.status(400).json({ success: false, message: 'Email does not match the code registration' });

    if (name && name !== child.user.name) {
      child.user.name = name;
      await child.user.save();
    }

    child.isCodeUsed = true;
    await child.save();

    const token = generateToken(child.user._id, child.user.role);

    res.json({
      success: true,
      token,
      user: { id: child.user._id, email: child.user.email, name: child.user.name, role: child.user.role, hasSetPassword: false },
      message: 'Code verified successfully. Please set your password to continue.'
    });
  } catch (error) {
    console.error('Child registration error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration. Please try again.' });
  }
};

// ========================= SET CHILD PASSWORD =========================
export const setChildPassword = async (req, res) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ success: false, message: 'Request body is missing' });
    }

    const { password } = req.body;
    if (!password) return res.status(400).json({ success: false, message: 'Password is required' });
    if (password.length < 6) return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    if (req.user.role !== 'child') return res.status(403).json({ success: false, message: 'Only child accounts can set password' });

    const user = await User.findById(req.user._id);
    user.password = await bcrypt.hash(password, 10);
    await user.save();

    await Child.findOneAndUpdate({ user: req.user._id }, { hasSetPassword: true });

    const token = generateToken(req.user._id, req.user.role);

    res.json({ success: true, token, message: 'Password set successfully. You can now access your account.' });
  } catch (error) {
    console.error('Password set error:', error);
    res.status(500).json({ success: false, message: 'Server error while setting password. Please try again.' });
  }
};

// ========================= VERIFY TOKEN =========================
export const verifyToken = async (req, res) => {
  try {
    res.json({
      success: true,
      user: { id: req.user._id, email: req.user.email, name: req.user.name, role: req.user.role },
      message: 'Token is valid'
    });
  } catch {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// ========================= LOGOUT =========================
export const logout = async (req, res) => {
  try {
    res.json({ success: true, message: 'Logged out successfully. Please remove the token from client storage.' });
  } catch {
    res.status(500).json({ success: false, message: 'Server error during logout' });
  }
};

// ========================= RESET CHILD PASSWORD (PARENT) =========================
export const resetChildPassword = async (req, res) => {
  try {
    const { childId, newPassword } = req.body;
    if (req.user.role !== 'parent') return res.status(403).json({ success: false, message: 'Only parents can reset a child’s password' });

    const child = await Child.findById(childId).populate('user');
    if (!child) return res.status(404).json({ success: false, message: 'Child not found' });

    const user = await User.findById(child.user._id);
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    child.hasSetPassword = true;
    await child.save();

    res.json({ success: true, message: 'Child password has been reset successfully' });
  } catch (error) {
    console.error('Reset child password error:', error);
    res.status(500).json({ success: false, message: 'Server error while resetting child password' });
  }
};

// ========================= DEFAULT EXPORT =========================
export default {
  registerParent,
  login,
  generateOneTimeCode,
  childLoginWithCode,
  registerChildWithCode,
  setChildPassword,
  resetChildPassword,
  verifyToken,
  logout
};
