// app/(dashboard)/child/settings/theme-settings.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme, THEME_COLORS, ThemeMode, ColorTheme } from "../../../../context/ThemeContext";

const { width } = Dimensions.get("window");
const THEME_CARD_WIDTH = (width - 60) / 2;

// Mode options with fun descriptions for kids
const MODE_OPTIONS: { mode: ThemeMode; emoji: string; title: string; description: string }[] = [
  {
    mode: "light",
    emoji: "☀️",
    title: "Light Mode",
    description: "Bright and sunny!",
  },
  {
    mode: "dark",
    emoji: "🌙",
    title: "Dark Mode",
    description: "Easy on the eyes",
  },
  {
    mode: "auto",
    emoji: "✨",
    title: "Auto Magic",
    description: "Changes with the day",
  },
];

export default function ThemeSettingsScreen() {
  const router = useRouter();
  const { mode, colorTheme, isDark, colors, setMode, setColorTheme, themeColors } = useTheme();

  return (
    <LinearGradient 
      colors={themeColors.gradient as [string, string]} 
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>🎨 Theme & Colors</Text>
            <Text style={styles.headerSubtitle}>Make the app look awesome!</Text>
          </View>
          <View style={{ width: 44 }} />
        </View>

        {/* Content */}
        <View style={[styles.contentContainer, { backgroundColor: colors.background }]}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Light/Dark Mode Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>🌓 Display Mode</Text>
              <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
                Choose how bright or dark you want the app
              </Text>
              
              <View style={styles.modeContainer}>
                {MODE_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.mode}
                    style={[
                      styles.modeCard,
                      { backgroundColor: colors.card },
                      mode === option.mode && [styles.modeCardSelected, { borderColor: themeColors.primary }],
                    ]}
                    onPress={() => setMode(option.mode)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.modeEmoji}>{option.emoji}</Text>
                    <Text style={[
                      styles.modeTitle,
                      { color: colors.text },
                      mode === option.mode && { color: themeColors.primary }
                    ]}>
                      {option.title}
                    </Text>
                    <Text style={[styles.modeDescription, { color: colors.textSecondary }]}>{option.description}</Text>
                    {mode === option.mode && (
                      <View style={[styles.checkBadge, { backgroundColor: themeColors.primary }]}>
                        <Ionicons name="checkmark" size={14} color="white" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Color Theme Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>🎨 Color Theme</Text>
              <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
                Pick your favorite colors for the app
              </Text>
              
              <View style={styles.themesGrid}>
                {(Object.keys(THEME_COLORS) as ColorTheme[]).map((themeKey) => {
                  const theme = THEME_COLORS[themeKey];
                  const isSelected = colorTheme === themeKey;
                  
                  return (
                    <TouchableOpacity
                      key={themeKey}
                      style={[
                        styles.themeCard,
                        { backgroundColor: colors.card },
                        isSelected && styles.themeCardSelected,
                      ]}
                      onPress={() => setColorTheme(themeKey)}
                      activeOpacity={0.7}
                    >
                      <LinearGradient
                        colors={theme.gradient as [string, string]}
                        style={styles.themeGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <Text style={styles.themeEmoji}>{theme.emoji}</Text>
                        {isSelected && (
                          <View style={styles.selectedBadge}>
                            <Ionicons name="checkmark-circle" size={24} color="white" />
                          </View>
                        )}
                      </LinearGradient>
                      <Text style={[
                        styles.themeName,
                        { color: colors.text },
                        isSelected && { color: theme.primary, fontWeight: "700" }
                      ]}>
                        {theme.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Preview Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>👀 Preview</Text>
              <View style={[
                styles.previewCard,
                { backgroundColor: colors.card },
              ]}>
                <LinearGradient
                  colors={themeColors.gradient as [string, string]}
                  style={styles.previewHeader}
                >
                  <Text style={styles.previewHeaderText}>Your App Will Look Like This!</Text>
                </LinearGradient>
                <View style={[
                  styles.previewBody,
                  { backgroundColor: colors.surface },
                ]}>
                  <View style={[styles.previewItem, { backgroundColor: themeColors.primary + "20" }]}>
                    <Text style={styles.previewItemEmoji}>⭐</Text>
                    <Text style={[styles.previewItemText, { color: colors.text }]}>
                      Points: 250
                    </Text>
                  </View>
                  <View style={[styles.previewItem, { backgroundColor: themeColors.secondary + "20" }]}>
                    <Text style={styles.previewItemEmoji}>🔥</Text>
                    <Text style={[styles.previewItemText, { color: colors.text }]}>
                      Streak: 7 days
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Fun Tip */}
            <View style={[styles.tipCard, { backgroundColor: themeColors.accent + "40" }]}>
              <Text style={styles.tipEmoji}>💡</Text>
              <Text style={[styles.tipText, { color: isDark ? colors.text : themeColors.primary }]}>
                Tip: Try "Auto Magic" mode! It switches to dark mode at night automatically.
              </Text>
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "white",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 16,
  },
  modeContainer: {
    flexDirection: "row",
    gap: 12,
  },
  modeCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  modeCardSelected: {
    backgroundColor: "#FAFAFF",
  },
  modeEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  modeTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 2,
  },
  modeDescription: {
    fontSize: 11,
    color: "#64748B",
    textAlign: "center",
  },
  checkBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  themesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  themeCard: {
    width: THEME_CARD_WIDTH,
    backgroundColor: "white",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  themeCardSelected: {
    borderColor: "#1E293B",
  },
  themeGradient: {
    height: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  themeEmoji: {
    fontSize: 32,
  },
  selectedBadge: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  themeName: {
    fontSize: 13,
    fontWeight: "500",
    color: "#1E293B",
    textAlign: "center",
    paddingVertical: 10,
  },
  previewCard: {
    backgroundColor: "white",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  previewCardDark: {
    backgroundColor: "#1F2937",
  },
  previewHeader: {
    padding: 16,
    alignItems: "center",
  },
  previewHeaderText: {
    fontSize: 14,
    fontWeight: "600",
    color: "white",
  },
  previewBody: {
    padding: 16,
    gap: 12,
  },
  previewBodyDark: {
    backgroundColor: "#111827",
  },
  previewItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  previewItemEmoji: {
    fontSize: 20,
  },
  previewItemText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1E293B",
  },
  previewTextDark: {
    color: "#F9FAFB",
  },
  tipCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  tipEmoji: {
    fontSize: 24,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
});
