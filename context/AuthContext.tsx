// app/(auth)/context/AuthContext.tsx
import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Role = "parent" | "child" | null;

interface AuthContextType {
  role: Role;
  login: (r: Role) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>(null);

  // ✅ Load saved role on startup
  useEffect(() => {
    const loadRole = async () => {
      const saved = await AsyncStorage.getItem("dummyUser");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.role) {
          setRole(parsed.role as Role);
        }
      }
    };
    loadRole();
  }, []);

  // ✅ Save role when logging in
  const login = async (r: Role) => {
    setRole(r);
    await AsyncStorage.setItem("dummyUser", JSON.stringify({ role: r }));
  };

  const logout = async () => {
    setRole(null);
    await AsyncStorage.removeItem("dummyUser");
  };

  return (
    <AuthContext.Provider value={{ role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
