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
import { useEffect } from "react";
import { BackHandler, View, Image, Text, TouchableOpacity, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Avatar component for header
function HeaderAvatar() {
  const { user } = useAuth();
  const router = useRouter();
  
  const initials = user?.name
    ? user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <TouchableOpacity 
      onPress={() => router.push("/(dashboard)/child/settings")}
      style={styles.avatarContainer}
      activeOpacity={0.8}
    >
      {user?.avatar?.url ? (
        <Image source={{ uri: user.avatar.url }} style={styles.avatarImage} />
      ) : (
        <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.avatarPlaceholder}>
          <Text style={styles.avatarInitials}>{initials}</Text>
        </LinearGradient>
      )}
    </TouchableOpacity>
  );
}

export default function ChildLayout() {
  const { role } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Calculate bottom padding for safe area
  const bottomInset = Math.max(insets.bottom, 10);

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
    <NotificationProvider>
      <GamificationProvider>
        <ActivityProvider>
          <MoodProvider>
            <JournalProvider>
              <AIProvider>
                <Tabs
                  screenOptions={{
                    headerShown: true,
                    headerRight: () => <HeaderAvatar />,
                    headerRightContainerStyle: { paddingRight: 16 },
                    headerTitleStyle: { fontWeight: "600" },
                    tabBarStyle: {
                      paddingBottom: bottomInset,
                      height: 60 + bottomInset,
                    },
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
                  name="memory-match"
                  options={{
                    href: null,
                    title: "Memory Match",
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
              </AIProvider>
            </JournalProvider>
          </MoodProvider>
        </ActivityProvider>
      </GamificationProvider>
    </NotificationProvider>
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
