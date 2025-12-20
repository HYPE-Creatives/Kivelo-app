// app/(dashboard)/parent/_layout.tsx
import { Tabs, Redirect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../../context/AuthContext";
import { ParentProvider } from "../../../context/ParentContext";
import { ActivityProvider } from "../../../context/ActivityContext";
import { NotificationProvider } from "../../../context/NotificationContext";
import { ThemeProvider, useTheme } from "../../../context/ThemeContext";
import { ConversationProvider } from "../../../context/ConversationContext";
import { useEffect } from "react";
import { BackHandler, Platform, StatusBar } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Themed Tabs component that uses the theme context
function ThemedTabs() {
  const { colors, themeColors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 10);

  return (
    <>
      <StatusBar 
        barStyle={isDark ? "light-content" : "dark-content"} 
        backgroundColor={colors.background}
      />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#FFFFFF",
          tabBarInactiveTintColor: "rgba(255,255,255,0.7)",
          tabBarStyle: {
            backgroundColor: themeColors.primary,
            borderTopWidth: 0,
            paddingTop: 8,
            paddingBottom: bottomInset,
            height: 60 + bottomInset,
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
          sceneStyle: { backgroundColor: colors.background },
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
          name="activities"
          options={{
            href: null,
            title: "Activities",
          }}
        />
        <Tabs.Screen
          name="submissions"
          options={{
            href: null,
            title: "Submissions",
          }}
        />
        <Tabs.Screen
          name="notifications"
          options={{
            href: null,
            title: "Notifications",
          }}
        />
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
        <Tabs.Screen
          name="settings/theme-settings"
          options={{
            href: null,
            title: "Theme Settings",
          }}
        />
        <Tabs.Screen
          name="settings/change-password"
          options={{
            href: null,
            title: "Change Password",
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            href: null,
            title: "Child Chat",
          }}
        />
        <Tabs.Screen
          name="family-chat"
          options={{
            href: null,
            title: "Family Group Chat",
          }}
        />
      </Tabs>
    </>
  );
}

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
    <ThemeProvider>
      <ParentProvider>
        <ActivityProvider>
          <NotificationProvider>
            <ConversationProvider>
              <ThemedTabs />
            </ConversationProvider>
          </NotificationProvider>
        </ActivityProvider>
      </ParentProvider>
    </ThemeProvider>
  );
}
