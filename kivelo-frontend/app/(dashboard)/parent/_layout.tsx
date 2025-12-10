// app/(dashboard)/parent/_layout.tsx
import { Tabs, Redirect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../../context/AuthContext";
import { ParentProvider } from "../../../context/ParentContext";
import { useEffect } from "react";
import { BackHandler } from "react-native";

export default function ParentLayout() {
  const { role } = useAuth();

  // Prevent hardware back button from going to auth screens
  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      // Return true to prevent default back behavior when on dashboard
      // This prevents going back to login/auth screens
      return true;
    });

    return () => backHandler.remove();
  }, []);

  if (role !== "parent") {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <ParentProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#FFFFFF",
          tabBarInactiveTintColor: "rgba(255,255,255,0.7)",
          tabBarStyle: {
            backgroundColor: "#16A34A",
            borderTopWidth: 0,
            paddingTop: 8,
            paddingBottom: 50,
            height: 110,
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            elevation: 20,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "600",
            marginTop: 2,
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: "Home",
            headerTitle: "Family Dashboard",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "home" : "home-outline"} size={28} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="family"
          options={{
            title: "Family",
            headerTitle: "Manage Family",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "people" : "people-outline"} size={28} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="journal"
          options={{
            title: "Journal",
            headerTitle: "Children's Journals",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "book" : "book-outline"} size={28} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="ai-insight"
          options={{
            title: "Insights",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "analytics" : "analytics-outline"} size={28} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "settings" : "settings-outline"} size={28} color={color} />
            ),
          }}
        />
        {/* Hidden routes */}
        <Tabs.Screen
          name="learning-hub"
          options={{
            href: null,
            title: "Learning Hub",
          }}
        />
        <Tabs.Screen
          name="profile-edit"
          options={{
            href: null,
            title: "Edit Profile",
          }}
        />
        <Tabs.Screen
          name="settings/profile-edit"
          options={{
            href: null,
            title: "Edit Profile",
          }}
        />
      </Tabs>
    </ParentProvider>
  );
}

