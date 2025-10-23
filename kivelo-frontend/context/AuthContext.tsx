// app/context/AuthContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

const API_BASE_URL = "https://family-wellness.onrender.com/api";

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
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  loginWithOneTimeCode: (email: string, code: string) => Promise<{ success: boolean; message?: string }>;
  loginWithGoogle: (googleToken: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  registerParent: (
    email: string,
    password: string,
    name: string,
    phone: string,
    dob: string
  ) => Promise<{ success: boolean; message?: string }>;
  generateOneTimeCode: (
    parentId: string,
    childName: string,
    childEmail: string,
    childDOB: string,
    childGender: string
  ) => Promise<{ success: boolean; message?: string; code?: string }>;
  setChildPassword: (childId: string, password: string) => Promise<{ success: boolean; message?: string }>;
  validateOneTimeCode: (code: string) => Promise<{ valid: boolean; message?: string; childName?: string }>;
  resetChildPassword: (parentId: string, childEmail: string) => Promise<{ success: boolean; message?: string }>;
  updateChildProfile: (childId: string, updates: Partial<ChildDetails>) => Promise<{ success: boolean; message?: string }>;
  clearAuthState: () => Promise<void>;
  refreshTokens: () => Promise<boolean>;
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


  // 🔹 Load stored user and tokens on app start
  // 🔹 UPDATED: Load stored user and tokens on app start
  useEffect(() => {
    const loadStoredAuth = async () => {
      try {
        const [storedUser, accessToken] = await Promise.all([
          AsyncStorage.getItem(USER_STORAGE_KEY),
          AsyncStorage.getItem(ACCESS_TOKEN_KEY),
          // Don't load refreshToken here as it might not exist
        ]);

        if (storedUser && accessToken) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setIsAuthenticated(true);
          console.log("✅ Loaded stored user:", parsedUser);
        } else {
          // If no access token, clear everything
          await clearAuthState();
        }
      } catch (error) {
        console.error("⚠️ Failed to load stored auth:", error);
        await clearAuthState();
      } finally {
        setIsLoading(false);
      }
    };
    loadStoredAuth();
  }, []);

  // 🔹 Auto-refresh token logic
  useEffect(() => {
    let refreshInterval: ReturnType<typeof setInterval> | undefined;

    if (isAuthenticated) {
      // Refresh token 5 minutes before expiry (assuming 1 hour expiry)
      refreshInterval = setInterval(async () => {
        const success = await refreshTokens();
        if (!success) {
          console.log("🔄 Token refresh failed, logging out...");
          await logout();
        }
      }, 55 * 60 * 1000); // 55 minutes
    }

    return () => {
      if (refreshInterval !== undefined) {
        // clearInterval accepts different timer types in Node vs DOM, cast to any to avoid TS mismatch
        clearInterval(refreshInterval as any);
      }
    };
  }, [isAuthenticated]);

  // 🔹 Helper for API calls with automatic token refresh
  // 🔹 UPDATED: Helper for API calls with better token handling
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    let accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);

    const makeRequest = async (token: string | null) => {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...options.headers,
      };

      // Only add Authorization header if token exists
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    };

    try {
      return await makeRequest(accessToken);
    } catch (error: any) {
      // If token is expired or invalid, try to refresh and retry
      if ((error.message.includes('401') || error.message.includes('token')) && accessToken) {
        console.log("🔄 Token expired or invalid, attempting refresh...");
        const refreshed = await refreshTokens();

        if (refreshed) {
          accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
          return await makeRequest(accessToken);
        } else {
          // If refresh fails, logout user
          await logout();
          throw new Error('Authentication failed. Please login again.');
        }
      }
      throw error;
    }
  };

  // 🔹 Refresh tokens
  const refreshTokens = async (): Promise<boolean> => {
    try {
      const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);

      if (!refreshToken) {
        console.log("⚠️ No refresh token available");
        return false;
      }

      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // FIXED: Ensure we don't store undefined tokens
        if (!result.accessToken) {
          throw new Error('No access token received from refresh endpoint');
        }

        await AsyncStorage.setItem(ACCESS_TOKEN_KEY, result.accessToken);

        // Only store new refresh token if provided
        if (result.refreshToken) {
          await AsyncStorage.setItem(REFRESH_TOKEN_KEY, result.refreshToken);
        }

        console.log("✅ Tokens refreshed successfully");
        return true;
      } else {
        throw new Error(result.message || 'Token refresh failed');
      }
    } catch (error) {
      console.error("🚨 Token refresh error:", error);
      return false;
    }
  };

  // 🔹 Store auth data
  const storeAuthData = async (userData: User, tokens: AuthTokens) => {
    try {
      const storageOperations = [
        AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData)),
        AsyncStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken),
      ];

      // Only store refreshToken if it exists and is not undefined/null
      if (tokens.refreshToken) {
        storageOperations.push(AsyncStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken));
      } else {
        // Remove refresh token if it doesn't exist
        storageOperations.push(AsyncStorage.removeItem(REFRESH_TOKEN_KEY));
      }

      await Promise.all(storageOperations);
      console.log("✅ Auth data stored successfully");
    } catch (error) {
      console.error("🚨 Error storing auth data:", error);
      throw error;
    }
  };

  // ✅ REGULAR LOGIN (Parents & Children with passwords)
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();
      console.log("🔍 Login API Response:", result);

      if (response.ok && result.success) {
        const userData = result.data?.user || result.user;
        if (!userData) {
          throw new Error("Invalid user data from server");
        }

        const finalUser: User = {
          id: userData._id || userData.id,
          role: userData.role,
          email: userData.email,
          name: userData.name,
          phone: userData.phone,
          dob: userData.dob,
          children: userData.children,
          parent: userData.parent,
          childDetails: userData.childDetails,
          hasSetPassword: userData.hasSetPassword || result.data?.hasSetPassword,
        };

        // FIXED: Handle cases where refreshToken might be undefined
        const tokens: AuthTokens = {
          accessToken: result.accessToken || result.token,
          refreshToken: result.refreshToken || null, // Ensure it's never undefined
          expiresIn: result.expiresIn,
        };

        // Validate that accessToken exists
        if (!tokens.accessToken) {
          throw new Error("No access token received from server");
        }

        await storeAuthData(finalUser, tokens);

        setUser(finalUser);
        setIsAuthenticated(true);

        console.log("✅ Login successful, user set:", finalUser);
        return {
          success: true,
          message: "Login successful!"
        };
      } else {
        return {
          success: false,
          message: result.message || "Invalid credentials"
        };
      }
    } catch (error: any) {
      console.error("🚨 Login error:", error);
      return {
        success: false,
        message: error.message || "Network error. Please try again."
      };
    } finally {
      setIsLoading(false);
    }
  };


  // ✅ ONE-TIME CODE LOGIN (Children first-time login)
  const loginWithOneTimeCode = async (email: string, code: string) => {
    try {
      setIsLoading(true);

      const response = await fetch(`${API_BASE_URL}/auth/child-login-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, code }),
      });

      const result = await response.json();
      console.log("🔍 One-time code login response:", result);

      if (response.ok && result.success) {
        const userData = result.data?.user || result.user;
        if (!userData) {
          throw new Error("Invalid user data from server");
        }

        const childUser: User = {
          id: userData._id || userData.id,
          role: 'child',
          email: userData.email,
          name: userData.name,
          hasSetPassword: userData.hasSetPassword || result.data?.hasSetPassword,
          childDetails: userData.childDetails,
          dob: userData.dob,
        };

        // FIXED: Handle cases where refreshToken might be undefined
        const tokens: AuthTokens = {
          accessToken: result.accessToken || result.token,
          refreshToken: result.refreshToken || null, // Ensure it's never undefined
          expiresIn: result.expiresIn,
        };

        // Validate that accessToken exists
        if (!tokens.accessToken) {
          throw new Error("No access token received from server");
        }

        await storeAuthData(childUser, tokens);

        setUser(childUser);
        setIsAuthenticated(true);

        console.log("✅ One-time code login successful:", childUser);
        return {
          success: true,
          message: "Login successful! Please set your password."
        };
      } else {
        return {
          success: false,
          message: result.message || "Invalid code or email"
        };
      }
    } catch (error: any) {
      console.error("🚨 One-time code login error:", error);
      return {
        success: false,
        message: error.message || "Network error. Please try again."
      };
    } finally {
      setIsLoading(false);
    }
  };


  // ✅ GOOGLE LOGIN
  const loginWithGoogle = async (googleToken: string) => {
    try {
      setIsLoading(true);

      const response = await fetch(`${API_BASE_URL}/auth/google`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: googleToken }),
      });

      const result = await response.json();
      console.log("🔍 Google login response:", result);

      if (response.ok && result.success) {
        const userData = result.data?.user || result.user;
        if (!userData) {
          throw new Error("Invalid user data from server");
        }

        const finalUser: User = {
          id: userData._id || userData.id,
          role: userData.role,
          email: userData.email,
          name: userData.name,
          phone: userData.phone,
          dob: userData.dob,
          children: userData.children,
          parent: userData.parent,
          childDetails: userData.childDetails,
          hasSetPassword: userData.hasSetPassword,
        };

        // FIXED: Handle cases where refreshToken might be undefined
        const tokens: AuthTokens = {
          accessToken: result.accessToken || result.token,
          refreshToken: result.refreshToken || null, // Ensure it's never undefined
          expiresIn: result.expiresIn,
        };

        // Validate that accessToken exists
        if (!tokens.accessToken) {
          throw new Error("No access token received from server");
        }

        await storeAuthData(finalUser, tokens);

        setUser(finalUser);
        setIsAuthenticated(true);

        console.log("✅ Google login successful:", finalUser);
        return {
          success: true,
          message: "Google login successful!"
        };
      } else {
        return {
          success: false,
          message: result.message || "Google login failed"
        };
      }
    } catch (error: any) {
      console.error("🚨 Google login error:", error);
      return {
        success: false,
        message: error.message || "Google login failed. Please try again."
      };
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ LOGOUT
  const logout = async () => {
    try {
      // Call logout endpoint to invalidate tokens on server
      const accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
      if (accessToken) {
        try {
          await fetch(`${API_BASE_URL}/auth/logout`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${accessToken}`,
            },
          });
        } catch (error) {
          console.error("Logout API error:", error);
        }
      }

      await clearAuthState();
      setUser(null);
      setIsAuthenticated(false);

      // Redirect to login page
      router.replace('/(auth)/login');
      console.log("✅ Logout successful");
    } catch (error) {
      console.error("🚨 Logout error:", error);
      throw error;
    }
  };

  // ✅ UPDATED: CLEAR AUTH STATE - More robust cleanup
  const clearAuthState = async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(USER_STORAGE_KEY),
        AsyncStorage.removeItem(ACCESS_TOKEN_KEY),
        AsyncStorage.removeItem(REFRESH_TOKEN_KEY), // This won't error if key doesn't exist
      ].map(p => p.catch(e => console.warn("Cleanup warning:", e))));

      console.log("✅ Auth state cleared successfully");
    } catch (error) {
      console.error("🚨 Clear auth state error:", error);
    }
  };

  // Updated generateOneTimeCode function with detailed debugging
  const generateOneTimeCode = async (
    parentId: string,
    childName: string,
    childEmail: string,
    childDOB: string,
    childGender: string
  ) => {
    try {
      console.log("🔍 DEBUG - Child creation data:", {
        parentId,
        childName,
        childEmail,
        childDOB,
        childGender
      });

      // Validate all required fields
      if (!childName?.trim()) {
        throw new Error('Child name is required');
      }
      if (!childEmail?.trim()) {
        throw new Error('Child email is required');
      }
      if (!childDOB) {
        throw new Error('Child date of birth is required');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(childEmail.trim())) {
        throw new Error('Please enter a valid email address');
      }

      // Get the access token
      const accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
      console.log("🔍 Access token available:", !!accessToken);

      if (!accessToken) {
        throw new Error('Authentication token not found. Please login again.');
      }

      // Try different payload structures
      const payloads = [
        // Format 1: Flat structure (most common)
        {
          parentId,
          name: childName.trim(),
          email: childEmail.trim().toLowerCase(),
          dob: childDOB,
          gender: childGender || 'prefer-not-to-say',
          role: 'child'
        },
        // Format 2: Nested child object
        {
          parentId,
          child: {
            name: childName.trim(),
            email: childEmail.trim().toLowerCase(),
            dob: childDOB,
            gender: childGender || 'prefer-not-to-say',
            role: 'child'
          }
        },
        // Format 3: With userData wrapper
        {
          parentId,
          userData: {
            name: childName.trim(),
            email: childEmail.trim().toLowerCase(),
            dob: childDOB,
            gender: childGender || 'prefer-not-to-say',
            role: 'child'
          }
        },
        // Format 4: Without parentId (server might get it from token)
        {
          name: childName.trim(),
          email: childEmail.trim().toLowerCase(),
          dob: childDOB,
          gender: childGender || 'prefer-not-to-say',
          role: 'child'
        },
        // Format 5: Alternative field names
        {
          parentId,
          childName: childName.trim(),
          childEmail: childEmail.trim().toLowerCase(),
          childDOB: childDOB,
          childGender: childGender || 'prefer-not-to-say',
          role: 'child'
        },
        // Format 6: Mixed field names
        {
          parentId,
          name: childName.trim(),
          email: childEmail.trim().toLowerCase(),
          childDOB: childDOB, // Try both dob and childDOB
          dob: childDOB,
          gender: childGender || 'prefer-not-to-say',
          childGender: childGender || 'prefer-not-to-say',
          role: 'child'
        }
      ];

      let lastError: any = null;
      let lastResponse: any = null;

      for (let i = 0; i < payloads.length; i++) {
        try {
          console.log(`🔄 Trying payload format ${i + 1}:`, JSON.stringify(payloads[i], null, 2));

          const response = await fetch(`${API_BASE_URL}/auth/generate-code`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${accessToken}`,
            },
            body: JSON.stringify(payloads[i]),
          });

          const data = await response.json();
          console.log(`📨 Server response for format ${i + 1}:`, {
            status: response.status,
            statusText: response.statusText,
            data: data
          });

          lastResponse = data;

          if (response.ok && data.success) {
            console.log("✅ One-time code generated successfully:", data.code);
            return {
              success: true,
              code: data.code,
              message: data.message || "Child account created and code generated successfully"
            };
          } else if (response.ok) {
            lastError = new Error(data.message || `Server returned error for format ${i + 1}`);
            console.log(`❌ Format ${i + 1} failed:`, data.message);
          } else {
            lastError = new Error(data.message || `HTTP ${response.status} for format ${i + 1}`);
            console.log(`❌ Format ${i + 1} failed with status:`, response.status);
          }
        } catch (formatError: any) {
          console.log(`❌ Format ${i + 1} error:`, formatError.message);
          lastError = formatError;
          // Continue to next format
        }
      }

      // If we tried all formats and none worked
      console.log("💥 All payload formats failed. Last response:", lastResponse);
      throw lastError || new Error('All payload formats failed. Please check server requirements.');

    } catch (error: any) {
      console.error("🚨 Generate code error:", error);
      return {
        success: false,
        message: error.message || "Failed to generate code. Please check all fields and try again."
      };
    }
  };

  // ✅ VALIDATE ONE-TIME CODE
  const validateOneTimeCode = async (code: string) => {
    try {
      const data = await apiCall("/auth/validate-code", {
        method: "POST",
        body: JSON.stringify({ code }),
      });

      if (data.success) {
        return {
          valid: true,
          childName: data.childName,
          message: data.message
        };
      } else {
        return {
          valid: false,
          message: data.message || "Invalid code"
        };
      }
    } catch (error: any) {
      console.error("🚨 Validate code error:", error);
      return {
        valid: false,
        message: error.message || "Failed to validate code"
      };
    }
  };

  // ✅ REGISTER PARENT
  const registerParent = async (
    email: string,
    password: string,
    name: string,
    phone: string,
    dob: string
  ) => {
    try {
      setIsLoading(true);

      const response = await fetch(`${API_BASE_URL}/auth/register-parent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, phone, dob }),
      });

      const data = await response.json();
      console.log("🔍 Register API Response:", data);

      if (response.ok && data.success) {
        return {
          success: true,
          message: data.message || "Registration successful! Please login."
        };
      } else {
        return {
          success: false,
          message: data.message || "Registration failed"
        };
      }
    } catch (error: any) {
      console.error("🚨 Registration error:", error);
      return {
        success: false,
        message: error.message || "Registration failed. Please try again."
      };
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ SET CHILD PASSWORD
  const setChildPassword = async (childId: string, password: string) => {
    try {
      const data = await apiCall("/auth/set-child-password", {
        method: "POST",
        body: JSON.stringify({ childId, password }),
      });

      if (data.success) {
        // Update the user state if it's the current user
        if (user?.id === childId) {
          const updatedUser = {
            ...user,
            hasSetPassword: true
          };
          setUser(updatedUser);
          await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
        }

        return {
          success: true,
          message: data.message || "Password set successfully"
        };
      }

      return {
        success: false,
        message: data.message || "Failed to set password"
      };
    } catch (error: any) {
      console.error("🚨 Set child password error:", error);
      return {
        success: false,
        message: error.message || "Failed to set password"
      };
    }
  };

  // ✅ RESET CHILD PASSWORD
  const resetChildPassword = async (parentId: string, childEmail: string) => {
    try {
      const data = await apiCall("/auth/reset-child-password", {
        method: "POST",
        body: JSON.stringify({ parentId, childEmail }),
      });

      return {
        success: data.success,
        message: data.message || "Password reset initiated"
      };
    } catch (error: any) {
      console.error("🚨 Reset child password error:", error);
      return {
        success: false,
        message: error.message || "Failed to reset password"
      };
    }
  };

  // ✅ UPDATE CHILD PROFILE
  const updateChildProfile = async (childId: string, updates: Partial<ChildDetails>) => {
    try {
      const data = await apiCall("/auth/update-child-profile", {
        method: "PUT",
        body: JSON.stringify({ childId, updates }),
      });

      if (data.success) {
        // Update the user state if it's the current user
        if (user?.id === childId) {
          const updatedUser = {
            ...user,
            childDetails: { ...user.childDetails, ...updates }
          };
          setUser(updatedUser);
          await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
        }

        return {
          success: true,
          message: data.message || "Profile updated successfully"
        };
      }

      return {
        success: false,
        message: data.message || "Failed to update profile"
      };
    } catch (error: any) {
      console.error("🚨 Update child profile error:", error);
      return {
        success: false,
        message: error.message || "Failed to update profile"
      };
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
        loginWithOneTimeCode,
        loginWithGoogle,
        logout,
        registerParent,
        generateOneTimeCode,
        setChildPassword,
        validateOneTimeCode,
        resetChildPassword,
        updateChildProfile,
        clearAuthState,
        refreshTokens,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};