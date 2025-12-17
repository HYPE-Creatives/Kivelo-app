// app/(dashboard)/parent/notifications.tsx - Parent Notification Center
import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useNotifications, Notification } from "../../../context/NotificationContext";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Notification type configuration
const NOTIFICATION_TYPE_CONFIG: Record<string, { icon: string; color: string; bg: string; label: string }> = {
  mood_alert: { icon: "heart", color: "#EF4444", bg: "#FEE2E2", label: "Mood Alert" },
  streak_milestone: { icon: "flame", color: "#F59E0B", bg: "#FEF3C7", label: "Streak" },
  new_journal: { icon: "book", color: "#8B5CF6", bg: "#EDE9FE", label: "Journal" },
  new_activity: { icon: "clipboard", color: "#3B82F6", bg: "#DBEAFE", label: "Activity" },
  activity_completed: { icon: "checkmark-circle", color: "#16A34A", bg: "#DCFCE7", label: "Completed" },
  points_earned: { icon: "star", color: "#EC4899", bg: "#FCE7F3", label: "Points" },
  badge_earned: { icon: "trophy", color: "#F59E0B", bg: "#FEF3C7", label: "Badge" },
  system: { icon: "information-circle", color: "#6B7280", bg: "#F3F4F6", label: "System" },
  reminder: { icon: "alarm", color: "#3B82F6", bg: "#DBEAFE", label: "Reminder" },
  parent_alert: { icon: "alert-circle", color: "#EF4444", bg: "#FEE2E2", label: "Alert" },
  ai_suggestion: { icon: "sparkles", color: "#8B5CF6", bg: "#EDE9FE", label: "AI Insight" },
};

// Filter tabs
const FILTER_TABS = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "mood_alert", label: "Moods" },
  { key: "activity", label: "Activities" },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    loading,
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
  } = useNotifications();

  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    refreshNotifications();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshNotifications();
    setRefreshing(false);
  }, [refreshNotifications]);

  // Filter notifications based on active filter
  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "unread") return !n.isRead;
    if (activeFilter === "activity") return n.type === "new_activity" || n.type === "activity_completed";
    return n.type === activeFilter;
  });

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Handle notification tap
  const handleNotificationTap = async (notification: Notification) => {
    // Mark as read
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }

    // Navigate based on notification type
    const data = notification.data;
    switch (notification.type) {
      case "mood_alert":
        if (data?.childId) {
          router.push(`/(dashboard)/parent/family`);
        }
        break;
      case "new_journal":
        router.push("/(dashboard)/parent/journal");
        break;
      case "new_activity":
      case "activity_completed":
        router.push("/(dashboard)/parent/activities");
        break;
      default:
        // Just mark as read, no navigation
        break;
    }
  };

  // Handle mark all as read
  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };

  // Handle delete notification
  const handleDelete = async (notificationId: string) => {
    await deleteNotification(notificationId);
  };

  // Render notification item
  const renderNotificationItem = (notification: Notification) => {
    const config = NOTIFICATION_TYPE_CONFIG[notification.type] || NOTIFICATION_TYPE_CONFIG.system;
    const priorityColor = notification.priority >= 4 ? "#EF4444" : notification.priority >= 3 ? "#F59E0B" : "#6B7280";

    return (
      <TouchableOpacity
        key={notification._id}
        style={[
          styles.notificationItem,
          !notification.isRead && styles.unreadItem,
        ]}
        onPress={() => handleNotificationTap(notification)}
        activeOpacity={0.7}
      >
        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: config.bg }]}>
          <Ionicons name={config.icon as any} size={22} color={config.color} />
        </View>

        {/* Content */}
        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <View style={styles.titleRow}>
              <Text style={styles.notificationTitle} numberOfLines={1}>
                {notification.title}
              </Text>
              {!notification.isRead && <View style={styles.unreadDot} />}
            </View>
            <Text style={styles.notificationTime}>
              {formatRelativeTime(notification.createdAt)}
            </Text>
          </View>
          <Text style={styles.notificationMessage} numberOfLines={2}>
            {notification.message}
          </Text>
          <View style={styles.notificationFooter}>
            <View style={[styles.typeTag, { backgroundColor: config.bg }]}>
              <Text style={[styles.typeTagText, { color: config.color }]}>
                {config.label}
              </Text>
            </View>
            {notification.priority >= 4 && (
              <View style={styles.priorityTag}>
                <Ionicons name="alert" size={12} color={priorityColor} />
                <Text style={[styles.priorityText, { color: priorityColor }]}>
                  High Priority
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Delete button */}
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => handleDelete(notification._id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="trash-outline" size={18} color="#9CA3AF" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* Header */}
      <LinearGradient
        colors={["#16A34A", "#15803D"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Notifications</Text>
            {unreadCount > 0 && (
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
          {unreadCount > 0 && (
            <TouchableOpacity
              style={styles.markAllBtn}
              onPress={handleMarkAllRead}
            >
              <Text style={styles.markAllText}>Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        >
          {FILTER_TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.filterTab,
                activeFilter === tab.key && styles.filterTabActive,
              ]}
              onPress={() => setActiveFilter(tab.key)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  activeFilter === tab.key && styles.filterTabTextActive,
                ]}
              >
                {tab.label}
                {tab.key === "unread" && unreadCount > 0 && ` (${unreadCount})`}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </LinearGradient>

      {/* Notification List */}
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#16A34A"]}
            tintColor="#16A34A"
          />
        }
      >
        {loading && notifications.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#16A34A" />
            <Text style={styles.loadingText}>Loading notifications...</Text>
          </View>
        ) : filteredNotifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="notifications-off-outline" size={64} color="#D1D5DB" />
            </View>
            <Text style={styles.emptyTitle}>No notifications</Text>
            <Text style={styles.emptySubtitle}>
              {activeFilter === "unread"
                ? "You're all caught up! 🎉"
                : "You'll see updates about your children here"}
            </Text>
          </View>
        ) : (
          <>
            {filteredNotifications.map(renderNotificationItem)}
            <View style={styles.listFooter}>
              <Text style={styles.footerText}>
                {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? "s" : ""}
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#16A34A",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  headerBadge: {
    marginLeft: 8,
    backgroundColor: "#EF4444",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    minWidth: 24,
    alignItems: "center",
  },
  headerBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  markAllBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 16,
  },
  markAllText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 4,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
  },
  filterTabActive: {
    backgroundColor: "#FFFFFF",
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.9)",
  },
  filterTabTextActive: {
    color: "#16A34A",
  },
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    paddingHorizontal: 40,
  },
  notificationItem: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  unreadItem: {
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#86EFAC",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  titleRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#16A34A",
    marginLeft: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  notificationMessage: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  typeTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  typeTagText: {
    fontSize: 11,
    fontWeight: "600",
  },
  priorityTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: "500",
  },
  deleteBtn: {
    padding: 8,
    marginLeft: 4,
  },
  listFooter: {
    alignItems: "center",
    paddingVertical: 16,
  },
  footerText: {
    fontSize: 12,
    color: "#9CA3AF",
  },
});
