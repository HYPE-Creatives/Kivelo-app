// app/(auth)/context/AuthContext.tsx
import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Role = "parent" | "child" | null;

interface User {
  username: string;
  profilePic?: string;
  role: Role;
}

interface AuthContextType {
  role: Role;
  user: User | null;
  isLoading: boolean;
  login: (u: User, token?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ Auto-load user on startup (for auto-login)
  useEffect(() => {
    const loadUser = async () => {
      try {
        const savedUser = await AsyncStorage.getItem("userData");
        const savedToken = await AsyncStorage.getItem("userToken");

        if (savedUser && savedToken) {
          const parsedUser: User = JSON.parse(savedUser);
          setUser(parsedUser);
          setRole(parsedUser.role);
        }
      } catch (error) {
        console.error("Error loading user:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, []);

  // ✅ Login (save user + token)
  const login = async (u: User, token?: string) => {
    try {
      setRole(u.role);
      setUser(u);
      await AsyncStorage.setItem("userData", JSON.stringify(u));
      if (token) await AsyncStorage.setItem("userToken", token);
    } catch (error) {
      console.error("Error saving user:", error);
    }
  };

  // ✅ Logout (clear everything)
  const logout = async () => {
    try {
      setRole(null);
      setUser(null);
      await AsyncStorage.multiRemove(["userData", "userToken"]);
    } catch (error) {
      console.error("Error clearing user:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ role, user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
