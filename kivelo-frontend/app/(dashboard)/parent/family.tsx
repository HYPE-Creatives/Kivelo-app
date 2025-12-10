// app/(dashboard)/parent/family.tsx - Enhanced Family Management with Inline Child Details
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Dimensions,
  Image,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useParent, Child, JournalEntry, MoodEntry } from "../../../context/ParentContext";
import { useAuth } from "../../../context/AuthContext";

const { width } = Dimensions.get("window");
const API_BASE = "https://family-wellness.onrender.com/api/v1";

// Family interface
interface FamilyData {
  _id: string;
  name: string;
  description?: string;
  familyPhoto?: {
    url: string;
    public_id: string;
  };
  members: any[];
  createdBy: any;
}

// Trust zone colors with full styling
const TRUST_ZONE_COLORS: Record<string, { bg: string; text: string; border: string; emoji: string; label: string }> = {
  green: { bg: "#DCFCE7", text: "#166534", border: "#86EFAC", emoji: "😊", label: "Happy" },
  yellow: { bg: "#FEF9C3", text: "#854D0E", border: "#FDE047", emoji: "😐", label: "Okay" },
  orange: { bg: "#FFEDD5", text: "#9A3412", border: "#FDBA74", emoji: "😟", label: "Uneasy" },
  red: { bg: "#FEE2E2", text: "#991B1B", border: "#FCA5A5", emoji: "😢", label: "Needs Support" },
  unknown: { bg: "#F3F4F6", text: "#6B7280", border: "#D1D5DB", emoji: "❓", label: "No Data" },
};

// Extended child interface with ALL details inline
interface ChildWithFullDetails extends Child {
  // Note: user with avatar is inherited from Child interface in ParentContext
  // Mood data
  latestMood?: {
    emoji: string;
    moodScore: number;
    trustZone: string;
    textNote?: string;
    createdAt: string;
  };
  weeklyMoodAverage?: number;
  moodHistory?: MoodEntry[];
  moodCheckinCount?: number;
  // Journals
  recentJournals?: JournalEntry[];
  totalJournals?: number;
  // Gamification
  level?: number;
  badges?: string[];
}

export default function FamilyManagement() {
  const { user, generateOneTimeCode, resetChildPassword } = useAuth();
  const {
    children,
    loading,
    getChildren,
    getChildMoodSummary,
    getChildMoodHistory,
    getChildJournals,
  } = useParent();

  const [refreshing, setRefreshing] = useState(false);
  const [childrenDetails, setChildrenDetails] = useState<ChildWithFullDetails[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [expandedChild, setExpandedChild] = useState<string | null>(null);
  const [showAddChildModal, setShowAddChildModal] = useState(false);
  const [resettingCode, setResettingCode] = useState<string | null>(null);

  // Family state
  const [familyData, setFamilyData] = useState<FamilyData | null>(null);
  const [uploadingFamilyPhoto, setUploadingFamilyPhoto] = useState(false);

  // Add child form state
  const [newChildName, setNewChildName] = useState("");
  const [newChildEmail, setNewChildEmail] = useState("");
  const [newChildDOB, setNewChildDOB] = useState("");
  const [newChildGender, setNewChildGender] = useState("");
  const [isAddingChild, setIsAddingChild] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");

  useEffect(() => {
    loadFamilyData();
    loadChildren();
  }, []);

  // Load family data
  const loadFamilyData = async () => {
    try {
      const token = await AsyncStorage.getItem("kivelo_access_token");
      if (!token) return;

      const res = await fetch(`${API_BASE}/families/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.family) {
          setFamilyData(data.family);
        }
      }
    } catch (err) {
      console.log("Could not load family data:", err);
    }
  };

  // Upload/Update family photo
  const handleUpdateFamilyPhoto = async () => {
    if (!familyData?._id) {
      Alert.alert("No Family", "Family data not available yet");
      return;
    }

    Alert.alert("Update Family Photo", "Choose how to update your family photo", [
      { text: "Cancel", style: "cancel" },
      {
        text: "📷 Camera",
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== "granted") {
            Alert.alert("Permission required", "Please allow camera access in settings");
            return;
          }
          const result = await ImagePicker.launchCameraAsync({
            quality: 0.7,
            allowsEditing: true,
            aspect: [16, 9],
          });
          if (!result.canceled && result.assets?.[0]) {
            await uploadFamilyPhoto(result.assets[0].uri);
          }
        },
      },
      {
        text: "🖼️ Gallery",
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== "granted") {
            Alert.alert("Permission required", "Please allow photo access in settings");
            return;
          }
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.7,
            allowsEditing: true,
            aspect: [16, 9],
          });
          if (!result.canceled && result.assets?.[0]) {
            await uploadFamilyPhoto(result.assets[0].uri);
          }
        },
      },
    ]);
  };

  const uploadFamilyPhoto = async (uri: string) => {
    if (!familyData?._id) return;

    try {
      setUploadingFamilyPhoto(true);
      const token = await AsyncStorage.getItem("kivelo_access_token");
      if (!token) throw new Error("Not authenticated");

      const formData = new FormData();
      const uriParts = uri.split(".");
      const ext = uriParts[uriParts.length - 1];
      // @ts-ignore - React Native FormData
      formData.append("familyPhoto", {
        uri: Platform.OS === "ios" ? uri.replace("file://", "") : uri,
        name: `family.${ext}`,
        type: `image/${ext}`,
      });

      const res = await fetch(`${API_BASE}/families/${familyData._id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Upload failed");
      }

      const updated = await res.json();
      setFamilyData(updated);
      Alert.alert("Success! 🎉", "Family photo updated");
    } catch (err: any) {
      console.error("Family photo upload failed", err);
      Alert.alert("Upload failed", err.message || "Could not upload photo");
    } finally {
      setUploadingFamilyPhoto(false);
    }
  };

  // Load children with ALL their data (mood, journals, etc.)
  const loadChildren = async () => {
    setLoadingDetails(true);
    try {
      const result = await getChildren();
      if (result.success && result.data) {
        // Fetch ALL data for each child in parallel
        const enrichedChildren = await Promise.all(
          result.data.map(async (child: Child) => {
            try {
              // Fetch mood summary, mood history, and journals in parallel
              const [moodSummary, moodHistory, journals] = await Promise.all([
                getChildMoodSummary(child._id),
                getChildMoodHistory(child._id, "week"),
                getChildJournals(child._id),
              ]);

              // Extract mood data
              const moodData = moodSummary?.data as any;
              const latestMood = moodData?.latestMood || (moodSummary as any)?.latestMood || null;

              // Calculate weekly average
              const weeklyMoodAverage =
                moodHistory.length > 0
                  ? Math.round(
                      (moodHistory.reduce((sum, m) => sum + (m.moodScore || 0), 0) /
                        moodHistory.length) *
                        10
                    ) / 10
                  : undefined;

              // Calculate level
              const level = Math.floor((child.points || 0) / 100) + 1;

              return {
                ...child,
                latestMood,
                weeklyMoodAverage,
                moodHistory: moodHistory.slice(0, 7), // Last 7 days
                moodCheckinCount: moodHistory.length,
                recentJournals: journals.slice(0, 3), // Last 3 journals
                totalJournals: journals.length,
                level,
              };
            } catch (error) {
              // Return child with basic data if enrichment fails
              return {
                ...child,
                level: Math.floor((child.points || 0) / 100) + 1,
              };
            }
          })
        );
        setChildrenDetails(enrichedChildren);
      }
    } finally {
      setLoadingDetails(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadFamilyData(), loadChildren()]);
    setRefreshing(false);
  }, []);

  const toggleExpandChild = (childId: string) => {
    setExpandedChild(expandedChild === childId ? null : childId);
  };

  const handleResetCode = async (childEmail: string, childId: string) => {
    Alert.alert("Generate New Code", "Create a new one-time login code for this child?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Generate",
        onPress: async () => {
          setResettingCode(childId);
          try {
            const result = await resetChildPassword(user?.id || "", childEmail);
            if (result.success && result.code) {
              Alert.alert(
                "Code Generated! 🎉",
                `New code: ${result.code}\n\nThis code expires in 1 hour.`
              );
              await loadChildren();
            } else {
              Alert.alert("Error", result.message || "Failed to generate code");
            }
          } catch (error: any) {
            Alert.alert("Error", error.message || "Something went wrong");
          } finally {
            setResettingCode(null);
          }
        },
      },
    ]);
  };

  const handleAddChild = async () => {
    if (!newChildName.trim() || !newChildEmail.trim() || !newChildDOB.trim()) {
      Alert.alert("Missing Info", "Please fill in Name, Email, and Date of Birth");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newChildEmail.trim())) {
      Alert.alert("Invalid Email", "Please enter a valid email address");
      return;
    }

    setIsAddingChild(true);
    try {
      const result = await generateOneTimeCode(
        user?.id || "",
        newChildName.trim(),
        newChildEmail.trim().toLowerCase(),
        newChildDOB.trim(),
        newChildGender.trim() || "other"
      );

      if (result.success && result.code) {
        setGeneratedCode(result.code);
        Alert.alert(
          "Child Registered! 🎉",
          `One-time code for ${newChildName}:\n\n${result.code}\n\nShare this code with your child. It expires in 1 hour.`,
          [
            {
              text: "OK",
              onPress: () => {
                setNewChildName("");
                setNewChildEmail("");
                setNewChildDOB("");
                setNewChildGender("");
                setShowAddChildModal(false);
                loadChildren();
              },
            },
          ]
        );
      } else {
        Alert.alert("Error", result.message || "Failed to register child");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Something went wrong");
    } finally {
      setIsAddingChild(false);
    }
  };

  // Helper functions
  const formatRelativeTime = (dateStr?: string) => {
    if (!dateStr) return "Never";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const calculateAge = (dob?: string) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const getMoodTrend = (history: MoodEntry[] | undefined) => {
    if (!history || history.length < 4) return null;
    const recent = history.slice(0, 3).reduce((sum, m) => sum + (m.moodScore || 0), 0) / 3;
    const older =
      history.slice(3, 6).reduce((sum, m) => sum + (m.moodScore || 0), 0) /
      Math.min(3, history.length - 3);
    if (recent > older + 0.5)
      return { icon: "trending-up" as const, color: "#10B981", text: "Improving" };
    if (recent < older - 0.5)
      return { icon: "trending-down" as const, color: "#EF4444", text: "Declining" };
    return { icon: "remove" as const, color: "#6B7280", text: "Stable" };
  };

  // Mini mood history chart
  const MiniMoodChart = ({ history }: { history: MoodEntry[] | undefined }) => {
    if (!history || history.length === 0) return null;
    return (
      <View style={styles.miniChart}>
        <View style={styles.miniChartBars}>
          {history
            .slice(0, 7)
            .reverse()
            .map((entry, index) => {
              const score = entry.moodScore || 5;
              const height = (score / 10) * 36;
              const color = score >= 7 ? "#10B981" : score >= 5 ? "#F59E0B" : "#EF4444";
              return (
                <View key={index} style={styles.miniChartBarWrap}>
                  <View style={[styles.miniChartBar, { height, backgroundColor: color }]} />
                </View>
              );
            })}
        </View>
        <Text style={styles.miniChartLabel}>Last 7 days</Text>
      </View>
    );
  };

  // Skeleton loader
  const ChildCardSkeleton = () => (
    <View style={styles.childCard}>
      <View style={styles.skeletonRow}>
        <View style={styles.skeletonAvatar} />
        <View style={styles.skeletonText}>
          <View style={[styles.skeletonLine, { width: "60%" }]} />
          <View style={[styles.skeletonLine, { width: "40%", marginTop: 8 }]} />
        </View>
      </View>
      <View style={styles.skeletonStats}>
        <View style={styles.skeletonBox} />
        <View style={styles.skeletonBox} />
        <View style={styles.skeletonBox} />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* Header */}
      <LinearGradient
        colors={["#7C3AED", "#9333EA", "#A855F7"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>👨‍👩‍👧‍👦 My Family</Text>
            <Text style={styles.headerSub}>
              {childrenDetails.length} {childrenDetails.length === 1 ? "child" : "children"} •
              Complete overview
            </Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddChildModal(true)}>
            <Ionicons name="person-add" size={20} color="#7C3AED" />
          </TouchableOpacity>
        </View>

        {/* Family Code */}
        {user?.parent?.familyCode && (
          <View style={styles.codeCard}>
            <Ionicons name="qr-code" size={20} color="#7C3AED" />
            <View style={styles.codeInfo}>
              <Text style={styles.codeLabel}>Family Code</Text>
              <Text style={styles.codeValue} selectable>
                {user.parent.familyCode}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => Alert.alert("Copied!", "Family code copied to clipboard")}
            >
              <Ionicons name="copy-outline" size={18} color="#7C3AED" />
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>

      {/* Main Content */}
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 220 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#7C3AED"]}
            tintColor="#7C3AED"
          />
        }
      >
        {/* Family Photo Card */}
        {familyData && (
          <TouchableOpacity
            style={styles.familyPhotoCard}
            onPress={handleUpdateFamilyPhoto}
            activeOpacity={0.9}
          >
            {familyData.familyPhoto?.url ? (
              <Image
                source={{ uri: familyData.familyPhoto.url }}
                style={styles.familyPhotoImage}
                resizeMode="cover"
              />
            ) : (
              <LinearGradient
                colors={["#E0E7FF", "#C7D2FE"]}
                style={styles.familyPhotoPlaceholder}
              >
                <Ionicons name="people" size={48} color="#6366F1" />
                <Text style={styles.familyPhotoPlaceholderText}>Tap to add family photo</Text>
              </LinearGradient>
            )}
            {uploadingFamilyPhoto && (
              <View style={styles.familyPhotoOverlay}>
                <ActivityIndicator size="large" color="white" />
              </View>
            )}
            <View style={styles.familyPhotoEditBadge}>
              <Ionicons name="camera" size={16} color="white" />
            </View>
            <View style={styles.familyNameOverlay}>
              <Text style={styles.familyNameText}>{familyData.name}</Text>
              <Text style={styles.familyMembersText}>
                {familyData.members?.length || 0} member{(familyData.members?.length || 0) !== 1 ? 's' : ''}
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {loadingDetails ? (
          <View style={styles.loadingWrap}>
            <ChildCardSkeleton />
            <ChildCardSkeleton />
          </View>
        ) : childrenDetails.length === 0 ? (
          // Empty State
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="people-outline" size={64} color="#D1D5DB" />
            </View>
            <Text style={styles.emptyTitle}>No Children Yet</Text>
            <Text style={styles.emptyText}>
              Add your first child to start tracking their wellness journey
            </Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowAddChildModal(true)}>
              <Ionicons name="add-circle" size={22} color="white" />
              <Text style={styles.emptyBtnText}>Add Child</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // Children List
          <View style={styles.list}>
            {childrenDetails.map((child) => {
              const name = child.user?.name || child.name || "Child";
              const email = child.user?.email || child.email || "";
              const age = calculateAge(child.user?.dob);
              const gender = child.user?.gender;
              const zone = child.latestMood?.trustZone || "unknown";
              const zoneStyle = TRUST_ZONE_COLORS[zone] || TRUST_ZONE_COLORS.unknown;
              const isExpanded = expandedChild === child._id;
              const trend = getMoodTrend(child.moodHistory);
              const isActive = child.hasSetPassword;

              return (
                <TouchableOpacity
                  key={child._id}
                  style={[
                    styles.childCard,
                    { borderLeftColor: zoneStyle.border, borderLeftWidth: 4 },
                  ]}
                  onPress={() => toggleExpandChild(child._id)}
                  activeOpacity={0.9}
                >
                  {/* Card Header */}
                  <View style={styles.cardHeader}>
                    <View style={styles.avatarRow}>
                      <View style={[styles.avatar, { backgroundColor: zoneStyle.bg }]}>
                        {child.user?.avatar?.url ? (
                          <Image source={{ uri: child.user.avatar.url }} style={styles.avatarImage} />
                        ) : (
                          <Text style={styles.avatarText}>
                            {child.latestMood?.emoji || name.charAt(0).toUpperCase()}
                          </Text>
                        )}
                      </View>
                      <View style={styles.headerInfo}>
                        <Text style={styles.childName}>{name}</Text>
                        <View style={styles.metaRow}>
                          {age && (
                            <View style={styles.chip}>
                              <Ionicons name="person" size={11} color="#6B7280" />
                              <Text style={styles.chipText}>{age} yrs</Text>
                            </View>
                          )}
                          {gender && (
                            <View style={styles.chip}>
                              <Ionicons
                                name={
                                  gender === "male"
                                    ? "male"
                                    : gender === "female"
                                    ? "female"
                                    : "transgender"
                                }
                                size={11}
                                color="#6B7280"
                              />
                              <Text style={styles.chipText}>{gender}</Text>
                            </View>
                          )}
                          <View
                            style={[
                              styles.statusChip,
                              { backgroundColor: isActive ? "#DCFCE7" : "#FEF3C7" },
                            ]}
                          >
                            <View
                              style={[
                                styles.statusDot,
                                { backgroundColor: isActive ? "#10B981" : "#F59E0B" },
                              ]}
                            />
                            <Text
                              style={[
                                styles.statusText,
                                { color: isActive ? "#166534" : "#92400E" },
                              ]}
                            >
                              {isActive ? "Active" : "Pending"}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                    <Ionicons
                      name={isExpanded ? "chevron-up" : "chevron-down"}
                      size={22}
                      color="#9CA3AF"
                    />
                  </View>

                  {/* Quick Stats Row - ALWAYS VISIBLE */}
                  <View style={styles.statsRow}>
                    <View style={[styles.statCard, { backgroundColor: zoneStyle.bg }]}>
                      <Text style={styles.statEmoji}>{child.latestMood?.emoji || "❓"}</Text>
                      <Text style={[styles.statValue, { color: zoneStyle.text }]}>
                        {child.latestMood?.moodScore ? `${child.latestMood.moodScore}/10` : "N/A"}
                      </Text>
                      <Text style={styles.statLabel}>Mood</Text>
                      {child.latestMood && (
                        <Text style={styles.statTime}>
                          {formatRelativeTime(child.latestMood.createdAt)}
                        </Text>
                      )}
                    </View>
                    <View style={[styles.statCard, { backgroundColor: "#FEF3C7" }]}>
                      <Text style={styles.statEmoji}>⭐</Text>
                      <Text style={[styles.statValue, { color: "#92400E" }]}>
                        {child.points || 0}
                      </Text>
                      <Text style={styles.statLabel}>Points</Text>
                      <Text style={[styles.statTime, { color: "#B45309" }]}>
                        Lvl {child.level || 1}
                      </Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: "#FEE2E2" }]}>
                      <Text style={styles.statEmoji}>🔥</Text>
                      <Text style={[styles.statValue, { color: "#991B1B" }]}>
                        {child.currentStreak || 0}
                      </Text>
                      <Text style={styles.statLabel}>Streak</Text>
                      <Text style={styles.statTime}>days</Text>
                    </View>
                  </View>

                  {/* Mood Section - ALWAYS VISIBLE */}
                  {child.latestMood && (
                    <View style={styles.section}>
                      <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>😊 Current Mood</Text>
                        {trend && (
                          <View style={[styles.trendBadge, { backgroundColor: trend.color + "20" }]}>
                            <Ionicons name={trend.icon} size={14} color={trend.color} />
                            <Text style={[styles.trendText, { color: trend.color }]}>
                              {trend.text}
                            </Text>
                          </View>
                        )}
                      </View>
                      <View
                        style={[
                          styles.moodBox,
                          { backgroundColor: zoneStyle.bg, borderColor: zoneStyle.border },
                        ]}
                      >
                        <Text style={styles.moodEmoji}>{child.latestMood.emoji}</Text>
                        <View style={styles.moodInfo}>
                          <Text style={[styles.moodZone, { color: zoneStyle.text }]}>
                            {zoneStyle.label} ({zone.charAt(0).toUpperCase() + zone.slice(1)} Zone)
                          </Text>
                          <Text style={styles.moodScore}>
                            Score: {child.latestMood.moodScore}/10
                          </Text>
                          {child.latestMood.textNote && (
                            <Text style={styles.moodNote} numberOfLines={2}>
                              "{child.latestMood.textNote}"
                            </Text>
                          )}
                        </View>
                      </View>
                      {/* Mini Mood Chart */}
                      <MiniMoodChart history={child.moodHistory} />
                      {/* Weekly Average */}
                      {child.weeklyMoodAverage !== undefined && (
                        <View style={styles.avgRow}>
                          <Text style={styles.avgLabel}>Weekly Average:</Text>
                          <Text style={styles.avgValue}>{child.weeklyMoodAverage}/10</Text>
                          <Text style={styles.avgCount}>({child.moodCheckinCount} check-ins)</Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* No Mood Data Message */}
                  {!child.latestMood && (
                    <View style={styles.noMoodSection}>
                      <Ionicons name="heart-outline" size={24} color="#D1D5DB" />
                      <Text style={styles.noMoodText}>No mood check-ins yet</Text>
                    </View>
                  )}

                  {/* Journals Preview - ALWAYS VISIBLE */}
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>📔 Recent Journals</Text>
                      <Text style={styles.sectionCount}>{child.totalJournals || 0} total</Text>
                    </View>
                    {child.recentJournals && child.recentJournals.length > 0 ? (
                      <View style={styles.journalList}>
                        {child.recentJournals.map((journal, idx) => (
                          <View key={journal._id || idx} style={styles.journalItem}>
                            <View style={styles.journalHeader}>
                              <Text style={styles.journalTitle} numberOfLines={1}>
                                {journal.title || "Untitled"}
                              </Text>
                              <Text style={styles.journalDate}>
                                {formatRelativeTime(journal.createdAt)}
                              </Text>
                            </View>
                            <Text style={styles.journalPreview} numberOfLines={2}>
                              {journal.content || "No content"}
                            </Text>
                            {journal.mood && (
                              <Text style={styles.journalMood}>Mood: {journal.mood}</Text>
                            )}
                          </View>
                        ))}
                      </View>
                    ) : (
                      <View style={styles.noData}>
                        <Ionicons name="document-text-outline" size={24} color="#D1D5DB" />
                        <Text style={styles.noDataText}>No journals yet</Text>
                      </View>
                    )}
                  </View>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <View style={styles.expandedSection}>
                      {/* Activity & Progress */}
                      <View style={styles.section}>
                        <Text style={styles.sectionTitle}>📊 Progress Overview</Text>
                        <View style={styles.activityGrid}>
                          <View style={styles.activityItem}>
                            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                            <Text style={styles.activityValue}>
                              {child.completedActivities || 0}
                            </Text>
                            <Text style={styles.activityLabel}>Activities</Text>
                          </View>
                          <View style={styles.activityItem}>
                            <Ionicons name="trophy" size={24} color="#F59E0B" />
                            <Text style={styles.activityValue}>{child.level || 1}</Text>
                            <Text style={styles.activityLabel}>Level</Text>
                          </View>
                          <View style={styles.activityItem}>
                            <Ionicons name="ribbon" size={24} color="#8B5CF6" />
                            <Text style={styles.activityValue}>{child.badges?.length || 0}</Text>
                            <Text style={styles.activityLabel}>Badges</Text>
                          </View>
                        </View>
                      </View>

                      {/* Contact Info */}
                      <View style={styles.section}>
                        <Text style={styles.sectionTitle}>📧 Contact Details</Text>
                        <View style={styles.contactBox}>
                          <View style={styles.contactRow}>
                            <Ionicons name="mail-outline" size={16} color="#6B7280" />
                            <Text style={styles.contactText}>{email}</Text>
                          </View>
                          {child.user?.dob && (
                            <View style={styles.contactRow}>
                              <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                              <Text style={styles.contactText}>
                                Born: {new Date(child.user.dob).toLocaleDateString()}
                              </Text>
                            </View>
                          )}
                          {child.lastLogin && (
                            <View style={styles.contactRow}>
                              <Ionicons name="time-outline" size={16} color="#6B7280" />
                              <Text style={styles.contactText}>
                                Last login: {formatRelativeTime(child.lastLogin)}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>

                      {/* Actions */}
                      <View style={styles.actionRow}>
                        {!child.hasSetPassword && (
                          <TouchableOpacity
                            style={styles.actionBtn}
                            onPress={() => handleResetCode(email, child._id)}
                            disabled={resettingCode === child._id}
                          >
                            {resettingCode === child._id ? (
                              <ActivityIndicator size="small" color="#7C3AED" />
                            ) : (
                              <>
                                <Ionicons name="key-outline" size={18} color="#7C3AED" />
                                <Text style={styles.actionBtnText}>Get Code</Text>
                              </>
                            )}
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.dangerBtn]}
                          onPress={() =>
                            Alert.alert("Remove Child", "Are you sure you want to remove this child?", [
                              { text: "Cancel", style: "cancel" },
                              {
                                text: "Remove",
                                style: "destructive",
                                onPress: () => Alert.alert("Coming Soon", "This feature will be available soon"),
                              },
                            ])
                          }
                        >
                          <Ionicons name="trash-outline" size={18} color="#EF4444" />
                          <Text style={[styles.actionBtnText, { color: "#EF4444" }]}>Remove</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {/* Expand Hint */}
                  <View style={styles.expandHint}>
                    <Text style={styles.expandHintText}>
                      {isExpanded ? "Tap to collapse" : "Tap for more details"}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Trust Zone Guide */}
        {childrenDetails.length > 0 && (
          <View style={styles.guide}>
            <Text style={styles.guideTitle}>💡 Understanding Trust Zones</Text>
            <View style={styles.zoneRow}>
              {Object.entries(TRUST_ZONE_COLORS)
                .filter(([k]) => k !== "unknown")
                .map(([zone, cfg]) => (
                  <View key={zone} style={[styles.zoneItem, { backgroundColor: cfg.bg }]}>
                    <Text style={styles.zoneEmoji}>{cfg.emoji}</Text>
                    <Text style={[styles.zoneName, { color: cfg.text }]}>
                      {zone.charAt(0).toUpperCase() + zone.slice(1)}
                    </Text>
                  </View>
                ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Add Child Modal */}
      <Modal
        visible={showAddChildModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddChildModal(false)}
      >
        <SafeAreaView style={styles.modalWrap}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Child</Text>
            <TouchableOpacity onPress={() => setShowAddChildModal(false)}>
              <Ionicons name="close-circle" size={32} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <Text style={styles.formDesc}>
              Register a new child to your family. They will receive a one-time code to complete
              their account setup.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Child's Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter full name"
                value={newChildName}
                onChangeText={setNewChildName}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Child's Email *</Text>
              <TextInput
                style={styles.input}
                placeholder="child@email.com"
                value={newChildEmail}
                onChangeText={setNewChildEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Date of Birth *</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                value={newChildDOB}
                onChangeText={setNewChildDOB}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Gender (Optional)</Text>
              <View style={styles.genderRow}>
                {["Male", "Female", "Other"].map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[
                      styles.genderBtn,
                      newChildGender.toLowerCase() === g.toLowerCase() && styles.genderBtnActive,
                    ]}
                    onPress={() => setNewChildGender(g.toLowerCase())}
                  >
                    <Text
                      style={[
                        styles.genderBtnText,
                        newChildGender.toLowerCase() === g.toLowerCase() &&
                          styles.genderBtnTextActive,
                      ]}
                    >
                      {g}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, isAddingChild && styles.submitBtnDisabled]}
              onPress={handleAddChild}
              disabled={isAddingChild}
            >
              {isAddingChild ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="person-add" size={20} color="white" />
                  <Text style={styles.submitBtnText}>Register Child</Text>
                </>
              )}
            </TouchableOpacity>

            {generatedCode && (
              <View style={styles.codeResult}>
                <Text style={styles.codeResultLabel}>Generated Code:</Text>
                <Text style={styles.codeResultValue} selectable>
                  {generatedCode}
                </Text>
                <Text style={styles.codeResultHint}>Share this code with your child</Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#7C3AED",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "white",
  },
  headerSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },
  codeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  codeInfo: {
    flex: 1,
  },
  codeLabel: {
    fontSize: 11,
    color: "#6B7280",
  },
  codeValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1F2937",
    letterSpacing: 1,
  },
  // Family Photo Card styles
  familyPhotoCard: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#E5E7EB",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: "relative",
  },
  familyPhotoImage: {
    width: "100%",
    height: 180,
  },
  familyPhotoPlaceholder: {
    width: "100%",
    height: 180,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  familyPhotoPlaceholderText: {
    fontSize: 14,
    color: "#6366F1",
    fontWeight: "500",
  },
  familyPhotoOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  familyPhotoEditBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  familyNameOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  familyNameText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  familyMembersText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    marginTop: 2,
  },
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  loadingWrap: {
    padding: 16,
    gap: 16,
  },
  list: {
    paddingBottom: 16,
  },
  childCard: {
    backgroundColor: "white",
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarText: {
    fontSize: 22,
  },
  headerInfo: {
    marginLeft: 12,
    flex: 1,
  },
  childName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 3,
  },
  chipText: {
    fontSize: 11,
    color: "#6B7280",
    textTransform: "capitalize",
  },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    padding: 10,
    borderRadius: 12,
  },
  statEmoji: {
    fontSize: 22,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 10,
    color: "#6B7280",
    marginTop: 1,
  },
  statTime: {
    fontSize: 9,
    color: "#9CA3AF",
    marginTop: 1,
  },
  section: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
  },
  sectionCount: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  trendBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  trendText: {
    fontSize: 11,
    fontWeight: "600",
  },
  moodBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  moodEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  moodInfo: {
    flex: 1,
  },
  moodZone: {
    fontSize: 14,
    fontWeight: "700",
  },
  moodScore: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  moodNote: {
    fontSize: 11,
    color: "#6B7280",
    fontStyle: "italic",
    marginTop: 4,
  },
  miniChart: {
    alignItems: "center",
    marginTop: 12,
  },
  miniChartBars: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 44,
    gap: 5,
  },
  miniChartBarWrap: {
    width: 22,
    height: 44,
    justifyContent: "flex-end",
    backgroundColor: "#F3F4F6",
    borderRadius: 4,
  },
  miniChartBar: {
    width: "100%",
    borderRadius: 4,
  },
  miniChartLabel: {
    fontSize: 10,
    color: "#9CA3AF",
    marginTop: 5,
  },
  avgRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#F9FAFB",
    padding: 8,
    borderRadius: 8,
    marginTop: 10,
  },
  avgLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  avgValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1F2937",
  },
  avgCount: {
    fontSize: 10,
    color: "#9CA3AF",
  },
  noMoodSection: {
    alignItems: "center",
    padding: 20,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    marginTop: 14,
  },
  noMoodText: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 6,
  },
  journalList: {
    gap: 10,
  },
  journalItem: {
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: "#8B5CF6",
  },
  journalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  journalTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1F2937",
    flex: 1,
  },
  journalDate: {
    fontSize: 10,
    color: "#9CA3AF",
    marginLeft: 8,
  },
  journalPreview: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 17,
  },
  journalMood: {
    fontSize: 10,
    color: "#8B5CF6",
    fontWeight: "500",
    marginTop: 6,
  },
  noData: {
    alignItems: "center",
    padding: 20,
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
  },
  noDataText: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 6,
  },
  expandedSection: {
    marginTop: 10,
  },
  activityGrid: {
    flexDirection: "row",
    marginTop: 10,
    gap: 10,
  },
  activityItem: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    padding: 14,
    borderRadius: 12,
  },
  activityValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginTop: 6,
  },
  activityLabel: {
    fontSize: 10,
    color: "#6B7280",
    marginTop: 3,
  },
  contactBox: {
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 5,
  },
  contactText: {
    fontSize: 12,
    color: "#374151",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: "#EDE9FE",
    gap: 6,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#7C3AED",
  },
  dangerBtn: {
    backgroundColor: "#FEE2E2",
  },
  expandHint: {
    alignItems: "center",
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  expandHintText: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#7C3AED",
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  emptyBtnText: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },
  guide: {
    margin: 16,
    padding: 16,
    backgroundColor: "white",
    borderRadius: 16,
  },
  guideTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 10,
  },
  zoneRow: {
    flexDirection: "row",
    gap: 8,
  },
  zoneItem: {
    flex: 1,
    alignItems: "center",
    padding: 10,
    borderRadius: 10,
  },
  zoneEmoji: {
    fontSize: 16,
    marginBottom: 3,
  },
  zoneName: {
    fontSize: 10,
    fontWeight: "600",
  },
  // Skeleton
  skeletonRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  skeletonAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#E5E7EB",
  },
  skeletonText: {
    flex: 1,
    marginLeft: 12,
  },
  skeletonLine: {
    height: 14,
    borderRadius: 7,
    backgroundColor: "#E5E7EB",
  },
  skeletonStats: {
    flexDirection: "row",
    marginTop: 14,
    gap: 10,
  },
  skeletonBox: {
    flex: 1,
    height: 80,
    borderRadius: 12,
    backgroundColor: "#E5E7EB",
  },
  // Modal
  modalWrap: {
    flex: 1,
    backgroundColor: "white",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
  },
  modalBody: {
    flex: 1,
    padding: 20,
  },
  formDesc: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 19,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#1F2937",
  },
  genderRow: {
    flexDirection: "row",
    gap: 10,
  },
  genderBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
  },
  genderBtnActive: {
    borderColor: "#7C3AED",
    backgroundColor: "#EDE9FE",
  },
  genderBtnText: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },
  genderBtnTextActive: {
    color: "#7C3AED",
    fontWeight: "600",
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#7C3AED",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "white",
  },
  codeResult: {
    backgroundColor: "#DCFCE7",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
  },
  codeResultLabel: {
    fontSize: 12,
    color: "#166534",
    marginBottom: 4,
  },
  codeResultValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#166534",
    letterSpacing: 3,
  },
  codeResultHint: {
    fontSize: 11,
    color: "#166534",
    marginTop: 6,
  },
});
