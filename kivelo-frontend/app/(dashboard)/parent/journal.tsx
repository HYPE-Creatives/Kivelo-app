// app/(dashboard)/parent/journal.tsx
import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useParent, Child, JournalEntry } from "../../../context/ParentContext";
import { Ionicons } from "@expo/vector-icons";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Mood configuration
const MOOD_CONFIG: Record<string, { emoji: string; color: string; bg: string }> = {
  happy: { emoji: "😊", color: "#16A34A", bg: "#DCFCE7" },
  sad: { emoji: "😢", color: "#3B82F6", bg: "#DBEAFE" },
  angry: { emoji: "😠", color: "#EF4444", bg: "#FEE2E2" },
  anxious: { emoji: "😰", color: "#F59E0B", bg: "#FEF3C7" },
  calm: { emoji: "😌", color: "#14B8A6", bg: "#CCFBF1" },
  excited: { emoji: "🤩", color: "#EC4899", bg: "#FCE7F3" },
  tired: { emoji: "😴", color: "#6366F1", bg: "#E0E7FF" },
  neutral: { emoji: "😐", color: "#6B7280", bg: "#F3F4F6" },
};

// Skeleton component
function Skeleton({ width, height, style }: { width: number | string; height: number; style?: any }) {
  return (
    <View style={[{ width, height, backgroundColor: "#E5E7EB", borderRadius: 8 }, style]} />
  );
}

export default function Journal() {
  const { children, getChildren, getChildJournals, loading } = useParent();
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [loadingJournals, setLoadingJournals] = useState(false);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);

  useEffect(() => {
    getChildren();
  }, [getChildren]);

  useEffect(() => {
    if (children.length > 0 && !selectedChild) {
      setSelectedChild(children[0]);
    }
  }, [children]);

  useEffect(() => {
    if (selectedChild) {
      loadJournals(selectedChild._id || selectedChild.id || "");
    }
  }, [selectedChild]);

  const loadJournals = async (childId: string) => {
    if (!childId) return;
    setLoadingJournals(true);
    try {
      const data = await getChildJournals(childId);
      setJournals(data || []);
    } catch (error) {
      console.error("Failed to load journals:", error);
      setJournals([]);
    } finally {
      setLoadingJournals(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await getChildren();
    if (selectedChild) {
      await loadJournals(selectedChild._id || selectedChild.id || "");
    }
    setRefreshing(false);
  }, [getChildren, selectedChild]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getMoodConfig = (mood?: string) => {
    return MOOD_CONFIG[mood?.toLowerCase() || ""] || { emoji: "📝", color: "#6B7280", bg: "#F3F4F6" };
  };

  // Group journals by date (ensure journals is always an array)
  const journalList = Array.isArray(journals) ? journals : [];
  const groupedJournals = journalList.reduce((groups, entry) => {
    const date = formatDate(entry.createdAt);
    if (!groups[date]) groups[date] = [];
    groups[date].push(entry);
    return groups;
  }, {} as Record<string, JournalEntry[]>);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* Header */}
      <LinearGradient
        colors={["#8B5CF6", "#7C3AED", "#6D28D9"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerIcon}>
            <Ionicons name="journal" size={24} color="white" />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Journal Entries</Text>
            <Text style={styles.headerSubtitle}>
              Read your children&apos;s thoughts and feelings
            </Text>
          </View>
        </View>

        {/* Stats Summary */}
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{journalList.length}</Text>
            <Text style={styles.statLabel}>Total Entries</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {journalList.filter(j => {
                const date = new Date(j.createdAt);
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return date >= weekAgo;
              }).length}
            </Text>
            <Text style={styles.statLabel}>This Week</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{children.length}</Text>
            <Text style={styles.statLabel}>Children</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 90 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#8B5CF6"]}
            tintColor="#8B5CF6"
          />
        }
      >
        {/* Child Selector */}
        {children.length > 0 && (
          <View style={styles.childSelector}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.childTabs}>
                {children.map((child) => {
                  const isSelected = selectedChild?._id === child._id || selectedChild?.id === child.id;
                  return (
                    <TouchableOpacity
                      key={child._id || child.id}
                      style={[styles.childTab, isSelected && styles.childTabActive]}
                      onPress={() => setSelectedChild(child)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.childTabAvatar, isSelected && styles.childTabAvatarActive]}>
                        <Text style={styles.childTabAvatarText}>
                          {child.name?.charAt(0)?.toUpperCase() || "?"}
                        </Text>
                      </View>
                      <Text style={[styles.childTabText, isSelected && styles.childTabTextActive]}>
                        {child.name}
                      </Text>
                      {isSelected && <View style={styles.activeIndicator} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Content */}
        <View style={styles.content}>
          {loading && children.length === 0 ? (
            <View style={styles.skeletonContainer}>
              {[1, 2, 3].map((i) => (
                <View key={i} style={styles.skeletonCard}>
                  <Skeleton width={40} height={40} style={{ borderRadius: 20 }} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Skeleton width="60%" height={16} style={{ marginBottom: 8 }} />
                    <Skeleton width="100%" height={12} />
                    <Skeleton width="80%" height={12} style={{ marginTop: 6 }} />
                  </View>
                </View>
              ))}
            </View>
          ) : children.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="people-outline" size={48} color="#8B5CF6" />
              </View>
              <Text style={styles.emptyTitle}>No Children Added</Text>
              <Text style={styles.emptyText}>
                Add children to your family to see their journal entries
              </Text>
            </View>
          ) : loadingJournals ? (
            <View style={styles.skeletonContainer}>
              {[1, 2, 3].map((i) => (
                <View key={i} style={styles.skeletonCard}>
                  <Skeleton width={40} height={40} style={{ borderRadius: 20 }} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Skeleton width="60%" height={16} style={{ marginBottom: 8 }} />
                    <Skeleton width="100%" height={12} />
                  </View>
                </View>
              ))}
            </View>
          ) : journalList.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="document-text-outline" size={48} color="#8B5CF6" />
              </View>
              <Text style={styles.emptyTitle}>No Entries Yet</Text>
              <Text style={styles.emptyText}>
                {selectedChild?.name || "This child"} hasn&apos;t written any journal entries yet
              </Text>
            </View>
          ) : (
            Object.entries(groupedJournals).map(([date, entries]) => (
              <View key={date} style={styles.dateGroup}>
                <View style={styles.dateHeader}>
                  <View style={styles.dateLine} />
                  <Text style={styles.dateText}>{date}</Text>
                  <View style={styles.dateLine} />
                </View>

                {entries.map((entry) => {
                  const moodConfig = getMoodConfig(entry.mood);
                  const isExpanded = expandedEntry === entry._id;

                  return (
                    <TouchableOpacity
                      key={entry._id}
                      style={styles.journalCard}
                      onPress={() => setExpandedEntry(isExpanded ? null : entry._id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.cardHeader}>
                        <View style={[styles.moodBadge, { backgroundColor: moodConfig.bg }]}>
                          <Text style={styles.moodEmoji}>{moodConfig.emoji}</Text>
                        </View>
                        <View style={styles.cardHeaderInfo}>
                          {entry.title && (
                            <Text style={styles.cardTitle} numberOfLines={1}>
                              {entry.title}
                            </Text>
                          )}
                          <View style={styles.cardMeta}>
                            <Text style={[styles.moodText, { color: moodConfig.color }]}>
                              {entry.mood || "No mood"}
                            </Text>
                            <Text style={styles.timeText}>{formatTime(entry.createdAt)}</Text>
                          </View>
                        </View>
                        <Ionicons
                          name={isExpanded ? "chevron-up" : "chevron-down"}
                          size={20}
                          color="#9CA3AF"
                        />
                      </View>

                      <Text
                        style={styles.cardContent}
                        numberOfLines={isExpanded ? undefined : 3}
                      >
                        {entry.content}
                      </Text>

                      {entry.tags && entry.tags.length > 0 && (
                        <View style={styles.tagsRow}>
                          {entry.tags.slice(0, isExpanded ? undefined : 3).map((tag, idx) => (
                            <View key={idx} style={styles.tag}>
                              <Text style={styles.tagText}>#{tag}</Text>
                            </View>
                          ))}
                          {!isExpanded && entry.tags.length > 3 && (
                            <Text style={styles.moreTagsText}>+{entry.tags.length - 3}</Text>
                          )}
                        </View>
                      )}

                      {entry.visibility === "private" && (
                        <View style={styles.privateRow}>
                          <Ionicons name="lock-closed" size={12} color="#9CA3AF" />
                          <Text style={styles.privateText}>Private entry</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#8B5CF6",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  statsBar: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  statLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginHorizontal: 12,
  },
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -10,
  },
  childSelector: {
    paddingTop: 20,
    paddingBottom: 8,
  },
  childTabs: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 12,
  },
  childTab: {
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  childTabActive: {},
  childTabAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#E9D5FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  childTabAvatarActive: {
    backgroundColor: "#8B5CF6",
  },
  childTabAvatarText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#7C3AED",
  },
  childTabText: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },
  childTabTextActive: {
    color: "#7C3AED",
    fontWeight: "700",
  },
  activeIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#8B5CF6",
    marginTop: 4,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  skeletonContainer: {
    gap: 12,
  },
  skeletonCard: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  emptyState: {
    backgroundColor: "white",
    padding: 40,
    borderRadius: 20,
    alignItems: "center",
    marginTop: 20,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F3E8FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#374151",
  },
  emptyText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  dateGroup: {
    marginBottom: 20,
  },
  dateHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  dateText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#9CA3AF",
    paddingHorizontal: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  journalCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  moodBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  moodEmoji: {
    fontSize: 22,
  },
  cardHeaderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 2,
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  moodText: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  timeText: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  cardContent: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 21,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 12,
    alignItems: "center",
  },
  tag: {
    backgroundColor: "#F3E8FF",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 12,
    color: "#7C3AED",
    fontWeight: "500",
  },
  moreTagsText: {
    fontSize: 12,
    color: "#9CA3AF",
    marginLeft: 4,
  },
  privateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  privateText: {
    fontSize: 12,
    color: "#9CA3AF",
  },
});
