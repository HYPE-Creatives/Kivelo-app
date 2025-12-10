// app/(dashboard)/parent/ai-insight.tsx
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
import { useParent, Child, MoodEntry } from "../../../context/ParentContext";
import { Ionicons } from "@expo/vector-icons";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface MoodInsight {
  summary?: string;
  patterns?: string[];
  recommendations?: string[];
  alertLevel?: "low" | "medium" | "high";
  averageMood?: number;
  totalCheckins?: number;
}

// Trust zone configuration
const TRUST_ZONES = {
  green: { label: "Happy & Great", color: "#22C55E", bg: "#DCFCE7", emoji: "😊" },
  yellow: { label: "Okay & Good", color: "#F59E0B", bg: "#FEF3C7", emoji: "😐" },
  orange: { label: "Needs Attention", color: "#F97316", bg: "#FFEDD5", emoji: "😟" },
  red: { label: "Needs Support", color: "#EF4444", bg: "#FEE2E2", emoji: "😢" },
};

// Skeleton component
function Skeleton({ width, height, style }: { width: number | string; height: number; style?: any }) {
  return (
    <View style={[{ width, height, backgroundColor: "#E5E7EB", borderRadius: 8 }, style]} />
  );
}

export default function AIInsights() {
  const { children, getChildren, getChildMoodHistory, getChildMoodInsights, loading } = useParent();
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([]);
  const [insights, setInsights] = useState<MoodInsight | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<"week" | "month" | "all">("week");

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
      loadData(selectedChild._id || selectedChild.id || "");
    }
  }, [selectedChild, selectedPeriod]);

  const loadData = async (childId: string) => {
    if (!childId) return;
    setLoadingData(true);
    try {
      const [historyData, insightsData] = await Promise.all([
        getChildMoodHistory(childId, selectedPeriod),
        getChildMoodInsights(childId).catch(() => null),
      ]);
      setMoodHistory(historyData || []);
      setInsights(insightsData);
    } catch (error) {
      console.error("Failed to load mood data:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await getChildren();
    if (selectedChild) {
      await loadData(selectedChild._id || selectedChild.id || "");
    }
    setRefreshing(false);
  }, [getChildren, selectedChild]);

  const getMoodStats = () => {
    if (moodHistory.length === 0) return { average: 0, trend: "neutral", zones: {}, highest: 0, lowest: 10 };

    const scores = moodHistory.map((m) => m.moodScore || 5);
    const average = scores.reduce((a, b) => a + b, 0) / scores.length;
    const highest = Math.max(...scores);
    const lowest = Math.min(...scores);

    const zones: Record<string, number> = {};
    moodHistory.forEach((m) => {
      const zone = m.trustZone?.toLowerCase() || "unknown";
      zones[zone] = (zones[zone] || 0) + 1;
    });

    const recentScores = scores.slice(0, 7);
    const olderScores = scores.slice(7, 14);
    const trend =
      olderScores.length > 0
        ? recentScores.reduce((a, b) => a + b, 0) / recentScores.length >
          olderScores.reduce((a, b) => a + b, 0) / olderScores.length
          ? "improving"
          : "declining"
        : "neutral";

    return { average, trend, zones, highest, lowest };
  };

  const stats = getMoodStats();

  // Calculate zone distribution percentage
  const getTotalZoneCount = () => {
    return Object.values(stats.zones).reduce((a, b) => a + b, 0);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* Header */}
      <LinearGradient
        colors={["#3B82F6", "#2563EB", "#1D4ED8"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerIcon}>
            <Ionicons name="analytics" size={24} color="white" />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>AI Mood Insights</Text>
            <Text style={styles.headerSubtitle}>
              Understand your child&apos;s emotional patterns
            </Text>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.quickStats}>
          <View style={styles.quickStatItem}>
            <Text style={styles.quickStatValue}>{moodHistory.length}</Text>
            <Text style={styles.quickStatLabel}>Check-ins</Text>
          </View>
          <View style={styles.quickStatDivider} />
          <View style={styles.quickStatItem}>
            <Text style={styles.quickStatValue}>{stats.average.toFixed(1)}</Text>
            <Text style={styles.quickStatLabel}>Avg Score</Text>
          </View>
          <View style={styles.quickStatDivider} />
          <View style={styles.quickStatItem}>
            <Ionicons
              name={
                stats.trend === "improving"
                  ? "trending-up"
                  : stats.trend === "declining"
                  ? "trending-down"
                  : "remove-outline"
              }
              size={22}
              color="white"
            />
            <Text style={styles.quickStatLabel}>
              {stats.trend === "improving" ? "Improving" : stats.trend === "declining" ? "Declining" : "Stable"}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 220 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#3B82F6"]}
            tintColor="#3B82F6"
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
                      <View style={[styles.childAvatar, isSelected && styles.childAvatarActive]}>
                        <Text style={[styles.childAvatarText, isSelected && styles.childAvatarTextActive]}>
                          {child.name?.charAt(0)?.toUpperCase() || "?"}
                        </Text>
                      </View>
                      <Text style={[styles.childTabText, isSelected && styles.childTabTextActive]}>
                        {child.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {(["week", "month", "all"] as const).map((period) => (
            <TouchableOpacity
              key={period}
              style={[styles.periodTab, selectedPeriod === period && styles.periodTabActive]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text style={[styles.periodTabText, selectedPeriod === period && styles.periodTabTextActive]}>
                {period === "week" ? "This Week" : period === "month" ? "This Month" : "All Time"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {loading && children.length === 0 ? (
            <View style={styles.skeletonContainer}>
              <Skeleton width="100%" height={120} style={{ borderRadius: 16 }} />
              <Skeleton width="100%" height={180} style={{ borderRadius: 16, marginTop: 16 }} />
            </View>
          ) : children.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="people-outline" size={48} color="#3B82F6" />
              </View>
              <Text style={styles.emptyTitle}>No Children Added</Text>
              <Text style={styles.emptyText}>Add children to see their mood insights</Text>
            </View>
          ) : loadingData ? (
            <View style={styles.skeletonContainer}>
              <Skeleton width="100%" height={120} style={{ borderRadius: 16 }} />
              <Skeleton width="100%" height={180} style={{ borderRadius: 16, marginTop: 16 }} />
              <Skeleton width="100%" height={100} style={{ borderRadius: 16, marginTop: 16 }} />
            </View>
          ) : moodHistory.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="happy-outline" size={48} color="#3B82F6" />
              </View>
              <Text style={styles.emptyTitle}>No Mood Data Yet</Text>
              <Text style={styles.emptyText}>
                {selectedChild?.name || "This child"} hasn&apos;t logged any moods yet.
                Encourage them to check in daily!
              </Text>
            </View>
          ) : (
            <>
              {/* Trust Zone Distribution */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Trust Zone Distribution</Text>
                <View style={styles.zoneCard}>
                  {/* Visual Bar */}
                  <View style={styles.zoneBar}>
                    {(["green", "yellow", "orange", "red"] as const).map((zone) => {
                      const count = stats.zones[zone] || 0;
                      const percentage = getTotalZoneCount() > 0 ? (count / getTotalZoneCount()) * 100 : 0;
                      if (percentage === 0) return null;
                      return (
                        <View
                          key={zone}
                          style={[
                            styles.zoneBarSegment,
                            { width: `${percentage}%`, backgroundColor: TRUST_ZONES[zone].color },
                          ]}
                        />
                      );
                    })}
                  </View>

                  {/* Zone List */}
                  <View style={styles.zoneList}>
                    {(["green", "yellow", "orange", "red"] as const).map((zone) => {
                      const config = TRUST_ZONES[zone];
                      const count = stats.zones[zone] || 0;
                      return (
                        <View key={zone} style={styles.zoneItem}>
                          <View style={[styles.zoneDot, { backgroundColor: config.color }]} />
                          <Text style={styles.zoneEmoji}>{config.emoji}</Text>
                          <Text style={styles.zoneLabel}>{config.label}</Text>
                          <Text style={styles.zoneCount}>{count}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </View>

              {/* Score Overview */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Score Overview</Text>
                <View style={styles.scoreRow}>
                  <View style={styles.scoreCard}>
                    <LinearGradient
                      colors={["#DCFCE7", "#BBF7D0"]}
                      style={styles.scoreGradient}
                    >
                      <Text style={styles.scoreValue}>{stats.highest}</Text>
                      <Text style={styles.scoreLabel}>Highest</Text>
                    </LinearGradient>
                  </View>
                  <View style={styles.scoreCard}>
                    <LinearGradient
                      colors={["#DBEAFE", "#BFDBFE"]}
                      style={styles.scoreGradient}
                    >
                      <Text style={styles.scoreValue}>{stats.average.toFixed(1)}</Text>
                      <Text style={styles.scoreLabel}>Average</Text>
                    </LinearGradient>
                  </View>
                  <View style={styles.scoreCard}>
                    <LinearGradient
                      colors={["#FEE2E2", "#FECACA"]}
                      style={styles.scoreGradient}
                    >
                      <Text style={styles.scoreValue}>{stats.lowest}</Text>
                      <Text style={styles.scoreLabel}>Lowest</Text>
                    </LinearGradient>
                  </View>
                </View>
              </View>

              {/* AI Analysis */}
              {insights?.summary && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>🤖 AI Analysis</Text>
                  <View style={styles.aiCard}>
                    <Text style={styles.aiText}>{insights.summary}</Text>
                    {insights.patterns && insights.patterns.length > 0 && (
                      <View style={styles.patternsBox}>
                        <Text style={styles.patternsTitle}>Patterns Detected</Text>
                        {insights.patterns.map((pattern, idx) => (
                          <View key={idx} style={styles.patternItem}>
                            <Ionicons name="analytics" size={14} color="#3B82F6" />
                            <Text style={styles.patternText}>{pattern}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* Recent Moods */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recent Check-ins</Text>
                {moodHistory.slice(0, 5).map((mood, index) => {
                  const zone = mood.trustZone?.toLowerCase() as keyof typeof TRUST_ZONES;
                  const config = TRUST_ZONES[zone] || { color: "#9CA3AF", bg: "#F3F4F6" };
                  return (
                    <View key={mood._id || index} style={styles.moodCard}>
                      <View style={[styles.moodSidebar, { backgroundColor: config.color }]} />
                      <View style={styles.moodContent}>
                        <View style={styles.moodHeader}>
                          <Text style={styles.moodEmoji}>{mood.emoji || "😐"}</Text>
                          <View style={styles.moodScoreBadge}>
                            <Text style={styles.moodScoreText}>{mood.moodScore || "-"}/10</Text>
                          </View>
                          <Text style={styles.moodTime}>
                            {new Date(mood.createdAt).toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })}
                          </Text>
                        </View>
                        {mood.textNote && (
                          <Text style={styles.moodNote} numberOfLines={2}>
                            {mood.textNote}
                          </Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* Recommendations */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>💡 Parenting Tips</Text>
                <View style={styles.tipsCard}>
                  {[
                    { icon: "chatbubble-ellipses", text: "Start conversations about their day", color: "#8B5CF6" },
                    { icon: "heart", text: "Show appreciation for their efforts", color: "#EC4899" },
                    { icon: "game-controller", text: "Plan fun family activities together", color: "#F59E0B" },
                  ].map((tip, idx) => (
                    <View key={idx} style={styles.tipItem}>
                      <View style={[styles.tipIcon, { backgroundColor: tip.color + "20" }]}>
                        <Ionicons name={tip.icon as any} size={18} color={tip.color} />
                      </View>
                      <Text style={styles.tipText}>{tip.text}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </>
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
    backgroundColor: "#3B82F6",
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
  quickStats: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
  },
  quickStatItem: {
    flex: 1,
    alignItems: "center",
  },
  quickStatValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  quickStatLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
    marginTop: 2,
  },
  quickStatDivider: {
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
  childAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  childAvatarActive: {
    backgroundColor: "#3B82F6",
  },
  childAvatarText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2563EB",
  },
  childAvatarTextActive: {
    color: "white",
  },
  childTabText: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },
  childTabTextActive: {
    color: "#2563EB",
    fontWeight: "700",
  },
  periodSelector: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  periodTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "white",
    alignItems: "center",
  },
  periodTabActive: {
    backgroundColor: "#3B82F6",
  },
  periodTabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  periodTabTextActive: {
    color: "white",
  },
  content: {
    paddingHorizontal: 16,
  },
  skeletonContainer: {
    marginTop: 8,
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
    backgroundColor: "#DBEAFE",
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
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 12,
  },
  zoneCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  zoneBar: {
    flexDirection: "row",
    height: 12,
    borderRadius: 6,
    overflow: "hidden",
    backgroundColor: "#F3F4F6",
    marginBottom: 16,
  },
  zoneBarSegment: {
    height: "100%",
  },
  zoneList: {
    gap: 10,
  },
  zoneItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  zoneDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  zoneEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  zoneLabel: {
    flex: 1,
    fontSize: 14,
    color: "#374151",
  },
  zoneCount: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F2937",
    minWidth: 30,
    textAlign: "right",
  },
  scoreRow: {
    flexDirection: "row",
    gap: 10,
  },
  scoreCard: {
    flex: 1,
    borderRadius: 14,
    overflow: "hidden",
  },
  scoreGradient: {
    padding: 16,
    alignItems: "center",
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F2937",
  },
  scoreLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  aiCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  aiText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 21,
  },
  patternsBox: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  patternsTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 10,
  },
  patternItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  patternText: {
    fontSize: 13,
    color: "#4B5563",
    flex: 1,
  },
  moodCard: {
    backgroundColor: "white",
    borderRadius: 14,
    flexDirection: "row",
    marginBottom: 10,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  moodSidebar: {
    width: 5,
  },
  moodContent: {
    flex: 1,
    padding: 14,
  },
  moodHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  moodEmoji: {
    fontSize: 22,
  },
  moodScoreBadge: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 10,
  },
  moodScoreText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
  },
  moodTime: {
    fontSize: 12,
    color: "#9CA3AF",
    marginLeft: "auto",
  },
  moodNote: {
    fontSize: 13,
    color: "#4B5563",
    marginTop: 8,
    lineHeight: 19,
  },
  tipsCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  tipIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: "#374151",
  },
});
