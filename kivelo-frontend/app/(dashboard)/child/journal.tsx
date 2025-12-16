// app/(dashboard)/child/journal.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Image,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  SlideInRight,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { useJournal, JournalEntry } from "../../../context/JournalContext";
import { showAlert } from "@/utils/showAlert";
import * as ImagePicker from "expo-image-picker";
import DrawingModal from "@/components/DrawingModal";

const { width: screenWidth } = Dimensions.get("window");

const MOOD_EMOJIS: Record<string, { emoji: string; color: string; label: string }> = {
  happy: { emoji: "😊", color: "#FFD93D", label: "Happy" },
  excited: { emoji: "🤩", color: "#FF6B6B", label: "Excited" },
  calm: { emoji: "😌", color: "#4ECDC4", label: "Calm" },
  neutral: { emoji: "😐", color: "#95A5A6", label: "Neutral" },
  tired: { emoji: "😴", color: "#9B59B6", label: "Tired" },
  sad: { emoji: "😢", color: "#3498DB", label: "Sad" },
  anxious: { emoji: "😰", color: "#E67E22", label: "Anxious" },
  angry: { emoji: "😤", color: "#E74C3C", label: "Angry" },
};

const CONTENT_TYPES = [
  { id: "text", icon: "create-outline", label: "Write", color: "#667EEA" },
  { id: "drawing", icon: "color-palette-outline", label: "Draw", color: "#F472B6" },
  { id: "photo", icon: "camera-outline", label: "Photo", color: "#10B981" },
  { id: "voice", icon: "mic-outline", label: "Voice", color: "#F59E0B" },
  { id: "video", icon: "videocam-outline", label: "Video", color: "#EF4444" },
];

const SHARE_OPTIONS = [
  { id: "private", icon: "lock-closed", label: "Only Me", color: "#8B5CF6", desc: "Keep it secret 🤫" },
  { id: "parent-only", icon: "people", label: "Parents", color: "#10B981", desc: "Mom & Dad can see" },
  { id: "family", icon: "home", label: "Family", color: "#3B82F6", desc: "Everyone at home" },
];

const JOURNAL_PROMPTS = [
  "What made you smile today? 😊",
  "What's something new you learned?",
  "Who made your day special?",
  "What are you grateful for today?",
  "What's your favorite memory from today?",
  "What challenge did you overcome?",
  "What's something kind you did?",
  "What are you looking forward to?",
  "Draw how your day felt!",
  "What would you tell your best friend about today?",
];

// Journal Entry Card Component
const JournalCard = ({ 
  entry, 
  onPress, 
  onDelete,
  index 
}: { 
  entry: JournalEntry; 
  onPress: () => void;
  onDelete: () => void;
  index: number;
}) => {
  const moodData = MOOD_EMOJIS[entry.mood] || MOOD_EMOJIS.neutral;
  const date = new Date(entry.createdAt);
  const formattedDate = date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const formattedTime = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  const shareOption = SHARE_OPTIONS.find(opt => opt.id === entry.visibility) || SHARE_OPTIONS[0];
  const hasMedia = entry.assets && entry.assets.length > 0;
  const contentType = CONTENT_TYPES.find(ct => ct.id === entry.type) || CONTENT_TYPES[0];

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 100).springify()}
    >
      <TouchableOpacity
        style={styles.journalCard}
        onPress={onPress}
        activeOpacity={0.9}
      >
        {/* Media Preview */}
        {hasMedia && entry.assets?.[0] && (
          <View style={styles.mediaPreview}>
            <Image 
              source={{ uri: entry.assets[0] }} 
              style={styles.mediaImage}
              resizeMode="cover"
            />
            {entry.assets.length > 1 && (
              <View style={styles.mediaCount}>
                <Text style={styles.mediaCountText}>+{entry.assets.length - 1}</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.cardHeader}>
          <View style={styles.cardDateContainer}>
            <Text style={styles.cardDate}>{formattedDate}</Text>
            <Text style={styles.cardTime}>{formattedTime}</Text>
          </View>
          <View style={styles.cardBadges}>
            {/* Content type badge */}
            <View style={[styles.typeBadge, { backgroundColor: contentType.color + "20" }]}>
              <Ionicons name={contentType.icon as any} size={12} color={contentType.color} />
            </View>
            {/* Mood badge */}
            <View style={[styles.moodBadge, { backgroundColor: moodData.color + "20" }]}>
              <Text style={styles.moodEmoji}>{moodData.emoji}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.cardTitle} numberOfLines={1}>
          {entry.title || "Untitled Entry"}
        </Text>
        
        {entry.content && (
          <Text style={styles.cardContent} numberOfLines={2}>
            {entry.content}
          </Text>
        )}

        <View style={styles.cardFooter}>
          <View style={styles.shareIndicator}>
            <Ionicons name={shareOption.icon as any} size={14} color={shareOption.color} />
            <Text style={[styles.shareText, { color: shareOption.color }]}>{shareOption.label}</Text>
          </View>
          <View style={styles.cardMeta}>
            {entry.wordCount && entry.wordCount > 0 && (
              <Text style={styles.metaText}>{entry.wordCount} words</Text>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Ionicons name="trash-outline" size={18} color="#EF4444" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Create/Edit Journal Modal
const JournalModal = ({
  visible,
  onClose,
  onSave,
  initialEntry,
  isLoading,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (data: { 
    title: string; 
    content: string; 
    mood: string; 
    visibility: string; 
    tags: string[];
    type: string;
    assets?: string[];
  }) => void;
  initialEntry?: JournalEntry | null;
  isLoading: boolean;
}) => {
  const [title, setTitle] = useState(initialEntry?.title || "");
  const [content, setContent] = useState(initialEntry?.content || "");
  const [selectedMood, setSelectedMood] = useState(initialEntry?.mood || "neutral");
  const [selectedType, setSelectedType] = useState(initialEntry?.type || "text");
  const [selectedShare, setSelectedShare] = useState(initialEntry?.visibility || "parent-only");
  const [attachedImages, setAttachedImages] = useState<string[]>(initialEntry?.assets || []);
  const [currentPrompt, setCurrentPrompt] = useState(
    JOURNAL_PROMPTS[Math.floor(Math.random() * JOURNAL_PROMPTS.length)]
  );
  const [activeSection, setActiveSection] = useState<"write" | "mood" | "share">("write");
  const [showDrawingModal, setShowDrawingModal] = useState(false);

  useEffect(() => {
    if (visible && !initialEntry) {
      setTitle("");
      setContent("");
      setSelectedMood("neutral");
      setSelectedType("text");
      setSelectedShare("parent-only");
      setAttachedImages([]);
      setActiveSection("write");
      setCurrentPrompt(JOURNAL_PROMPTS[Math.floor(Math.random() * JOURNAL_PROMPTS.length)]);
    } else if (initialEntry) {
      setTitle(initialEntry.title);
      setContent(initialEntry.content);
      setSelectedMood(initialEntry.mood);
      setSelectedType(initialEntry.type);
      setSelectedShare(initialEntry.visibility);
      setAttachedImages(initialEntry.assets || []);
    }
  }, [visible, initialEntry]);

  const handleSave = () => {
    if (selectedType === "text" && !content.trim()) {
      showAlert("Oops!", "Please write something in your journal entry");
      return;
    }
    if (selectedType !== "text" && attachedImages.length === 0 && !content.trim()) {
      showAlert("Oops!", "Please add some content to your journal entry");
      return;
    }

    onSave({
      title: title.trim() || "My Journal Entry",
      content: content.trim(),
      mood: selectedMood,
      visibility: selectedShare,
      tags: [],
      type: selectedType,
      assets: attachedImages,
    });
  };

  const shufflePrompt = () => {
    let newPrompt;
    do {
      newPrompt = JOURNAL_PROMPTS[Math.floor(Math.random() * JOURNAL_PROMPTS.length)];
    } while (newPrompt === currentPrompt);
    setCurrentPrompt(newPrompt);
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        showAlert("Permission Needed", "Please allow access to your photos to add images");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 5,
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets.map(asset => asset.uri);
        setAttachedImages(prev => [...prev, ...newImages].slice(0, 5));
      }
    } catch (error) {
      showAlert("Error", "Failed to pick image");
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        showAlert("Permission Needed", "Please allow camera access to take photos");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]) {
        setAttachedImages(prev => [...prev, result.assets[0].uri].slice(0, 5));
      }
    } catch (error) {
      showAlert("Error", "Failed to take photo");
    }
  };

  const removeImage = (index: number) => {
    setAttachedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleDrawingSave = (imageData: string) => {
    setAttachedImages(prev => [...prev, imageData].slice(0, 5));
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalContainer}
      >
        {/* Header */}
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            {initialEntry ? "Edit Entry" : "New Entry ✨"}
          </Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={isLoading}
            style={[
              styles.modalSaveButton,
              isLoading && styles.modalSaveButtonDisabled,
            ]}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.modalSaveText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.modalScroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Content Type Selector */}
          <View style={styles.typeSelectorContainer}>
            <Text style={styles.sectionTitle}>What do you want to add?</Text>
            <View style={styles.typeSelector}>
              {CONTENT_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.typeOption,
                    selectedType === type.id && { 
                      backgroundColor: type.color + "20",
                      borderColor: type.color,
                    }
                  ]}
                  onPress={() => setSelectedType(type.id)}
                >
                  <Ionicons 
                    name={type.icon as any} 
                    size={22} 
                    color={selectedType === type.id ? type.color : "#9CA3AF"} 
                  />
                  <Text style={[
                    styles.typeLabel,
                    selectedType === type.id && { color: type.color }
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Prompt Card */}
          <TouchableOpacity
            style={styles.promptCard}
            onPress={shufflePrompt}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#667EEA", "#764BA2"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.promptGradient}
            >
              <View style={styles.promptContent}>
                <Ionicons name="bulb" size={20} color="#FFD93D" />
                <Text style={styles.promptText}>{currentPrompt}</Text>
              </View>
              <View style={styles.promptHint}>
                <Ionicons name="refresh" size={14} color="rgba(255,255,255,0.7)" />
                <Text style={styles.promptHintText}>Tap for new idea</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Title Input */}
          <TextInput
            style={styles.titleInput}
            placeholder="Give your entry a title..."
            placeholderTextColor="#9CA3AF"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />

          {/* Content Input */}
          <TextInput
            style={styles.contentInput}
            placeholder={
              selectedType === "text" 
                ? "Write your thoughts here..." 
                : "Add a caption or description..."
            }
            placeholderTextColor="#9CA3AF"
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
          />

          {/* Media Buttons for non-text types */}
          {selectedType !== "text" && (
            <View style={styles.mediaActions}>
              <TouchableOpacity style={styles.mediaButton} onPress={pickImage}>
                <LinearGradient
                  colors={["#10B981", "#059669"]}
                  style={styles.mediaButtonGradient}
                >
                  <Ionicons name="images" size={24} color="#fff" />
                  <Text style={styles.mediaButtonText}>Gallery</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={styles.mediaButton} onPress={takePhoto}>
                <LinearGradient
                  colors={["#3B82F6", "#2563EB"]}
                  style={styles.mediaButtonGradient}
                >
                  <Ionicons name="camera" size={24} color="#fff" />
                  <Text style={styles.mediaButtonText}>Camera</Text>
                </LinearGradient>
              </TouchableOpacity>
              {selectedType === "drawing" && (
                <TouchableOpacity 
                  style={styles.mediaButton}
                  onPress={() => setShowDrawingModal(true)}
                >
                  <LinearGradient
                    colors={["#F472B6", "#EC4899"]}
                    style={styles.mediaButtonGradient}
                  >
                    <Ionicons name="brush" size={24} color="#fff" />
                    <Text style={styles.mediaButtonText}>Draw</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Attached Images Preview */}
          {attachedImages.length > 0 && (
            <View style={styles.attachedImages}>
              <Text style={styles.sectionTitle}>Attached ({attachedImages.length}/5)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {attachedImages.map((uri, index) => (
                  <View key={index} style={styles.attachedImageContainer}>
                    <Image source={{ uri }} style={styles.attachedImage} />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => removeImage(index)}
                    >
                      <Ionicons name="close-circle" size={24} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Mood Selector */}
          <View style={styles.moodSelectorContainer}>
            <Text style={styles.sectionTitle}>How are you feeling?</Text>
            <View style={styles.moodSelector}>
              {Object.entries(MOOD_EMOJIS).map(([key, value]) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.moodOption,
                    selectedMood === key && {
                      backgroundColor: value.color + "30",
                      borderColor: value.color,
                    },
                  ]}
                  onPress={() => setSelectedMood(key)}
                >
                  <Text style={styles.moodOptionEmoji}>{value.emoji}</Text>
                  <Text style={[
                    styles.moodLabel,
                    selectedMood === key && { color: value.color }
                  ]}>
                    {value.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Share Options */}
          <View style={styles.shareOptionsContainer}>
            <Text style={styles.sectionTitle}>Who can see this?</Text>
            <View style={styles.shareOptions}>
              {SHARE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.shareOption,
                    selectedShare === option.id && {
                      backgroundColor: option.color + "15",
                      borderColor: option.color,
                    }
                  ]}
                  onPress={() => setSelectedShare(option.id)}
                >
                  <View style={[
                    styles.shareIconContainer,
                    { backgroundColor: option.color + "20" }
                  ]}>
                    <Ionicons 
                      name={option.icon as any} 
                      size={20} 
                      color={selectedShare === option.id ? option.color : "#9CA3AF"} 
                    />
                  </View>
                  <View style={styles.shareOptionText}>
                    <Text style={[
                      styles.shareLabel,
                      selectedShare === option.id && { color: option.color, fontWeight: "600" }
                    ]}>
                      {option.label}
                    </Text>
                    <Text style={styles.shareDesc}>{option.desc}</Text>
                  </View>
                  {selectedShare === option.id && (
                    <Ionicons name="checkmark-circle" size={22} color={option.color} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Drawing Modal */}
      <DrawingModal
        visible={showDrawingModal}
        onClose={() => setShowDrawingModal(false)}
        onSave={handleDrawingSave}
      />
    </Modal>
  );
};

// Empty State Component
const EmptyState = ({ onCreateFirst }: { onCreateFirst: () => void }) => (
  <Animated.View
    entering={FadeIn.delay(200)}
    style={styles.emptyContainer}
  >
    <View style={styles.emptyIconContainer}>
      <LinearGradient
        colors={["#667EEA", "#764BA2"]}
        style={styles.emptyIconGradient}
      >
        <Ionicons name="book" size={48} color="#fff" />
      </LinearGradient>
    </View>
    <Text style={styles.emptyTitle}>Start Your Journal</Text>
    <Text style={styles.emptySubtitle}>
      Write about your day, feelings, and adventures!
    </Text>
    <TouchableOpacity style={styles.emptyButton} onPress={onCreateFirst}>
      <LinearGradient
        colors={["#667EEA", "#764BA2"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.emptyButtonGradient}
      >
        <Ionicons name="add" size={20} color="#fff" />
        <Text style={styles.emptyButtonText}>Write First Entry</Text>
      </LinearGradient>
    </TouchableOpacity>
  </Animated.View>
);

// Main Journal Screen
export default function ChildJournal() {
  const {
    journals,
    isLoading,
    createJournal,
    getMyJournals,
    updateJournal,
    deleteJournal,
    refreshJournals,
  } = useJournal();

  const [showModal, setShowModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Load journals on mount
  useEffect(() => {
    getMyJournals();
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshJournals();
    setRefreshing(false);
  }, [refreshJournals]);

  const handleCreateOrUpdate = async (data: {
    title: string;
    content: string;
    mood: string;
    visibility: string;
    tags: string[];
    type: string;
    assets?: string[];
  }) => {
    let result;

    if (selectedEntry) {
      result = await updateJournal(selectedEntry._id, data);
    } else {
      result = await createJournal(data);
    }

    if (result.success) {
      setShowModal(false);
      setSelectedEntry(null);
      
      if (!selectedEntry && result.pointsEarned) {
        showAlert("Journal Saved! 🎉", `Great job! You earned ${result.pointsEarned} points!`);
      } else {
        showAlert("Success!", selectedEntry ? "Entry updated!" : "Entry saved!");
      }
    } else {
      showAlert("Oops!", result.message || "Failed to save journal");
    }
  };

  const handleDelete = (entry: JournalEntry) => {
    showAlert(
      "Delete Entry?",
      "Are you sure you want to delete this journal entry? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const result = await deleteJournal(entry._id);
            if (result.success) {
              showAlert("Deleted", "Journal entry removed");
            } else {
              showAlert("Error", result.message || "Failed to delete");
            }
          },
        },
      ]
    );
  };

  const handleEditEntry = (entry: JournalEntry) => {
    setSelectedEntry(entry);
    setShowModal(true);
  };

  const handleNewEntry = () => {
    setSelectedEntry(null);
    setShowModal(true);
  };

  return (
    <View style={styles.container}>
      {/* Header Stats */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.statsCard}>
        <LinearGradient
          colors={["#667EEA", "#764BA2"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.statsGradient}
        >
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{journals.length}</Text>
            <Text style={styles.statLabel}>Entries</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {journals.reduce((acc, j) => acc + (j.wordCount || 0), 0)}
            </Text>
            <Text style={styles.statLabel}>Words</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>🔥</Text>
            <Text style={styles.statLabel}>Keep Going!</Text>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Journal List */}
      {isLoading && journals.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667EEA" />
          <Text style={styles.loadingText}>Loading your journals...</Text>
        </View>
      ) : journals.length === 0 ? (
        <EmptyState onCreateFirst={handleNewEntry} />
      ) : (
        <FlatList
          data={journals}
          keyExtractor={(item) => item._id}
          renderItem={({ item, index }) => (
            <JournalCard
              entry={item}
              index={index}
              onPress={() => handleEditEntry(item)}
              onDelete={() => handleDelete(item)}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={["#667EEA"]}
              tintColor="#667EEA"
            />
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleNewEntry}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={["#667EEA", "#764BA2"]}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Create/Edit Modal */}
      <JournalModal
        visible={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedEntry(null);
        }}
        onSave={handleCreateOrUpdate}
        initialEntry={selectedEntry}
        isLoading={isLoading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  statsCard: {
    margin: 16,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#667EEA",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  statsGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  statLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#6B7280",
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  journalCard: {
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
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardDateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardDate: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },
  cardTime: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  moodBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  moodEmoji: {
    fontSize: 18,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 6,
  },
  cardContent: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  tagsContainer: {
    flexDirection: "row",
    gap: 6,
  },
  tag: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 11,
    color: "#6366F1",
    fontWeight: "500",
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  deleteButton: {
    position: "absolute",
    top: 12,
    right: 48,
    padding: 4,
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    borderRadius: 28,
    shadowColor: "#667EEA",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    marginBottom: 24,
  },
  emptyIconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
  },
  emptyButton: {
    borderRadius: 14,
    overflow: "hidden",
  },
  emptyButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
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
  modalCloseButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
  },
  modalSaveButton: {
    backgroundColor: "#667EEA",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modalSaveButtonDisabled: {
    backgroundColor: "#D1D5DB",
  },
  modalSaveText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  promptCard: {
    margin: 16,
    borderRadius: 12,
    overflow: "hidden",
  },
  promptGradient: {
    padding: 16,
  },
  promptContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  promptText: {
    flex: 1,
    fontSize: 15,
    color: "#fff",
    fontWeight: "500",
  },
  promptHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
  },
  promptHintText: {
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
  },
  titleInput: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1F2937",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  contentInput: {
    flex: 1,
    fontSize: 16,
    color: "#374151",
    paddingHorizontal: 16,
    paddingVertical: 16,
    lineHeight: 24,
  },
  moodSelectorContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 10,
  },
  moodSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  moodOption: {
    alignItems: "center",
    padding: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    minWidth: 60,
  },
  moodOptionEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  moodLabel: {
    fontSize: 10,
    color: "#9CA3AF",
    textTransform: "capitalize",
  },
  // Type Selector
  typeSelectorContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  typeSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  typeOption: {
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    width: screenWidth / 5 - 18,
  },
  typeLabel: {
    fontSize: 10,
    color: "#9CA3AF",
    marginTop: 4,
  },
  // Share Options
  shareOptionsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  shareOptions: {
    gap: 10,
  },
  shareOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    backgroundColor: "#FAFAFA",
  },
  shareIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  shareOptionText: {
    flex: 1,
  },
  shareLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  shareDesc: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
  },
  // Media Buttons
  mediaActions: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  mediaButton: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  mediaButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
  },
  mediaButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  // Attached Images
  attachedImages: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  attachedImageContainer: {
    marginRight: 12,
    position: "relative",
  },
  attachedImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  removeImageButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#fff",
    borderRadius: 12,
  },
  // Modal Scroll
  modalScroll: {
    flex: 1,
  },
  // Card Media Preview
  cardMediaPreview: {
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  cardMediaImage: {
    width: "100%",
    height: 150,
    borderRadius: 12,
  },
  mediaCountBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  mediaCountText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  // Card Badges
  cardBadges: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: "500",
  },
  shareBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  shareBadgeText: {
    fontSize: 11,
    color: "#6B7280",
  },
  privacyToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  privacyLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  privacyLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
  },
  privacyHint: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  privacySwitch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  privacySwitchActive: {
    backgroundColor: "#8B5CF6",
  },
  privacySwitchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  privacySwitchThumbActive: {
    alignSelf: "flex-end",
  },
});
