// app/(dashboard)/parent/learning-hub.tsx
import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Image,
  Linking,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useParent, Article } from "../../../context/ParentContext";
import { Ionicons } from "@expo/vector-icons";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const CATEGORIES = [
  { key: "all", label: "All", icon: "apps", color: "#6B7280" },
  { key: "parenting", label: "Parenting", icon: "people", color: "#8B5CF6" },
  { key: "child_development", label: "Development", icon: "trending-up", color: "#3B82F6" },
  { key: "education", label: "Education", icon: "school", color: "#10B981" },
  { key: "health", label: "Health", icon: "fitness", color: "#EF4444" },
  { key: "behavior", label: "Behavior", icon: "happy", color: "#F59E0B" },
];

const DIFFICULTY_CONFIG: Record<string, { color: string; bg: string }> = {
  beginner: { color: "#22C55E", bg: "#DCFCE7" },
  intermediate: { color: "#F59E0B", bg: "#FEF3C7" },
  advanced: { color: "#EF4444", bg: "#FEE2E2" },
};

// Skeleton component
function Skeleton({ width, height, style }: { width: number | string; height: number; style?: any }) {
  return (
    <View style={[{ width, height, backgroundColor: "#E5E7EB", borderRadius: 8 }, style]} />
  );
}

export default function LearningHub() {
  const { getLearningArticles, loading } = useParent();
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [featuredArticle, setFeaturedArticle] = useState<Article | null>(null);

  useEffect(() => {
    loadArticles(true);
  }, [selectedCategory]);

  const loadArticles = async (reset = false) => {
    try {
      const currentPage = reset ? 1 : page;
      const params: { category?: string; page: number; limit: number } = {
        page: currentPage,
        limit: 10,
      };

      if (selectedCategory !== "all") {
        params.category = selectedCategory;
      }

      const data = await getLearningArticles(params);
      const articleList = data || [];

      if (reset) {
        setArticles(articleList);
        // Set first article as featured
        if (articleList.length > 0) {
          setFeaturedArticle(articleList[0]);
        }
        setPage(2);
      } else {
        setArticles((prev) => [...prev, ...articleList]);
        setPage(currentPage + 1);
      }

      setHasMore(articleList.length === 10);
    } catch (error) {
      console.error("Failed to load articles:", error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadArticles(true);
    setRefreshing(false);
  }, [selectedCategory]);

  const getCategoryConfig = (categoryKey?: string) => {
    return CATEGORIES.find(c => c.key === categoryKey) || CATEGORIES[0];
  };

  const formatReadTime = (minutes?: number, content?: string) => {
    if (minutes) return `${minutes} min`;
    if (!content) return "5 min";
    const words = content.split(/\s+/).length;
    return `${Math.ceil(words / 200)} min`;
  };

  const openArticle = (article: Article) => {
    if (article.externalUrl) {
      Linking.openURL(article.externalUrl);
    }
  };

  // Get articles excluding featured
  const displayArticles = articles.filter(a => a._id !== featuredArticle?._id);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* Header */}
      <LinearGradient
        colors={["#10B981", "#059669", "#047857"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerIcon}>
            <Ionicons name="library" size={24} color="white" />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Learning Hub</Text>
            <Text style={styles.headerSubtitle}>
              Tips and resources for better parenting
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{articles.length}</Text>
            <Text style={styles.statLabel}>Articles</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{CATEGORIES.length - 1}</Text>
            <Text style={styles.statLabel}>Categories</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="bookmark" size={20} color="white" />
            <Text style={styles.statLabel}>Saved</Text>
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
            colors={["#10B981"]}
            tintColor="#10B981"
          />
        }
      >
        {/* Category Filter */}
        <View style={styles.categorySection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.categoryTabs}>
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.key;
                return (
                  <TouchableOpacity
                    key={cat.key}
                    style={[styles.categoryTab, isSelected && styles.categoryTabActive]}
                    onPress={() => setSelectedCategory(cat.key)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.categoryIcon, isSelected && { backgroundColor: cat.color }]}>
                      <Ionicons
                        name={cat.icon as any}
                        size={16}
                        color={isSelected ? "white" : cat.color}
                      />
                    </View>
                    <Text style={[styles.categoryText, isSelected && styles.categoryTextActive]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {loading && articles.length === 0 ? (
            <View style={styles.skeletonContainer}>
              <Skeleton width="100%" height={180} style={{ borderRadius: 16, marginBottom: 16 }} />
              {[1, 2, 3].map((i) => (
                <View key={i} style={styles.skeletonCard}>
                  <Skeleton width={80} height={80} style={{ borderRadius: 12 }} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Skeleton width="80%" height={14} style={{ marginBottom: 8 }} />
                    <Skeleton width="100%" height={12} style={{ marginBottom: 6 }} />
                    <Skeleton width="60%" height={12} />
                  </View>
                </View>
              ))}
            </View>
          ) : articles.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="book-outline" size={48} color="#10B981" />
              </View>
              <Text style={styles.emptyTitle}>No Articles Found</Text>
              <Text style={styles.emptyText}>
                Try selecting a different category or check back later
              </Text>
            </View>
          ) : (
            <>
              {/* Featured Article */}
              {featuredArticle && (
                <TouchableOpacity
                  style={styles.featuredCard}
                  onPress={() => openArticle(featuredArticle)}
                  activeOpacity={0.8}
                >
                  {featuredArticle.imageUrl ? (
                    <Image
                      source={{ uri: featuredArticle.imageUrl }}
                      style={styles.featuredImage}
                    />
                  ) : (
                    <LinearGradient
                      colors={[getCategoryConfig(featuredArticle.category).color, "#1F2937"]}
                      style={styles.featuredImage}
                    >
                      <Ionicons
                        name={getCategoryConfig(featuredArticle.category).icon as any}
                        size={48}
                        color="rgba(255,255,255,0.3)"
                      />
                    </LinearGradient>
                  )}
                  <LinearGradient
                    colors={["transparent", "rgba(0,0,0,0.8)"]}
                    style={styles.featuredOverlay}
                  >
                    <View style={styles.featuredBadge}>
                      <Ionicons name="star" size={12} color="#F59E0B" />
                      <Text style={styles.featuredBadgeText}>Featured</Text>
                    </View>
                    <Text style={styles.featuredTitle} numberOfLines={2}>
                      {featuredArticle.title}
                    </Text>
                    <View style={styles.featuredMeta}>
                      <View style={styles.featuredMetaItem}>
                        <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.7)" />
                        <Text style={styles.featuredMetaText}>
                          {formatReadTime(featuredArticle.estimatedReadingTime, featuredArticle.content)}
                        </Text>
                      </View>
                      <View style={[
                        styles.featuredCategory,
                        { backgroundColor: getCategoryConfig(featuredArticle.category).color }
                      ]}>
                        <Text style={styles.featuredCategoryText}>
                          {featuredArticle.category?.replace("_", " ") || "General"}
                        </Text>
                      </View>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              )}

              {/* Articles List */}
              <View style={styles.articlesSection}>
                <Text style={styles.sectionTitle}>Latest Articles</Text>
                {displayArticles.map((article) => {
                  const catConfig = getCategoryConfig(article.category);
                  const diffConfig = DIFFICULTY_CONFIG[article.difficulty || "beginner"];
                  return (
                    <TouchableOpacity
                      key={article._id}
                      style={styles.articleCard}
                      onPress={() => openArticle(article)}
                      activeOpacity={0.7}
                    >
                      {article.imageUrl ? (
                        <Image source={{ uri: article.imageUrl }} style={styles.articleImage} />
                      ) : (
                        <View style={[styles.articleImagePlaceholder, { backgroundColor: catConfig.color + "20" }]}>
                          <Ionicons name={catConfig.icon as any} size={24} color={catConfig.color} />
                        </View>
                      )}
                      <View style={styles.articleContent}>
                        <View style={styles.articleBadges}>
                          <View style={[styles.badge, { backgroundColor: catConfig.color + "20" }]}>
                            <Text style={[styles.badgeText, { color: catConfig.color }]}>
                              {article.category?.replace("_", " ") || "General"}
                            </Text>
                          </View>
                          {article.difficulty && (
                            <View style={[styles.badge, { backgroundColor: diffConfig.bg }]}>
                              <Text style={[styles.badgeText, { color: diffConfig.color }]}>
                                {article.difficulty}
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.articleTitle} numberOfLines={2}>
                          {article.title}
                        </Text>
                        {article.summary && (
                          <Text style={styles.articleSummary} numberOfLines={2}>
                            {article.summary}
                          </Text>
                        )}
                        <View style={styles.articleFooter}>
                          <View style={styles.articleStat}>
                            <Ionicons name="time-outline" size={12} color="#9CA3AF" />
                            <Text style={styles.articleStatText}>
                              {formatReadTime(article.estimatedReadingTime, article.content)}
                            </Text>
                          </View>
                          {article.viewCount !== undefined && (
                            <View style={styles.articleStat}>
                              <Ionicons name="eye-outline" size={12} color="#9CA3AF" />
                              <Text style={styles.articleStatText}>{article.viewCount}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
                    </TouchableOpacity>
                  );
                })}

                {/* Load More */}
                {hasMore && (
                  <TouchableOpacity
                    style={styles.loadMoreBtn}
                    onPress={() => loadArticles(false)}
                    disabled={loading}
                  >
                    <Text style={styles.loadMoreText}>
                      {loading ? "Loading..." : "Load More Articles"}
                    </Text>
                    {!loading && <Ionicons name="arrow-down" size={16} color="#10B981" />}
                  </TouchableOpacity>
                )}
              </View>

              {/* Quick Tips */}
              <View style={styles.tipsSection}>
                <Text style={styles.sectionTitle}>💡 Quick Parenting Tips</Text>
                <View style={styles.tipsGrid}>
                  {[
                    { icon: "heart", text: "Praise effort over results", color: "#EC4899" },
                    { icon: "ear", text: "Practice active listening", color: "#8B5CF6" },
                    { icon: "time", text: "Quality time matters most", color: "#F59E0B" },
                  ].map((tip, idx) => (
                    <View key={idx} style={styles.tipCard}>
                      <View style={[styles.tipIcon, { backgroundColor: tip.color + "20" }]}>
                        <Ionicons name={tip.icon as any} size={20} color={tip.color} />
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
    backgroundColor: "#10B981",
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
  categorySection: {
    paddingTop: 20,
    paddingBottom: 8,
  },
  categoryTabs: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 10,
  },
  categoryTab: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryTabActive: {
    backgroundColor: "#ECFDF5",
  },
  categoryIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  categoryText: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },
  categoryTextActive: {
    color: "#059669",
    fontWeight: "700",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  skeletonContainer: {},
  skeletonCard: {
    backgroundColor: "white",
    padding: 12,
    borderRadius: 14,
    flexDirection: "row",
    marginBottom: 12,
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
    backgroundColor: "#ECFDF5",
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
  },
  featuredCard: {
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 20,
    height: 200,
  },
  featuredImage: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  featuredOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingTop: 40,
  },
  featuredBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    marginBottom: 8,
  },
  featuredBadgeText: {
    fontSize: 11,
    color: "white",
    fontWeight: "600",
  },
  featuredTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    marginBottom: 8,
  },
  featuredMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featuredMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  featuredMetaText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
  },
  featuredCategory: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  featuredCategoryText: {
    fontSize: 11,
    color: "white",
    fontWeight: "600",
    textTransform: "capitalize",
  },
  articlesSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 12,
  },
  articleCard: {
    backgroundColor: "white",
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  articleImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  articleImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  articleContent: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  articleBadges: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  articleTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  articleSummary: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 16,
    marginBottom: 6,
  },
  articleFooter: {
    flexDirection: "row",
    gap: 12,
  },
  articleStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  articleStatText: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  loadMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 4,
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#10B981",
  },
  tipsSection: {
    marginBottom: 20,
  },
  tipsGrid: {
    gap: 10,
  },
  tipCard: {
    backgroundColor: "white",
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tipIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },
});
