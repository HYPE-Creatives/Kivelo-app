// app/(dashboard)/child/_layout.tsx
import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs, useRouter } from "expo-router";
import { Text, TouchableOpacity } from "react-native";
import { useAuth } from "../../../context/AuthContext";

export default function ChildLayout() {
  const { role, logout } = useAuth();
  const router = useRouter();

  if (role !== "child") {
    return <Redirect href="/(auth)/login" />;
  }

  const handleLogout = () => {
    logout();
    router.replace("/(auth)/login"); // instant redirect after logout
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: "#4CAF50",   // ✅ green for active
        tabBarInactiveTintColor: "#9ca3af", // ✅ gray for inactive
        headerRight: () => (
          <TouchableOpacity
            onPress={handleLogout}
            style={{
              marginRight: 15,
              padding: 6,
              backgroundColor: "#ef4444",
              borderRadius: 6,
            }}
          >
            <Text style={{ color: "white", fontWeight: "600" }}>Logout</Text>
          </TouchableOpacity>
        ),
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="mood"
        options={{
          title: "Mood",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="happy-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ai-helper"
        options={{
          title: "AI Helper",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="sparkles-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: "Chats",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="games"
        options={{
          title: "Games",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="game-controller-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
