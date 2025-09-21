// app/context/AuthContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Simple hash function that works everywhere
function simpleHash(password: string): string {
  let hash = 0;
  if (password.length === 0) return hash.toString();
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}

// Use our simple hash function
async function hashPassword(password: string): Promise<string> {
  return simpleHash(password);
}

async function comparePassword(plainText: string, hashed: string): Promise<boolean> {
  return simpleHash(plainText) === hashed;
}

type Role = "parent" | "child" | "ai" | null;

interface User {
  id: string;
  role: Role;
  email: string;
  name: string;
  phone?: string;
  dob?: string;
  children?: string[];
  hasSetPassword?: boolean;
}

interface OneTimeCode {
  code: string;
  parentId: string;
  createdAt: number;
  expiresAt: number;
  used: boolean;
}

interface AuthContextType {
  user: User | null;
  role: Role;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  registerParent: (email: string, password: string, name: string, phone: string, dob: string) => Promise<{ success: boolean; message?: string }>;
  generateOneTimeCode: (parentId: string) => { code: string; expiresAt: number };
  registerChildWithCode: (code: string, email: string, name: string) => Promise<{ success: boolean; message?: string }>;
  setChildPassword: (childId: string, password: string) => Promise<{ success: boolean; message?: string }>;
  validateOneTimeCode: (code: string) => { valid: boolean; message?: string };
  resetChildPassword: (parentId: string, childEmail: string) => Promise<{ success: boolean; message?: string }>;
}

// Mock user data
const mockUsers: User[] = [
  { 
    id: "1", 
    role: "parent", 
    email: "parent1@test.com", 
    name: "John Doe", 
    phone: "123-456-7890", 
    dob: "1980-01-01", 
    children: ["3"] 
  },
  { 
    id: "2", 
    role: "parent", 
    email: "parent2@test.com", 
    name: "Jane Smith", 
    phone: "098-765-4321", 
    dob: "1985-05-15", 
    children: [] 
  },
  { 
    id: "3", 
    role: "child", 
    email: "child1@test.com", 
    name: "Jimmy Doe", 
    hasSetPassword: true 
  }
];

// Mock password storage - using our simple hash values
const mockPasswordStorage: Record<string, string> = {
  "parent1@test.com": "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8", // "password"
  "parent2@test.com": "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8", // "password"
  "child1@test.com": "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8",  // "password"
};

// Mock one-time codes storage
let mockOneTimeCodes: OneTimeCode[] = [];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function generateRandomCode(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from AsyncStorage on mount
  useEffect(() => {
    const loadStoredUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error("Failed to load stored user:", error);
        await AsyncStorage.removeItem('user');
      } finally {
        setIsLoading(false);
      }
    };
    loadStoredUser();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      setIsLoading(true);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return { success: false, message: "Invalid email format" };
      }
      
      // Check if user exists
      const foundUser = mockUsers.find(u => u.email === email);
      if (!foundUser) {
        return { success: false, message: "User not found" };
      }
      
      // For children who haven't set their password yet
      if (foundUser.role === "child" && !foundUser.hasSetPassword) {
        return { 
          success: false, 
          message: "Please use your one-time code to set up your account first" 
        };
      }
      
      // Compare passwords using our simple hash
      const isPasswordValid = await comparePassword(password, mockPasswordStorage[email]);
      
      if (!isPasswordValid) {
        return { success: false, message: "Invalid password" };
      }
      
      setUser(foundUser);
      await AsyncStorage.setItem('user', JSON.stringify(foundUser));
      
      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, message: "An error occurred during login" };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem('user');
  };

  const registerParent = async (
    email: string, 
    password: string, 
    name: string, 
    phone: string, 
    dob: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      setIsLoading(true);
      
      // Check if email already exists
      if (mockUsers.some(u => u.email === email)) {
        return { success: false, message: "Email already registered" };
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return { success: false, message: "Invalid email format" };
      }
      
      // Validate password strength
      if (password.length < 6) {
        return { success: false, message: "Password must be at least 6 characters" };
      }
      
      // Hash password using our simple function
      const hashedPassword = await hashPassword(password);
      
      // Create new parent user
      const newParent: User = {
        id: `${mockUsers.length + 1}`,
        role: "parent",
        email,
        name,
        phone,
        dob,
        children: []
      };
      
      // Add to mockUsers and mockPasswordStorage
      mockUsers.push(newParent);
      mockPasswordStorage[email] = hashedPassword;
      
      return { success: true };
    } catch (error) {
      console.error("Error registering parent:", error);
      return { success: false, message: "Failed to register" };
    } finally {
      setIsLoading(false);
    }
  };

  const resetChildPassword = async (
    parentId: string,
    childEmail: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      // Verify parent exists and has permission
      const parent = mockUsers.find(u => u.id === parentId && u.role === "parent");
      if (!parent) {
        return { success: false, message: "Parent not found" };
      }

      // Verify child exists and belongs to this parent
      const child = mockUsers.find(u => 
        u.email === childEmail && 
        u.role === "child" &&
        parent.children?.includes(u.id)
      );
      
      if (!child) {
        return { success: false, message: "Child not found or not associated with this parent" };
      }

      // Generate a new one-time code specifically for password reset
      const resetCode = generateRandomCode();
      const createdAt = Date.now();
      const expiresAt = createdAt + 60 * 60 * 1000; // 1 hour

      // Store reset code
      const resetCodeEntry: OneTimeCode = {
        code: resetCode,
        parentId,
        createdAt,
        expiresAt,
        used: false
      };
      
      mockOneTimeCodes.push(resetCodeEntry);

      // Mark that child needs to set password again
      child.hasSetPassword = false;

      return { 
        success: true, 
        message: `Password reset code generated: ${resetCode}. This code expires in 1 hour.` 
      };
    } catch (error) {
      console.error("Error resetting child password:", error);
      return { success: false, message: "Failed to reset password" };
    }
  };

  const generateOneTimeCode = (parentId: string): { code: string; expiresAt: number } => {
    // Check if parent exists
    const parent = mockUsers.find(u => u.id === parentId && u.role === "parent");
    if (!parent) {
      throw new Error("Parent not found");
    }
    
    // Generate a unique code
    let code: string;
    do {
      code = generateRandomCode();
    } while (mockOneTimeCodes.some(otc => otc.code === code));
    
    // Set expiration (1 hour from now)
    const createdAt = Date.now();
    const expiresAt = createdAt + 60 * 60 * 1000;
    
    // Store the code
    const oneTimeCode: OneTimeCode = {
      code,
      parentId,
      createdAt,
      expiresAt,
      used: false
    };
    
    mockOneTimeCodes.push(oneTimeCode);
    
    // Clean up expired codes
    mockOneTimeCodes = mockOneTimeCodes.filter(otc => otc.expiresAt > Date.now());
    
    return { code, expiresAt };
  };

  const validateOneTimeCode = (code: string): { valid: boolean; message?: string } => {
    // Clean up expired codes first
    mockOneTimeCodes = mockOneTimeCodes.filter(otc => otc.expiresAt > Date.now());
    
    const oneTimeCode = mockOneTimeCodes.find(otc => otc.code === code);
    
    if (!oneTimeCode) {
      return { valid: false, message: "Invalid code" };
    }
    
    if (oneTimeCode.used) {
      return { valid: false, message: "Code has already been used" };
    }
    
    if (oneTimeCode.expiresAt < Date.now()) {
      return { valid: false, message: "Code has expired" };
    }
    
    return { valid: true };
  };

  const registerChildWithCode = async (
    code: string, 
    email: string, 
    name: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      // Validate the code
      const validation = validateOneTimeCode(code);
      if (!validation.valid) {
        return { success: false, message: validation.message };
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return { success: false, message: "Invalid email format" };
      }
      
      // Check if email exists but password is not set (allow re-registration)
      const existingUser = mockUsers.find(u => u.email === email);
      if (existingUser && existingUser.hasSetPassword) {
        return { success: false, message: "Email already registered with a password" };
      }

      // If user exists but no password set, remove them first
      if (existingUser && !existingUser.hasSetPassword) {
        const userIndex = mockUsers.findIndex(u => u.email === email);
        if (userIndex !== -1) {
          mockUsers.splice(userIndex, 1);
        }
        // Also remove from parent's children list
        const parent = mockUsers.find(u => u.children?.includes(existingUser.id));
        if (parent) {
          parent.children = parent.children?.filter(id => id !== existingUser.id);
        }
      }
      
      // Get the one-time code details
      const oneTimeCode = mockOneTimeCodes.find(otc => otc.code === code)!;
      
      // Create new child (without password yet)
      const newChild: User = {
        id: `${mockUsers.length + 1}`,
        role: "child",
        email,
        name,
        hasSetPassword: false // Child will set password on first login
      };
      
      // Add to mock users
      mockUsers.push(newChild);
      
      // Add child to parent's children list
      const parent = mockUsers.find(u => u.id === oneTimeCode.parentId);
      if (parent) {
        if (!parent.children) {
          parent.children = [];
        }
        parent.children.push(newChild.id);
      }
      
      // Mark code as used
      oneTimeCode.used = true;
      
      // Auto-login the child
      setUser(newChild);
      await AsyncStorage.setItem('user', JSON.stringify(newChild));
      
      return { success: true };
    } catch (error) {
      console.error("Error registering child:", error);
      return { success: false, message: "Failed to register child" };
    }
  };

  const setChildPassword = async (
    childId: string, 
    password: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      // Find the child
      const child = mockUsers.find(u => u.id === childId && u.role === "child");
      if (!child) {
        return { success: false, message: "Child account not found" };
      }
      
      // Validate password strength
      if (password.length < 6) {
        return { success: false, message: "Password must be at least 6 characters" };
      }
      
      // Hash and store the password
      mockPasswordStorage[child.email] = await hashPassword(password);
      
      // Mark that the child has set their password
      child.hasSetPassword = true;
      
      return { success: true };
    } catch (error) {
      console.error("Error setting child password:", error);
      return { success: false, message: "Failed to set password" };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isLoading,
        login,
        logout,
        registerParent,
        generateOneTimeCode,
        registerChildWithCode,
        setChildPassword,
        validateOneTimeCode,
        resetChildPassword, // Added the reset function
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