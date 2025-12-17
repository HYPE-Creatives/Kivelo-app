// app/(dashboard)/child/settings.tsx - Redesigned Child Settings
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Dimensions,
  ActivityIndicator,
  Platform,
} from "react-native";
import { showAlert } from '@/utils/showAlert';
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../../context/AuthContext";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");
const API_URLS = [
  "http://localhost:5000/api/v1",  // Local dev server
  "https://family-wellness.onrender.com/api/v1",
];

// Helper function to try multiple API URLs
const apiCallWithFallback = async (
  endpoint: string,
  options: RequestInit
): Promise<Response> => {
  let lastError: Error | null = null;
  
  for (const baseUrl of API_URLS) {
    try {
      const response = await fetch(`${baseUrl}${endpoint}`, options);
      if (response.ok || response.status < 500) {
        return response;
      }
    } catch (err) {
      lastError = err as Error;
    }
  }
  
  throw lastError || new Error("All API endpoints failed");
};

export default function ChildSettings() {
  const { user, logout, refreshProfile } = useAuth();
  const router = useRouter();
  const [uploading, setUploading] = useState(false);

  const handleLogout = () => {
    showAlert(
      "👋 See you later!",
      "Are you sure you want to log out?",
      [
        { text: "Stay", style: "cancel" },
        {
          text: "Log Out",
          style: "destructive",
          onPress: () => {
            logout();
            router.replace("/(auth)/login");
          },
        },
      ]
    );
  };

  const handleChangePassword = () => {
    router.push("/(dashboard)/child/settings/change-password");
  };

  // Avatar upload handlers
  const handleAvatarPress = () => {
    showAlert(
      "📸 Update Your Photo",
      "How would you like to update your profile picture?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "📷 Take Photo", onPress: openCamera },
        { text: "🖼️ Choose from Gallery", onPress: openImageLibrary },
        ...(user?.avatar?.url ? [{ text: "🗑️ Remove Photo", style: "destructive" as const, onPress: handleRemoveAvatar }] : []),
      ]
    );
  };

  const openImageLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      showAlert("Permission Needed", "Please allow photo access to change your picture!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled && result.assets?.[0]) {
      await uploadAvatar(result.assets[0].uri);
    }
  };

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      showAlert("Permission Needed", "Please allow camera access to take a photo!");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled && result.assets?.[0]) {
      await uploadAvatar(result.assets[0].uri);
    }
  };

  const uploadAvatar = async (uri: string) => {
    try {
      setUploading(true);
      const token = await AsyncStorage.getItem("kivelo_access_token");
      if (!token) throw new Error("Not logged in");

      const formData = new FormData();
      const ext = uri.split(".").pop() || "jpg";
      // @ts-ignore
      formData.append("avatar", {
        uri: Platform.OS === "ios" ? uri.replace("file://", "") : uri,
        name: `avatar.${ext}`,
        type: `image/${ext}`,
      });

      const res = await apiCallWithFallback("/users/avatar", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      await refreshProfile();
      showAlert("🎉 Awesome!", "Your new photo looks great!");
    } catch (err: any) {
      console.error("Avatar upload failed", err);
      showAlert("Oops!", "Couldn't update your photo. Try again!");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      setUploading(true);
      const token = await AsyncStorage.getItem("kivelo_access_token");
      const res = await apiCallWithFallback("/users/avatar", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      if (!res.ok) throw new Error("Failed to remove");
      await refreshProfile();
      showAlert("Done!", "Photo removed");
    } catch (err) {
      showAlert("Oops!", "Couldn't remove photo");
    } finally {
      setUploading(false);
    }
  };

  const initials = (user?.name || "U")
    .split(" ")
    .map((p: string) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const settingsSections = [
    {
      title: "✨ My Stuff",
      items: [
        {
          icon: "person",
          label: "My Profile",
          description: "View and edit your info",
          onPress: () => router.push("/(dashboard)/child/settings/profile-edit"),
          gradient: ["#667eea", "#764ba2"],
        },
        {
          icon: "key",
          label: "Change Password",
          description: "Keep your account secure",
          onPress: handleChangePassword,
          gradient: ["#f093fb", "#f5576c"],
        },
      ],
    },
    {
      title: "🎯 Activities",
      items: [
        {
          icon: "calendar",
          label: "My Schedule",
          description: "See what's planned for today",
          onPress: () => router.push("/(dashboard)/child/schedule"),
          gradient: ["#4facfe", "#00f2fe"],
        },
        {
          icon: "heart",
          label: "Mood Journal",
          description: "Track how you're feeling",
          onPress: () => router.push("/(dashboard)/child/mood"),
          gradient: ["#fa709a", "#fee140"],
        },
        {
          icon: "trophy",
          label: "Achievements",
          description: "See your badges and points",
          onPress: () => router.push("/(dashboard)/child/achievements"),
          gradient: ["#a8edea", "#fed6e3"],
        },
      ],
    },
    {
      title: "⚙️ Settings",
      items: [
        {
          icon: "notifications",
          label: "Notifications",
          description: "Manage your alerts",
          onPress: () => showAlert("Coming Soon!", "Notification settings will be here soon! 🔔"),
          gradient: ["#ffecd2", "#fcb69f"],
        },
        {
          icon: "help-circle",
          label: "Help & Support",
          description: "Get help when you need it",
          onPress: () => showAlert("Need Help? 💬", "Ask your parent or guardian for help, or check the FAQ in the app!"),
          gradient: ["#a1c4fd", "#c2e9fb"],
        },
        {
          icon: "information-circle",
          label: "About Kivelo",
          description: "Learn about this app",
          onPress: () => showAlert(
            "🌟 Kivelo Family Wellness",
            "Version 1.0.0\n\nHelping families stay connected and happy together!\n\n© 2025 MrDOF"
          ),
          gradient: ["#d299c2", "#fef9d7"],
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <Text style={styles.headerSubtitle}>Customize your experience</Text>
      </LinearGradient>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={handleAvatarPress}
            activeOpacity={0.8}
          >
            {user?.avatar?.url ? (
              <Image source={{ uri: user.avatar.url }} style={styles.avatarImage} />
            ) : (
              <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </LinearGradient>
            )}
            {uploading ? (
              <View style={styles.avatarOverlay}>
                <ActivityIndicator color="white" size="small" />
              </View>
            ) : (
              <View style={styles.cameraBadge}>
                <Ionicons name="camera" size={16} color="white" />
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name || "Hey there!"}</Text>
            <Text style={styles.profileEmail}>{user?.email || "Welcome to Kivelo"}</Text>
            <View style={styles.profileBadge}>
              <Ionicons name="star" size={14} color="#fbbf24" />
              <Text style={styles.profileBadgeText}>Super Kid</Text>
            </View>
          </View>
        </View>

        {/* Settings Sections */}
        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.map((item, itemIndex) => (
              <TouchableOpacity
                key={itemIndex}
                style={styles.settingItem}
                onPress={item.onPress}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={item.gradient as [string, string]}
                  style={styles.iconGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name={item.icon as any} size={22} color="white" />
                </LinearGradient>
                <View style={styles.itemContent}>
                  <Text style={styles.itemLabel}>{item.label}</Text>
                  <Text style={styles.itemDescription}>{item.description}</Text>
                </View>
                <View style={styles.chevronContainer}>
                  <Ionicons name="chevron-forward" size={20} color="#c4b5fd" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
          <LinearGradient
            colors={["#fee2e2", "#fecaca"]}
            style={styles.logoutGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="log-out-outline" size={24} color="#dc2626" />
            <Text style={styles.logoutText}>Log Out</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Made with</Text>
          <Ionicons name="heart" size={16} color="#ef4444" style={styles.heartIcon} />
          <Text style={styles.footerText}>by</Text>
          <Text style={styles.footerBrand}> MrDOF</Text>
        </View>
        <Text style={styles.footerVersion}>Kivelo v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#667eea",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 25,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
  },
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -15,
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 120,
  },
  // Profile Card
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 20,
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  avatarContainer: {
    position: "relative",
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: "#e0e7ff",
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#e0e7ff",
  },
  avatarInitials: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
  },
  avatarOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 40,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  cameraBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#667eea",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
  },
  profileEmail: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
  },
  profileBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef3c7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginTop: 8,
    gap: 4,
  },
  profileBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#d97706",
  },
  // Sections
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 12,
    marginLeft: 4,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconGradient: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  itemContent: {
    flex: 1,
    marginLeft: 14,
  },
  itemLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
  },
  itemDescription: {
    fontSize: 13,
    color: "#94a3b8",
    marginTop: 2,
  },
  chevronContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  // Logout
  logoutButton: {
    marginHorizontal: 16,
    marginTop: 32,
    borderRadius: 16,
    overflow: "hidden",
  },
  logoutGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 10,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#dc2626",
  },
  // Footer
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 32,
    gap: 4,
  },
  footerText: {
    fontSize: 13,
    color: "#94a3b8",
  },
  heartIcon: {
    marginHorizontal: 2,
  },
  footerBrand: {
    fontSize: 14,
    fontWeight: "700",
    color: "#667eea",
  },
  footerVersion: {
    fontSize: 11,
    color: "#cbd5e1",
    textAlign: "center",
    marginTop: 6,
    marginBottom: 20,
  },
});
