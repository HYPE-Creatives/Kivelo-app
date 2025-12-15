import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import Parent from '../models/Parent.js';
import generateToken from '../utils/generateToken.js';

// Initialize Google OAuth client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Verify Google ID token and extract user info
 * @param {string} idToken - Google ID token from client
 * @returns {object} - User info from Google
 */
const verifyGoogleToken = async (idToken) => {
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: [
        process.env.GOOGLE_CLIENT_ID,           // Web client ID
        process.env.GOOGLE_ANDROID_CLIENT_ID,   // Android client ID (if different)
        process.env.GOOGLE_IOS_CLIENT_ID,       // iOS client ID (if different)
      ].filter(Boolean), // Remove undefined values
    });
    
    const payload = ticket.getPayload();
    
    return {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      emailVerified: payload.email_verified,
    };
  } catch (error) {
    console.error('Google token verification error:', error);
    throw new Error('Invalid Google token');
  }
};

/**
 * Generate unique family code for parent
 */
const generateFamilyCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'FAM-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

/**
 * Google OAuth Login/Register for Parents
 * POST /api/v1/auth/google
 * 
 * Flow:
 * 1. Client gets Google ID token via expo-auth-session
 * 2. Client sends ID token to this endpoint
 * 3. Backend verifies token with Google
 * 4. Backend creates/finds user and returns JWT tokens
 */
export const googleAuth = async (req, res) => {
  try {
    const { idToken, accessToken: googleAccessToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'Google ID token is required'
      });
    }

    // Verify the Google token
    let googleUser;
    try {
      googleUser = await verifyGoogleToken(idToken);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired Google token'
      });
    }

    const { googleId, email, name, picture, emailVerified } = googleUser;

    // Check if user exists with this Google ID
    let user = await User.findOne({ googleId });

    if (user) {
      // Existing Google user - check if it's a parent
      if (user.role !== 'parent') {
        return res.status(403).json({
          success: false,
          message: 'Google sign-in is only available for parent accounts'
        });
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Get parent profile for familyCode
      const parent = await Parent.findOne({ user: user._id });

      // Generate tokens
      const tokens = generateToken(user._id, user.role);

      // Save refresh token
      user.refreshToken = tokens.refreshToken;
      await user.save();

      // Set refresh token in HTTP-only cookie
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        accessToken: tokens.accessToken,
        data: {
          user: {
            _id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
            avatar: user.avatar,
            isVerified: user.isVerified,
            authProvider: user.authProvider,
          },
          familyCode: parent?.familyCode,
          subscription: parent?.subscription || 'free',
        }
      });
    }

    // Check if email already exists with local auth
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    
    if (existingUser) {
      // Email exists but with different auth method
      if (existingUser.authProvider === 'local') {
        // Option 1: Link accounts (merge Google with existing local account)
        existingUser.googleId = googleId;
        existingUser.authProvider = 'google'; // Or keep as 'local' and just add googleId
        existingUser.isVerified = true; // Google already verified the email
        existingUser.lastLogin = new Date();
        
        if (picture && !existingUser.avatar?.url) {
          existingUser.avatar = { url: picture };
        }
        
        await existingUser.save();

        // Get parent profile
        const parent = await Parent.findOne({ user: existingUser._id });

        // Generate tokens
        const tokens2 = generateToken(existingUser._id, existingUser.role);

        existingUser.refreshToken = tokens2.refreshToken;
        await existingUser.save();

        res.cookie('refreshToken', tokens2.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.status(200).json({
          success: true,
          message: 'Account linked with Google successfully',
          accessToken: tokens2.accessToken,
          data: {
            user: {
              _id: existingUser._id,
              email: existingUser.email,
              name: existingUser.name,
              role: existingUser.role,
              avatar: existingUser.avatar,
              isVerified: existingUser.isVerified,
              authProvider: existingUser.authProvider,
            },
            familyCode: parent?.familyCode,
            subscription: parent?.subscription || 'free',
          }
        });
      }
      
      // Linked to different OAuth provider
      return res.status(409).json({
        success: false,
        message: `This email is already registered with ${existingUser.authProvider}`
      });
    }

    // Create new parent user with Google
    const familyCode = generateFamilyCode();

    // Create user
    user = new User({
      email: email.toLowerCase(),
      name,
      role: 'parent',
      authProvider: 'google',
      googleId,
      isVerified: true, // Google already verified email
      isActive: true,
      avatar: picture ? { url: picture } : undefined,
      termsAcceptedAt: new Date(),
      lastLogin: new Date(),
      parent: {
        familyCode,
        subscription: 'free',
        children: []
      }
    });

    await user.save();

    // Create parent profile
    const parent = new Parent({
      user: user._id,
      familyCode,
      subscription: 'free',
      children: []
    });

    await parent.save();

    // Generate tokens
    const tokens3 = generateToken(user._id, user.role);

    user.refreshToken = tokens3.refreshToken;
    await user.save();

    res.cookie('refreshToken', tokens3.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      success: true,
      message: 'Account created successfully with Google',
      accessToken: tokens3.accessToken,
      data: {
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
          isVerified: user.isVerified,
          authProvider: user.authProvider,
        },
        familyCode: parent.familyCode,
        subscription: parent.subscription,
      }
    });

  } catch (error) {
    console.error('Google OAuth error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during Google authentication',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export default {
  googleAuth,
};
