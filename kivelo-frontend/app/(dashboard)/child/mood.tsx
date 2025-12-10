// app/(dashboard)/child/mood.tsx
import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { useMood, MoodCheckin } from "@/context/MoodContext";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';

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
  const { submitMood, getTodayMood, getMoodHistory } = useMood();

  const [selectedMood, setSelectedMood] = useState<typeof MOOD_OPTIONS[0] | null>(null);
  const [textNote, setTextNote] = useState("");
  const [expressionMode, setExpressionMode] = useState<'text' | 'voice' | 'drawing' | 'image'>('text');
  const [voiceRecording, setVoiceRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const [todayMood, setTodayMood] = useState<MoodCheckin | null>(null);
  const [recentMoods, setRecentMoods] = useState<MoodCheckin[]>([]);

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
      Alert.alert("Select a Mood", "Please select how you are feeling today!");
      return;
    }

    setIsSubmitting(true);
    try {
      const moodData: any = {
        emoji: selectedMood.emoji,
        moodScore: selectedMood.score,
      };

      // Add expression based on mode
      if (expressionMode === 'text' && textNote.trim()) {
        moodData.textNote = textNote.trim();
      } else if (expressionMode === 'voice' && voiceRecording) {
        moodData.voiceNote = 'voice_recording_placeholder'; // In production, upload audio file
      } else if (expressionMode === 'image' && selectedImage) {
        moodData.imageNote = selectedImage; // In production, upload image
      } else if (expressionMode === 'drawing') {
        moodData.drawingNote = 'drawing_placeholder'; // In production, save canvas data
      }

      const result = await submitMood(moodData);

      if (result.success) {
        Alert.alert(
          '✅ Mood Recorded!',
          `Thanks for sharing! You earned 10 points! 🎉`,
          [{ text: 'OK', onPress: () => {
            resetForm();
            loadTodayMood();
            loadRecentMoods();
          }}]
        );
      } else {
        Alert.alert('Error', result.message || 'Failed to record mood');
      }
    } catch (error: any) {
      console.error('Submit mood error:', error);
      Alert.alert('Error', 'Failed to record mood. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedMood(null);
    setTextNote("");
    setExpressionMode('text');
    setVoiceRecording(null);
    setSelectedImage(null);
    setIsRecording(false);
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

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#16A34A" />
        <Text style={styles.loadingText}>Loading mood data...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
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
                onPress={() => setSelectedMood(mood)}
              >
                <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                <Text style={styles.moodLabel}>{mood.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

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
                  <TouchableOpacity
                    style={styles.drawingButton}
                    onPress={() => Alert.alert('Coming soon', 'Drawing canvas is not implemented yet')}
                  >
                    <Ionicons name="color-palette" size={32} color="#22C55E" />
                    <Text style={styles.drawingButtonText}>Open Drawing Canvas</Text>
                  </TouchableOpacity>
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
                </View>
              </View>
              <View style={[styles.historyZone, { backgroundColor: getTrustZoneColor(mood.trustZone) }]}>
                <Text style={styles.historyZoneText}>{mood.trustZone}</Text>
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
    </KeyboardAvoidingView>
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
});