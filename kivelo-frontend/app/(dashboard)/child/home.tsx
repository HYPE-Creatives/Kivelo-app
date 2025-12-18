// app/(dashboard)/child/home.tsx
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../../context/AuthContext";
import { useGamification } from "../../../context/GamificationContext";
import { useActivity } from "../../../context/ActivityContext";
import { useNotifications } from "../../../context/NotificationContext";
import { useTheme } from "../../../context/ThemeContext";
import { useRouter } from "expo-router";
import { useEffect, useState, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";

export default function ChildHome() {
  const { user } = useAuth();
  const router = useRouter();
  const { stats, getStats } = useGamification();
  const { activities, getActivities } = useActivity();
  const { unreadCount, refreshNotifications } = useNotifications();
  const { colors, themeColors, isDark } = useTheme();
  const [initialLoad, setInitialLoad] = useState(true);
  const scrollY = useRef(new Animated.Value(0)).current;

  // Fetch all data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          getStats(),
          getActivities(),
          refreshNotifications()
        ]);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setInitialLoad(false);
      }
    };
    loadData();
  }, [getStats, getActivities, refreshNotifications]);

  // Calculate stats
  const pendingActivities = activities.filter(a => !a.completed).length;
  
  const earnedBadges = stats?.badges?.length || 0;
  const dashboardCards = [
    { 
      icon: "color-palette-outline",
      title: "Mood Check-in", 
      description: "How are you feeling today?",
      action: "Check In", 
      onPress: () => router.push("/(dashboard)/child/mood"),
      color: "#FF6B9D",
      gradient: ['#FF6B9D', '#FF8FB3']
    },
    { 
      icon: "book-outline",
      title: "My Journal", 
      description: "Write about your day",
      action: "Open Journal", 
      onPress: () => router.push("/(dashboard)/child/journal"),
      color: "#667EEA",
      gradient: ['#667EEA', '#764BA2']
    },
    { 
      icon: "checkmark-circle-outline",
      title: "My Activities", 
      description: pendingActivities > 0 
        ? `${pendingActivities} activities waiting`
        : "All caught up! 🎉", 
      action: "View Activities", 
      onPress: () => router.push("/(dashboard)/child/activities"),
      badge: pendingActivities > 0 ? pendingActivities.toString() : null,
      color: "#4CAF50",
      gradient: ['#4CAF50', '#66BB6A']
    },
    { 
      icon: "trophy-outline",
      title: "Achievements", 
      description: `Level ${stats?.level || 1} • ${earnedBadges} badges`, 
      action: "View Badges", 
      onPress: () => router.push("/(dashboard)/child/achievements"),
      color: "#FFC107",
      gradient: ['#FFC107', '#FFD54F']
    },
    { 
      icon: "calendar-outline",
      title: "My Schedule", 
      description: "Check your daily schedule",
      action: "View Schedule", 
      onPress: () => router.push("/(dashboard)/child/schedule"),
      color: "#9C27B0",
      gradient: ['#9C27B0', '#BA68C8']
    }
  ];

  // Use the child's actual name from the user object
  const displayName = user?.name || "there";

  // Show loading state during initial data fetch
  if (initialLoad) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }]} edges={['top']}>
        <ActivityIndicator size="large" color={themeColors.primary} />
        <Text style={{ marginTop: 12, color: colors.textSecondary }}>Loading your dashboard...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Animated Header with stats */}
      <Animated.View 
        style={[
          styles.header,
          { backgroundColor: colors.background },
          {
            opacity: scrollY.interpolate({
              inputRange: [0, 50],
              outputRange: [1, 0.9],
              extrapolate: 'clamp'
            })
          }
        ]}
      >
        <View style={styles.headerTop}>
          <View style={styles.headerTitles}>
            <Text style={[styles.welcomeTitle, { color: colors.text }]}>
              Welcome, {displayName}! 👋
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Ready for some fun today? 🚀
            </Text>
          </View>
          
          {/* Notification Bell */}
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={() => router.push("/(dashboard)/child/notifications")}
          >
            <Ionicons name="notifications-outline" size={24} color={colors.text} />
            {unreadCount > 0 && (
              <View style={[styles.notificationBadge, { backgroundColor: themeColors.primary }]}>
                <Text style={styles.notificationBadgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        
        {/* Stats bar */}
        <View style={[styles.statsBar, { backgroundColor: colors.surface }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>⭐ {stats?.points || 0}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Points</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>🔥 {stats?.streakCount || 0}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Streak</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>🏆 {earnedBadges}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Badges</Text>
          </View>
        </View>
      </Animated.View>

      <Animated.ScrollView 
        style={styles.cardsContainer}
        contentContainerStyle={styles.cardsContent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      >
        {dashboardCards.map((card, index) => (
          <Animated.View
            key={index}
            style={{
              opacity: scrollY.interpolate({
                inputRange: [0, 100 * index, 100 * (index + 1)],
                outputRange: [1, 1, 1],
                extrapolate: 'clamp'
              }),
              transform: [{
                translateY: scrollY.interpolate({
                  inputRange: [0, 100 * index, 100 * (index + 1)],
                  outputRange: [0, 0, 0],
                  extrapolate: 'clamp'
                })
              }]
            }}
          >
            <TouchableOpacity 
              style={[styles.card, { backgroundColor: colors.card, borderLeftColor: card.color, borderLeftWidth: 4 }]} 
              onPress={card.onPress}
              activeOpacity={0.7}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: card.color + '20' }]}>
                  <Ionicons name={card.icon as any} size={28} color={card.color} />
                </View>
                {card.badge && (
                  <View style={[styles.badge, { backgroundColor: card.color }]}>
                    <Text style={styles.badgeText}>{card.badge}</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>{card.title}</Text>
              <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>{card.description}</Text>
              <View style={styles.cardFooter}>
                <Text style={[styles.cardAction, { color: card.color }]}>{card.action}</Text>
                <Ionicons name="arrow-forward" size={16} color={card.color} />
              </View>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  header: { 
    backgroundColor: 'white', 
    padding: 20, 
    paddingBottom: 20,
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.08, 
    shadowRadius: 8, 
    elevation: 4,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4
  },
  headerTitles: {
    flex: 1,
    marginRight: 12
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4
  },
  notificationBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700'
  },
  welcomeTitle: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: '#1e293b', 
    marginBottom: 4
  },
  subtitle: { 
    fontSize: 15, 
    color: '#64748b', 
    marginBottom: 16
  },
  statsBar: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    backgroundColor: '#f1f5f9', 
    borderRadius: 16, 
    padding: 16,
    marginTop: 8
  },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { 
    fontSize: 20, 
    fontWeight: '800', 
    color: '#1e293b', 
    marginBottom: 4 
  },
  statLabel: { 
    fontSize: 11, 
    color: '#64748b', 
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5
  },
  statDivider: { 
    width: 1, 
    backgroundColor: '#cbd5e1', 
    marginHorizontal: 12 
  },
  cardsContainer: { 
    flex: 1
  },
  cardsContent: {
    padding: 16,
    paddingBottom: 24
  },
  card: { 
    backgroundColor: 'white', 
    padding: 20, 
    borderRadius: 16, 
    marginBottom: 16, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 12, 
    elevation: 5
  },
  cardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 12
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cardTitle: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: '#1e293b',
    marginBottom: 6,
    marginTop: 8
  },
  badge: { 
    borderRadius: 12, 
    paddingHorizontal: 10, 
    paddingVertical: 5, 
    minWidth: 28, 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3
  },
  badgeText: { 
    color: 'white', 
    fontSize: 13, 
    fontWeight: '800' 
  },
  cardDescription: { 
    fontSize: 14, 
    color: '#64748b', 
    marginBottom: 14, 
    lineHeight: 20 
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  cardAction: { 
    fontSize: 15, 
    fontWeight: '700'
  },
});