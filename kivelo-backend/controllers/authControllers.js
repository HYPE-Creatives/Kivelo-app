import User from '../models/User.js';
import Parent from '../models/Parent.js';
import Child from '../models/Child.js';
import sendEmailViaSendGrid from '../utils/sendEmail.js';
import jwt from 'jsonwebtoken';
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
    isVerified: user.isVerified, // Added this
  };
  
  return { ...baseUser, ...additionalData };
};

// ========================= VERIFICATION FUNCTIONS =========================

// REMOVE THIS DUPLICATE FUNCTION - It's defined twice in your code!
// Keep only one version of verifyEmailWithToken

/**
 * @desc    Verify email using token from verification link
 * @route   GET /api/auth/verify-email/:token
 * @access  Public
 */
export const verifyEmailWithToken = async (req, res) => {
  try {
    const { token } = req.params;
    console.log('🔐 Received verification token:', token); // Debug log

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('🔓 Decoded token:', decoded); // Debug log

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found or token is invalid'
      });
    }

    // Check if already verified
    if (user.isVerified) {
      return res.status(200).json({
        success: true,
        message: 'Email is already verified',
        user: {
          id: user._id,
          email: user.email,
          name: user.name
        }
      });
    }

    // Verify the user
    user.isVerified = true;
    user.verificationCode = null;
    user.verificationCodeExpires = null;
    await user.save();

    const { accessToken, refreshToken } = generateToken(user._id, user.role);
    user.refreshToken = refreshToken;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully! Your account is now active.',
      user: {
        id: user._id,
        email: user.email,
        name: user.name
      },
      redirectUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?verified=true`
    });

  } catch (error) {
    console.error('❌ Token verification error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({
        success: false,
        message: 'Verification link has expired. Please request a new one.',
        needsNewLink: true
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification token format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Verification failed',
      error: error.message
    });
  }
};

/**
 * @desc    Generate new verification link for email
 * @route   POST /api/auth/generate-verification-link
 * @access  Public
 */
export const generateVerificationLink = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this email'
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Account is already verified'
      });
    }

    // Generate new verification token
    const verificationToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const verificationLink = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/verify-email/${verificationToken}`;

    // Send email with verification link
    await sendEmailViaSendGrid(
      user.email,
      "Verify Your Kivelo Account - Click the Link",
      `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f9fafb; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.05); overflow: hidden;">
          <div style="background-color: #4CAF50; color: white; text-align: center; padding: 20px;">
            <h1 style="margin: 0;">Kivelo</h1>
            <p style="margin: 0; font-size: 14px;">Empowering Families with Technology</p>
          </div>
          <div style="padding: 30px;">
            <h2 style="color: #333;">Hello ${user.name},</h2>
            <p style="font-size: 15px; color: #555; line-height: 1.6;">
              Thank you for joining <strong>Kivelo</strong>! To complete your registration, 
              please verify your email address by clicking the button below.
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationLink}" 
                style="background-color: #4CAF50; color: #fff; text-decoration: none; 
                       padding: 12px 24px; border-radius: 6px; font-weight: bold; 
                       display: inline-block;">
                Verify My Account
              </a>
            </div>

            <p style="font-size: 14px; color: #555; line-height: 1.6;">
              Or copy and paste this link in your browser:<br/>
              <code style="background: #f5f5f5; padding: 8px; border-radius: 4px; word-break: break-all;">
                ${verificationLink}
              </code>
            </p>

            <p style="font-size: 14px; color: #555; line-height: 1.6;">
              This link will expire in 24 hours. If you didn't create a Kivelo account, 
              you can safely ignore this email.
            </p>

            <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;" />

            <p style="font-size: 13px; color: #777; text-align: center;">
              Need help? Contact our support team at 
              <a href="mailto:support@kivelo.com" style="color: #4CAF50; text-decoration: none;">support@kivelo.com</a>
            </p>
          </div>
          <div style="background-color: #f1f1f1; text-align: center; padding: 15px; font-size: 12px; color: #888;">
            © ${new Date().getFullYear()} Kivelo. All rights reserved.
          </div>
        </div>
      </div>
      `
    );

    res.status(200).json({
      success: true,
      message: 'Verification link sent to your email'
    });

  } catch (error) {
    console.error('Generate verification link error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send verification link',
      error: error.message
    });
  }
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

    // Generate verification code ONLY (no token)
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationCodeExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Create user (password will be hashed by pre-save hook)
    const user = await User.create({
      email: email.toLowerCase().trim(),
      password: password,
      name: name.trim(),
      phone: phone?.trim(),
      dob,
      role: 'parent',
      isVerified: false,
      verificationCode,
      verificationCodeExpires,
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

    // Send verification email with CODE ONLY (no links)
    // In registerParent function - updated email template
    const getBaseUrl = () => {
      // Use Render's URL in production, localhost in development
      return process.env.NODE_ENV === 'production' 
        ? 'https://family-wellness.onrender.com'
        : 'http://localhost:5000';
    };

const verificationPageLink = `${getBaseUrl()}/api/auth/verify-code-page`;;

    await sendEmailViaSendGrid(
      user.email,
      "Verify Your Kivelo Account - Security Code",
      `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f9fafb; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.05); overflow: hidden;">
          <div style="background-color: #4CAF50; color: white; text-align: center; padding: 20px;">
            <h1 style="margin: 0;">Kivelo</h1>
            <p style="margin: 0; font-size: 14px;">Empowering Families with Technology</p>
          </div>
          <div style="padding: 30px;">
            <h2 style="color: #333;">Hello ${user.name},</h2>
            <p style="font-size: 15px; color: #555; line-height: 1.6;">
              Thank you for joining <strong>Kivelo</strong>! To complete your registration, 
              please use the following verification code:
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <div style="background-color: #4CAF50; color: #fff; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 24px; letter-spacing: 2px;">
                ${verificationCode}
              </div>
            </div>

            <p style="font-size: 14px; color: #555; line-height: 1.6;">
              Click the button below to go directly to the verification page where you can enter this code:
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationPageLink}" 
                style="background-color: #4CAF50; color: #fff; text-decoration: none; 
                      padding: 12px 24px; border-radius: 6px; font-weight: bold; 
                      display: inline-block; font-size: 16px;">
                Go to Verification Page
              </a>
            </div>

            <p style="font-size: 14px; color: #555; line-height: 1.6;">
              Once on the verification page, enter your email and the code above. 
              This code will expire in 24 hours.
            </p>

            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4CAF50;">
              <p style="margin: 0; color: #666; font-size: 14px;">
                <strong>Quick Steps:</strong><br>
                1. Click the button above<br>
                2. Enter the code: <strong>${verificationCode}</strong><br>
                3. Click "Verify Email" to complete
              </p>
            </div>

            <p style="font-size: 12px; color: #777; background: #f8f9fa; padding: 10px; border-radius: 5px;">
              <strong>Security Note:</strong> For your protection, we use one-time codes instead of clickable links with tokens to prevent exposure in browser URLs.
            </p>

            <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;" />

            <p style="font-size: 13px; color: #777; text-align: center;">
              Need help? Contact our support team at 
              <a href="mailto:support@kivelo.com" style="color: #4CAF50; text-decoration: none;">support@kivelo.com</a>
            </p>
          </div>
          <div style="background-color: #f1f1f1; text-align: center; padding: 15px; font-size: 12px; color: #888;">
            © ${new Date().getFullYear()} Kivelo. All rights reserved.
          </div>
        </div>
      </div>
      `
    );

    res.status(201).json({
      success: true,
      user: createUserResponse(user),
      parent: { 
        familyCode: parent.familyCode, 
        subscription: parent.subscription 
      },
      message: 'Registration successful! Please check your email for the verification code.'
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

// ========================= VERIFY EMAIL WITH CODE =========================
export const verifyEmail = async (req, res) => {
  try {
    const { email, verificationCode } = req.body;

    if (!email || !verificationCode) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and verification code are required' 
      });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Check if already verified
    if (user.isVerified) {
      return res.status(400).json({ 
        success: false, 
        message: 'Account is already verified' 
      });
    }

    // Check verification code
    if (user.verificationCode !== verificationCode) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid verification code' 
      });
    }

    // Check if code expired
    if (user.verificationCodeExpires < new Date()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Verification code has expired' 
      });
    }

    // Verify the user
    user.isVerified = true;
    user.verificationCode = null;
    user.verificationCodeExpires = null;
    await user.save();

    // Generate token after verification
    const { accessToken, refreshToken } = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      accessToken,
      refreshToken,
      user: createUserResponse(user),
      message: 'Email verified successfully! Your account is now active.'
    });

  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Verification failed', 
      error: error.message 
    });
  }
};

// ========================= RESEND VERIFICATION CODE =========================
export const resendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    if (user.isVerified) {
      return res.status(400).json({ 
        success: false, 
        message: 'Account is already verified' 
      });
    }

    // Generate new verification code and token
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationCodeExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const verificationToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const verificationLink = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/verify-email/${verificationToken}`;

    // Save verification code to user
    user.verificationCode = verificationCode;
    user.verificationCodeExpires = verificationCodeExpires;
    await user.save();

   // In registerParent function - use this simplified email
    await sendEmailViaSendGrid(
      user.email,
      "Verify Your Kivelo Account - Security Code",
      `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f9fafb; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.05); overflow: hidden;">
          <div style="background-color: #4CAF50; color: white; text-align: center; padding: 20px;">
            <h1 style="margin: 0;">Kivelo</h1>
            <p style="margin: 0; font-size: 14px;">Empowering Families with Technology</p>
          </div>
          <div style="padding: 30px;">
            <h2 style="color: #333;">Hello ${user.name},</h2>
            <p style="font-size: 15px; color: #555; line-height: 1.6;">
              For security reasons, please use this one-time code to verify your email:
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <div style="background-color: #4CAF50; color: #fff; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 24px; letter-spacing: 2px;">
                ${verificationCode}
              </div>
            </div>

            <p style="font-size: 14px; color: #555; line-height: 1.6;">
              Enter this code on the verification page. This code will expire in 24 hours.
            </p>

            <p style="font-size: 12px; color: #777; background: #f8f9fa; padding: 10px; border-radius: 5px;">
              <strong>Security Note:</strong> For your protection, we use one-time codes instead of clickable links to prevent token exposure in browser URLs.
            </p>

            <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;" />

            <p style="font-size: 13px; color: #777; text-align: center;">
              Need help? Contact our support team at 
              <a href="mailto:support@kivelo.com" style="color: #4CAF50; text-decoration: none;">support@kivelo.com</a>
            </p>
          </div>
          <div style="background-color: #f1f1f1; text-align: center; padding: 15px; font-size: 12px; color: #888;">
            © ${new Date().getFullYear()} Kivelo. All rights reserved.
          </div>
        </div>
      </div>
      `
    );

    res.status(200).json({
      success: true,
      message: 'New verification code sent to your email'
    });

  } catch (error) {
    console.error('Resend verification code error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to resend verification code', 
      error: error.message 
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

    // Check if user is verified
    if (!user.isVerified) {
      return res.status(403).json({ 
        success: false, 
        message: 'Please verify your email before logging in. Check your email for the verification code.',
        needsVerification: true,
        email: user.email
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
    const { accessToken, refreshToken } = generateToken(user._id, user.role);

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
      accessToken,
      refreshToken,
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

// ========================= FORGOT PASSWORD =========================
/**
 * @desc    Request password reset
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      // For security, don't reveal if email exists or not
      return res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset code has been sent.'
      });
    }

    // Check if user is verified
    if (!user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Please verify your email before resetting password'
      });
    }

    // Generate reset token (6-digit code)
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    const resetTokenExpires = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

    // Save reset token to user
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpires;
    await user.save();

    // Send email with reset code
    await sendEmailViaSendGrid(
      user.email,
      "Reset Your Kivelo Password",
      `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f9fafb; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.05); overflow: hidden;">
          <div style="background-color: #4CAF50; color: white; text-align: center; padding: 20px;">
            <h1 style="margin: 0;">Kivelo</h1>
            <p style="margin: 0; font-size: 14px;">Empowering Families with Technology</p>
          </div>
          <div style="padding: 30px;">
            <h2 style="color: #333;">Password Reset Request</h2>
            <p style="font-size: 15px; color: #555; line-height: 1.6;">
              Hello ${user.name},<br><br>
              We received a request to reset your password for your Kivelo account. 
              Use the verification code below to reset your password:
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <div style="background-color: #4CAF50; color: #fff; padding: 15px 30px; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 28px; letter-spacing: 3px; border: 2px dashed #fff;">
                ${resetToken}
              </div>
            </div>

            <p style="font-size: 14px; color: #555; line-height: 1.6;">
              <strong>Important:</strong> This code will expire in 1 hour for security reasons.
            </p>

            <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
              <p style="margin: 0; color: #856404; font-size: 14px;">
                <strong>Security Tip:</strong> If you didn't request this password reset, 
                please ignore this email and ensure your account is secure.
              </p>
            </div>

            <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;" />

            <p style="font-size: 13px; color: #777; text-align: center;">
              Need help? Contact our support team at 
              <a href="mailto:support@kivelo.com" style="color: #4CAF50; text-decoration: none;">support@kivelo.com</a>
            </p>
          </div>
          <div style="background-color: #f1f1f1; text-align: center; padding: 15px; font-size: 12px; color: #888;">
            © ${new Date().getFullYear()} Kivelo. All rights reserved.
          </div>
        </div>
      </div>
      `
    );

    res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a password reset code has been sent.'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process password reset request',
      error: error.message
    });
  }
};

// ========================= VERIFY RESET TOKEN =========================
/**
 * @desc    Verify reset token
 * @route   POST /api/auth/verify-reset-token
 * @access  Public
 */
export const verifyResetToken = async (req, res) => {
  try {
    const { email, resetToken } = req.body;

    if (!email || !resetToken) {
      return res.status(400).json({
        success: false,
        message: 'Email and reset token are required'
      });
    }

    const user = await User.findOne({ 
      email: email.toLowerCase().trim(),
      resetPasswordToken: resetToken,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Reset token is valid'
    });

  } catch (error) {
    console.error('Verify reset token error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify reset token',
      error: error.message
    });
  }
};

// ========================= RESET PASSWORD =========================
/**
 * @desc    Reset password with token
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
export const resetPassword = async (req, res) => {
  try {
    const { email, resetToken, newPassword } = req.body;

    if (!email || !resetToken || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, reset token, and new password are required'
      });
    }

    if (!validatePassword(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Find user with valid reset token
    const user = await User.findOne({ 
      email: email.toLowerCase().trim(),
      resetPasswordToken: resetToken,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Update password
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Send confirmation email
    await sendEmailViaSendGrid(
      user.email,
      "Your Kivelo Password Has Been Reset",
      `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f9fafb; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.05); overflow: hidden;">
          <div style="background-color: #4CAF50; color: white; text-align: center; padding: 20px;">
            <h1 style="margin: 0;">Kivelo</h1>
            <p style="margin: 0; font-size: 14px;">Empowering Families with Technology</p>
          </div>
          <div style="padding: 30px;">
            <h2 style="color: #333;">Password Reset Successful</h2>
            <p style="font-size: 15px; color: #555; line-height: 1.6;">
              Hello ${user.name},<br><br>
              Your Kivelo account password has been successfully reset.
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <div style="background-color: #4CAF50; color: #fff; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block;">
                ✅ Password Updated
              </div>
            </div>

            <div style="background: #d4edda; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
              <p style="margin: 0; color: #155724; font-size: 14px;">
                <strong>Security Notice:</strong> If you did not perform this action, 
                please contact our support team immediately at 
                <a href="mailto:support@kivelo.com" style="color: #155724; text-decoration: underline;">support@kivelo.com</a>
              </p>
            </div>

            <p style="font-size: 14px; color: #555; line-height: 1.6;">
              You can now log in to your account with your new password.
            </p>

            <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;" />

            <p style="font-size: 13px; color: #777; text-align: center;">
              Need help? Contact our support team at 
              <a href="mailto:support@kivelo.com" style="color: #4CAF50; text-decoration: none;">support@kivelo.com</a>
            </p>
          </div>
          <div style="background-color: #f1f1f1; text-align: center; padding: 15px; font-size: 12px; color: #888;">
            © ${new Date().getFullYear()} Kivelo. All rights reserved.
          </div>
        </div>
      </div>
      `
    );

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
      error: error.message
    });
  }
};

// ========================= REFRESH ACCESS TOKEN =========================
export const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ message: 'Refresh token required' });

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== refreshToken)
      return res.status(403).json({ message: 'Invalid refresh token' });

    const { accessToken, refreshToken: newRefreshToken } = generateToken(user._id, user.role);
    user.refreshToken = newRefreshToken;
    await user.save();

    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(403).json({ message: 'Invalid or expired refresh token' });
  }
};

  // ========================= GENERATE / REGENERATE ONE-TIME CODE =========================
  // helper to create a short human-friendly code, or use whatever generator you have
  function createOneTimeCode(len = 6) {
    // numeric code e.g. 123456
    let code = '';
    for (let i = 0; i < len; i++) code += Math.floor(Math.random() * 10);
    return code;
  }

// ========================= GENERATE / REGENERATE ONE-TIME CODE =========================
  export const generateOneTimeCode = async (req, res) => {
    try {
      // --- Logging to make debugging easy (remove / reduce in production) ---
      console.log('📥 generateOneTimeCode req.body:', req.body);
      console.log('📥 generateOneTimeCode req.user:', req.user && { id: req.user.id || req.user._id });

      // --- Read fields from body ---
      // Accept either camelCase or lower-case keys just to be robust:
      const childName = req.body.childName ?? req.body.name ?? '';
      const childEmail = req.body.childEmail ?? req.body.email ?? '';
      const childDOB = req.body.childDOB ?? req.body.dob ?? '';
      const childGender = req.body.childGender ?? req.body.gender ?? 'prefer_not_to_say';

      // Parent can come from req.user (from JWT) or body.parentId (fallback)
      const parentId = (req.user && (req.user.id || req.user._id)) || req.body.parentId;
      
      // --- Basic validation ---
      if (!childName || !childEmail || !childDOB) {
        return res.status(400).json({
          success: false,
          message: 'Child email, name, and DOB are required',
        });
      }

      // email format quick check
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(String(childEmail).trim().toLowerCase())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid child email format',
        });
      }

      // DOB format optional check (YYYY-MM-DD)
      const dobRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dobRegex.test(String(childDOB))) {
        // not fatal — you can relax if you accept other formats. For now return error to match frontend expectations.
        return res.status(400).json({
          success: false,
          message: 'Invalid DOB format. Use YYYY-MM-DD',
        });
      }

      // --- Check if a User already exists with this email ---
      const existingUser = await User.findOne({ email: childEmail.trim().toLowerCase() });

      // If a user exists and is already a child (or not allowed), you may want to block:
      if (existingUser && existingUser.role === 'child') {
        // If you want to allow regeneration of code for an existing child user that's already registered,
        // you would handle that here (e.g., create/reset oneTimeCode on their Child record).
        return res.status(400).json({
          success: false,
          message: 'Email is already registered as a child. Try resetting password instead.',
        });
      }

      // --- If parentId not available, error out ---
      if (!parentId) {
        return res.status(401).json({
          success: false,
          message: 'Parent authentication required',
        });
      }

      // --- Create a new User record for the child if needed ---
      let childUser = existingUser;
      if (!childUser) {
        childUser = new User({
          name: childName.trim(),
          email: childEmail.trim().toLowerCase(),
          role: 'child',
          // You may want to store a placeholder password or null. Ensure schema allows it.
          password: crypto.randomBytes(16).toString('hex'), // random placeholder — they will set password
        });
        await childUser.save();
      } else {
        // existing user exists but not role child — optionally set role to child
        childUser.role = 'child';
        await childUser.save();
      }

      // --- Create or update Child document that links parent and child user ---
      let childDoc = await Child.findOne({ user: childUser._id });
      const oneTimeCode = createOneTimeCode(6);
      const codeExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      if (childDoc) {
        // update relevant fields and reset code
        childDoc.parent = parentId;
        childDoc.oneTimeCode = oneTimeCode;
        childDoc.codeExpires = codeExpires;
        // update any fields if provided
        childDoc.dob = childDOB;
        childDoc.gender = childGender || childDoc.gender || 'prefer_not_to_say';
        await childDoc.save();
      } else {
        // create
        childDoc = await Child.create({
          user: childUser._id,
          parent: parentId,
          oneTimeCode,
          codeExpires,
          dob: childDOB,
          gender: childGender || 'prefer_not_to_say',
          isCodeUsed: false,
          hasSetPassword: false,
        });
      }

      // optional: send email to child parent email or child's email with the code
      try {
        // adapt your email template / function
        await sendEmail({
          to: childEmail,
          subject: 'Your one-time registration code',
          text: `Hello ${childName},\n\nYour one-time registration code is: ${oneTimeCode}\nIt expires at ${codeExpires.toISOString()}\n\nIf you did not request this, ignore this message.`,
        });
      } catch (emailErr) {
        console.warn('⚠️ Failed to send email (non-fatal):', emailErr);
      }

      // Return success with the code (so frontend can show it)
      return res.status(200).json({
        success: true,
        message: 'One-time code generated',
        code: oneTimeCode,
        expiresAt: codeExpires.toISOString(),
        child: {
          id: childUser._id,
          email: childUser.email,
          name: childUser.name,
        },
      });
    } catch (err) {
      console.error('🔥 generateOneTimeCode error:', err);
      return res.status(500).json({
        success: false,
        message: 'Server error generating code',
        error: err.message,
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

    const { accessToken, refreshToken } = generateToken(user._id, user.role);

    res.json({
      success: true,
      accessToken,
      refreshToken,
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

    const { accessToken, refreshToken } = generateToken(child.user._id, child.user.role);

    res.json({
      success: true,
      accessToken,
      refreshToken,
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

    const { accessToken, refreshToken } = generateToken(req.user._id, req.user.role);

    res.json({ 
      success: true, 
      accessToken, 
      refreshToken, 
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
    const user = await User.findById(req.user._id);
    if (user) {
      user.refreshToken = null;
      await user.save();
    }
    res.json({ 
      success: true, 
      message: 'Logged out successfully. Token removed from client storage.' 
    }); // Token removed from client storage.' 
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
  forgotPassword,
  verifyResetToken,
  resetPassword,
  verifyEmail, // NEW: Added email verification with code
  verifyEmailWithToken, 
  generateVerificationLink,
  resendVerificationCode, // NEW: Added resend verification code
  generateOneTimeCode,
  childLoginWithCode,
  registerChildWithCode,
  setChildPassword,
  resetChildPassword,
  refreshAccessToken,
  verifyToken,
  logout
};