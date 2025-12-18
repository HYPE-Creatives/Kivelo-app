// app/(dashboard)/child/mood.tsx
import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  Modal,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Slider from '@react-native-community/slider';
import { showAlert } from '@/utils/showAlert';
import { useMood, MoodCheckin } from "@/context/MoodContext";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import DrawingModal from "@/components/DrawingModal";

// Mood emojis with scores
const MOOD_OPTIONS = [
  { emoji: "😢", label: "Sad", score: 2, color: "#EF4444" },
  { emoji: "😟", label: "Down", score: 4, color: "#F97316" },
  { emoji: "😐", label: "Okay", score: 5, color: "#EAB308" },
  { emoji: "🙂", label: "Good", score: 7, color: "#84CC16" },
  { emoji: "😊", label: "Happy", score: 8, color: "#22C55E" },
  { emoji: "😄", label: "Great", score: 10, color: "#10B981" },
];

export default function MoodCheck() {
  const { submitMood, getTodayMood, getMoodHistory, updateMood, deleteMood } = useMood();

  const [selectedMood, setSelectedMood] = useState<typeof MOOD_OPTIONS[0] | null>(null);
  const [moodIntensity, setMoodIntensity] = useState<number>(5);
  const [textNote, setTextNote] = useState("");
  const [expressionMode, setExpressionMode] = useState<'text' | 'voice' | 'drawing' | 'image'>('text');
  const [voiceRecording, setVoiceRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [drawingImage, setDrawingImage] = useState<string | null>(null);
  const [showDrawingModal, setShowDrawingModal] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const [todayMood, setTodayMood] = useState<MoodCheckin | null>(null);
  const [recentMoods, setRecentMoods] = useState<MoodCheckin[]>([]);

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMood, setEditingMood] = useState<MoodCheckin | null>(null);
  const [editSelectedMood, setEditSelectedMood] = useState<typeof MOOD_OPTIONS[0] | null>(null);
  const [editMoodIntensity, setEditMoodIntensity] = useState<number>(5);
  const [editTextNote, setEditTextNote] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadTodayMood = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getTodayMood();
      if (result.success) {
        setHasCheckedInToday(result.hasCheckedInToday || false);
        setTodayMood(result.data || null);
      }
    } catch (error) {
      console.error("Load today mood error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [getTodayMood]);

  const loadRecentMoods = useCallback(async () => {
    try {
      const result = await getMoodHistory("week", 7);
      if (result.success && result.data) {
        setRecentMoods(result.data);
      }
    } catch (error) {
      console.error("Load recent moods error:", error);
    }
  }, [getMoodHistory]);

  useEffect(() => {
    loadTodayMood();
    loadRecentMoods();
  }, [loadTodayMood, loadRecentMoods]);

  const handleSubmitMood = async () => {
    if (!selectedMood) {
      showAlert("Select a Mood", "Please select how you are feeling today!");
      return;
    }

    setIsSubmitting(true);
    try {
      const moodData: any = {
        emoji: selectedMood.emoji,
        moodScore: moodIntensity,
      };

      // Add expression based on mode
      if (expressionMode === 'text' && textNote.trim()) {
        moodData.textNote = textNote.trim();
      } else if (expressionMode === 'voice' && voiceRecording) {
        moodData.voiceNote = 'voice_recording_placeholder'; // In production, upload audio file
      } else if (expressionMode === 'image' && selectedImage) {
        moodData.imageNote = selectedImage; // In production, upload image
      } else if (expressionMode === 'drawing' && drawingImage) {
        moodData.drawingNote = drawingImage;
      }

      const result = await submitMood(moodData);

      if (result.success) {
        showAlert(
          '✅ Mood Recorded!',
          `Thanks for sharing! You earned 10 points! 🎉`,
          [{ text: 'OK', onPress: () => {
            resetForm();
            loadTodayMood();
            loadRecentMoods();
          }}]
        );
      } else {
        showAlert('Error', result.message || 'Failed to record mood');
      }
    } catch (error: any) {
      console.error('Submit mood error:', error);
      showAlert('Error', 'Failed to record mood. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedMood(null);
    setMoodIntensity(5);
    setTextNote("");
    setExpressionMode('text');
    setVoiceRecording(null);
    setSelectedImage(null);
    setDrawingImage(null);
    setIsRecording(false);
  };

  const handleDrawingSave = (imageData: string) => {
    setDrawingImage(imageData);
    setShowDrawingModal(false);
  };

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Please enable microphone access');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setVoiceRecording(recording);
      setIsRecording(true);
    } catch (err) {
      console.error('Start recording error:', err);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    if (!voiceRecording) return;

    setIsRecording(false);
    await voiceRecording.stopAndUnloadAsync();
    Alert.alert('✅ Recording Saved', 'Your voice note is ready!');
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'Please enable photo access');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const getTrustZoneColor = (zone: string) => {
    switch (zone) {
      case "green": return "#22C55E";
      case "yellow": return "#EAB308";
      case "orange": return "#F97316";
      case "red": return "#EF4444";
      default: return "#6B7280";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
  };

  // Open edit modal for a mood
  const handleEditMood = (mood: MoodCheckin) => {
    setEditingMood(mood);
    const moodOption = MOOD_OPTIONS.find(m => m.emoji === mood.emoji) || null;
    setEditSelectedMood(moodOption);
    setEditMoodIntensity(mood.moodScore || 5);
    setEditTextNote(mood.textNote || "");
    setShowEditModal(true);
  };

  // Save edited mood
  const handleSaveEdit = async () => {
    if (!editingMood || !editSelectedMood) return;

    setIsUpdating(true);
    try {
      const updates = {
        emoji: editSelectedMood.emoji,
        moodScore: editMoodIntensity,
        textNote: editTextNote.trim() || undefined,
      };

      const result = await updateMood(editingMood._id, updates);

      if (result.success) {
        showAlert("✅ Updated!", "Your mood entry has been updated.");
        setShowEditModal(false);
        setEditingMood(null);
        loadTodayMood();
        loadRecentMoods();
      } else {
        showAlert("Error", result.message || "Failed to update mood");
      }
    } catch (error: any) {
      console.error("Update mood error:", error);
      showAlert("Error", "Failed to update mood. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete mood with confirmation
  const handleDeleteMood = (mood: MoodCheckin) => {
    Alert.alert(
      "🗑️ Delete Mood",
      `Are you sure you want to delete this mood entry from ${formatDate(mood.createdAt)}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => confirmDeleteMood(mood._id),
        },
      ]
    );
  };

  const confirmDeleteMood = async (moodId: string) => {
    setIsDeleting(true);
    try {
      const result = await deleteMood(moodId);

      if (result.success) {
        showAlert("✅ Deleted!", "Your mood entry has been removed.");
        loadTodayMood();
        loadRecentMoods();
      } else {
        showAlert("Error", result.message || "Failed to delete mood");
      }
    } catch (error: any) {
      console.error("Delete mood error:", error);
      showAlert("Error", "Failed to delete mood. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loaderContainer} edges={['top']}>
        <ActivityIndicator size="large" color="#16A34A" />
        <Text style={styles.loadingText}>Loading mood data...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
    <KeyboardAvoidingView 
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView style={styles.innerScroll} contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>🌈 How are you feeling?</Text>
              <Text style={styles.subtitle}>
                {hasCheckedInToday
                  ? "You have already checked in today! 🎉"
                  : "Share your mood and earn 10 points!"}
              </Text>
          </View>

      {/* Today's Mood (if already checked in) */}
      {hasCheckedInToday && todayMood && (
        <View style={[styles.todayCard, { borderColor: getTrustZoneColor(todayMood.trustZone) }]}>
          <Text style={styles.todayLabel}>Mood for Today</Text>
          <Text style={styles.todayEmoji}>{todayMood.emoji}</Text>
          <Text style={styles.todayScore}>Score: {todayMood.moodScore}/10</Text>
          {todayMood.textNote && (
            <Text style={styles.todayNote}>{`"${todayMood.textNote}"`}</Text>
          )}
          <View style={[styles.trustZoneBadge, { backgroundColor: getTrustZoneColor(todayMood.trustZone) }]}>
            <Text style={styles.trustZoneText}>{todayMood.trustZone.toUpperCase()} ZONE</Text>
          </View>
          <View style={styles.todayActions}>
            <TouchableOpacity
              style={styles.todayActionButton}
              onPress={() => handleEditMood(todayMood)}
            >
              <Ionicons name="pencil" size={18} color="#3B82F6" />
              <Text style={styles.todayActionText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.todayActionButton, styles.todayDeleteButton]}
              onPress={() => handleDeleteMood(todayMood)}
              disabled={isDeleting}
            >
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
              <Text style={[styles.todayActionText, { color: '#EF4444' }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Mood Selection */}
      {!hasCheckedInToday && (
        <View style={styles.moodSection}>
          <Text style={styles.sectionTitle}>Pick Your Mood</Text>
          <View style={styles.moodGrid}>
            {MOOD_OPTIONS.map((mood) => (
              <TouchableOpacity
                key={mood.emoji}
                style={[
                  styles.moodButton,
                  selectedMood?.emoji === mood.emoji && {
                    borderColor: mood.color,
                    backgroundColor: `${mood.color}15`,
                    transform: [{ scale: 1.1 }],
                  },
                ]}
                onPress={() => {
                  setSelectedMood(mood);
                  setMoodIntensity(mood.score);
                }}
              >
                <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                <Text style={styles.moodLabel}>{mood.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Mood Intensity Slider */}
          {selectedMood && (
            <View style={styles.intensitySection}>
              <Text style={styles.intensityTitle}>How intense is this feeling?</Text>
              <View style={styles.intensitySliderContainer}>
                <Text style={styles.intensityLabel}>Mild</Text>
                <View style={styles.sliderWrapper}>
                  <Slider
                    style={styles.slider}
                    minimumValue={1}
                    maximumValue={10}
                    step={1}
                    value={moodIntensity}
                    onValueChange={setMoodIntensity}
                    minimumTrackTintColor={selectedMood.color}
                    maximumTrackTintColor="#E5E7EB"
                    thumbTintColor={selectedMood.color}
                  />
                  <View style={styles.intensityValue}>
                    <Text style={[styles.intensityValueText, { color: selectedMood.color }]}>
                      {moodIntensity}
                    </Text>
                    <Text style={styles.intensityValueLabel}>/10</Text>
                  </View>
                </View>
                <Text style={styles.intensityLabel}>Strong</Text>
              </View>
              <Text style={styles.intensityHint}>
                Slide to show how strongly you feel this emotion
              </Text>
            </View>
          )}

          {/* Expression Mode Selection */}
          {selectedMood && (
            <View style={styles.expressionSection}>
              <Text style={styles.sectionTitle}>Express Yourself</Text>
              <View style={styles.expressionModes}>
                <TouchableOpacity
                  style={[styles.modeButton, expressionMode === 'text' && styles.modeButtonActive]}
                  onPress={() => setExpressionMode('text')}
                >
                  <Ionicons name="text-outline" size={24} color={expressionMode === 'text' ? '#22C55E' : '#64748b'} />
                  <Text style={[styles.modeText, expressionMode === 'text' && styles.modeTextActive]}>Text</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modeButton, expressionMode === 'voice' && styles.modeButtonActive]}
                  onPress={() => setExpressionMode('voice')}
                >
                  <Ionicons name="mic-outline" size={24} color={expressionMode === 'voice' ? '#22C55E' : '#64748b'} />
                  <Text style={[styles.modeText, expressionMode === 'voice' && styles.modeTextActive]}>Voice</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modeButton, expressionMode === 'drawing' && styles.modeButtonActive]}
                  onPress={() => setExpressionMode('drawing')}
                >
                  <Ionicons name="brush-outline" size={24} color={expressionMode === 'drawing' ? '#22C55E' : '#64748b'} />
                  <Text style={[styles.modeText, expressionMode === 'drawing' && styles.modeTextActive]}>Draw</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modeButton, expressionMode === 'image' && styles.modeButtonActive]}
                  onPress={() => setExpressionMode('image')}
                >
                  <Ionicons name="image-outline" size={24} color={expressionMode === 'image' ? '#22C55E' : '#64748b'} />
                  <Text style={[styles.modeText, expressionMode === 'image' && styles.modeTextActive]}>Image</Text>
                </TouchableOpacity>
              </View>

              {/* Text Mode */}
              {expressionMode === 'text' && (
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Tell us more about your mood... (optional)"
                    placeholderTextColor="#94A3B8"
                    value={textNote}
                    onChangeText={setTextNote}
                    multiline
                    numberOfLines={4}
                    maxLength={500}
                    returnKeyType="default"
                    blurOnSubmit={false}
                    autoCorrect={true}
                    autoCapitalize="sentences"
                  />
                  <Text style={styles.charCount}>{textNote.length}/500</Text>
                </View>
              )}

              {/* Voice Mode */}
              {expressionMode === 'voice' && (
                <View style={styles.voiceContainer}>
                  <TouchableOpacity
                    style={[styles.recordButton, isRecording && styles.recordButtonActive]}
                    onPress={isRecording ? stopRecording : startRecording}
                  >
                    <Ionicons 
                      name={isRecording ? "stop-circle" : "mic"} 
                      size={48} 
                      color={isRecording ? "#EF4444" : "#22C55E"} 
                    />
                  </TouchableOpacity>
                  <Text style={styles.voiceLabel}>
                    {isRecording ? "Recording... Tap to stop" : voiceRecording ? "✅ Voice recorded!" : "Tap to record"}
                  </Text>
                </View>
              )}

              {/* Drawing Mode */}
              {expressionMode === 'drawing' && (
                <View style={styles.drawingContainer}>
                  {drawingImage ? (
                    <View style={styles.drawingPreview}>
                      <Image source={{ uri: drawingImage }} style={styles.drawingPreviewImage} />
                      <TouchableOpacity 
                        style={styles.removeDrawingButton} 
                        onPress={() => setDrawingImage(null)}
                      >
                        <Ionicons name="close-circle" size={32} color="#EF4444" />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.editDrawingButton}
                        onPress={() => setShowDrawingModal(true)}
                      >
                        <Ionicons name="pencil" size={20} color="#fff" />
                        <Text style={styles.editDrawingText}>Edit</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.drawingButton}
                      onPress={() => setShowDrawingModal(true)}
                    >
                      <Ionicons name="color-palette" size={32} color="#22C55E" />
                      <Text style={styles.drawingButtonText}>Open Drawing Canvas</Text>
                    </TouchableOpacity>
                  )}
                  <Text style={styles.drawingHint}>Express your mood with colors and shapes!</Text>
                </View>
              )}

              {/* Image Mode */}
              {expressionMode === 'image' && (
                <View style={styles.imageContainer}>
                  {selectedImage ? (
                    <View style={styles.imagePreview}>
                      <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
                      <TouchableOpacity style={styles.removeImageButton} onPress={() => setSelectedImage(null)}>
                        <Ionicons name="close-circle" size={32} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
                      <Ionicons name="images-outline" size={48} color="#22C55E" />
                      <Text style={styles.imagePickerText}>Choose an image</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          )}

          {/* Text Note */}
          {selectedMood && false && (
            <View style={styles.noteSection}>
              <Text style={styles.noteLabel}>
                Want to share more? (Optional)
              </Text>
              <TextInput
                style={styles.noteInput}
                placeholder="What made you feel this way today?"
                placeholderTextColor="#9CA3AF"
                value={textNote}
                onChangeText={setTextNote}
                multiline
                maxLength={200}
              />
              <Text style={styles.charCount}>{textNote.length}/200</Text>
            </View>
          )}

          {/* Submit Button */}
          {selectedMood && (
            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmitMood}
              disabled={isSubmitting}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? "Recording..." : "✨ Record My Mood"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Recent Moods */}
      {recentMoods.length > 0 && (
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Moods This Week</Text>
          {recentMoods.map((mood) => (
            <View key={mood._id} style={styles.historyCard}>
              <View style={styles.historyLeft}>
                <Text style={styles.historyEmoji}>{mood.emoji}</Text>
                <View>
                  <Text style={styles.historyDate}>{formatDate(mood.createdAt)}</Text>
                  <Text style={styles.historyScore}>Score: {mood.moodScore}/10</Text>
                  {mood.textNote && (
                    <Text style={styles.historyNote} numberOfLines={1}>
                      {mood.textNote}
                    </Text>
                  )}
                </View>
              </View>
              <View style={styles.historyRight}>
                <View style={[styles.historyZone, { backgroundColor: getTrustZoneColor(mood.trustZone) }]}>
                  <Text style={styles.historyZoneText}>{mood.trustZone}</Text>
                </View>
                <View style={styles.historyActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleEditMood(mood)}
                  >
                    <Ionicons name="pencil" size={18} color="#3B82F6" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDeleteMood(mood)}
                    disabled={isDeleting}
                  >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          💡 Tracking your mood helps you understand your feelings better!
        </Text>
      </View>
        </ScrollView>
      </TouchableWithoutFeedback>

      {/* Edit Mood Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>✏️ Edit Mood</Text>
              <TouchableOpacity
                onPress={() => setShowEditModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSectionTitle}>How were you feeling?</Text>
            <View style={styles.editMoodGrid}>
              {MOOD_OPTIONS.map((mood) => (
                <TouchableOpacity
                  key={mood.emoji}
                  style={[
                    styles.editMoodButton,
                    editSelectedMood?.emoji === mood.emoji && {
                      borderColor: mood.color,
                      backgroundColor: `${mood.color}15`,
                    },
                  ]}
                  onPress={() => {
                    setEditSelectedMood(mood);
                    setEditMoodIntensity(mood.score);
                  }}
                >
                  <Text style={styles.editMoodEmoji}>{mood.emoji}</Text>
                  <Text style={styles.editMoodLabel}>{mood.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Intensity Slider in Edit Modal */}
            {editSelectedMood && (
              <View style={styles.editIntensitySection}>
                <Text style={styles.modalSectionTitle}>Intensity</Text>
                <View style={styles.editIntensityRow}>
                  <Text style={styles.intensityLabel}>Mild</Text>
                  <Slider
                    style={styles.editSlider}
                    minimumValue={1}
                    maximumValue={10}
                    step={1}
                    value={editMoodIntensity}
                    onValueChange={setEditMoodIntensity}
                    minimumTrackTintColor={editSelectedMood.color}
                    maximumTrackTintColor="#E5E7EB"
                    thumbTintColor={editSelectedMood.color}
                  />
                  <Text style={styles.intensityLabel}>Strong</Text>
                </View>
                <Text style={[styles.editIntensityValue, { color: editSelectedMood.color }]}>
                  {editMoodIntensity}/10
                </Text>
              </View>
            )}

            <Text style={styles.modalSectionTitle}>Note (optional)</Text>
            <TextInput
              style={styles.editTextInput}
              placeholder="How did you feel?"
              placeholderTextColor="#9CA3AF"
              value={editTextNote}
              onChangeText={setEditTextNote}
              multiline
              maxLength={200}
            />
            <Text style={styles.charCount}>{editTextNote.length}/200</Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, isUpdating && styles.saveButtonDisabled]}
                onPress={handleSaveEdit}
                disabled={isUpdating || !editSelectedMood}
              >
                {isUpdating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Drawing Modal */}
      <DrawingModal
        visible={showDrawingModal}
        onClose={() => setShowDrawingModal(false)}
        onSave={handleDrawingSave}
      />
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  innerScroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#6B7280",
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
  },
  todayCard: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 16,
    marginBottom: 30,
    borderWidth: 3,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  todayLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 8,
  },
  todayEmoji: {
    fontSize: 64,
    marginBottom: 12,
  },
  todayScore: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 8,
  },
  todayNote: {
    fontSize: 14,
    color: "#6B7280",
    fontStyle: "italic",
    textAlign: "center",
    marginBottom: 12,
  },
  trustZoneBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  trustZoneText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  todayActions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 16,
  },
  todayActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
  },
  todayDeleteButton: {
    backgroundColor: '#FEF2F2',
  },
  todayActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  moodSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 16,
  },
  moodGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  moodButton: {
    width: "30%",
    aspectRatio: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  moodEmoji: {
    fontSize: 36,
    marginBottom: 4,
  },
  moodLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },
  // Mood Intensity Slider Styles
  intensitySection: {
    marginTop: 24,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  intensityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  intensitySliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  intensityLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    width: 45,
  },
  sliderWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  intensityValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
  },
  intensityValueText: {
    fontSize: 32,
    fontWeight: '700',
  },
  intensityValueLabel: {
    fontSize: 16,
    color: '#9CA3AF',
    fontWeight: '500',
    marginLeft: 2,
  },
  intensityHint: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 12,
  },
  noteSection: {
    marginTop: 24,
  },
  noteLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  noteInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#1F2937",
    minHeight: 100,
    textAlignVertical: "top",
  },
  charCount: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "right",
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: "#16A34A",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 24,
    shadowColor: "#16A34A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: "#9CA3AF",
    opacity: 0.7,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  historySection: {
    marginTop: 20,
  },
  historyCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  historyLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  historyRight: {
    alignItems: "flex-end",
    gap: 8,
  },
  historyEmoji: {
    fontSize: 32,
  },
  historyDate: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
  },
  historyScore: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  historyNote: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 2,
    maxWidth: 150,
  },
  historyActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  historyZone: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  historyZoneText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  footer: {
    marginTop: 30,
    padding: 16,
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
  },
  footerText: {
    fontSize: 14,
    color: "#1E40AF",
    textAlign: "center",
    lineHeight: 20,
  },
  expressionSection: {
    marginTop: 24,
  },
  expressionModes: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  modeButton: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  modeButtonActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#22C55E',
  },
  modeText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 4,
  },
  modeTextActive: {
    color: '#22C55E',
  },
  inputContainer: {
    marginTop: 8,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  voiceContainer: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  recordButtonActive: {
    backgroundColor: '#FEE2E2',
  },
  voiceLabel: {
    marginTop: 16,
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  drawingContainer: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
  },
  drawingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'white',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  drawingButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  drawingHint: {
    marginTop: 12,
    fontSize: 13,
    color: '#64748b',
  },
  drawingPreview: {
    position: 'relative',
    width: '100%',
    alignItems: 'center',
  },
  drawingPreviewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  removeDrawingButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  editDrawingButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#667EEA',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  editDrawingText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  imageContainer: {
    alignItems: 'center',
    padding: 16,
  },
  imagePickerButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    width: '100%',
  },
  imagePickerText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  imagePreview: {
    position: 'relative',
    width: '100%',
  },
  selectedImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'white',
    borderRadius: 16,
  },
  // Edit Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    marginTop: 8,
  },
  editMoodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  editMoodButton: {
    width: '30%',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  editMoodEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  editMoodLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  editIntensitySection: {
    marginTop: 16,
    marginBottom: 8,
  },
  editIntensityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editSlider: {
    flex: 1,
    height: 40,
  },
  editIntensityValue: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 4,
  },
  editTextInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#1F2937',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  saveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#16A34A',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});