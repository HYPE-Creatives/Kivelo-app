import { AuthResponse } from '../types/auth';

export const loginWithGoogle = async (accessToken: string): Promise<AuthResponse> => {
  try {
    if (!accessToken) {
      throw new Error('No access token received from Google');
    }

    // Get user info from Google API
    const userResponse = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`);
    
    if (!userResponse.ok) {
      throw new Error('Failed to fetch user information from Google');
    }
    
    const googleUser = await userResponse.json();
    
    // Send to your backend for authentication
    const response = await fetch('https://family-wellness.onrender.com/api/auth/google', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        googleAccessToken: accessToken,
        email: googleUser.email,
        name: googleUser.name,
        picture: googleUser.picture,
        googleId: googleUser.id,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Google login failed');
    }
    
    const result = await response.json();
    
    return {
      success: true,
      message: result.message || 'Successfully logged in with Google',
      data: result
    };
    
  } catch (error: any) {
    console.error('Google login error:', error);
    return {
      success: false,
      message: error.message || 'Google login failed'
    };
  }
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateForm = (mode: 'password' | 'oneTimeCode', email: string, password: string, code: string): string | null => {
  if (!email.trim()) return "Please enter your email address";
  if (!validateEmail(email)) return "Please enter a valid email address";
  
  if (mode === "password" && !password.trim()) return "Please enter your password";
  if (mode === "oneTimeCode" && !code.trim()) return "Please enter your one-time code";
  
  return null;
};