// app/(dashboard)/child/_layout.tsx
import { Tabs, Redirect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../../context/AuthContext";
import { MoodProvider } from "../../../context/MoodContext";
import { GamificationProvider } from "../../../context/GamificationContext";
import { ActivityProvider } from "../../../context/ActivityContext";
import { AIProvider } from "../../../context/AIContext";
import { NotificationProvider } from "../../../context/NotificationContext";
import { JournalProvider } from "../../../context/JournalContext";
import { ThemeProvider, useTheme } from "../../../context/ThemeContext";
import { ConversationProvider } from "../../../context/ConversationContext";
import { useEffect } from "react";
import { BackHandler, View, Image, Text, TouchableOpacity, StyleSheet, StatusBar } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Avatar component for header
function HeaderAvatar() {
  const { user } = useAuth();
  const router = useRouter();
  const { colors, themeColors } = useTheme();
  
  const initials = user?.name
    ? user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <TouchableOpacity 
      onPress={() => router.push("/(dashboard)/child/settings")}
      style={[styles.avatarContainer, { borderColor: colors.border }]}
      activeOpacity={0.8}
    >
      {user?.avatar?.url ? (
        <Image source={{ uri: user.avatar.url }} style={styles.avatarImage} />
      ) : (
        <LinearGradient colors={themeColors.gradient} style={styles.avatarPlaceholder}>
          <Text style={styles.avatarInitials}>{initials}</Text>
        </LinearGradient>
      )}
    </TouchableOpacity>
  );
}

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
          headerShown: true,
          headerRight: () => <HeaderAvatar />,
          headerRightContainerStyle: { paddingRight: 16 },
          headerTitleStyle: { fontWeight: "600", color: colors.text },
          headerStyle: { backgroundColor: colors.background },
          tabBarStyle: {
            paddingBottom: bottomInset,
            height: 60 + bottomInset,
            backgroundColor: colors.background,
            borderTopColor: colors.border,
          },
          tabBarActiveTintColor: themeColors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          sceneStyle: { backgroundColor: colors.background },
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
          name="journal"
          options={{
            title: "Journal",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="book-outline" size={size} color={color} />
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
        <Tabs.Screen
          name="chat"
          options={{
            title: "Chat",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="chatbubbles-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="settings-outline" size={size} color={color} />
            ),
          }}
        />
        {/* Hide these from tabs but keep them accessible via navigation */}
        <Tabs.Screen
          name="ai-helper"
          options={{
            href: null,
            title: "AI Helper",
          }}
        />
        <Tabs.Screen
          name="mood"
          options={{
            href: null,
            title: "Mood Check-in",
          }}
        />
        <Tabs.Screen
          name="activities"
          options={{
            href: null,
            title: "My Activities",
          }}
        />
        <Tabs.Screen
          name="achievements"
          options={{
            href: null,
            title: "Achievements",
          }}
        />
        <Tabs.Screen
          name="schedule"
          options={{
            href: null,
            title: "My Schedule",
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
          name="settings/change-password"
          options={{
            href: null,
            title: "Change Password",
          }}
        />
        <Tabs.Screen
          name="settings/notification-settings"
          options={{
            href: null,
            title: "Notification Settings",
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="settings/theme-settings"
          options={{
            href: null,
            title: "Theme Settings",
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="memory-match"
          options={{
            href: null,
            title: "Memory Match",
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="family-chat"
          options={{
            href: null,
            title: "Family Chat",
            headerShown: false,
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
          name="color-quest"
          options={{
            href: null,
            title: "Color Quest",
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="math-challenge"
          options={{
            href: null,
            title: "Math Challenge",
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="word-wizard"
          options={{
            href: null,
            title: "Word Wizard",
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="trivia-master"
          options={{
            href: null,
            title: "Trivia Master",
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="space-explorer"
          options={{
            href: null,
            title: "Space Explorer",
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="free-draw"
          options={{
            href: null,
            title: "Free Draw",
            headerShown: false,
          }}
        />
      </Tabs>
    </>
  );
}

export default function ChildLayout() {
  const { role } = useAuth();
  const router = useRouter();

  // Prevent hardware back button from going to auth screens
  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      // Return true to prevent default back behavior when on dashboard
      // This prevents going back to login/auth screens
      return true;
    });

    return () => backHandler.remove();
  }, []);

  if (role !== "child") {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <ThemeProvider>
      <NotificationProvider>
        <GamificationProvider>
          <ActivityProvider>
            <MoodProvider>
              <JournalProvider>
                <AIProvider>
                  <ConversationProvider>
                    <ThemedTabs />
                  </ConversationProvider>
                </AIProvider>
              </JournalProvider>
            </MoodProvider>
          </ActivityProvider>
        </GamificationProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 18,
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
  },
});
