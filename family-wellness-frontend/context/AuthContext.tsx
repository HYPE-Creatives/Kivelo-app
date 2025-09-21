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

async function hashPassword(password: string): Promise<string> {
  return simpleHash(password);
}

async function comparePassword(plainText: string, hashed: string): Promise<boolean> {
  return simpleHash(plainText) === hashed;
}

type Role = "parent" | "child" | "ai" | null;

interface ChildDetails {
  dob?: string;
  gender?: string;
  interests?: string[];
  gradeLevel?: string;
}

interface User {
  id: string;
  role: Role;
  email: string;
  name: string;
  phone?: string;
  dob?: string;
  children?: string[];
  hasSetPassword?: boolean;
  childDetails?: ChildDetails; // Added for child-specific data
}

interface OneTimeCode {
  code: string;
  parentId: string;
  childName: string;
  childEmail: string;
  childDOB: string;
  childGender: string;
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
  generateOneTimeCode: (parentId: string, childName: string, childEmail: string, childDOB: string, childGender: string) => { code: string; expiresAt: number };
  registerChildWithCode: (code: string, email: string) => Promise<{ success: boolean; message?: string }>;
  setChildPassword: (childId: string, password: string) => Promise<{ success: boolean; message?: string }>;
  validateOneTimeCode: (code: string) => { valid: boolean; message?: string; childName?: string };
  resetChildPassword: (parentId: string, childEmail: string) => Promise<{ success: boolean; message?: string }>;
  updateChildProfile: (childId: string, updates: Partial<ChildDetails>) => Promise<{ success: boolean; message?: string }>;
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
    children: [] 
  },
  { 
    id: "2", 
    role: "parent", 
    email: "parent2@test.com", 
    name: "Jane Smith", 
    phone: "098-765-4321", 
    dob: "1985-05-15", 
    children: [] 
  }
];

// Mock password storage
const mockPasswordStorage: Record<string, string> = {
  "parent1@test.com": simpleHash("password"),
  "parent2@test.com": simpleHash("password"),
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

  useEffect(() => {
    const loadStoredUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          console.log("Loaded user from storage:", parsedUser);
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

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) return { success: false, message: "Invalid email format" };

      const foundUser = mockUsers.find(u => u.email === email);
      if (!foundUser) return { success: false, message: "User not found" };

      if (foundUser.role === "child" && !foundUser.hasSetPassword) {
        return { success: false, message: "Please use your one-time code to set up your account first" };
      }

      const storedHash = mockPasswordStorage[email];
      if (!storedHash) return { success: false, message: "No password set for this user" };

      const isPasswordValid = await comparePassword(password, storedHash);
      if (!isPasswordValid) return { success: false, message: "Invalid password" };

      setUser(foundUser);
      await AsyncStorage.setItem('user', JSON.stringify(foundUser));
      console.log("Logged in user:", foundUser);
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
  ) => {
    try {
      setIsLoading(true);
      if (mockUsers.some(u => u.email === email)) return { success: false, message: "Email already registered" };
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) return { success: false, message: "Invalid email format" };
      if (password.length < 6) return { success: false, message: "Password must be at least 6 characters" };

      const hashedPassword = await hashPassword(password);

      const newParent: User = {
        id: `${mockUsers.length + 1}`,
        role: "parent",
        email,
        name,
        phone,
        dob,
        children: []
      };

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

  const generateOneTimeCode = (parentId: string, childName: string, childEmail: string, childDOB: string, childGender: string) => {
    const parent = mockUsers.find(u => u.id === parentId && u.role === "parent");
    if (!parent) throw new Error("Parent not found");

    let code: string;
    do {
      code = generateRandomCode();
    } while (mockOneTimeCodes.some(otc => otc.code === code));

    const createdAt = Date.now();
    const expiresAt = createdAt + 60 * 60 * 1000;

    const newCode = { 
      code, 
      parentId, 
      childName, 
      childEmail,
      childDOB,
      childGender,
      createdAt, 
      expiresAt, 
      used: false 
    };
    
    mockOneTimeCodes.push(newCode);
    mockOneTimeCodes = mockOneTimeCodes.filter(otc => otc.expiresAt > Date.now());

    console.log("Generated code for child:", childName, "Code:", code);
    return { code, expiresAt };
  };

  const validateOneTimeCode = (code: string) => {
    mockOneTimeCodes = mockOneTimeCodes.filter(otc => otc.expiresAt > Date.now());
    const oneTimeCode = mockOneTimeCodes.find(otc => otc.code === code);

    if (!oneTimeCode) return { valid: false, message: "Invalid code" };
    if (oneTimeCode.used) return { valid: false, message: "Code has already been used" };
    if (oneTimeCode.expiresAt < Date.now()) return { valid: false, message: "Code has expired" };

    return { valid: true, childName: oneTimeCode.childName };
  };

  const registerChildWithCode = async (code: string, email: string) => {
    try {
      console.log("Registering child with code:", code, "email:", email);
      
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
      const oneTimeCode = mockOneTimeCodes.find(otc => otc.code === code);
      if (!oneTimeCode) {
        return { success: false, message: "Invalid code" };
      }

      // Create new child with all details from parent registration
      const newChild: User = {
        id: `${mockUsers.length + 1}`,
        role: "child",
        email: oneTimeCode.childEmail, // Use the email from parent registration
        name: oneTimeCode.childName,
        dob: oneTimeCode.childDOB,
        hasSetPassword: false,
        childDetails: {
          dob: oneTimeCode.childDOB,
          gender: oneTimeCode.childGender,
          interests: [],
          gradeLevel: ""
        }
      };

      // Add to mock users
      mockUsers.push(newChild);

      // Add child to parent's children list
      const parent = mockUsers.find(u => u.id === oneTimeCode.parentId);
      if (parent) {
        if (!parent.children) parent.children = [];
        parent.children.push(newChild.id);
      }

      // Mark code as used
      oneTimeCode.used = true;

      // Auto-login the child
      setUser(newChild);
      await AsyncStorage.setItem('user', JSON.stringify(newChild));
      
      console.log("Child registered successfully:", newChild);
      console.log("All users:", mockUsers);

      return { success: true };
    } catch (error) {
      console.error("Error registering child:", error);
      return { success: false, message: "Failed to register child" };
    }
  };

  const setChildPassword = async (childId: string, password: string) => {
    try {
      const child = mockUsers.find(u => u.id === childId && u.role === "child");
      if (!child) return { success: false, message: "Child account not found" };
      if (password.length < 6) return { success: false, message: "Password must be at least 6 characters" };

      mockPasswordStorage[child.email] = await hashPassword(password);
      child.hasSetPassword = true;

      // Update the user state if it's the current user
      if (user?.id === childId) {
        const updatedUser = { ...user, hasSetPassword: true };
        setUser(updatedUser);
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      }

      return { success: true };
    } catch (error) {
      console.error("Error setting child password:", error);
      return { success: false, message: "Failed to set password" };
    }
  };

  const updateChildProfile = async (childId: string, updates: Partial<ChildDetails>) => {
    try {
      const child = mockUsers.find(u => u.id === childId && u.role === "child");
      if (!child) return { success: false, message: "Child account not found" };

      // Update child details
      if (!child.childDetails) {
        child.childDetails = {};
      }
      
      child.childDetails = { ...child.childDetails, ...updates };

      // Update the user state if it's the current user
      if (user?.id === childId) {
        const updatedUser = { ...user, childDetails: child.childDetails };
        setUser(updatedUser);
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      }

      return { success: true, message: "Profile updated successfully" };
    } catch (error) {
      console.error("Error updating child profile:", error);
      return { success: false, message: "Failed to update profile" };
    }
  };

  const resetChildPassword = async (parentId: string, childEmail: string) => {
    try {
      const parent = mockUsers.find(u => u.id === parentId && u.role === "parent");
      if (!parent) return { success: false, message: "Parent not found" };

      const child = mockUsers.find(u => u.email === childEmail && u.role === "child" && parent.children?.includes(u.id));
      if (!child) return { success: false, message: "Child not found or not associated with this parent" };

      const resetCode = generateRandomCode();
      const createdAt = Date.now();
      const expiresAt = createdAt + 60 * 60 * 1000;

      const resetCodeEntry: OneTimeCode = {
        code: resetCode,
        parentId,
        childName: child.name,
        childEmail: child.email,
        childDOB: child.dob || "",
        childGender: child.childDetails?.gender || "",
        createdAt,
        expiresAt,
        used: false
      };

      mockOneTimeCodes.push(resetCodeEntry);
      child.hasSetPassword = false;

      return { success: true, message: `Password reset code generated: ${resetCode}. This code expires in 1 hour.` };
    } catch (error) {
      console.error("Error resetting child password:", error);
      return { success: false, message: "Failed to reset password" };
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
        resetChildPassword,
        updateChildProfile,
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