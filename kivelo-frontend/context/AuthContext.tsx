import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { Platform } from "react-native";

// Detect if running in production (web deployed on Vercel/etc)
const isProduction = Platform.OS === 'web' && 
  typeof window !== 'undefined' && 
  !window.location.hostname.includes('localhost');

// In production, only use the remote API
// In development, try localhost first then fallback to remote
const API_URLS = isProduction
  ? ["https://family-wellness.onrender.com/api/v1"]
  : [
      "http://localhost:5000/api/v1",  // Local dev server
      "https://family-wellness.onrender.com/api/v1",
    ];

// Types (keep your existing types)
type Role = "parent" | "child" | "ai" | null;

interface ChildDetails {
  dob?: string;
  gender?: string;
  interests?: string[];
  gradeLevel?: string;
}

interface User {
  id: string;
  _id?: string;
  role: Role;
  email: string;
  name: string;
  phone?: string;
  dob?: string;
  children?: string[];
  hasSetPassword?: boolean;
  childDetails?: ChildDetails;
  avatar?: {
    url?: string;
    publicId?: string;
  };
  parent?: {
    familyCode: string;
    subscription: string;
  };
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
}

interface AuthContextType {
  user: User | null;
  role: Role;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, expectedRole?: 'parent' | 'child') => Promise<{ success: boolean; message?: string }>;
  loginWithGoogle: (idToken: string, accessToken?: string | null) => Promise<{ success: boolean; message?: string }>;
  loginWithOneTimeCode: (email: string, code: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  registerParent: (
    email: string,
    password: string,
    name: string,
    phone: string,
    dob: string,
    termsAccepted: boolean
  ) => Promise<{ success: boolean; message?: string }>;
  generateOneTimeCode: (
    parentId: string,
    childName: string,
    childEmail: string,
    childDOB: string,
    childGender: string
  ) => Promise<{ success: boolean; message?: string; code?: string }>;
  setChildPassword: (
    childId: string,
    password: string
  ) => Promise<{ success: boolean; message?: string }>;
  resetChildPassword: (
    parentId: string,
    childEmail: string
  ) => Promise<{ success: boolean; message?: string; code?: string }>;
  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<{ success: boolean; message?: string }>;
  clearAuthState: () => Promise<void>;
  refreshProfile: () => Promise<{ success: boolean; message?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Storage keys
const USER_STORAGE_KEY = "kivelo_user";
const ACCESS_TOKEN_KEY = "kivelo_access_token";
const REFRESH_TOKEN_KEY = "kivelo_refresh_token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 🔹 SIMPLIFIED API CALL - No timeouts, just basic fallback
  const apiCallWithFallback = async (endpoint: string, options: RequestInit = {}) => {
    let lastError = null;
    
    for (const baseUrl of API_URLS) {
      try {
        console.log(`🔄 Trying: ${baseUrl}${endpoint}`);
        
        const response = await fetch(`${baseUrl}${endpoint}`, options);
        
        // Check if response is OK before trying to parse JSON
        if (!response.ok) {
          // Try to get error message from response
          let errorMessage = `HTTP ${response.status}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } catch {
            // If JSON parsing fails, use status text
            errorMessage = response.statusText || errorMessage;
          }
          
          // For 404 (route not found), try next URL - route might exist on another server
          // For other 4xx errors (auth/validation), throw immediately
          // For 5xx errors, try next URL
          if (response.status === 404 || response.status >= 500) {
            lastError = { success: false, message: errorMessage };
            console.warn(`⚠️ Route not found or server error at ${baseUrl}:`, errorMessage);
            continue;
          }
          
          // This is a valid auth/validation error (401, 403, etc.), throw it immediately
          throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log(`✅ Success with: ${baseUrl}`);
        return { response, data };
        
      } catch (error: any) {
        // If it's our thrown error (client error), re-throw it immediately
        if (!error.message?.includes('Network') && !error.message?.includes('fetch')) {
          throw error;
        }
        
        lastError = {
          success: false,
          message: `Network error: ${error.message}`
        };
        console.warn(`🌐 Network error with ${baseUrl}:`, error.message);
      }
    }

    throw new Error(lastError?.message || "Unable to connect to server");
  };

  // 🔹 Load stored user and tokens
  useEffect(() => {
    const loadStoredAuth = async () => {
      try {
        const [storedUser, accessToken] = await Promise.all([
          AsyncStorage.getItem(USER_STORAGE_KEY),
          AsyncStorage.getItem(ACCESS_TOKEN_KEY),
        ]);

        if (storedUser && accessToken) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Failed to load stored auth:", error);
        await clearAuthState();
      } finally {
        setIsLoading(false);
      }
    };
    loadStoredAuth();
  }, []);

  // 🔹 Store auth data
  const storeAuthData = async (userData: User, tokens: AuthTokens) => {
    try {
      await Promise.all([
        AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData)),
        AsyncStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken),
        tokens.refreshToken ? AsyncStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken) : Promise.resolve(),
      ]);
    } catch (error) {
      console.error("Error storing auth data:", error);
      throw error;
    }
  };

  // 🔹 Refresh profile from backend and update stored user
  const refreshProfile = async () => {
    try {
      const accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
      if (!accessToken) return { success: false, message: 'No access token' };

      const { data } = await apiCallWithFallback('/users/profile', {
        method: 'GET',
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!data || !data.success) {
        return { success: false, message: data?.message || 'Failed to refresh profile' };
      }

      const userData = data.data?.user || data.user;
      if (!userData) return { success: false, message: 'Invalid user data' };

      // familyCode and subscription come at root level for parents from profile endpoint
      const parentData = userData.role === 'parent' ? {
        familyCode: userData.familyCode || userData.parent?.familyCode || '',
        subscription: userData.subscription || userData.parent?.subscription || 'free',
      } : userData.parent;

      const finalUser: User = {
        id: userData._id || userData.id,
        role: userData.role,
        email: userData.email,
        name: userData.name,
        phone: userData.phone,
        dob: userData.dob,
        children: userData.children,
        parent: parentData,
        childDetails: userData.childDetails,
        hasSetPassword: userData.hasSetPassword,
        avatar: userData.avatar,
      };

      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(finalUser));
      setUser(finalUser);
      setIsAuthenticated(true);

      return { success: true };
    } catch (error: any) {
      console.error('refreshProfile error', error);
      return { success: false, message: error.message || 'Failed to refresh profile' };
    }
  };

  // ✅ SIMPLIFIED LOGIN with role validation
  const login = async (email: string, password: string, expectedRole?: 'parent' | 'child') => {
    try {
      setIsLoading(true);

      // Use role-specific endpoints for proper backend enforcement
      const endpoint = expectedRole === 'parent' 
        ? "/auth/parent-login" 
        : expectedRole === 'child' 
          ? "/auth/child-login-password" 
          : "/auth/login"; // Legacy fallback

      const { data } = await apiCallWithFallback(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      console.log("🔍 Login Response:", data);

      if (data.success) {
        const userData = data.data?.user || data.user;
        console.log("🖼️ Login - User avatar from server:", userData?.avatar);
        
        if (!userData) {
          throw new Error("Invalid user data from server");
        }

        // hasSetPassword comes from roleData (at data level), not inside user object
        const hasSetPassword = data.data?.hasSetPassword ?? userData.hasSetPassword ?? true;
        
        // familyCode and subscription come from roleData (at data level) for parents
        const parentData = userData.role === 'parent' ? {
          familyCode: data.data?.familyCode || userData.parent?.familyCode || '',
          subscription: data.data?.subscription || userData.parent?.subscription || 'free',
        } : userData.parent;

        const finalUser: User = {
          id: userData._id || userData.id,
          role: userData.role,
          email: userData.email,
          name: userData.name,
          phone: userData.phone,
          dob: userData.dob,
          children: userData.children,
          parent: parentData,
          childDetails: userData.childDetails,
          hasSetPassword: hasSetPassword,
          avatar: userData.avatar,
        };

        const tokens: AuthTokens = {
          accessToken: data.accessToken || data.token,
          refreshToken: data.refreshToken || "",
        };

        if (!tokens.accessToken) {
          throw new Error("No access token received");
        }

        await storeAuthData(finalUser, tokens);
        setUser(finalUser);
        setIsAuthenticated(true);

        return { success: true, message: "Login successful!" };
      } else {
        // Backend now returns role-specific error messages
        return { success: false, message: data.message || "Login failed" };
      }
    } catch (error: any) {
      // Don't log expected auth errors as ERROR - just return the message
      return { success: false, message: error.message || "Network error" };
    } finally {
      setIsLoading(false);
    }
  };
  // ✅ GOOGLE OAUTH LOGIN (Parent only)
  const loginWithGoogle = async (idToken: string, accessToken?: string | null) => {
    try {
      setIsLoading(true);

      const { data } = await apiCallWithFallback("/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, accessToken }),
      });

      console.log("🔍 Google Login Response:", data);

      if (data.success) {
        const userData = data.data?.user || data.user;
        console.log("🖼️ Google Login - User data:", userData);
        
        if (!userData) {
          throw new Error("Invalid user data from server");
        }

        // Google OAuth is parent-only, verify role
        if (userData.role !== 'parent') {
          return { success: false, message: "Google sign-in is only available for parent accounts" };
        }

        const parentData = {
          familyCode: data.data?.familyCode || userData.parent?.familyCode || '',
          subscription: data.data?.subscription || userData.parent?.subscription || 'free',
        };

        const finalUser: User = {
          id: userData._id || userData.id,
          role: userData.role,
          email: userData.email,
          name: userData.name,
          phone: userData.phone,
          dob: userData.dob,
          children: userData.children,
          parent: parentData,
          hasSetPassword: true, // OAuth users don't need password
          avatar: userData.avatar,
        };

        const tokens: AuthTokens = {
          accessToken: data.accessToken || data.token,
          refreshToken: data.refreshToken || "",
        };

        if (!tokens.accessToken) {
          throw new Error("No access token received");
        }

        await storeAuthData(finalUser, tokens);
        setUser(finalUser);
        setIsAuthenticated(true);

        return { success: true, message: data.message || "Login successful with Google!" };
      } else {
        return { success: false, message: data.message || "Google login failed" };
      }
    } catch (error: any) {
      console.error("Google login error:", error);
      return { success: false, message: error.message || "Network error during Google login" };
    } finally {
      setIsLoading(false);
    }
  };
  // ✅ ONE-TIME CODE LOGIN
  const loginWithOneTimeCode = async (email: string, code: string) => {
    try {
      setIsLoading(true);

      const { data } = await apiCallWithFallback("/auth/child-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), code }),
      });

      if (data.success) {
        const userData = data.data?.user || data.user;
        console.log("🔑 [loginWithOneTimeCode] Raw API response:", JSON.stringify(data, null, 2));
        console.log("🔑 [loginWithOneTimeCode] userData.hasSetPassword from API:", userData.hasSetPassword);
        
        // One-time code login always means hasSetPassword is false
        const childUser: User = {
          id: userData._id || userData.id,
          role: 'child',
          email: userData.email,
          name: userData.name,
          hasSetPassword: userData.hasSetPassword ?? false, // Default to false for one-time code
          childDetails: userData.childDetails,
          dob: userData.dob,
          avatar: userData.avatar,
        };

        console.log("🔑 [loginWithOneTimeCode] Created childUser.hasSetPassword:", childUser.hasSetPassword);

        const tokens: AuthTokens = {
          accessToken: data.accessToken || data.token,
          refreshToken: data.refreshToken || "",
        };

        await storeAuthData(childUser, tokens);
        console.log("🔑 [loginWithOneTimeCode] Auth data stored, setting user state...");
        setUser(childUser);
        setIsAuthenticated(true);

        return { success: true, message: "Login successful!" };
      } else {
        return { success: false, message: data.message || "Invalid code" };
      }
    } catch (error: any) {
      // Don't log expected auth errors as ERROR - just return the message
      return { success: false, message: error.message || "Network error" };
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ LOGOUT
  const logout = async () => {
    try {
      await clearAuthState();
      setUser(null);
      setIsAuthenticated(false);
      router.replace('/(auth)/login');
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  // ✅ CLEAR AUTH STATE
  const clearAuthState = async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(USER_STORAGE_KEY),
        AsyncStorage.removeItem(ACCESS_TOKEN_KEY),
        AsyncStorage.removeItem(REFRESH_TOKEN_KEY),
      ]);
    } catch (error) {
      console.error("Clear auth state error:", error);
    }
  };

  // ✅ REGISTER PARENT - SIMPLIFIED AND ROBUST
  const registerParent = async (
    email: string,
    password: string,
    name: string,
    phone: string,
    dob: null | string,
    termsAccepted: boolean
  ) => {
    try {
      setIsLoading(true);

      console.log("🔍 Starting registration...");

      // Basic validation
      if (!name?.trim() || !email?.trim() || !password || !phone?.trim()) {
        return { success: false, message: "All fields are required." };
      }

      if (termsAccepted !== true) {
        return { success: false, message: "You must agree to the Terms & Conditions." };
      }

      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password,
        phone: phone.trim(),
        dob: dob || null,
        termsAccepted: true
      };

      console.log("📤 Sending payload:", payload);

      const { data } = await apiCallWithFallback("/auth/register-parent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      console.log("📨 Registration response:", data);

      if (data.success) {
        return { 
          success: true, 
          message: data.message || "Registration successful! Please check your email for verification." 
        };
      } else {
        return { success: false, message: data.message || "Registration failed" };
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      return { success: false, message: error.message || "Registration failed. Please try again." };
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ GENERATE ONE-TIME CODE (Parent only)
  const generateOneTimeCode = async (
    parentId: string,
    childName: string,
    childEmail: string,
    childDOB: string,
    childGender: string
  ) => {
    try {
      console.log("🔍 Generating one-time code for child...");

      const accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
      if (!accessToken) {
        return { success: false, message: "Not authenticated. Please log in again." };
      }

      const payload = {
        childName: childName.trim(),
        childEmail: childEmail.trim().toLowerCase(),
        childDOB,
        childGender: childGender.trim()
      };

      console.log("📤 Sending generate code payload:", payload);

      const { data } = await apiCallWithFallback("/auth/generate-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`
        },
        body: JSON.stringify(payload),
      });

      console.log("📨 Generate code response:", data);

      if (data.success) {
        return {
          success: true,
          message: data.message || "One-time code generated successfully!",
          code: data.code || data.oneTimeCode
        };
      } else {
        return { success: false, message: data.message || "Failed to generate code" };
      }
    } catch (error: any) {
      console.error("Generate code error:", error);
      return { success: false, message: error.message || "Failed to generate code. Please try again." };
    }
  };

  // ✅ SET CHILD PASSWORD (After one-time code login)
  const setChildPassword = async (childId: string, password: string) => {
    try {
      console.log("🔍 Setting child password...");

      const accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
      if (!accessToken) {
        return { success: false, message: "Not authenticated. Please log in again." };
      }

      if (!password || password.length < 6) {
        return { success: false, message: "Password must be at least 6 characters long." };
      }

      const payload = {
        password: password
      };

      console.log("📤 Setting password for child:", childId);

      const { data } = await apiCallWithFallback("/auth/set-child-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`
        },
        body: JSON.stringify(payload),
      });

      console.log("📨 Set password response:", data);

      if (data.success) {
        // Update user state to reflect password has been set
        if (user) {
          const updatedUser = { ...user, hasSetPassword: true };
          await storeAuthData(updatedUser, { accessToken: data.accessToken || accessToken, refreshToken: "" });
          setUser(updatedUser);
        }
        return {
          success: true,
          message: data.message || "Password set successfully!"
        };
      } else {
        return { success: false, message: data.message || "Failed to set password" };
      }
    } catch (error: any) {
      console.error("Set password error:", error);
      return { success: false, message: error.message || "Failed to set password. Please try again." };
    }
  };

  // ✅ CHANGE PASSWORD (Any authenticated user)
  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      console.log("🔍 Changing password...");

      const accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
      if (!accessToken) {
        return { success: false, message: "Not authenticated. Please log in again." };
      }

      if (!currentPassword || !newPassword) {
        return { success: false, message: "Current password and new password are required." };
      }

      if (newPassword.length < 6) {
        return { success: false, message: "New password must be at least 6 characters long." };
      }

      const payload = {
        currentPassword,
        newPassword,
      };

      console.log("📤 Sending password change request...");

      const { data } = await apiCallWithFallback("/users/update-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`
        },
        body: JSON.stringify(payload),
      });

      console.log("📨 Change password response:", data);

      if (data.success) {
        return {
          success: true,
          message: data.message || "Password changed successfully!"
        };
      } else {
        return { success: false, message: data.message || "Failed to change password" };
      }
    } catch (error: any) {
      console.error("Change password error:", error);
      return { success: false, message: error.message || "Failed to change password. Please try again." };
    }
  };

  // ✅ RESET CHILD PASSWORD (Parent only) - Regenerates one-time code
  const resetChildPassword = async (parentId: string, childEmail: string) => {
    try {
      console.log("🔍 Resetting child password by regenerating code...");

      const accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
      if (!accessToken) {
        return { success: false, message: "Not authenticated. Please log in again." };
      }

      // Use generate-code endpoint to regenerate code for existing child
      // Backend will detect existing child and regenerate code
      const payload = {
        childEmail: childEmail.trim().toLowerCase(),
        childName: "Child", // Backend uses existing name if child exists
        childDOB: "2010-01-01", // Backend uses existing DOB if child exists
        childGender: "" // Backend uses existing gender if child exists
      };

      console.log("📤 Regenerating code for child:", childEmail);

      const { data } = await apiCallWithFallback("/auth/generate-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`
        },
        body: JSON.stringify(payload),
      });

      console.log("📨 Regenerate code response:", data);

      if (data.success) {
        const newCode = data.code || data.oneTimeCode;
        return {
          success: true,
          message: `Password reset! New code: ${newCode}. Share this code with your child.`,
          code: newCode
        };
      } else {
        return { success: false, message: data.message || "Failed to reset password" };
      }
    } catch (error: any) {
      console.error("Reset password error:", error);
      return { success: false, message: error.message || "Failed to reset password. Please try again." };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isLoading,
        isAuthenticated,
        login,
        loginWithGoogle,
        loginWithOneTimeCode,
        logout,
        registerParent,
        generateOneTimeCode,
        setChildPassword,
        resetChildPassword,
        changePassword,
        clearAuthState,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    // Return a safe default during initial render before provider is ready
    // This prevents crashes during expo-router's initial layout rendering
    return {
      user: null,
      role: null,
      isLoading: true,
      isAuthenticated: false,
      login: async () => ({ success: false, message: "Auth not ready" }),
      loginWithGoogle: async () => ({ success: false, message: "Auth not ready" }),
      loginWithOneTimeCode: async () => ({ success: false, message: "Auth not ready" }),
      logout: async () => {},
      registerParent: async () => ({ success: false, message: "Auth not ready" }),
      generateOneTimeCode: async () => ({ success: false, message: "Auth not ready" }),
      setChildPassword: async () => ({ success: false, message: "Auth not ready" }),
      resetChildPassword: async () => ({ success: false, message: "Auth not ready" }),
      changePassword: async () => ({ success: false, message: "Auth not ready" }),
      clearAuthState: async () => {},
      refreshProfile: async () => ({ success: false, message: "Auth not ready" }),
    } as ReturnType<typeof useAuth>;
  }
  return context;
};