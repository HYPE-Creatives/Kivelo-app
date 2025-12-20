// app/(dashboard)/child/notifications.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNotifications } from "../../../context/NotificationContext";

// Map backend notification types to icons - matching backend model
const getNotificationIcon = (type: string) => {
  switch (type) {
    case "mood_alert":
      return { name: "heart", color: "#EC4899" };
    case "streak_milestone":
      return { name: "flame", color: "#F97316" };
    case "new_journal":
      return { name: "book", color: "#8B5CF6" };
    case "points_earned":
      return { name: "star", color: "#F59E0B" };
    case "badge_earned":
      return { name: "trophy", color: "#22C55E" };
    case "system":
      return { name: "settings", color: "#64748b" };
    case "reminder":
      return { name: "alarm", color: "#3B82F6" };
    case "parent_alert":
      return { name: "people", color: "#06B6D4" };
    case "ai_suggestion":
      return { name: "sparkles", color: "#A855F7" };
    case "new_message":
    case "chat_message":
      return { name: "chatbubble-ellipses", color: "#10B981" };
    default:
      return { name: "notifications", color: "#64748b" };
  }
};

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString();
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { 
    notifications, 
    loading, 
    error, 
    getNotifications, 
    markAsRead, 
    markAllAsRead, 
    refreshNotifications,
    unreadCount,
    deleteNotification 
  } = useNotifications();
  
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    getNotifications({ limit: 50 });
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshNotifications();
    setRefreshing(false);
  };

  const handleNotificationPress = async (notification: any) => {
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }
    
    // Navigate to relevant screen based on notification type
    if (notification.type === 'new_message' || notification.type === 'chat_message') {
      // Navigate to family chat with the conversation
      if (notification.data?.conversationId) {
        router.push({
          pathname: '/(dashboard)/child/family-chat',
          params: {
            conversationId: notification.data.conversationId,
            contactName: notification.data.senderName || 'Family',
            contactRole: notification.data.senderRole || 'parent',
          }
        });
      } else {
        router.push('/(dashboard)/child/chat');
      }
    }
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };

  const handleDelete = async (notificationId: string) => {
    await deleteNotification(notificationId);
  };

  const filteredNotifications = filter === "unread" 
    ? notifications.filter(n => !n.isRead)
    : notifications;

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
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <TouchableOpacity 
              style={styles.markAllButton}
              onPress={handleMarkAllRead}
            >
              <Text style={styles.markAllText}>Read All</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterTabs}>
          <TouchableOpacity
            style={[styles.filterTab, filter === "all" && styles.filterTabActive]}
            onPress={() => setFilter("all")}
          >
            <Text style={[styles.filterTabText, filter === "all" && styles.filterTabTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, filter === "unread" && styles.filterTabActive]}
            onPress={() => setFilter("unread")}
          >
            <Text style={[styles.filterTabText, filter === "unread" && styles.filterTabTextActive]}>
              Unread {unreadCount > 0 && `(${unreadCount})`}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Notifications List */}
        <View style={styles.contentContainer}>
          {loading && notifications.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#7C3AED" />
              <Text style={styles.loadingText}>Loading notifications...</Text>
            </View>
          ) : error ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="cloud-offline-outline" size={60} color="#94a3b8" />
              <Text style={styles.emptyTitle}>Connection Error</Text>
              <Text style={styles.emptyText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
                <Text style={styles.retryText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : filteredNotifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-off-outline" size={60} color="#94a3b8" />
              <Text style={styles.emptyTitle}>
                {filter === "unread" ? "All Caught Up!" : "No Notifications"}
              </Text>
              <Text style={styles.emptyText}>
                {filter === "unread" 
                  ? "You've read all your notifications 🎉" 
                  : "You'll see notifications here when you get them"}
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  colors={["#7C3AED"]}
                  tintColor="#7C3AED"
                />
              }
            >
              {filteredNotifications.map((notification) => {
                const icon = getNotificationIcon(notification.type);
                return (
                  <TouchableOpacity
                    key={notification._id}
                    style={[
                      styles.notificationCard,
                      !notification.isRead && styles.notificationUnread
                    ]}
                    onPress={() => handleNotificationPress(notification)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.iconCircle, { backgroundColor: icon.color + "20" }]}>
                      <Ionicons name={icon.name as any} size={22} color={icon.color} />
                    </View>
                    <View style={styles.notificationContent}>
                      <View style={styles.notificationHeader}>
                        <Text style={styles.notificationTitle}>{notification.title}</Text>
                        {!notification.isRead && <View style={styles.unreadDot} />}
                      </View>
                      <Text style={styles.notificationMessage} numberOfLines={2}>
                        {notification.message}
                      </Text>
                      <Text style={styles.notificationTime}>
                        {formatTimeAgo(notification.createdAt)}
                      </Text>
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
              })}
              
              {/* Footer */}
              <Text style={styles.footerText}>
                {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? "s" : ""}
              </Text>
            </ScrollView>
          )}
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "white",
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
  },
  markAllText: {
    color: "white",
    fontSize: 13,
    fontWeight: "600",
  },
  filterTabs: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
    padding: 4,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
  },
  filterTabActive: {
    backgroundColor: "white",
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.8)",
  },
  filterTabTextActive: {
    color: "#7C3AED",
  },
  contentContainer: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: "#64748b",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
    marginTop: 16,
  },
  emptyText: {
    fontSize: 15,
    color: "#64748b",
    textAlign: "center",
    marginTop: 8,
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#7C3AED",
    borderRadius: 12,
  },
  retryText: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },
  notificationCard: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  notificationUnread: {
    borderLeftWidth: 3,
    borderLeftColor: "#7C3AED",
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1e293b",
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#7C3AED",
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 6,
  },
  deleteBtn: {
    padding: 8,
    marginLeft: 4,
    alignSelf: "center",
  },
  footerText: {
    textAlign: "center",
    fontSize: 13,
    color: "#94a3b8",
    marginTop: 16,
    paddingBottom: 20,
  },
});
