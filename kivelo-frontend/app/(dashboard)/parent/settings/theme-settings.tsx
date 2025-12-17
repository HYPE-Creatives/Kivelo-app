// app/(dashboard)/parent/settings/theme-settings.tsx
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
const THEME_CARD_WIDTH = (width - 56) / 2;

// Mode options
const MODE_OPTIONS: { mode: ThemeMode; icon: string; title: string; description: string }[] = [
  {
    mode: "light",
    icon: "sunny",
    title: "Light",
    description: "Bright appearance",
  },
  {
    mode: "dark",
    icon: "moon",
    title: "Dark",
    description: "Darker appearance",
  },
  {
    mode: "auto",
    icon: "phone-portrait",
    title: "System",
    description: "Match device settings",
  },
];

export default function ThemeSettingsScreen() {
  const router = useRouter();
  const { mode, colorTheme, isDark, colors, setMode, setColorTheme, themeColors, resetToDefaults } = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: themeColors.primary }]} edges={["top"]}>
      {/* Header */}
      <LinearGradient
        colors={themeColors.gradient as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Appearance</Text>
            <Text style={styles.headerSubtitle}>Customize your app theme</Text>
          </View>
          <TouchableOpacity
            style={styles.resetBtn}
            onPress={resetToDefaults}
          >
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Content */}
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Display Mode Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Display Mode</Text>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            Choose how the app appears on your screen
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
                <View style={[
                  styles.modeIconContainer,
                  mode === option.mode && { backgroundColor: themeColors.primary + "20" }
                ]}>
                  <Ionicons 
                    name={option.icon as any} 
                    size={24} 
                    color={mode === option.mode ? themeColors.primary : colors.textSecondary} 
                  />
                </View>
                <Text style={[
                  styles.modeTitle,
                  { color: colors.text },
                  mode === option.mode && { color: themeColors.primary }
                ]}>
                  {option.title}
                </Text>
                <Text style={[styles.modeDescription, { color: colors.textSecondary }]}>{option.description}</Text>
                {mode === option.mode && (
                  <View style={[styles.checkmark, { backgroundColor: themeColors.primary }]}>
                    <Ionicons name="checkmark" size={12} color="white" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Color Theme Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Color Theme</Text>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            Select a color theme for your app
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
                      <View style={styles.selectedIndicator}>
                        <Ionicons name="checkmark-circle" size={22} color="white" />
                      </View>
                    )}
                  </LinearGradient>
                  <View style={styles.themeInfo}>
                    <Text style={[
                      styles.themeName,
                      { color: colors.text },
                      isSelected && { color: theme.primary, fontWeight: "700" }
                    ]}>
                      {theme.name}
                    </Text>
                    <View style={styles.colorDots}>
                      <View style={[styles.colorDot, { backgroundColor: theme.primary }]} />
                      <View style={[styles.colorDot, { backgroundColor: theme.secondary }]} />
                      <View style={[styles.colorDot, { backgroundColor: theme.accent }]} />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Preview Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Preview</Text>
          <View style={[
            styles.previewCard,
            { backgroundColor: colors.card },
          ]}>
            <LinearGradient
              colors={themeColors.gradient as [string, string]}
              style={styles.previewHeader}
            >
              <Text style={styles.previewHeaderTitle}>Family Dashboard</Text>
              <View style={styles.previewStats}>
                <View style={styles.previewStatItem}>
                  <Text style={styles.previewStatValue}>3</Text>
                  <Text style={styles.previewStatLabel}>Children</Text>
                </View>
                <View style={styles.previewStatDivider} />
                <View style={styles.previewStatItem}>
                  <Text style={styles.previewStatValue}>450</Text>
                  <Text style={styles.previewStatLabel}>Points</Text>
                </View>
              </View>
            </LinearGradient>
            <View style={[styles.previewBody, { backgroundColor: colors.surface }]}>
              <View style={[styles.previewButton, { backgroundColor: themeColors.primary }]}>
                <Text style={styles.previewButtonText}>Primary Action</Text>
              </View>
              <View style={[styles.previewChip, { backgroundColor: themeColors.accent + "30" }]}>
                <Text style={[styles.previewChipText, { color: themeColors.primary }]}>
                  Accent Color
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Info */}
        <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
          <Ionicons name="information-circle" size={20} color={colors.textSecondary} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Theme changes are saved automatically and will persist across sessions.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#16A34A",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  resetBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 16,
  },
  resetText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 16,
  },
  modeContainer: {
    flexDirection: "row",
    gap: 12,
  },
  modeCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
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
  modeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  modeTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 2,
  },
  modeDescription: {
    fontSize: 11,
    color: "#6B7280",
    textAlign: "center",
  },
  checkmark: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
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
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  themeCardSelected: {
    borderColor: "#1F2937",
  },
  themeGradient: {
    height: 70,
    alignItems: "center",
    justifyContent: "center",
  },
  themeEmoji: {
    fontSize: 28,
  },
  selectedIndicator: {
    position: "absolute",
    top: 6,
    right: 6,
  },
  themeInfo: {
    padding: 12,
    alignItems: "center",
  },
  themeName: {
    fontSize: 13,
    fontWeight: "500",
    color: "#1F2937",
    marginBottom: 6,
  },
  colorDots: {
    flexDirection: "row",
    gap: 4,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  previewCard: {
    backgroundColor: "#FFFFFF",
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
  },
  previewHeaderTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
    marginBottom: 12,
  },
  previewStats: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    padding: 12,
  },
  previewStatItem: {
    flex: 1,
    alignItems: "center",
  },
  previewStatValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "white",
  },
  previewStatLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  previewStatDivider: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.3)",
    marginHorizontal: 12,
  },
  previewBody: {
    padding: 16,
    flexDirection: "row",
    gap: 12,
  },
  previewBodyDark: {
    backgroundColor: "#111827",
  },
  previewButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  previewButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "white",
  },
  previewChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  previewChipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
  },
});
