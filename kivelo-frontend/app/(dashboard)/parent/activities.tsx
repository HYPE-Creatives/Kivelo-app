// app/(dashboard)/parent/activities.tsx - Parent Activity Management
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Modal,
  TextInput,
  ActivityIndicator,
  Dimensions,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn, FadeInDown, FadeInUp, SlideInRight } from "react-native-reanimated";
import { useActivity, Activity, CreateActivityData } from "../../../context/ActivityContext";
import { useParent } from "../../../context/ParentContext";
import { showAlert } from "@/utils/showAlert";
import { useRouter } from "expo-router";

const { width: screenWidth } = Dimensions.get("window");

// Category configuration
const CATEGORIES = [
  { id: "education", icon: "book-outline", label: "Education", color: "#3B82F6", gradient: ["#3B82F6", "#2563EB"] },
  { id: "physical", icon: "fitness-outline", label: "Physical", color: "#EF4444", gradient: ["#EF4444", "#DC2626"] },
  { id: "creative", icon: "color-palette-outline", label: "Creative", color: "#A855F7", gradient: ["#A855F7", "#9333EA"] },
  { id: "chores", icon: "home-outline", label: "Chores", color: "#F59E0B", gradient: ["#F59E0B", "#D97706"] },
  { id: "social", icon: "people-outline", label: "Social", color: "#10B981", gradient: ["#10B981", "#059669"] },
  { id: "mindfulness", icon: "flower-outline", label: "Mindfulness", color: "#8B5CF6", gradient: ["#8B5CF6", "#7C3AED"] },
] as const;

const DIFFICULTIES = [
  { id: "easy", label: "Easy", points: "5-10 pts", color: "#10B981" },
  { id: "medium", label: "Medium", points: "15-25 pts", color: "#F59E0B" },
  { id: "hard", label: "Hard", points: "30-50 pts", color: "#EF4444" },
] as const;

type CategoryType = typeof CATEGORIES[number]["id"];
type DifficultyType = typeof DIFFICULTIES[number]["id"];

export default function ParentActivities() {
  const router = useRouter();
  const { activities, loading, getActivities, createActivity, updateActivity, deleteActivity } = useActivity();
  const { children, getChildren } = useParent();
  
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryType | "all">("all");
  
  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCategory, setFormCategory] = useState<CategoryType>("education");
  const [formDifficulty, setFormDifficulty] = useState<DifficultyType>("medium");
  const [formPoints, setFormPoints] = useState("15");
  const [formDuration, setFormDuration] = useState("30");
  const [formDueDate, setFormDueDate] = useState("");
  const [selectedChildren, setSelectedChildren] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([getActivities(), getChildren()]);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  // Filter activities
  const filteredActivities = activities.filter(activity => {
    if (filter === "pending" && activity.completed) return false;
    if (filter === "completed" && !activity.completed) return false;
    if (categoryFilter !== "all" && activity.category !== categoryFilter) return false;
    return true;
  });

  // Stats
  const stats = {
    total: activities.length,
    pending: activities.filter(a => !a.completed).length,
    completed: activities.filter(a => a.completed).length,
  };

  // Reset form
  const resetForm = () => {
    setFormTitle("");
    setFormDescription("");
    setFormCategory("education");
    setFormDifficulty("medium");
    setFormPoints("15");
    setFormDuration("30");
    setFormDueDate("");
    setSelectedChildren([]);
    setEditingActivity(null);
  };

  // Open create modal
  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  // Open edit modal
  const openEditModal = (activity: Activity) => {
    setEditingActivity(activity);
    setFormTitle(activity.title);
    setFormDescription(activity.description);
    setFormCategory(activity.category);
    setFormDifficulty(activity.difficulty);
    setFormPoints(String(activity.points));
    setFormDuration(String(activity.duration));
    setFormDueDate(activity.dueDate ? new Date(activity.dueDate).toISOString().split("T")[0] : "");
    setSelectedChildren(
      activity.assignedTo.map(a => typeof a === "string" ? a : a._id)
    );
    setShowCreateModal(true);
  };

  // Handle save
  const handleSave = async () => {
    if (!formTitle.trim()) {
      showAlert("Error", "Please enter a title");
      return;
    }
    if (!formDescription.trim()) {
      showAlert("Error", "Please enter a description");
      return;
    }
    if (selectedChildren.length === 0) {
      showAlert("Error", "Please assign to at least one child");
      return;
    }

    setIsSubmitting(true);

    const data: CreateActivityData = {
      title: formTitle.trim(),
      description: formDescription.trim(),
      category: formCategory,
      difficulty: formDifficulty,
      points: parseInt(formPoints) || 15,
      duration: parseInt(formDuration) || 30,
      assignedTo: selectedChildren,
      ...(formDueDate && { dueDate: formDueDate }),
    };

    try {
      let result;
      if (editingActivity) {
        result = await updateActivity(editingActivity._id, data);
      } else {
        result = await createActivity(data);
      }

      if (result.success) {
        showAlert("Success!", editingActivity ? "Activity updated! ✅" : "Activity created! 🎉");
        setShowCreateModal(false);
        resetForm();
      } else {
        showAlert("Error", result.message || "Failed to save activity");
      }
    } catch {
      showAlert("Error", "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = (activity: Activity) => {
    Alert.alert(
      "Delete Activity",
      `Are you sure you want to delete "${activity.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const result = await deleteActivity(activity._id);
            if (result.success) {
              showAlert("Deleted", "Activity removed successfully");
            } else {
              showAlert("Error", result.message || "Failed to delete activity");
            }
          },
        },
      ]
    );
  };

  // Toggle child selection
  const toggleChildSelection = (childId: string) => {
    setSelectedChildren(prev =>
      prev.includes(childId)
        ? prev.filter(id => id !== childId)
        : [...prev, childId]
    );
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Get category config
  const getCategoryConfig = (categoryId: string) => {
    return CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[0];
  };

  // Render activity card
  const renderActivityCard = (activity: Activity, index: number) => {
    const category = getCategoryConfig(activity.category);
    const isOverdue = activity.dueDate && new Date(activity.dueDate) < new Date() && !activity.completed;
    
    return (
      <Animated.View
        key={activity._id}
        entering={FadeInDown.delay(index * 50).springify()}
        style={[styles.activityCard, activity.completed && styles.activityCardCompleted]}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.categoryBadge, { backgroundColor: category.color + "15" }]}>
            <Ionicons name={category.icon as any} size={14} color={category.color} />
            <Text style={[styles.categoryText, { color: category.color }]}>{category.label}</Text>
          </View>
          <View style={styles.cardActions}>
            {!activity.completed && (
              <>
                <TouchableOpacity 
                  style={styles.cardActionBtn}
                  onPress={() => openEditModal(activity)}
                >
                  <Ionicons name="pencil-outline" size={16} color="#6B7280" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.cardActionBtn}
                  onPress={() => handleDelete(activity)}
                >
                  <Ionicons name="trash-outline" size={16} color="#EF4444" />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        <Text style={[styles.activityTitle, activity.completed && styles.textCompleted]}>
          {activity.title}
        </Text>
        <Text style={[styles.activityDesc, activity.completed && styles.textCompleted]} numberOfLines={2}>
          {activity.description}
        </Text>

        <View style={styles.cardMeta}>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text style={styles.metaText}>{activity.points} pts</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color="#6B7280" />
              <Text style={styles.metaText}>{activity.duration} min</Text>
            </View>
            {activity.dueDate && (
              <View style={[styles.metaItem, isOverdue && styles.metaOverdue]}>
                <Ionicons name="calendar-outline" size={14} color={isOverdue ? "#EF4444" : "#6B7280"} />
                <Text style={[styles.metaText, isOverdue && { color: "#EF4444" }]}>
                  {formatDate(activity.dueDate)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Assigned children */}
        <View style={styles.assignedRow}>
          <Text style={styles.assignedLabel}>Assigned to:</Text>
          <View style={styles.assignedChildren}>
            {activity.assignedTo.slice(0, 3).map((child, idx) => {
              const childName = typeof child === "string" 
                ? children.find(c => (c._id || c.id) === child)?.name || "Child"
                : child.name || "Child";
              return (
                <View key={idx} style={styles.assignedChip}>
                  <Text style={styles.assignedChipText}>{childName}</Text>
                </View>
              );
            })}
            {activity.assignedTo.length > 3 && (
              <Text style={styles.moreText}>+{activity.assignedTo.length - 3}</Text>
            )}
          </View>
        </View>

        {/* Status badge */}
        {activity.completed && (
          <View style={styles.completedBadge}>
            <Ionicons name="checkmark-circle" size={14} color="#10B981" />
            <Text style={styles.completedText}>Completed</Text>
          </View>
        )}
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <LinearGradient
        colors={["#16A34A", "#15803D"]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Activities</Text>
            <Text style={styles.headerSubtitle}>Manage family activities</Text>
          </View>
          <TouchableOpacity onPress={openCreateModal} style={styles.addBtn}>
            <Ionicons name="add" size={26} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.completed}</Text>
            <Text style={styles.statLabel}>Done</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        {/* Status filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {(["all", "pending", "completed"] as const).map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
          <View style={styles.filterDivider} />
          {/* Category filter */}
          <TouchableOpacity
            style={[styles.filterChip, categoryFilter === "all" && styles.filterChipActive]}
            onPress={() => setCategoryFilter("all")}
          >
            <Text style={[styles.filterChipText, categoryFilter === "all" && styles.filterChipTextActive]}>
              All Types
            </Text>
          </TouchableOpacity>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.filterChip, 
                categoryFilter === cat.id && { backgroundColor: cat.color + "20", borderColor: cat.color }
              ]}
              onPress={() => setCategoryFilter(cat.id)}
            >
              <Ionicons name={cat.icon as any} size={14} color={categoryFilter === cat.id ? cat.color : "#6B7280"} />
              <Text style={[styles.filterChipText, categoryFilter === cat.id && { color: cat.color }]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Activity List */}
      <ScrollView
        style={styles.listContainer}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#16A34A"]} />
        }
      >
        {loading && activities.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#16A34A" />
            <Text style={styles.loadingText}>Loading activities...</Text>
          </View>
        ) : filteredActivities.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="clipboard-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No activities yet</Text>
            <Text style={styles.emptySubtitle}>
              Create activities for your children to complete and earn points!
            </Text>
            <TouchableOpacity style={styles.emptyButton} onPress={openCreateModal}>
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.emptyButtonText}>Create Activity</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredActivities.map((activity, index) => renderActivityCard(activity, index))
        )}
      </ScrollView>

      {/* Create/Edit Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <SafeAreaView style={styles.modalContainer} edges={["top", "bottom"]}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {editingActivity ? "Edit Activity" : "New Activity"}
              </Text>
              <TouchableOpacity 
                onPress={handleSave}
                disabled={isSubmitting}
                style={[styles.saveBtn, isSubmitting && styles.saveBtnDisabled]}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* Title */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Title *</Text>
                <TextInput
                  style={styles.textInput}
                  value={formTitle}
                  onChangeText={setFormTitle}
                  placeholder="e.g., Complete homework"
                  placeholderTextColor="#9CA3AF"
                  maxLength={100}
                />
              </View>

              {/* Description */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description *</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={formDescription}
                  onChangeText={setFormDescription}
                  placeholder="What should they do?"
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={3}
                  maxLength={500}
                />
              </View>

              {/* Category */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Category *</Text>
                <View style={styles.categoryGrid}>
                  {CATEGORIES.map(cat => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.categoryOption,
                        formCategory === cat.id && { backgroundColor: cat.color + "15", borderColor: cat.color }
                      ]}
                      onPress={() => setFormCategory(cat.id)}
                    >
                      <Ionicons 
                        name={cat.icon as any} 
                        size={20} 
                        color={formCategory === cat.id ? cat.color : "#6B7280"} 
                      />
                      <Text style={[
                        styles.categoryOptionText,
                        formCategory === cat.id && { color: cat.color }
                      ]}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Difficulty */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Difficulty</Text>
                <View style={styles.difficultyRow}>
                  {DIFFICULTIES.map(diff => (
                    <TouchableOpacity
                      key={diff.id}
                      style={[
                        styles.difficultyOption,
                        formDifficulty === diff.id && { backgroundColor: diff.color + "15", borderColor: diff.color }
                      ]}
                      onPress={() => setFormDifficulty(diff.id)}
                    >
                      <Text style={[
                        styles.difficultyLabel,
                        formDifficulty === diff.id && { color: diff.color }
                      ]}>
                        {diff.label}
                      </Text>
                      <Text style={styles.difficultyPoints}>{diff.points}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Points & Duration Row */}
              <View style={styles.rowGroup}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>Points ⭐</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formPoints}
                    onChangeText={setFormPoints}
                    placeholder="15"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                    maxLength={3}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.inputLabel}>Duration (min)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formDuration}
                    onChangeText={setFormDuration}
                    placeholder="30"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                    maxLength={3}
                  />
                </View>
              </View>

              {/* Due Date */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Due Date (Optional)</Text>
                <TextInput
                  style={styles.textInput}
                  value={formDueDate}
                  onChangeText={setFormDueDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#9CA3AF"
                  maxLength={10}
                />
              </View>

              {/* Assign to Children */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Assign to Children *</Text>
                {children.length === 0 ? (
                  <View style={styles.noChildrenCard}>
                    <Ionicons name="people-outline" size={32} color="#9CA3AF" />
                    <Text style={styles.noChildrenText}>No children in family yet</Text>
                  </View>
                ) : (
                  <View style={styles.childrenGrid}>
                    {children.map(child => {
                      const childId = child._id || child.id || "";
                      const isSelected = selectedChildren.includes(childId);
                      return (
                        <TouchableOpacity
                          key={childId}
                          style={[styles.childOption, isSelected && styles.childOptionSelected]}
                          onPress={() => toggleChildSelection(childId)}
                        >
                          <View style={[styles.childAvatar, isSelected && styles.childAvatarSelected]}>
                            <Text style={styles.childAvatarText}>
                              {child.name?.charAt(0)?.toUpperCase() || "?"}
                            </Text>
                          </View>
                          <Text style={[styles.childName, isSelected && styles.childNameSelected]}>
                            {child.name || "Child"}
                          </Text>
                          {isSelected && (
                            <Ionicons name="checkmark-circle" size={18} color="#16A34A" style={styles.childCheck} />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>

              <View style={{ height: 40 }} />
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  backBtn: {
    padding: 4,
  },
  headerTitleContainer: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    paddingVertical: 12,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
  },
  statLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  filtersContainer: {
    backgroundColor: "#fff",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  filterScroll: {
    paddingHorizontal: 12,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "transparent",
  },
  filterChipActive: {
    backgroundColor: "#16A34A15",
    borderColor: "#16A34A",
  },
  filterChipText: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },
  filterChipTextActive: {
    color: "#16A34A",
  },
  filterDivider: {
    width: 1,
    height: 20,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 8,
    alignSelf: "center",
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    color: "#6B7280",
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#16A34A",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 24,
  },
  emptyButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  activityCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  activityCardCompleted: {
    opacity: 0.7,
    backgroundColor: "#F9FAFB",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "600",
  },
  cardActions: {
    flexDirection: "row",
    gap: 8,
  },
  cardActionBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  activityDesc: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
    marginBottom: 12,
  },
  textCompleted: {
    textDecorationLine: "line-through",
    color: "#9CA3AF",
  },
  cardMeta: {
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: "row",
    gap: 16,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: "#6B7280",
  },
  metaOverdue: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  assignedRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  assignedLabel: {
    fontSize: 12,
    color: "#9CA3AF",
    marginRight: 8,
  },
  assignedChildren: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    flex: 1,
  },
  assignedChip: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  assignedChipText: {
    fontSize: 11,
    color: "#4F46E5",
    fontWeight: "500",
  },
  moreText: {
    fontSize: 11,
    color: "#6B7280",
    alignSelf: "center",
  },
  completedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
  },
  completedText: {
    fontSize: 12,
    color: "#10B981",
    fontWeight: "500",
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1F2937",
  },
  saveBtn: {
    backgroundColor: "#16A34A",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  modalScroll: {
    flex: 1,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#1F2937",
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  rowGroup: {
    flexDirection: "row",
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryOption: {
    width: (screenWidth - 56) / 3,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  categoryOptionText: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 4,
    fontWeight: "500",
  },
  difficultyRow: {
    flexDirection: "row",
    gap: 8,
  },
  difficultyOption: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  difficultyLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },
  difficultyPoints: {
    fontSize: 10,
    color: "#9CA3AF",
    marginTop: 2,
  },
  noChildrenCard: {
    alignItems: "center",
    paddingVertical: 32,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  noChildrenText: {
    fontSize: 13,
    color: "#9CA3AF",
    marginTop: 8,
  },
  childrenGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  childOption: {
    width: (screenWidth - 52) / 2,
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  childOptionSelected: {
    backgroundColor: "#DCFCE7",
    borderColor: "#16A34A",
  },
  childAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  childAvatarSelected: {
    backgroundColor: "#16A34A",
  },
  childAvatarText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  childName: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
    flex: 1,
  },
  childNameSelected: {
    color: "#166534",
  },
  childCheck: {
    marginLeft: 4,
  },
});
