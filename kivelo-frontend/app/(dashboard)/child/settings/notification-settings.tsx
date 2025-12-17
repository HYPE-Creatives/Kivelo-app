// app/(dashboard)/child/settings/notification-settings.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNotifications } from "../../../../context/NotificationContext";

// Fun, child-friendly notification settings
const NOTIFICATION_SETTINGS = [
  {
    key: "enableNotifications",
    icon: "notifications",
    emoji: "🔔",
    title: "All Notifications",
    description: "Turn all notifications on or off",
    color: "#7C3AED",
    isMaster: true,
  },
  {
    key: "activityUpdates",
    icon: "checkmark-circle",
    emoji: "✅",
    title: "Activity Reminders",
    description: "When you have activities to complete",
    color: "#22C55E",
  },
  {
    key: "streakMilestones",
    icon: "flame",
    emoji: "🔥",
    title: "Streak Alerts",
    description: "Celebrate your awesome streaks!",
    color: "#F97316",
  },
  {
    key: "badgeEarned",
    icon: "trophy",
    emoji: "🏆",
    title: "New Badges",
    description: "When you earn cool new badges",
    color: "#F59E0B",
  },
  {
    key: "aiSuggestions",
    icon: "sparkles",
    emoji: "✨",
    title: "Fun Tips",
    description: "Helpful tips and suggestions",
    color: "#A855F7",
  },
  {
    key: "systemNotifications",
    icon: "information-circle",
    emoji: "📢",
    title: "App Updates",
    description: "News about cool new features",
    color: "#3B82F6",
  },
];

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const { preferences, updatePreferences, unreadCount } = useNotifications();

  const handleToggle = (key: string, value: boolean) => {
    updatePreferences({ [key]: value });
  };

  return (
    <LinearGradient colors={["#7C3AED", "#A78BFA", "#C4B5FD"]} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>🔔 Notifications</Text>
            <Text style={styles.headerSubtitle}>Choose what alerts you want</Text>
          </View>
          <TouchableOpacity 
            style={styles.viewAllButton}
            onPress={() => router.push("/(dashboard)/child/notifications")}
          >
            <Ionicons name="mail" size={20} color="white" />
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Settings Content */}
        <View style={styles.contentContainer}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Info Card */}
            <View style={styles.infoCard}>
              <View style={styles.infoIconContainer}>
                <Text style={styles.infoEmoji}>💡</Text>
              </View>
              <Text style={styles.infoText}>
                You can turn notifications on or off here. Don't worry, you won't miss anything important!
              </Text>
            </View>

            {/* Settings List */}
            {NOTIFICATION_SETTINGS.map((setting, index) => {
              const isEnabled = preferences[setting.key as keyof typeof preferences];
              const isMaster = setting.isMaster;
              const isDisabled = !isMaster && !preferences.enableNotifications;

              return (
                <View 
                  key={setting.key}
                  style={[
                    styles.settingCard,
                    isMaster && styles.masterCard,
                    isDisabled && styles.settingCardDisabled,
                  ]}
                >
                  <View 
                    style={[
                      styles.settingIconContainer,
                      { backgroundColor: setting.color + "20" },
                    ]}
                  >
                    <Text style={styles.settingEmoji}>{setting.emoji}</Text>
                  </View>
                  
                  <View style={styles.settingContent}>
                    <Text style={[
                      styles.settingTitle,
                      isDisabled && styles.settingTitleDisabled
                    ]}>
                      {setting.title}
                    </Text>
                    <Text style={[
                      styles.settingDescription,
                      isDisabled && styles.settingDescriptionDisabled
                    ]}>
                      {setting.description}
                    </Text>
                  </View>
                  
                  <Switch
                    value={isEnabled}
                    onValueChange={(value) => handleToggle(setting.key, value)}
                    trackColor={{ false: "#E5E7EB", true: setting.color + "60" }}
                    thumbColor={isEnabled ? setting.color : "#9CA3AF"}
                    disabled={isDisabled}
                    ios_backgroundColor="#E5E7EB"
                  />
                </View>
              );
            })}

            {/* Footer Message */}
            <View style={styles.footerCard}>
              <Text style={styles.footerEmoji}>🎉</Text>
              <Text style={styles.footerText}>
                {preferences.enableNotifications 
                  ? "Great! You'll get updates about fun stuff happening in the app!"
                  : "Notifications are off. Turn them on to stay updated!"}
              </Text>
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "white",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  viewAllButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  unreadBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  unreadBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "white",
  },
  contentContainer: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  infoCard: {
    flexDirection: "row",
    backgroundColor: "#EDE9FE",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    alignItems: "center",
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  infoEmoji: {
    fontSize: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: "#5B21B6",
    lineHeight: 20,
  },
  settingCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  masterCard: {
    borderWidth: 2,
    borderColor: "#7C3AED",
    backgroundColor: "#FAFAFF",
  },
  settingCardDisabled: {
    opacity: 0.5,
  },
  settingIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  settingEmoji: {
    fontSize: 22,
  },
  settingContent: {
    flex: 1,
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 2,
  },
  settingTitleDisabled: {
    color: "#94A3B8",
  },
  settingDescription: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 18,
  },
  settingDescriptionDisabled: {
    color: "#CBD5E1",
  },
  footerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
  },
  footerEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  footerText: {
    flex: 1,
    fontSize: 14,
    color: "#166534",
    lineHeight: 20,
  },
});
