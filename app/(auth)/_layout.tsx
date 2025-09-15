// app/(auth)/_layout.tsx
import { Slot, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../../context/AuthContext";

export default function AuthLayout() {
  const router = useRouter();
  const { login } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("dummyUser");
        if (storedUser) {
          const user = JSON.parse(storedUser);

          // Restore role into context
          if (user.role) {
            login(user.role);
            if (user.role === "parent") {
              router.replace("/(dashboard)/parent/home");
            } else if (user.role === "child") {
              router.replace("/(dashboard)/child/home");
            }
          }
        }
      } catch (err) {
        console.error("Error restoring auth:", err);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-green-50">
        <ActivityIndicator size="large" color="#16A34A" />
      </View>
    );
  }

  // Show login/register/forgot-password pages
  return (
    <View className="flex-1 bg-green-50">
      <Slot />
    </View>
  );
}
