// app/(auth)/context/AuthContext.tsx
import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Role = "parent" | "child" | null;

interface User {
  username: string;
  profilePic?: string; // optional
  role: Role;
}

interface AuthContextType {
  role: Role;
  user: User | null;
  login: (u: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>(null);
  const [user, setUser] = useState<User | null>(null);

  // ✅ Load saved user on startup
  useEffect(() => {
    const loadUser = async () => {
      const saved = await AsyncStorage.getItem("dummyUser");
      if (saved) {
        const parsed: User = JSON.parse(saved);
        if (parsed?.role) {
          setRole(parsed.role);
          setUser(parsed);
        }
      }
    };
    loadUser();
  }, []);

  // ✅ Save user when logging in
  const login = async (u: User) => {
    setRole(u.role);
    setUser(u);
    await AsyncStorage.setItem("dummyUser", JSON.stringify(u));
  };

  const logout = async () => {
    setRole(null);
    setUser(null);
    await AsyncStorage.removeItem("dummyUser");
  };

  return (
    <AuthContext.Provider value={{ role, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
