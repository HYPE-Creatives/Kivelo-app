// app/(dashboard)/parent/home.tsx - Enhanced Parent Dashboard
import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Dimensions,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../../context/AuthContext";
import { useParent, Child, FamilyActivityFeed, ChildMoodSummary } from "../../../context/ParentContext";
import { useNotifications } from "../../../context/NotificationContext";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Trust zone colors with full styling
const TRUST_ZONE_CONFIG: Record<string, { bg: string; text: string; border: string; emoji: string; label: string; gradient: [string, string] }> = {
  green: { bg: "#DCFCE7", text: "#166534", border: "#86EFAC", emoji: "😊", label: "Happy", gradient: ["#22C55E", "#16A34A"] },
  yellow: { bg: "#FEF9C3", text: "#854D0E", border: "#FDE047", emoji: "😐", label: "Okay", gradient: ["#EAB308", "#CA8A04"] },
  orange: { bg: "#FFEDD5", text: "#9A3412", border: "#FDBA74", emoji: "😟", label: "Uneasy", gradient: ["#F97316", "#EA580C"] },
  red: { bg: "#FEE2E2", text: "#991B1B", border: "#FCA5A5", emoji: "😢", label: "Needs Support", gradient: ["#EF4444", "#DC2626"] },
  unknown: { bg: "#F3F4F6", text: "#6B7280", border: "#D1D5DB", emoji: "❓", label: "No Data", gradient: ["#9CA3AF", "#6B7280"] },
};

// Activity type icons and colors
const ACTIVITY_TYPE_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  mood_checkin: { icon: "happy", color: "#8B5CF6", bg: "#EDE9FE" },
  activity_completed: { icon: "checkmark-circle", color: "#16A34A", bg: "#DCFCE7" },
  badge_earned: { icon: "trophy", color: "#F59E0B", bg: "#FEF3C7" },
  streak_milestone: { icon: "flame", color: "#EF4444", bg: "#FEE2E2" },
  journal_entry: { icon: "book", color: "#3B82F6", bg: "#DBEAFE" },
  points_earned: { icon: "star", color: "#EC4899", bg: "#FCE7F3" },
};

// Skeleton loader component
function SkeletonBox({ width, height, style }: { width: number | string; height: number; style?: any }) {
  return (
    <View
      style={[
        {
          width,
          height,
          backgroundColor: "#E5E7EB",
          borderRadius: 8,
        },
        style,
      ]}
    />
  );
}

export default function ParentHome() {
  const { user } = useAuth();
  const { 
    children, 
    getChildren, 
    getChildMoodSummary,
    getFamilyActivityFeed,
    familyActivityFeed,
    loading 
  } = useParent();
  const { unreadCount, refreshNotifications } = useNotifications();
  const router = useRouter();
  
  const [refreshing, setRefreshing] = useState(false);
  const [childMoods, setChildMoods] = useState<Record<string, ChildMoodSummary>>({});
  const [loadingData, setLoadingData] = useState(false);

  // Get current time greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  // Load all data on mount
  useEffect(() => {
    loadAllData();
  }, []);

  // Load mood summaries when children change
  useEffect(() => {
    if (children.length > 0) {
      loadChildMoods();
    }
  }, [children]);

  const loadAllData = async () => {
    setLoadingData(true);
    await getChildren();
    await getFamilyActivityFeed();
    setLoadingData(false);
  };

  // Load mood summaries for all children
  const loadChildMoods = async () => {
    const moods: Record<string, ChildMoodSummary> = {};
    
    for (const child of children) {
      const childId = child._id || child.id;
      if (childId) {
        const result = await getChildMoodSummary(childId);
        if (result.success && result.data) {
          moods[childId] = result.data;
        }
      }
    }
    
    setChildMoods(moods);
  };

  // Refresh all data
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  }, []);

  // Get trust zone for a child
  const getChildTrustZone = (childId: string) => {
    const mood = childMoods[childId];
    if (!mood?.latestMood?.trustZone) return "unknown";
    return mood.latestMood.trustZone.toLowerCase();
  };

  // Calculate family stats
  const familyStats = {
    totalChildren: children.length,
    totalPoints: children.reduce((sum, c) => sum + (c.points || 0), 0),
    totalActivities: children.reduce((sum, c) => sum + (c.completedActivities || 0), 0),
    bestStreak: Math.max(...children.map(c => c.currentStreak || 0), 0),
    averageMood: Object.values(childMoods).length > 0 
      ? Object.values(childMoods).reduce((sum, m) => sum + (m.latestMood?.moodScore || 5), 0) / Object.values(childMoods).length
      : 5,
  };

  // Get children needing attention (yellow, orange, red zones)
  const childrenNeedingAttention = children.filter(child => {
    const zone = getChildTrustZone(child._id || child.id || "");
    return ["yellow", "orange", "red"].includes(zone);
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

  // Quick actions
  const quickActions = [
    {
      icon: "people",
      title: "Family",
      gradient: ["#7C3AED", "#5B21B6"],
      onPress: () => router.push("/(dashboard)/parent/family"),
    },
    {
      icon: "clipboard",
      title: "Activities",
      gradient: ["#F59E0B", "#D97706"],
      onPress: () => router.push("/(dashboard)/parent/activities"),
    },
    {
      icon: "book",
      title: "Journals",
      gradient: ["#8B5CF6", "#6D28D9"],
      onPress: () => router.push("/(dashboard)/parent/journal"),
    },
    {
      icon: "analytics",
      title: "Insights",
      gradient: ["#3B82F6", "#2563EB"],
      onPress: () => router.push("/(dashboard)/parent/ai-insight"),
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 90 }}
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
        {/* Header with Gradient */}
        <LinearGradient
          colors={["#16A34A", "#15803D", "#166534"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Text style={styles.greetingText}>{getGreeting()},</Text>
              <Text style={styles.userName}>{user?.name || "Parent"} 👋</Text>
              <View style={styles.familyCodeContainer}>
                <Ionicons name="key-outline" size={14} color="rgba(255,255,255,0.7)" />
                <Text style={styles.familyCodeText}>
                  Family Code: <Text style={styles.familyCodeValue}>{user?.parent?.familyCode || "------"}</Text>
                </Text>
              </View>
            </View>
            <View style={styles.headerRight}>
              {/* Notification Bell */}
              <TouchableOpacity 
                style={styles.notificationBtn}
                onPress={() => router.push("/(dashboard)/parent/notifications")}
              >
                <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
                {unreadCount > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
              {/* Avatar */}
              <TouchableOpacity 
                style={styles.avatarContainer}
                onPress={() => router.push("/(dashboard)/parent/settings")}
              >
                {user?.avatar?.url ? (
                  <Image 
                    source={{ uri: user.avatar.url }} 
                    style={styles.avatarImage}
                  />
                ) : (
                  <LinearGradient
                    colors={["rgba(255,255,255,0.3)", "rgba(255,255,255,0.1)"]}
                    style={styles.avatar}
                  >
                    <Text style={styles.avatarText}>
                      {user?.name?.charAt(0)?.toUpperCase() || "P"}
                    </Text>
                  </LinearGradient>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Family Overview Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statsCard}>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <View style={[styles.statIconBox, { backgroundColor: "#DCFCE7" }]}>
                    <Ionicons name="people" size={18} color="#16A34A" />
                  </View>
                  <View>
                    <Text style={styles.statValue}>{familyStats.totalChildren}</Text>
                    <Text style={styles.statLabel}>Children</Text>
                  </View>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <View style={[styles.statIconBox, { backgroundColor: "#FEF3C7" }]}>
                    <Ionicons name="star" size={18} color="#F59E0B" />
                  </View>
                  <View>
                    <Text style={styles.statValue}>{familyStats.totalPoints}</Text>
                    <Text style={styles.statLabel}>Points</Text>
                  </View>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <View style={[styles.statIconBox, { backgroundColor: "#FCE7F3" }]}>
                    <Ionicons name="flame" size={18} color="#EC4899" />
                  </View>
                  <View>
                    <Text style={styles.statValue}>{familyStats.bestStreak}</Text>
                    <Text style={styles.statLabel}>Best Streak</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Main Content */}
        <View style={styles.content}>
          {/* Quick Actions */}
          <View style={styles.section}>
            <View style={styles.quickActionsRow}>
              {quickActions.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.quickActionBtn}
                  onPress={action.onPress}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={action.gradient as [string, string]}
                    style={styles.quickActionIcon}
                  >
                    <Ionicons name={action.icon as any} size={22} color="white" />
                  </LinearGradient>
                  <Text style={styles.quickActionLabel}>{action.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Attention Alert (if any child needs attention) */}
          {childrenNeedingAttention.length > 0 && (
            <View style={styles.section}>
              <TouchableOpacity 
                style={styles.alertCard}
                onPress={() => router.push("/(dashboard)/parent/ai-insight")}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={["#FEF2F2", "#FEE2E2"]}
                  style={styles.alertGradient}
                >
                  <View style={styles.alertIconContainer}>
                    <Ionicons name="alert-circle" size={24} color="#EF4444" />
                  </View>
                  <View style={styles.alertContent}>
                    <Text style={styles.alertTitle}>Needs Your Attention</Text>
                    <Text style={styles.alertText}>
                      {childrenNeedingAttention.length === 1 
                        ? `${childrenNeedingAttention[0].name} might need some support`
                        : `${childrenNeedingAttention.length} children might need support`}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#EF4444" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* Children Cards */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My Children</Text>
              {children.length > 0 && (
                <TouchableOpacity onPress={() => router.push("/(dashboard)/parent/family")}>
                  <Text style={styles.seeAllLink}>View All</Text>
                </TouchableOpacity>
              )}
            </View>

            {loading && children.length === 0 ? (
              <View style={styles.loadingContainer}>
                {[1, 2].map((i) => (
                  <View key={i} style={styles.childCardSkeleton}>
                    <SkeletonBox width={60} height={60} style={{ borderRadius: 30 }} />
                    <View style={{ flex: 1, marginLeft: 14 }}>
                      <SkeletonBox width="60%" height={18} style={{ marginBottom: 8 }} />
                      <SkeletonBox width="80%" height={14} style={{ marginBottom: 6 }} />
                      <SkeletonBox width="40%" height={12} />
                    </View>
                  </View>
                ))}
              </View>
            ) : children.length === 0 ? (
              <TouchableOpacity 
                style={styles.emptyCard}
                onPress={() => router.push("/(dashboard)/parent/family")}
                activeOpacity={0.8}
              >
                <View style={styles.emptyIconContainer}>
                  <Ionicons name="people-outline" size={36} color="#9CA3AF" />
                </View>
                <Text style={styles.emptyTitle}>No children yet</Text>
                <Text style={styles.emptyText}>Add your first child to get started</Text>
                <View style={styles.emptyBtn}>
                  <Ionicons name="add" size={18} color="#16A34A" />
                  <Text style={styles.emptyBtnText}>Add Child</Text>
                </View>
              </TouchableOpacity>
            ) : (
              <View style={styles.childrenGrid}>
                {children.map((child: Child) => {
                  const childId = child._id || child.id || "";
                  const trustZone = getChildTrustZone(childId);
                  const zoneConfig = TRUST_ZONE_CONFIG[trustZone] || TRUST_ZONE_CONFIG.unknown;
                  const moodData = childMoods[childId];
                  const level = Math.floor((child.points || 0) / 100) + 1;

                  return (
                    <TouchableOpacity
                      key={childId}
                      style={styles.childCard}
                      onPress={() => router.push("/(dashboard)/parent/family")}
                      activeOpacity={0.8}
                    >
                      {/* Trust Zone Indicator Bar */}
                      <LinearGradient
                        colors={zoneConfig.gradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.childCardIndicator}
                      />

                      <View style={styles.childCardContent}>
                        {/* Avatar with mood emoji */}
                        <View style={styles.childAvatarContainer}>
                          <View style={[styles.childAvatar, { backgroundColor: zoneConfig.bg }]}>
                            {child.user?.avatar?.url ? (
                              <Image source={{ uri: child.user.avatar.url }} style={styles.childAvatarImage} />
                            ) : (
                              <Text style={styles.childAvatarText}>
                                {(child.user?.name || child.name)?.charAt(0)?.toUpperCase() || "?"}
                              </Text>
                            )}
                          </View>
                          <View style={[styles.moodIndicator, { backgroundColor: zoneConfig.bg, borderColor: zoneConfig.border }]}>
                            <Text style={styles.moodIndicatorEmoji}>{zoneConfig.emoji}</Text>
                          </View>
                        </View>

                        {/* Child Info */}
                        <View style={styles.childInfo}>
                          <Text style={styles.childName} numberOfLines={1}>{child.user?.name || child.name}</Text>
                          <Text style={styles.childMoodLabel}>{zoneConfig.label}</Text>
                          
                          {/* Stats Row */}
                          <View style={styles.childStatsRow}>
                            <View style={styles.childStatBadge}>
                              <Ionicons name="star" size={12} color="#F59E0B" />
                              <Text style={styles.childStatText}>{child.points || 0}</Text>
                            </View>
                            <View style={styles.childStatBadge}>
                              <Ionicons name="flame" size={12} color="#EF4444" />
                              <Text style={styles.childStatText}>{child.currentStreak || 0}</Text>
                            </View>
                            <View style={styles.childStatBadge}>
                              <Ionicons name="ribbon" size={12} color="#8B5CF6" />
                              <Text style={styles.childStatText}>Lv.{level}</Text>
                            </View>
                          </View>
                        </View>

                        {/* Status indicator */}
                        <View style={[styles.statusDot, { backgroundColor: child.hasSetPassword ? "#22C55E" : "#F59E0B" }]} />
                      </View>

                      {/* Latest mood note if available */}
                      {moodData?.latestMood?.textNote && (
                        <View style={styles.moodNoteContainer}>
                          <Text style={styles.moodNoteText} numberOfLines={2}>
                            &quot;{moodData.latestMood.textNote}&quot;
                          </Text>
                          <Text style={styles.moodNoteTime}>
                            {formatRelativeTime(moodData.latestMood.createdAt)}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* Recent Activity Feed */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              {familyActivityFeed.length > 0 && (
                <TouchableOpacity onPress={() => router.push("/(dashboard)/parent/ai-insight")}>
                  <Text style={styles.seeAllLink}>See All</Text>
                </TouchableOpacity>
              )}
            </View>

            {loadingData && familyActivityFeed.length === 0 ? (
              <View style={styles.activityLoadingContainer}>
                <ActivityIndicator size="small" color="#16A34A" />
                <Text style={styles.loadingText}>Loading activity...</Text>
              </View>
            ) : familyActivityFeed.length === 0 ? (
              <View style={styles.emptyActivityCard}>
                <Ionicons name="time-outline" size={32} color="#D1D5DB" />
                <Text style={styles.emptyActivityText}>No recent activity yet</Text>
                <Text style={styles.emptyActivitySubtext}>
                  Activity will appear here when your children check in
                </Text>
              </View>
            ) : (
              <View style={styles.activityList}>
                {familyActivityFeed.slice(0, 5).map((activity, index) => {
                  const config = ACTIVITY_TYPE_CONFIG[activity.type] || ACTIVITY_TYPE_CONFIG.mood_checkin;
                  
                  return (
                    <View 
                      key={activity._id || index} 
                      style={[
                        styles.activityItem,
                        index === familyActivityFeed.slice(0, 5).length - 1 && { borderBottomWidth: 0 }
                      ]}
                    >
                      <View style={[styles.activityIcon, { backgroundColor: config.bg }]}>
                        <Ionicons name={config.icon as any} size={18} color={config.color} />
                      </View>
                      <View style={styles.activityContent}>
                        <Text style={styles.activityTitle}>{activity.title}</Text>
                        {activity.description && (
                          <Text style={styles.activityDescription} numberOfLines={1}>
                            {activity.description}
                          </Text>
                        )}
                      </View>
                      <Text style={styles.activityTime}>{formatRelativeTime(activity.timestamp)}</Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* Family Wellness Tip */}
          <View style={styles.section}>
            <LinearGradient
              colors={["#F0FDF4", "#DCFCE7"]}
              style={styles.tipCard}
            >
              <View style={styles.tipIconContainer}>
                <Ionicons name="bulb" size={24} color="#16A34A" />
              </View>
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>Daily Tip</Text>
                <Text style={styles.tipText}>
                  {familyStats.averageMood >= 7 
                    ? "Your family is doing great! Keep up the positive interactions and celebrate small wins together."
                    : familyStats.averageMood >= 5
                    ? "Check in with your children today. A simple conversation can make a big difference."
                    : "Some of your children might need extra support. Consider spending quality time together."}
                </Text>
              </View>
            </LinearGradient>
          </View>

          {/* Footer spacing */}
          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#16A34A",
  },
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    paddingTop: 8,
    paddingHorizontal: 20,
    paddingBottom: 60,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  notificationBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: "#16A34A",
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  greetingText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
  },
  userName: {
    fontSize: 26,
    fontWeight: "bold",
    color: "white",
    marginTop: 4,
  },
  familyCodeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 6,
  },
  familyCodeText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
  },
  familyCodeValue: {
    fontWeight: "700",
    color: "white",
    letterSpacing: 1,
  },
  avatarContainer: {
    marginLeft: 16,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  avatarText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "white",
  },
  statsContainer: {
    marginTop: 20,
  },
  statsCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  statIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
  },
  statLabel: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 8,
  },
  content: {
    marginTop: -20,
    paddingTop: 30,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  seeAllLink: {
    fontSize: 14,
    color: "#16A34A",
    fontWeight: "600",
  },
  quickActionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  quickActionBtn: {
    alignItems: "center",
    width: (SCREEN_WIDTH - 60) / 4,
  },
  quickActionIcon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4B5563",
  },
  alertCard: {
    borderRadius: 16,
    overflow: "hidden",
  },
  alertGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  alertIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#991B1B",
    marginBottom: 2,
  },
  alertText: {
    fontSize: 13,
    color: "#B91C1C",
  },
  loadingContainer: {
    gap: 12,
  },
  childCardSkeleton: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  emptyCard: {
    backgroundColor: "white",
    padding: 32,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#374151",
  },
  emptyText: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 16,
    gap: 6,
  },
  emptyBtnText: {
    color: "#16A34A",
    fontWeight: "600",
    fontSize: 14,
  },
  childrenGrid: {
    gap: 14,
  },
  childCard: {
    backgroundColor: "white",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  childCardIndicator: {
    height: 4,
    width: "100%",
  },
  childCardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
  },
  childAvatarContainer: {
    position: "relative",
  },
  childAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  childAvatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  childAvatarText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#374151",
  },
  moodIndicator: {
    position: "absolute",
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  moodIndicatorEmoji: {
    fontSize: 12,
  },
  childInfo: {
    flex: 1,
    marginLeft: 14,
  },
  childName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 2,
  },
  childMoodLabel: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 8,
  },
  childStatsRow: {
    flexDirection: "row",
    gap: 8,
  },
  childStatBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  childStatText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4B5563",
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  moodNoteContainer: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 0,
  },
  moodNoteText: {
    fontSize: 13,
    color: "#6B7280",
    fontStyle: "italic",
    lineHeight: 18,
  },
  moodNoteTime: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 4,
  },
  activityLoadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 30,
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
    color: "#6B7280",
  },
  emptyActivityCard: {
    backgroundColor: "white",
    padding: 30,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyActivityText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#6B7280",
    marginTop: 12,
  },
  emptyActivitySubtext: {
    fontSize: 13,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 4,
    paddingHorizontal: 20,
  },
  activityList: {
    backgroundColor: "white",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  activityContent: {
    flex: 1,
    marginLeft: 12,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
  },
  activityDescription: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  activityTime: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  tipCard: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  tipIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#166534",
    marginBottom: 4,
  },
  tipText: {
    fontSize: 13,
    color: "#15803D",
    lineHeight: 19,
  },
});
