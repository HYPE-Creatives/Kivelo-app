// app/(dashboard)/child/activities.tsx
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { useActivity } from "../../../context/ActivityContext";
import { useGamification } from "../../../context/GamificationContext";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";

const CATEGORY_COLORS = {
  education: '#3B82F6',
  physical: '#EF4444',
  creative: '#A855F7',
  chores: '#F59E0B',
  social: '#10B981',
  mindfulness: '#8B5CF6',
};

const CATEGORY_ICONS = {
  education: 'book-outline',
  physical: 'fitness-outline',
  creative: 'color-palette-outline',
  chores: 'home-outline',
  social: 'people-outline',
  mindfulness: 'flower-outline',
};

export default function ActivitiesScreen() {
  const { activities, getActivities, completeActivity, loading } = useActivity();
  const { refreshStats } = useGamification();
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [completing, setCompleting] = useState<string | null>(null);

  useEffect(() => {
    getActivities();
  }, [getActivities]);

  const handleComplete = async (activityId: string, activityTitle: string) => {
    Alert.alert(
      "Complete Activity",
      `Mark "${activityTitle}" as complete?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Complete",
            onPress: async () => {
            try {
              setCompleting(activityId);
              await completeActivity(activityId);
              await refreshStats(); // Update points/streak
              Alert.alert("Success!", "Activity completed! Points earned! 🎉");
            } catch {
              Alert.alert("Error", "Failed to complete activity");
            } finally {
              setCompleting(null);
            }
          },
        },
      ]
    );
  };

  const filteredActivities = activities.filter(activity => {
    if (filter === 'pending') return !activity.completed;
    if (filter === 'completed') return activity.completed;
    return true;
  });

  const pendingCount = activities.filter(a => !a.completed).length;
  const completedCount = activities.filter(a => a.completed).length;

  if (loading && activities.length === 0) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={{ marginTop: 12, color: '#666' }}>Loading activities...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Activities</Text>
        <Text style={styles.subtitle}>
          {pendingCount} pending • {completedCount} completed
        </Text>
      </View>

      {/* Filter tabs */}
      <View style={styles.filterContainer}>
        {['all', 'pending', 'completed'].map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f as any)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Activities list */}
      <ScrollView style={styles.listContainer}>
        {filteredActivities.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>
              {filter === 'completed' ? '🎉' : '📝'}
            </Text>
            <Text style={styles.emptyText}>
              {filter === 'completed' 
                ? "No completed activities yet. Start completing some!" 
                : "No activities assigned yet"}
            </Text>
          </View>
        ) : (
          filteredActivities.map(activity => {
            const categoryColor = CATEGORY_COLORS[activity.category] || '#666';
            const categoryIcon = CATEGORY_ICONS[activity.category] || 'cube-outline';
            const isCompleting = completing === activity._id;

            return (
              <View 
                key={activity._id} 
                style={[
                  styles.activityCard,
                  activity.completed && styles.activityCardCompleted
                ]}
              >
                {/* Header */}
                <View style={styles.activityHeader}>
                  <View style={[styles.categoryBadge, { backgroundColor: categoryColor + '20' }]}>
                    <Ionicons name={categoryIcon as any} size={16} color={categoryColor} />
                    <Text style={[styles.categoryText, { color: categoryColor }]}>
                      {activity.category}
                    </Text>
                  </View>
                  <View style={styles.pointsBadge}>
                    <Text style={styles.pointsText}>⭐ {activity.points}</Text>
                  </View>
                </View>

                {/* Content */}
                <Text style={styles.activityTitle}>{activity.title}</Text>
                <Text style={styles.activityDescription}>{activity.description}</Text>

                {/* Meta info */}
                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={14} color="#666" />
                    <Text style={styles.metaText}>{activity.duration} min</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="speedometer-outline" size={14} color="#666" />
                    <Text style={styles.metaText}>{activity.difficulty}</Text>
                  </View>
                  {activity.dueDate && (
                    <View style={styles.metaItem}>
                      <Ionicons name="calendar-outline" size={14} color="#666" />
                      <Text style={styles.metaText}>
                        {new Date(activity.dueDate).toLocaleDateString()}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Action button */}
                {!activity.completed && (
                  <TouchableOpacity
                    style={[styles.completeButton, isCompleting && styles.completeButtonLoading]}
                    onPress={() => handleComplete(activity._id, activity.title)}
                    disabled={isCompleting}
                  >
                    {isCompleting ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle-outline" size={20} color="white" />
                        <Text style={styles.completeButtonText}>Mark Complete</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}

                {activity.completed && (
                  <View style={styles.completedBadge}>
                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                    <Text style={styles.completedText}>Completed</Text>
                    {activity.completedAt && (
                      <Text style={styles.completedDate}>
                        on {new Date(activity.completedAt).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f8ff' },
  header: { backgroundColor: 'white', padding: 20, paddingBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#666' },
  filterContainer: { flexDirection: 'row', padding: 16, gap: 8 },
  filterTab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8, backgroundColor: '#e0e0e0' },
  filterTabActive: { backgroundColor: '#4CAF50' },
  filterText: { fontSize: 14, fontWeight: '600', color: '#666' },
  filterTextActive: { color: 'white' },
  listContainer: { flex: 1, padding: 16, paddingTop: 0 },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyText: { fontSize: 16, color: '#666', textAlign: 'center' },
  activityCard: { backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  activityCardCompleted: { opacity: 0.7 },
  activityHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  categoryBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, gap: 6 },
  categoryText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  pointsBadge: { backgroundColor: '#FFF3CD', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 },
  pointsText: { fontSize: 12, fontWeight: '700', color: '#856404' },
  activityTitle: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 8 },
  activityDescription: { fontSize: 14, color: '#666', marginBottom: 12, lineHeight: 20 },
  metaRow: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: '#666', textTransform: 'capitalize' },
  completeButton: { flexDirection: 'row', backgroundColor: '#4CAF50', paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center', gap: 8 },
  completeButtonLoading: { backgroundColor: '#9CA3AF' },
  completeButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  completedBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#D1FAE5', padding: 12, borderRadius: 8 },
  completedText: { fontSize: 14, fontWeight: '600', color: '#10B981' },
  completedDate: { fontSize: 12, color: '#059669', marginLeft: 'auto' },
});
