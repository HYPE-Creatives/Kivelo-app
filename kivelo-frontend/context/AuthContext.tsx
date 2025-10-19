// app/context/AuthContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
  token?: string;
  parent?: {
    familyCode: string;
    subscription: string;
  };
}

interface AuthContextType {
  user: User | null;
  role: Role;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  loginWithOneTimeCode: (email: string, code: string) => Promise<{ success: boolean; message?: string }>;
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 🔹 Load stored user on app start
  useEffect(() => {
    const loadStoredUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        const storedToken = await AsyncStorage.getItem("token");
        
        if (storedUser && storedToken) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          console.log("✅ Loaded stored user:", parsedUser);
        }
      } catch (error) {
        console.error("⚠️ Failed to load stored user:", error);
        await clearAuthState();
      } finally {
        setIsLoading(false);
      }
    };
    loadStoredUser();
  }, []);

  // 🔹 Helper for API calls
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const token = await AsyncStorage.getItem("token");
    const headers: HeadersInit_ = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('API call error:', error);
      throw new Error(error.message || 'Network request failed');
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
        // FIXED: Extract user data from the correct response structure
        const userData = result.data?.user || result.user;
        if (!userData) {
          throw new Error("Invalid user data from server");
        }

        // FIXED: Use the actual role from the API response, don't default to 'parent'
        const finalUser: User = {
          id: userData._id || userData.id,
          role: userData.role, // Use the actual role from API
          email: userData.email,
          name: userData.name,
          phone: userData.phone,
          dob: userData.dob,
          children: userData.children,
          token: result.token,
          parent: userData.parent,
          childDetails: userData.childDetails,
          hasSetPassword: userData.hasSetPassword || result.data?.hasSetPassword,
        };

        setUser(finalUser);
        await AsyncStorage.setItem("user", JSON.stringify(finalUser));
        await AsyncStorage.setItem("token", result.token);

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
      
      // FIXED: Use the correct endpoint /auth/child-login-code
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
          role: 'child', // Always set as child for one-time code login
          email: userData.email,
          name: userData.name,
          token: result.token,
          hasSetPassword: userData.hasSetPassword || result.data?.hasSetPassword,
          childDetails: userData.childDetails,
          dob: userData.dob,
        };

        setUser(childUser);
        await AsyncStorage.setItem("user", JSON.stringify(childUser));
        await AsyncStorage.setItem("token", result.token);

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

  // ✅ LOGOUT
  const logout = async () => {
    try {
      setUser(null);
      await clearAuthState();
      console.log("✅ Logout successful");
    } catch (error) {
      console.error("🚨 Logout error:", error);
      throw error;
    }
  };

  // ✅ CLEAR AUTH STATE
  const clearAuthState = async () => {
    try {
      await AsyncStorage.multiRemove(["user", "token"]);
    } catch (error) {
      console.error("🚨 Clear auth state error:", error);
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

  // ✅ GENERATE ONE-TIME CODE FOR CHILD
  const generateOneTimeCode = async (
    parentId: string, 
    childName: string, 
    childEmail: string, 
    childDOB: string, 
    childGender: string
  ) => {
    try {
      const data = await apiCall("/auth/generate-code", {
        method: "POST",
        body: JSON.stringify({ 
          parentId, 
          childName, 
          childEmail, 
          childDOB, 
          childGender 
        }),
      });

      if (data.success) {
        return { 
          success: true, 
          code: data.code,
          message: data.message || "Child code generated successfully"
        };
      } else {
        return { 
          success: false, 
          message: data.message || "Failed to generate code" 
        };
      }
    } catch (error: any) {
      console.error("🚨 Generate code error:", error);
      return { 
        success: false, 
        message: error.message || "Failed to generate code" 
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
        login,
        loginWithOneTimeCode,
        logout,
        registerParent,
        generateOneTimeCode,
        setChildPassword,
        validateOneTimeCode,
        resetChildPassword,
        updateChildProfile,
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