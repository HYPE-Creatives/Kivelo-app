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
  StatusBar,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
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
import { SvgXml } from "react-native-svg";
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
} as const;

const CONTENT_TYPES = [
  { id: "text" as const, icon: "create-outline", label: "Write", color: "#667EEA" },
  { id: "drawing" as const, icon: "color-palette-outline", label: "Draw", color: "#F472B6" },
  { id: "mixed" as const, icon: "camera-outline", label: "Photo", color: "#10B981" },
  { id: "audio" as const, icon: "mic-outline", label: "Voice", color: "#F59E0B" },
  { id: "video" as const, icon: "videocam-outline", label: "Video", color: "#EF4444" },
];

const SHARE_OPTIONS = [
  { id: "private" as const, icon: "lock-closed", label: "Only Me", color: "#8B5CF6", desc: "Keep it secret 🤫" },
  { id: "parent-only" as const, icon: "people", label: "Parents", color: "#10B981", desc: "Mom & Dad can see" },
  { id: "public" as const, icon: "home", label: "Family", color: "#3B82F6", desc: "Everyone at home" },
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

// Helper to check if URI is an SVG drawing
const isDrawingUri = (uri: string) => uri?.startsWith('data:image/svg') ?? false;

// Helper to extract SVG content from data URI
const getSvgContent = (uri: string): string | null => {
  if (!isDrawingUri(uri)) return null;
  try {
    if (uri.includes('charset=utf-8,')) {
      const encoded = uri.split('charset=utf-8,')[1];
      return decodeURIComponent(encoded);
    }
    if (uri.includes('base64,')) {
      const base64 = uri.split('base64,')[1];
      return atob(base64);
    }
    return null;
  } catch (e) {
    console.error('Failed to decode SVG:', e);
    return null;
  }
};

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
  
  // Safely parse date
  let formattedDate = "";
  let formattedTime = "";
  try {
    const date = new Date(entry.createdAt);
    if (!isNaN(date.getTime())) {
      formattedDate = date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      formattedTime = date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });
    }
  } catch {
    formattedDate = "Unknown";
    formattedTime = "";
  }

  const shareOption = SHARE_OPTIONS.find(opt => opt.id === entry.visibility) || SHARE_OPTIONS[0];
  const hasMedia = entry.assets && entry.assets.length > 0;
  const contentType = CONTENT_TYPES.find(ct => ct.id === entry.type) || CONTENT_TYPES[0];
  
  // Safely get content as string
  const displayContent = typeof entry.content === "string" ? entry.content : "";
  const displayTitle = typeof entry.title === "string" && entry.title ? entry.title : "Untitled Entry";

  // Check if first asset is a drawing
  const firstAsset = entry.assets?.[0];
  const isFirstDrawing = firstAsset ? isDrawingUri(firstAsset) : false;
  const firstSvgContent = isFirstDrawing ? getSvgContent(firstAsset!) : null;

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
        {hasMedia && firstAsset ? (
          <View style={styles.cardMediaPreview}>
            {isFirstDrawing && firstSvgContent ? (
              <View style={[styles.cardMediaImage, { backgroundColor: '#fff', overflow: 'hidden' }]}>
                <SvgXml xml={firstSvgContent} width="100%" height={150} preserveAspectRatio="xMidYMid slice" />
              </View>
            ) : (
              <Image 
                source={{ uri: firstAsset }} 
                style={styles.cardMediaImage}
                resizeMode="cover"
              />
            )}
            {entry.assets && entry.assets.length > 1 ? (
              <View style={styles.mediaCountBadge}>
                <Text style={styles.mediaCountText}>{`+${entry.assets.length - 1}`}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        <View style={styles.cardHeader}>
          <View style={styles.cardDateContainer}>
            <Text style={styles.cardDate}>{formattedDate}</Text>
            {formattedTime ? <Text style={styles.cardTime}>{formattedTime}</Text> : null}
          </View>
          <View style={styles.cardBadges}>
            {/* Content type badge */}
            <View style={[styles.typeBadge, { backgroundColor: `${contentType.color}20` }]}>
              <Ionicons name={contentType.icon as any} size={12} color={contentType.color} />
            </View>
            {/* Mood badge */}
            <View style={[styles.moodBadge, { backgroundColor: `${moodData.color}20` }]}>
              <Text style={styles.moodEmoji}>{moodData.emoji}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.cardTitle} numberOfLines={1}>
          {displayTitle}
        </Text>
        
        {displayContent ? (
          <Text style={styles.cardContent} numberOfLines={2}>
            {displayContent}
          </Text>
        ) : null}

        <View style={styles.cardFooter}>
          <View style={styles.shareBadge}>
            <Ionicons name={shareOption.icon as any} size={14} color={shareOption.color} />
            <Text style={[styles.shareBadgeText, { color: shareOption.color }]}>{shareOption.label}</Text>
          </View>
          <View style={styles.cardMeta}>
            {entry.wordCount && entry.wordCount > 0 ? (
              <Text style={styles.metaText}>{`${entry.wordCount} words`}</Text>
            ) : null}
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

// Section tabs for the journal modal
const JOURNAL_SECTIONS = [
  { id: "write", icon: "create", label: "Write", color: "#667EEA" },
  { id: "media", icon: "images", label: "Media", color: "#10B981" },
  { id: "mood", icon: "happy", label: "Mood", color: "#F59E0B" },
  { id: "share", icon: "lock-closed", label: "Share", color: "#8B5CF6" },
] as const;

type JournalSection = typeof JOURNAL_SECTIONS[number]["id"];
type JournalType = JournalEntry["type"];
type JournalMood = JournalEntry["mood"];
type JournalVisibility = JournalEntry["visibility"];

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
    mood: JournalMood; 
    visibility: JournalVisibility; 
    tags: string[];
    type: JournalType;
    assets?: string[];
  }) => void;
  initialEntry?: JournalEntry | null;
  isLoading: boolean;
}) => {
  const [title, setTitle] = useState(initialEntry?.title || "");
  const [content, setContent] = useState(initialEntry?.content || "");
  const [selectedMood, setSelectedMood] = useState<JournalMood>(initialEntry?.mood || "neutral");
  const [selectedType, setSelectedType] = useState<JournalType>(initialEntry?.type || "text");
  const [selectedShare, setSelectedShare] = useState<JournalVisibility>(initialEntry?.visibility || "parent-only");
  const [attachedImages, setAttachedImages] = useState<string[]>(initialEntry?.assets || []);
  const [currentPrompt, setCurrentPrompt] = useState(
    JOURNAL_PROMPTS[Math.floor(Math.random() * JOURNAL_PROMPTS.length)]
  );
  const [activeSection, setActiveSection] = useState<JournalSection>("write");
  const [showDrawingModal, setShowDrawingModal] = useState(false);
  const [editingDrawingIndex, setEditingDrawingIndex] = useState<number | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Word count calculation
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  useEffect(() => {
    if (visible && !initialEntry) {
      setTitle("");
      setContent("");
      setSelectedMood("neutral");
      setSelectedType("text");
      setSelectedShare("parent-only");
      setAttachedImages([]);
      setActiveSection("write");
      setShowPreview(false);
      setCurrentPrompt(JOURNAL_PROMPTS[Math.floor(Math.random() * JOURNAL_PROMPTS.length)]);
    } else if (initialEntry) {
      setTitle(initialEntry.title);
      setContent(initialEntry.content);
      setSelectedMood(initialEntry.mood);
      setSelectedType(initialEntry.type);
      setSelectedShare(initialEntry.visibility);
      setAttachedImages(initialEntry.assets || []);
      setShowPreview(false);
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
    if (editingDrawingIndex !== null) {
      // Editing existing drawing - replace it
      setAttachedImages(prev => prev.map((img, i) => i === editingDrawingIndex ? imageData : img));
      setEditingDrawingIndex(null);
    } else {
      // Creating new drawing - add it
      setAttachedImages(prev => [...prev, imageData].slice(0, 5));
    }
  };

  const handleEditDrawing = (index: number) => {
    setEditingDrawingIndex(index);
    setShowDrawingModal(true);
  };

  // Completion check for each section
  const getSectionStatus = (section: JournalSection) => {
    switch (section) {
      case "write": return title.trim().length > 0 || content.trim().length > 0;
      case "media": return attachedImages.length > 0;
      case "mood": return selectedMood !== "neutral";
      case "share": return true; // Always has default
    }
  };

  // Render section content
  const renderSectionContent = () => {
    if (showPreview) {
      return (
        <Animated.View entering={FadeIn.duration(300)} style={styles.previewContainer}>
          <View style={styles.previewCard}>
            {/* Preview Header */}
            <View style={styles.previewHeader}>
              <View style={[styles.previewMoodBadge, { backgroundColor: `${MOOD_EMOJIS[selectedMood]?.color}20` }]}>
                <Text style={styles.previewMoodEmoji}>{MOOD_EMOJIS[selectedMood]?.emoji}</Text>
              </View>
              <View style={styles.previewMeta}>
                <Text style={styles.previewDate}>
                  {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                </Text>
                <View style={[styles.previewShareBadge, { backgroundColor: `${SHARE_OPTIONS.find(o => o.id === selectedShare)?.color}15` }]}>
                  <Ionicons 
                    name={SHARE_OPTIONS.find(o => o.id === selectedShare)?.icon as any} 
                    size={12} 
                    color={SHARE_OPTIONS.find(o => o.id === selectedShare)?.color} 
                  />
                  <Text style={[styles.previewShareText, { color: SHARE_OPTIONS.find(o => o.id === selectedShare)?.color }]}>
                    {SHARE_OPTIONS.find(o => o.id === selectedShare)?.label}
                  </Text>
                </View>
              </View>
            </View>

            {/* Preview Title */}
            <Text style={styles.previewTitle}>{title || "Untitled Entry"}</Text>

            {/* Preview Content */}
            {content ? (
              <Text style={styles.previewContent}>{content}</Text>
            ) : (
              <Text style={styles.previewNoContent}>No content yet...</Text>
            )}

            {/* Preview Media */}
            {attachedImages.length > 0 && (
              <View style={styles.previewMediaGrid}>
                {attachedImages.slice(0, 4).map((uri, index) => {
                  const isDrawing = isDrawingUri(uri);
                  const svgContent = isDrawing ? getSvgContent(uri) : null;
                  return (
                    <View key={index} style={styles.previewMediaItem}>
                      {isDrawing && svgContent ? (
                        <View style={[styles.previewMediaImage, { backgroundColor: '#fff' }]}>
                          <SvgXml xml={svgContent} width="100%" height="100%" />
                        </View>
                      ) : (
                        <Image source={{ uri }} style={styles.previewMediaImage} />
                      )}
                      {index === 3 && attachedImages.length > 4 && (
                        <View style={styles.previewMoreOverlay}>
                          <Text style={styles.previewMoreText}>+{attachedImages.length - 4}</Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}

            {/* Preview Footer */}
            <View style={styles.previewFooter}>
              <Text style={styles.previewWordCount}>{wordCount} words</Text>
              <View style={[styles.previewTypeBadge, { backgroundColor: `${CONTENT_TYPES.find(t => t.id === selectedType)?.color}20` }]}>
                <Ionicons 
                  name={CONTENT_TYPES.find(t => t.id === selectedType)?.icon as any} 
                  size={12} 
                  color={CONTENT_TYPES.find(t => t.id === selectedType)?.color} 
                />
              </View>
            </View>
          </View>
          <Text style={styles.previewHint}>This is how your entry will look 👆</Text>
        </Animated.View>
      );
    }

    switch (activeSection) {
      case "write":
        return (
          <Animated.View entering={FadeIn.duration(300)} style={styles.sectionContent}>
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
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Title</Text>
              <TextInput
                style={styles.titleInput}
                placeholder="Give your entry a title..."
                placeholderTextColor="#9CA3AF"
                value={title}
                onChangeText={setTitle}
                maxLength={100}
              />
              <Text style={styles.charCounter}>{title.length}/100</Text>
            </View>

            {/* Content Input */}
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Your Thoughts</Text>
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
              <View style={styles.contentStats}>
                <Text style={styles.wordCounter}>{wordCount} words</Text>
                <Text style={styles.charCounter}>{charCount} characters</Text>
              </View>
            </View>
          </Animated.View>
        );

      case "media":
        return (
          <Animated.View entering={FadeIn.duration(300)} style={styles.sectionContent}>
            <Text style={styles.sectionTitle}>Add Photos or Drawings ✨</Text>
            <Text style={styles.sectionSubtitle}>Capture moments or express yourself through art!</Text>

            {/* Media Action Buttons */}
            <View style={styles.mediaActionsGrid}>
              <TouchableOpacity style={styles.mediaActionCard} onPress={pickImage}>
                <LinearGradient
                  colors={["#10B981", "#059669"]}
                  style={styles.mediaActionGradient}
                >
                  <Ionicons name="images" size={32} color="#fff" />
                  <Text style={styles.mediaActionTitle}>Gallery</Text>
                  <Text style={styles.mediaActionDesc}>Pick from photos</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={styles.mediaActionCard} onPress={takePhoto}>
                <LinearGradient
                  colors={["#3B82F6", "#2563EB"]}
                  style={styles.mediaActionGradient}
                >
                  <Ionicons name="camera" size={32} color="#fff" />
                  <Text style={styles.mediaActionTitle}>Camera</Text>
                  <Text style={styles.mediaActionDesc}>Take a photo</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.mediaActionCard}
                onPress={() => setShowDrawingModal(true)}
              >
                <LinearGradient
                  colors={["#F472B6", "#EC4899"]}
                  style={styles.mediaActionGradient}
                >
                  <Ionicons name="brush" size={32} color="#fff" />
                  <Text style={styles.mediaActionTitle}>Draw</Text>
                  <Text style={styles.mediaActionDesc}>Create art</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Attached Media Grid */}
            {attachedImages.length > 0 ? (
              <View style={styles.mediaGridContainer}>
                <View style={styles.mediaGridHeader}>
                  <Text style={styles.sectionTitle}>Your Media ({attachedImages.length}/5)</Text>
                  <TouchableOpacity onPress={() => setAttachedImages([])}>
                    <Text style={styles.clearAllText}>Clear All</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.mediaGrid}>
                  {attachedImages.map((uri, index) => {
                    const isDrawing = isDrawingUri(uri);
                    const svgContent = isDrawing ? getSvgContent(uri) : null;
                    return (
                      <View key={index} style={styles.mediaGridItem}>
                        <TouchableOpacity
                          onPress={() => isDrawing && handleEditDrawing(index)}
                          activeOpacity={isDrawing ? 0.7 : 1}
                          disabled={!isDrawing}
                        >
                          {isDrawing && svgContent ? (
                            <View style={[styles.mediaGridImage, { backgroundColor: '#fff' }]}>
                              <SvgXml xml={svgContent} width="100%" height="100%" />
                            </View>
                          ) : (
                            <Image source={{ uri }} style={styles.mediaGridImage} />
                          )}
                          {isDrawing && (
                            <View style={styles.mediaEditBadge}>
                              <Ionicons name="pencil" size={14} color="#FFFFFF" />
                            </View>
                          )}
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.mediaRemoveButton}
                          onPress={() => removeImage(index)}
                        >
                          <Ionicons name="close-circle" size={26} color="#EF4444" />
                        </TouchableOpacity>
                        <View style={styles.mediaIndexBadge}>
                          <Text style={styles.mediaIndexText}>{index + 1}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            ) : (
              <View style={styles.noMediaContainer}>
                <Ionicons name="image-outline" size={64} color="#D1D5DB" />
                <Text style={styles.noMediaText}>No media added yet</Text>
                <Text style={styles.noMediaHint}>Tap the buttons above to add photos or drawings</Text>
              </View>
            )}
          </Animated.View>
        );

      case "mood":
        return (
          <Animated.View entering={FadeIn.duration(300)} style={styles.sectionContent}>
            <Text style={styles.sectionTitle}>How are you feeling? 🎭</Text>
            <Text style={styles.sectionSubtitle}>Pick the emoji that matches your mood right now</Text>

            <View style={styles.moodGrid}>
              {(Object.keys(MOOD_EMOJIS) as JournalMood[]).map((key) => {
                const value = MOOD_EMOJIS[key];
                return (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.moodGridOption,
                    selectedMood === key && {
                      backgroundColor: value.color + "20",
                      borderColor: value.color,
                      transform: [{ scale: 1.05 }],
                    },
                  ]}
                  onPress={() => setSelectedMood(key)}
                >
                  <Text style={styles.moodGridEmoji}>{value.emoji}</Text>
                  <Text style={[
                    styles.moodGridLabel,
                    selectedMood === key && { color: value.color, fontWeight: "700" }
                  ]}>
                    {value.label}
                  </Text>
                  {selectedMood === key && (
                    <View style={[styles.moodCheckmark, { backgroundColor: value.color }]}>
                      <Ionicons name="checkmark" size={12} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              );
              })}
            </View>

            {/* Selected mood feedback */}
            {selectedMood && (
              <Animated.View entering={FadeInUp.duration(300)} style={styles.moodFeedback}>
                <LinearGradient
                  colors={[`${MOOD_EMOJIS[selectedMood]?.color}20`, `${MOOD_EMOJIS[selectedMood]?.color}10`]}
                  style={styles.moodFeedbackGradient}
                >
                  <Text style={styles.moodFeedbackEmoji}>{MOOD_EMOJIS[selectedMood]?.emoji}</Text>
                  <Text style={[styles.moodFeedbackText, { color: MOOD_EMOJIS[selectedMood]?.color }]}>
                    You're feeling {MOOD_EMOJIS[selectedMood]?.label.toLowerCase()} today!
                  </Text>
                </LinearGradient>
              </Animated.View>
            )}
          </Animated.View>
        );

      case "share":
        return (
          <Animated.View entering={FadeIn.duration(300)} style={styles.sectionContent}>
            <Text style={styles.sectionTitle}>Who can see this? 🔐</Text>
            <Text style={styles.sectionSubtitle}>Choose who you want to share your thoughts with</Text>

            <View style={styles.shareGrid}>
              {SHARE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.shareGridOption,
                    selectedShare === option.id && {
                      backgroundColor: option.color + "15",
                      borderColor: option.color,
                    }
                  ]}
                  onPress={() => setSelectedShare(option.id)}
                >
                  <View style={[
                    styles.shareGridIcon,
                    { backgroundColor: option.color + "20" },
                    selectedShare === option.id && { backgroundColor: option.color + "30" }
                  ]}>
                    <Ionicons 
                      name={option.icon as any} 
                      size={28} 
                      color={selectedShare === option.id ? option.color : "#9CA3AF"} 
                    />
                  </View>
                  <Text style={[
                    styles.shareGridLabel,
                    selectedShare === option.id && { color: option.color, fontWeight: "700" }
                  ]}>
                    {option.label}
                  </Text>
                  <Text style={styles.shareGridDesc}>{option.desc}</Text>
                  {selectedShare === option.id && (
                    <View style={[styles.shareCheckmark, { backgroundColor: option.color }]}>
                      <Ionicons name="checkmark" size={14} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        );
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <SafeAreaView style={styles.modalSafeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          {/* Compact Header */}
          <LinearGradient
            colors={["#667EEA", "#764BA2"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.modalHeaderGradient}
          >
            <View style={styles.modalHeaderTop}>
              <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
                <Ionicons name="close" size={22} color="#fff" />
              </TouchableOpacity>
              <View style={styles.modalTitleContainer}>
                <Text style={styles.modalTitle}>
                  {initialEntry ? "Edit Entry" : "New Entry"}
                </Text>
              </View>
              <View style={styles.headerActions}>
                <TouchableOpacity 
                  onPress={() => setShowPreview(!showPreview)} 
                  style={styles.previewButton}
                >
                  <Ionicons 
                    name={showPreview ? "create" : "eye"} 
                    size={18} 
                    color="#fff" 
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSave}
                  disabled={isLoading}
                  style={[
                    styles.modalSaveButton,
                    isLoading && styles.modalSaveButtonDisabled,
                  ]}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#667EEA" />
                  ) : (
                    <Text style={styles.modalSaveText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Compact Section Tabs */}
            {!showPreview && (
              <View style={styles.sectionTabs}>
                {JOURNAL_SECTIONS.map((section) => {
                  const isActive = activeSection === section.id;
                  const isComplete = getSectionStatus(section.id);
                  return (
                    <TouchableOpacity
                      key={section.id}
                      style={[
                        styles.sectionTab,
                        isActive && styles.sectionTabActive,
                      ]}
                      onPress={() => setActiveSection(section.id)}
                    >
                      <View style={styles.sectionTabContent}>
                        <Ionicons 
                          name={section.icon as any} 
                          size={16} 
                          color={isActive ? "#fff" : "rgba(255,255,255,0.6)"} 
                        />
                        {isComplete && !isActive && (
                          <View style={styles.sectionTabCheck}>
                            <Ionicons name="checkmark" size={8} color="#fff" />
                          </View>
                        )}
                      </View>
                      {isActive && <View style={styles.sectionTabIndicator} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </LinearGradient>

          {/* Section Content */}
          <ScrollView 
            style={styles.modalScroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.modalScrollContent}
          >
            {renderSectionContent()}
          </ScrollView>

          {/* Compact Bottom Navigation */}
          {!showPreview && (
            <View style={styles.bottomNav}>
              <TouchableOpacity
                style={[
                  styles.navButton,
                  activeSection === "write" && styles.navButtonDisabled,
                ]}
                onPress={() => {
                  const currentIndex = JOURNAL_SECTIONS.findIndex(s => s.id === activeSection);
                  if (currentIndex > 0) {
                    setActiveSection(JOURNAL_SECTIONS[currentIndex - 1].id);
                  }
                }}
                disabled={activeSection === "write"}
              >
                <Ionicons 
                  name="chevron-back" 
                  size={18} 
                  color={activeSection === "write" ? "#D1D5DB" : "#667EEA"} 
                />
                <Text style={[
                  styles.navButtonText,
                  activeSection === "write" && styles.navButtonTextDisabled,
                ]}>
                  Back
                </Text>
              </TouchableOpacity>

              <View style={styles.progressDots}>
                {JOURNAL_SECTIONS.map((section) => (
                  <View
                    key={section.id}
                    style={[
                      styles.progressDot,
                      activeSection === section.id && styles.progressDotActive,
                      getSectionStatus(section.id) && activeSection !== section.id && styles.progressDotComplete,
                    ]}
                  />
                ))}
              </View>

              <TouchableOpacity
                style={[
                  styles.navButton,
                  activeSection === "share" && styles.navButtonDisabled,
                ]}
                onPress={() => {
                  const currentIndex = JOURNAL_SECTIONS.findIndex(s => s.id === activeSection);
                  if (currentIndex < JOURNAL_SECTIONS.length - 1) {
                    setActiveSection(JOURNAL_SECTIONS[currentIndex + 1].id);
                  }
                }}
                disabled={activeSection === "share"}
              >
                <Text style={[
                  styles.navButtonText,
                  activeSection === "share" && styles.navButtonTextDisabled,
                ]}>
                  Next
                </Text>
                <Ionicons 
                  name="chevron-forward" 
                  size={18} 
                  color={activeSection === "share" ? "#D1D5DB" : "#667EEA"} 
                />
              </TouchableOpacity>
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Drawing Modal */}
      <DrawingModal
        visible={showDrawingModal}
        onClose={() => {
          setShowDrawingModal(false);
          setEditingDrawingIndex(null);
        }}
        onSave={handleDrawingSave}
        initialImage={editingDrawingIndex !== null ? attachedImages[editingDrawingIndex] : undefined}
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
    mood: JournalMood;
    visibility: JournalVisibility;
    tags: string[];
    type: JournalType;
    assets?: string[];
  }) => {
    let result: { success: boolean; message?: string; data?: JournalEntry; pointsEarned?: number };

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
    backgroundColor: "#F8F9FA",
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
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  modalSaveButton: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modalSaveButtonDisabled: {
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  modalSaveText: {
    color: "#667EEA",
    fontWeight: "700",
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
  editBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    backgroundColor: "#8B5CF6",
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
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
  // SafeArea for Modal
  modalSafeArea: {
    flex: 1,
    backgroundColor: "#667EEA",
  },
  // Compact Modal Header
  modalHeaderGradient: {
    paddingTop: 8,
    paddingBottom: 0,
  },
  modalHeaderTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  modalTitleContainer: {
    alignItems: "center",
  },
  modalSubtitle: {
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
    marginTop: 1,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  previewButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  // Compact Section Tabs
  sectionTabs: {
    flexDirection: "row",
    paddingHorizontal: 4,
    paddingBottom: 0,
  },
  sectionTab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    position: "relative",
  },
  sectionTabActive: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  sectionTabContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  sectionTabLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "500",
  },
  sectionTabLabelActive: {
    color: "#fff",
    fontWeight: "600",
  },
  sectionTabCheck: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 2,
  },
  sectionTabIndicator: {
    position: "absolute",
    bottom: 0,
    left: "30%",
    right: "30%",
    height: 2,
    backgroundColor: "#fff",
    borderRadius: 1,
  },
  // Section Content
  sectionContent: {
    flex: 1,
    paddingTop: 2,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: "#9CA3AF",
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  modalScrollContent: {
    paddingBottom: 16,
  },
  // Input Groups
  inputGroup: {
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  charCounter: {
    fontSize: 11,
    color: "#9CA3AF",
    textAlign: "right",
    marginTop: 4,
  },
  contentStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  wordCounter: {
    fontSize: 11,
    color: "#667EEA",
    fontWeight: "500",
  },
  // Media Section
  mediaActionsGrid: {
    flexDirection: "row",
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 16,
  },
  mediaActionCard: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mediaActionGradient: {
    paddingVertical: 12,
    alignItems: "center",
    gap: 4,
  },
  mediaActionTitle: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 12,
  },
  mediaActionDesc: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 10,
  },
  mediaGridContainer: {
    paddingHorizontal: 16,
  },
  mediaGridHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  clearAllText: {
    color: "#EF4444",
    fontSize: 13,
    fontWeight: "500",
  },
  mediaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  mediaGridItem: {
    position: "relative",
    width: (screenWidth - 56) / 3,
    aspectRatio: 1,
  },
  mediaGridImage: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
  mediaEditBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "#8B5CF6",
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  mediaRemoveButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#fff",
    borderRadius: 13,
  },
  mediaIndexBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  mediaIndexText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
  noMediaContainer: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 12,
  },
  noMediaText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    marginTop: 12,
  },
  noMediaHint: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
    textAlign: "center",
  },
  // Mood Grid
  moodGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    gap: 8,
    justifyContent: "center",
  },
  moodGridOption: {
    width: (screenWidth - 56) / 4,
    aspectRatio: 0.95,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    backgroundColor: "#FAFAFA",
    position: "relative",
  },
  moodGridEmoji: {
    fontSize: 26,
    marginBottom: 2,
  },
  moodGridLabel: {
    fontSize: 10,
    color: "#6B7280",
    fontWeight: "500",
  },
  moodCheckmark: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  moodFeedback: {
    marginTop: 16,
    marginHorizontal: 12,
    borderRadius: 12,
    overflow: "hidden",
  },
  moodFeedbackGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  moodFeedbackEmoji: {
    fontSize: 22,
  },
  moodFeedbackText: {
    fontSize: 13,
    fontWeight: "600",
  },
  // Share Grid
  shareGrid: {
    paddingHorizontal: 12,
    gap: 8,
  },
  shareGridOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    backgroundColor: "#FAFAFA",
    position: "relative",
  },
  shareGridIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  shareGridLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 1,
  },
  shareGridDesc: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  shareCheckmark: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  // Bottom Navigation
  bottomNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    color: "#667EEA",
    fontSize: 14,
    fontWeight: "600",
  },
  navButtonTextDisabled: {
    color: "#D1D5DB",
  },
  progressDots: {
    flexDirection: "row",
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E5E7EB",
  },
  progressDotActive: {
    backgroundColor: "#667EEA",
    width: 20,
  },
  progressDotComplete: {
    backgroundColor: "#10B981",
  },
  // Preview Mode
  previewContainer: {
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  previewCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  previewMoodBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  previewMoodEmoji: {
    fontSize: 20,
  },
  previewMeta: {
    flex: 1,
  },
  previewDate: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  previewShareBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 4,
    alignSelf: "flex-start",
  },
  previewShareText: {
    fontSize: 11,
    fontWeight: "500",
  },
  previewTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 8,
  },
  previewContent: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 21,
  },
  previewNoContent: {
    fontSize: 14,
    color: "#9CA3AF",
    fontStyle: "italic",
  },
  previewMediaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 12,
  },
  previewMediaItem: {
    width: (screenWidth - 60) / 2,
    aspectRatio: 1,
    borderRadius: 10,
    overflow: "hidden",
    position: "relative",
  },
  previewMediaImage: {
    width: "100%",
    height: "100%",
  },
  previewMoreOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  previewMoreText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  previewFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  previewWordCount: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  previewTypeBadge: {
    padding: 6,
    borderRadius: 8,
  },
  previewHint: {
    textAlign: "center",
    color: "#9CA3AF",
    fontSize: 12,
    marginTop: 12,
    fontStyle: "italic",
  },
});
