import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

const API_URLS = [
  "http://localhost:5000/api",
  "https://family-wellness.onrender.com/api",
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
  logout: () => Promise<void>;
  registerParent: (
    email: string,
    password: string,
    name: string,
    phone: string,
    dob: string,
    termsAccepted: boolean
  ) => Promise<{ success: boolean; message?: string }>;
  clearAuthState: () => Promise<void>;
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
          
          lastError = { success: false, message: errorMessage };
          console.warn(`❌ Failed with ${baseUrl}:`, errorMessage);
          continue; // Try next URL
        }

        const data = await response.json();
        console.log(`✅ Success with: ${baseUrl}`);
        return { response, data };
        
      } catch (error: any) {
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

  // ✅ SIMPLIFIED LOGIN
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);

      const { response, data } = await apiCallWithFallback("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      console.log("🔍 Login Response:", data);

      if (data.success) {
        const userData = data.data?.user || data.user;
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
        return { success: false, message: data.message || "Login failed" };
      }
    } catch (error: any) {
      console.error("Login error:", error);
      return { success: false, message: error.message || "Network error" };
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ ONE-TIME CODE LOGIN
  const loginWithOneTimeCode = async (email: string, code: string) => {
    try {
      setIsLoading(true);

      const { response, data } = await apiCallWithFallback("/auth/child-login-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), code }),
      });

      if (data.success) {
        const userData = data.data?.user || data.user;
        const childUser: User = {
          id: userData._id || userData.id,
          role: 'child',
          email: userData.email,
          name: userData.name,
          hasSetPassword: userData.hasSetPassword,
          childDetails: userData.childDetails,
          dob: userData.dob,
        };

        const tokens: AuthTokens = {
          accessToken: data.accessToken || data.token,
          refreshToken: data.refreshToken || "",
        };

        await storeAuthData(childUser, tokens);
        setUser(childUser);
        setIsAuthenticated(true);

        return { success: true, message: "Login successful!" };
      } else {
        return { success: false, message: data.message || "Invalid code" };
      }
    } catch (error: any) {
      console.error("One-time code login error:", error);
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

      const { response, data } = await apiCallWithFallback("/auth/register-parent", {
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

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isLoading,
        isAuthenticated,
        login,
        loginWithOneTimeCode,
        logout,
        registerParent,
        clearAuthState,
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