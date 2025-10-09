import User from '../models/User.js';
import Parent from '../models/Parent.js';
import Child from '../models/Child.js';
import generateToken from '../utils/generateToken.js';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

// ========================= UTILITY FUNCTIONS =========================
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  return password && password.length >= 6;
};

const createUserResponse = (user, additionalData = {}) => {
  const baseUser = {
    id: user._id,
    email: user.email,
    name: user.name,
    role: user.role,
    phone: user.phone,
    dob: user.dob,
  };
  
  return { ...baseUser, ...additionalData };
};

// ========================= PARENT REGISTRATION =========================
export const registerParent = async (req, res) => {
  try {
    const { email, password, name, phone, dob } = req.body;

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email, password, and name are required' 
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide a valid email address' 
      });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters long' 
      });
    }

    // Check existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ 
        success: false, 
        message: 'User already exists with this email' 
      });
    }

    // Create user (password will be hashed by pre-save hook)
    const user = await User.create({
      email: email.toLowerCase().trim(),
      password: password,
      name: name.trim(),
      phone: phone?.trim(),
      dob,
      role: 'parent',
    });

    // Create parent profile
    const familyCode = crypto.randomBytes(6).toString('hex').toUpperCase();
    const parent = await Parent.create({
      user: user._id,
      familyCode,
      subscription: 'free',
      billing: { 
        plan: 'free', 
        paymentMethod: '', 
        billingAddress: {}, 
        nextBillingDate: null 
      },
      settings: {
        notifications: { 
          email: true, 
          push: true, 
          activityReminders: true, 
          progressReports: true 
        },
        privacy: { 
          shareProgress: false, 
          showInSearch: false 
        },
        limits: { 
          dailyScreenTime: 120, 
          maxActivitiesPerDay: 5 
        }
      }
    });

    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      token,
      user: createUserResponse(user),
      parent: { 
        familyCode: parent.familyCode, 
        subscription: parent.subscription 
      },
      message: 'Registration successful! Welcome to Family Wellness.'
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({ 
        success: false, 
        message: 'A user with this email already exists' 
      });
    }
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed', 
        errors 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Server error during registration. Please try again.' 
    });
  }
};

// ========================= LOGIN =========================
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }

    // Find user with password field
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    
    if (!user) {
      console.warn(`Login failed: No user found for ${email}`);
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Check account status
    if (!user.isActive) {
      return res.status(403).json({ 
        success: false, 
        message: 'Account is deactivated. Please contact support.' 
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password.trim(), user.password);
    if (!isPasswordValid) {
      console.warn(`Login failed: Invalid password for ${email}`);
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id, user.role);

    // Get role-specific data
    let roleData = {};
    if (user.role === 'parent') {
      const parent = await Parent.findOne({ user: user._id });
      if (!parent) {
        return res.status(404).json({ 
          success: false, 
          message: 'Parent profile not found' 
        });
      }
      roleData = { 
        familyCode: parent.familyCode, 
        subscription: parent.subscription 
      };
    } else if (user.role === 'child') {
      const child = await Child.findOne({ user: user._id });
      if (!child) {
        return res.status(404).json({ 
          success: false, 
          message: 'Child profile not found' 
        });
      }
      roleData = { 
        hasSetPassword: child.hasSetPassword || false, 
        parentId: child.parent 
      };
    }

    // Successful response
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      data: {
        user: createUserResponse(user),
        ...roleData,
      },
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during login. Please try again.' 
    });
  }
};

// ========================= GENERATE ONE-TIME CODE =========================
export const generateOneTimeCode = async (req, res) => {
  try {
    const { childEmail, childName } = req.body;
    const parentId = req.user._id;

    // Authorization check
    if (req.user.role !== 'parent') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only parents can generate codes' 
      });
    }

    // Validation
    if (!childEmail || !childName) {
      return res.status(400).json({ 
        success: false, 
        message: 'Child email and name are required' 
      });
    }

    if (!validateEmail(childEmail)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide a valid child email address' 
      });
    }

    const parent = await Parent.findOne({ user: parentId });
    if (!parent) {
      return res.status(404).json({ 
        success: false, 
        message: 'Parent profile not found' 
      });
    }

    // Check for existing user
    const existingUser = await User.findOne({ email: childEmail });
    if (existingUser) {
      return res.status(409).json({ 
        success: false, 
        message: 'User with this email already exists' 
      });
    }

    // Generate code and create child
    const oneTimeCode = crypto.randomBytes(4).toString('hex').toUpperCase();
    const codeExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const childUser = await User.create({
      email: childEmail.toLowerCase().trim(),
      name: childName.trim(),
      password: oneTimeCode,
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

    res.status(201).json({
      success: true,
      code: oneTimeCode,
      expiresAt: codeExpires,
      childId: childUser._id,
      message: `One-time code generated for ${childName}`
    });

  } catch (error) {
    console.error('Code generation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while generating code' 
    });
  }
};

// ========================= CHILD LOGIN WITH CODE =========================
export const childLoginWithCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and code are required' 
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || user.role !== 'child') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or code' 
      });
    }

    const child = await Child.findOne({
      user: user._id,
      oneTimeCode: code.toUpperCase(),
      isCodeUsed: false,
      codeExpires: { $gt: new Date() }
    });

    if (!child) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired code' 
      });
    }

    // Mark code as used
    child.isCodeUsed = true;
    await child.save();

    const token = generateToken(user._id, user.role);

    res.json({
      success: true,
      token,
      user: createUserResponse(user, { hasSetPassword: child.hasSetPassword }),
      message: 'Login successful with one-time code. Please set your password to continue.'
    });

  } catch (error) {
    console.error('Child login with code error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during child login with code' 
    });
  }
};

// ========================= REGISTER CHILD WITH CODE =========================
export const registerChildWithCode = async (req, res) => {
  try {
    const { code, email, name } = req.body;
    
    if (!code || !email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Code and email are required' 
      });
    }

    const child = await Child.findOne({
      oneTimeCode: code.toUpperCase(),
      isCodeUsed: false,
      codeExpires: { $gt: new Date() }
    }).populate('user');

    if (!child) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired code' 
      });
    }

    if (child.user.email !== email.toLowerCase().trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email does not match the code registration' 
      });
    }

    if (name && name.trim() !== child.user.name) {
      child.user.name = name.trim();
      await child.user.save();
    }

    child.isCodeUsed = true;
    await child.save();

    const token = generateToken(child.user._id, child.user.role);

    res.json({
      success: true,
      token,
      user: createUserResponse(child.user, { hasSetPassword: false }),
      message: 'Code verified successfully. Please set your password to continue.'
    });

  } catch (error) {
    console.error('Child registration error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during registration. Please try again.' 
    });
  }
};

// ========================= SET CHILD PASSWORD =========================
export const setChildPassword = async (req, res) => {
  try {
    // Enhanced debugging
    console.log('=== SET CHILD PASSWORD DEBUG ===');
    console.log('Request method:', req.method);
    console.log('Request URL:', req.url);
    console.log('Request headers:', req.headers);
    console.log('Content-Type header:', req.headers['content-type']);
    console.log('Request body exists:', !!req.body);
    console.log('Request body keys:', req.body ? Object.keys(req.body) : 'No body');
    console.log('Full request body:', req.body);
    console.log('User from auth middleware:', req.user ? {
      id: req.user._id,
      email: req.user.email,
      role: req.user.role
    } : 'No user');
    console.log('==============================');

    // Check if body exists
    if (!req.body) {
      return res.status(400).json({ 
        success: false, 
        message: 'Request body is missing. Make sure to send JSON with Content-Type: application/json' 
      });
    }

    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password field is required in the request body' 
      });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters long' 
      });
    }

    if (req.user.role !== 'child') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only child accounts can set password' 
      });
    }

    // Update password (will be hashed by pre-save hook)
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    user.password = password;
    await user.save();

    // Update child record
    await Child.findOneAndUpdate(
      { user: req.user._id }, 
      { hasSetPassword: true }
    );

    const token = generateToken(req.user._id, req.user.role);

    res.json({ 
      success: true, 
      token, 
      message: 'Password set successfully. You can now access your account.' 
    });

  } catch (error) {
    console.error('Password set error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while setting password. Please try again.' 
    });
  }
};

// ========================= VERIFY TOKEN =========================
export const verifyToken = async (req, res) => {
  try {
    res.json({
      success: true,
      user: createUserResponse(req.user),
      message: 'Token is valid'
    });
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      message: 'Invalid token' 
    });
  }
};

// ========================= LOGOUT =========================
export const logout = async (req, res) => {
  try {
    res.json({ 
      success: true, 
      message: 'Logged out successfully. Please remove the token from client storage.' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error during logout' 
    });
  }
};

// ========================= RESET CHILD PASSWORD =========================
export const resetChildPassword = async (req, res) => {
  try {
    const { childId, newPassword } = req.body;

    if (req.user.role !== 'parent') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only parents can reset a child\'s password' 
      });
    }

    if (!childId || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Child ID and new password are required' 
      });
    }

    if (!validatePassword(newPassword)) {
      return res.status(400).json({ 
        success: false, 
        message: 'New password must be at least 6 characters long' 
      });
    }

    const child = await Child.findById(childId).populate('user');
    if (!child) {
      return res.status(404).json({ 
        success: false, 
        message: 'Child not found' 
      });
    }

    // Update password (will be hashed by pre-save hook)
    const user = await User.findById(child.user._id);
    user.password = newPassword;
    await user.save();

    child.hasSetPassword = true;
    await child.save();

    res.json({ 
      success: true, 
      message: 'Child password has been reset successfully' 
    });

  } catch (error) {
    console.error('Reset child password error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while resetting child password' 
    });
  }
};

// ========================= DEFAULT EXPORT =========================
export default {
  registerParent,
  login,
  generateOneTimeCode,
  childLoginWithCode,
  registerChildWithCode, // Now properly exported
  setChildPassword,
  resetChildPassword,
  verifyToken,
  logout
};