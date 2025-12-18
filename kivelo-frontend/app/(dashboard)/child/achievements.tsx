// app/(dashboard)/child/achievements.tsx
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGamification } from "../../../context/GamificationContext";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";

export default function AchievementsScreen() {
  const { stats, availableBadges, getStats, getBadges, loading } = useGamification();
  const [tab, setTab] = useState<'overview' | 'badges'>('overview');

  useEffect(() => {
    getStats();
    getBadges();
  }, [getStats, getBadges]);

  const level = stats?.level || 1;
  const currentPoints = stats?.points || 0;
  const nextLevelPoints = stats?.nextLevelPoints || 100;
  const progress = ((currentPoints % 100) / 100) * 100;

  if (loading && !stats) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]} edges={['top']}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={{ marginTop: 12, color: '#666' }}>Loading achievements...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header with level info */}
      <View style={styles.header}>
        <View style={styles.levelCircle}>
          <Text style={styles.levelNumber}>{level}</Text>
          <Text style={styles.levelLabel}>Level</Text>
        </View>
        <View style={styles.statsInfo}>
          <Text style={styles.statsTitle}>Your Progress</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.statsSubtitle}>
            {currentPoints} / {nextLevelPoints} points to next level
          </Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, tab === 'overview' && styles.tabActive]}
          onPress={() => setTab('overview')}
        >
          <Text style={[styles.tabText, tab === 'overview' && styles.tabTextActive]}>
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'badges' && styles.tabActive]}
          onPress={() => setTab('badges')}
        >
          <Text style={[styles.tabText, tab === 'badges' && styles.tabTextActive]}>
            Badges ({stats?.badges?.length || 0})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {tab === 'overview' && (
          <>
            {/* Stats cards */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statIcon}>⭐</Text>
                <Text style={styles.statValue}>{stats?.points || 0}</Text>
                <Text style={styles.statLabel}>Total Points</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statIcon}>🔥</Text>
                <Text style={styles.statValue}>{stats?.streakCount || 0}</Text>
                <Text style={styles.statLabel}>Day Streak</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statIcon}>🏆</Text>
                <Text style={styles.statValue}>{stats?.badges?.length || 0}</Text>
                <Text style={styles.statLabel}>Badges Earned</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statIcon}>📊</Text>
                <Text style={styles.statValue}>{level}</Text>
                <Text style={styles.statLabel}>Current Level</Text>
              </View>
            </View>

            {/* Recent badges */}
            <Text style={styles.sectionTitle}>Recent Badges</Text>
            {stats?.badges && stats.badges.length > 0 ? (
              stats.badges.slice(0, 3).map((badge, index) => (
                <View key={index} style={styles.badgeCard}>
                  <View style={styles.badgeIconContainer}>
                    <Text style={styles.badgeIcon}>🏅</Text>
                  </View>
                  <View style={styles.badgeInfo}>
                    <Text style={styles.badgeName}>
                      {badge.badgeId?.name || badge.name || 'Badge'}
                    </Text>
                    <Text style={styles.badgeDescription}>
                      {badge.badgeId?.description || badge.description || 'Achievement unlocked!'}
                    </Text>
                    {badge.earnedAt && (
                      <Text style={styles.badgeDate}>
                        Earned {new Date(badge.earnedAt).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🏅</Text>
                <Text style={styles.emptyText}>
                  No badges yet! Complete activities and check in your mood to earn badges.
                </Text>
              </View>
            )}

            {/* Motivational message */}
            <View style={styles.motivationCard}>
              <Ionicons name="trophy-outline" size={32} color="#F59E0B" />
              <Text style={styles.motivationTitle}>Keep Going!</Text>
              <Text style={styles.motivationText}>
                You are doing great! Complete more activities and maintain your streak to level up faster!
              </Text>
            </View>
          </>
        )}

        {tab === 'badges' && (
          <>
            {/* Earned badges */}
            <Text style={styles.sectionTitle}>Earned Badges</Text>
            {stats?.badges && stats.badges.length > 0 ? (
              stats.badges.map((badge, index) => (
                <View key={index} style={styles.badgeCard}>
                  <View style={styles.badgeIconContainer}>
                    <Text style={styles.badgeIcon}>🏅</Text>
                  </View>
                  <View style={styles.badgeInfo}>
                    <Text style={styles.badgeName}>
                      {badge.badgeId?.name || badge.name || 'Badge'}
                    </Text>
                    <Text style={styles.badgeDescription}>
                      {badge.badgeId?.description || badge.description || 'Achievement unlocked!'}
                    </Text>
                    {badge.earnedAt && (
                      <Text style={styles.badgeDate}>
                        Earned {new Date(badge.earnedAt).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                  <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🏅</Text>
                <Text style={styles.emptyText}>
                  No badges earned yet. Start completing activities!
                </Text>
              </View>
            )}

            {/* Available badges */}
            <Text style={styles.sectionTitle}>Available Badges</Text>
            {availableBadges.length > 0 ? (
              availableBadges.map((badge, index) => (
                <View key={index} style={[styles.badgeCard, styles.badgeCardLocked]}>
                  <View style={[styles.badgeIconContainer, styles.badgeIconLocked]}>
                    <Ionicons name="lock-closed" size={24} color="#999" />
                  </View>
                  <View style={styles.badgeInfo}>
                    <Text style={styles.badgeName}>{badge.name || 'Badge'}</Text>
                    <Text style={styles.badgeDescription}>
                      {badge.description || 'Unlock this badge!'}
                    </Text>
                    {badge.pointsRequired && (
                      <Text style={styles.badgeRequirement}>
                        Requires {badge.pointsRequired} points
                      </Text>
                    )}
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>✨</Text>
                <Text style={styles.emptyText}>
                  All badges unlocked! Check back later for new challenges.
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f8ff' },
  header: { flexDirection: 'row', backgroundColor: 'white', padding: 20, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  levelCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#4CAF50', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  levelNumber: { fontSize: 32, fontWeight: 'bold', color: 'white' },
  levelLabel: { fontSize: 12, color: 'white', marginTop: -4 },
  statsInfo: { flex: 1 },
  statsTitle: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 8 },
  progressBar: { height: 10, backgroundColor: '#e0e0e0', borderRadius: 5, overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: '100%', backgroundColor: '#4CAF50' },
  statsSubtitle: { fontSize: 12, color: '#666' },
  tabContainer: { flexDirection: 'row', backgroundColor: 'white', paddingHorizontal: 20, paddingTop: 12 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: '#4CAF50' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#666' },
  tabTextActive: { color: '#4CAF50' },
  content: { flex: 1, padding: 20 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  statCard: { flex: 1, minWidth: '45%', backgroundColor: 'white', padding: 16, borderRadius: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  statIcon: { fontSize: 32, marginBottom: 8 },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#666', textAlign: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 12, marginTop: 8 },
  badgeCard: { flexDirection: 'row', backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  badgeCardLocked: { opacity: 0.6 },
  badgeIconContainer: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFF3CD', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  badgeIconLocked: { backgroundColor: '#e0e0e0' },
  badgeIcon: { fontSize: 28 },
  badgeInfo: { flex: 1 },
  badgeName: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 4 },
  badgeDescription: { fontSize: 13, color: '#666', marginBottom: 4 },
  badgeDate: { fontSize: 11, color: '#999' },
  badgeRequirement: { fontSize: 12, color: '#F59E0B', fontWeight: '600', marginTop: 4 },
  motivationCard: { backgroundColor: '#FFF7ED', padding: 20, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  motivationTitle: { fontSize: 18, fontWeight: '600', color: '#F59E0B', marginTop: 8, marginBottom: 8 },
  motivationText: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyText: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20, paddingHorizontal: 20 },
});
