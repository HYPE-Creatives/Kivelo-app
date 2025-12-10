// app/(dashboard)/child/color-quest.tsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useGamification } from "../../../context/GamificationContext";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ACCESS_TOKEN_KEY = "kivelo_access_token";
const { width } = Dimensions.get("window");

// Primary colors that can be mixed
const PRIMARY_COLORS = {
  red: "#EF4444",
  yellow: "#FBBF24", 
  blue: "#3B82F6",
};

// Color mixing results
const COLOR_MIXTURES: Record<string, { result: string; name: string; hex: string }> = {
  "red+yellow": { result: "orange", name: "Orange", hex: "#F97316" },
  "yellow+red": { result: "orange", name: "Orange", hex: "#F97316" },
  "red+blue": { result: "purple", name: "Purple", hex: "#8B5CF6" },
  "blue+red": { result: "purple", name: "Purple", hex: "#8B5CF6" },
  "yellow+blue": { result: "green", name: "Green", hex: "#22C55E" },
  "blue+yellow": { result: "green", name: "Green", hex: "#22C55E" },
};

// Game modes
type GameMode = "learn" | "quiz" | "challenge";

// Challenge questions
interface Challenge {
  id: number;
  question: string;
  targetColor: string;
  targetHex: string;
  correctMix: [string, string];
  options: [string, string][];
}

const CHALLENGES: Challenge[] = [
  {
    id: 1,
    question: "Mix colors to make Orange! 🍊",
    targetColor: "orange",
    targetHex: "#F97316",
    correctMix: ["red", "yellow"],
    options: [["red", "yellow"], ["red", "blue"], ["yellow", "blue"]],
  },
  {
    id: 2,
    question: "Mix colors to make Purple! 🍇",
    targetColor: "purple", 
    targetHex: "#8B5CF6",
    correctMix: ["red", "blue"],
    options: [["red", "blue"], ["red", "yellow"], ["yellow", "blue"]],
  },
  {
    id: 3,
    question: "Mix colors to make Green! 🌿",
    targetColor: "green",
    targetHex: "#22C55E",
    correctMix: ["yellow", "blue"],
    options: [["yellow", "blue"], ["red", "yellow"], ["red", "blue"]],
  },
  {
    id: 4,
    question: "What makes a sunset color? 🌅",
    targetColor: "orange",
    targetHex: "#F97316",
    correctMix: ["red", "yellow"],
    options: [["yellow", "blue"], ["red", "yellow"], ["red", "blue"]],
  },
  {
    id: 5,
    question: "Mix colors for a grape! 🍇",
    targetColor: "purple",
    targetHex: "#8B5CF6",
    correctMix: ["red", "blue"],
    options: [["red", "yellow"], ["yellow", "blue"], ["red", "blue"]],
  },
  {
    id: 6,
    question: "Make the color of grass! 🌱",
    targetColor: "green",
    targetHex: "#22C55E",
    correctMix: ["yellow", "blue"],
    options: [["red", "blue"], ["red", "yellow"], ["yellow", "blue"]],
  },
];

export default function ColorQuest() {
  const router = useRouter();
  const { refreshStats } = useGamification();
  
  // Game state
  const [gameMode, setGameMode] = useState<GameMode | null>(null);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [mixedColor, setMixedColor] = useState<{ name: string; hex: string } | null>(null);
  const [showResult, setShowResult] = useState(false);
  
  // Challenge mode state
  const [currentChallenge, setCurrentChallenge] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  
  // Animations
  const mixAnimation = useRef(new Animated.Value(0)).current;
  const resultScale = useRef(new Animated.Value(0)).current;
  const shakeAnimation = useRef(new Animated.Value(0)).current;

  // Handle color selection in learn mode
  const handleColorSelect = (color: string) => {
    if (selectedColors.length < 2 && !selectedColors.includes(color)) {
      const newSelected = [...selectedColors, color];
      setSelectedColors(newSelected);
      
      if (newSelected.length === 2) {
        // Mix the colors
        setTimeout(() => mixColors(newSelected), 300);
      }
    }
  };

  // Mix colors and show result
  const mixColors = (colors: string[]) => {
    const mixKey = `${colors[0]}+${colors[1]}`;
    const result = COLOR_MIXTURES[mixKey];
    
    // Animate mixing
    Animated.sequence([
      Animated.timing(mixAnimation, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(resultScale, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();
    
    if (result) {
      setMixedColor(result);
    } else {
      setMixedColor({ name: "Same Color", hex: PRIMARY_COLORS[colors[0] as keyof typeof PRIMARY_COLORS] });
    }
    setShowResult(true);
  };

  // Reset learn mode
  const resetLearnMode = () => {
    setSelectedColors([]);
    setMixedColor(null);
    setShowResult(false);
    mixAnimation.setValue(0);
    resultScale.setValue(0);
  };

  // Handle challenge answer
  const handleChallengeAnswer = (optionIndex: number) => {
    if (showFeedback) return;
    
    setSelectedOption(optionIndex);
    const challenge = CHALLENGES[currentChallenge];
    const selectedMix = challenge.options[optionIndex];
    const correct = 
      (selectedMix[0] === challenge.correctMix[0] && selectedMix[1] === challenge.correctMix[1]) ||
      (selectedMix[0] === challenge.correctMix[1] && selectedMix[1] === challenge.correctMix[0]);
    
    setIsCorrect(correct);
    setShowFeedback(true);
    
    if (correct) {
      setScore(prev => prev + 10 + streak * 2);
      setStreak(prev => prev + 1);
      
      // Success animation
      Animated.spring(resultScale, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }).start();
    } else {
      setStreak(0);
      
      // Shake animation for wrong answer
      Animated.sequence([
        Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    }
    
    // Move to next question after delay
    setTimeout(() => {
      if (currentChallenge < CHALLENGES.length - 1) {
        setCurrentChallenge(prev => prev + 1);
        setSelectedOption(null);
        setShowFeedback(false);
        resultScale.setValue(0);
      } else {
        // Game complete
        setGameCompleted(true);
        awardPoints(score + (correct ? 10 + streak * 2 : 0));
      }
    }, 1500);
  };

  // Award points via API
  const awardPoints = useCallback(async (points: number) => {
    try {
      const accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
      if (!accessToken) return;

      const API_URLS = [
        "http://localhost:5000/api/v1",
        "https://family-wellness.onrender.com/api/v1",
      ];

      for (const baseUrl of API_URLS) {
        try {
          const response = await fetch(`${baseUrl}/gamification/self-points`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ 
              points: Math.min(points, 100), // Cap at 100
              reason: `Color Quest completed! Score: ${points}`,
              source: "game"
            }),
          });

          if (response.ok) {
            console.log("Points awarded successfully!");
            await refreshStats();
            return;
          }
        } catch (err) {
          console.log(`Failed to connect to ${baseUrl}, trying next...`);
        }
      }
    } catch (err) {
      console.error("Error awarding points:", err);
    }
  }, [refreshStats]);

  // Reset challenge mode
  const resetChallengeMode = () => {
    setCurrentChallenge(0);
    setScore(0);
    setStreak(0);
    setGameCompleted(false);
    setSelectedOption(null);
    setShowFeedback(false);
    resultScale.setValue(0);
  };

  // Get color display name
  const getColorName = (color: string) => {
    return color.charAt(0).toUpperCase() + color.slice(1);
  };

  // Mode selection screen
  if (!gameMode) {
    return (
      <LinearGradient colors={["#EC4899", "#F472B6", "#FBCFE8"]} style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Color Quest</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView contentContainerStyle={styles.modeSelection} showsVerticalScrollIndicator={false}>
            <View style={styles.iconCircle}>
              <Text style={styles.gameIcon}>🎨</Text>
            </View>
            <Text style={styles.modeTitle}>Choose Your Adventure!</Text>
            <Text style={styles.modeSubtitle}>Learn about colors and have fun mixing them!</Text>

            {/* Learn Mode */}
            <TouchableOpacity
              style={[styles.modeCard, { borderLeftColor: "#22C55E" }]}
              onPress={() => setGameMode("learn")}
              activeOpacity={0.8}
            >
              <View style={styles.modeCardHeader}>
                <View style={[styles.modeIcon, { backgroundColor: "#22C55E20" }]}>
                  <Text style={styles.modeEmoji}>🔬</Text>
                </View>
                <View style={styles.modeInfo}>
                  <Text style={styles.modeName}>Color Lab</Text>
                  <Text style={styles.modeDesc}>Mix colors freely and see what happens!</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Challenge Mode */}
            <TouchableOpacity
              style={[styles.modeCard, { borderLeftColor: "#F59E0B" }]}
              onPress={() => setGameMode("challenge")}
              activeOpacity={0.8}
            >
              <View style={styles.modeCardHeader}>
                <View style={[styles.modeIcon, { backgroundColor: "#F59E0B20" }]}>
                  <Text style={styles.modeEmoji}>🏆</Text>
                </View>
                <View style={styles.modeInfo}>
                  <Text style={styles.modeName}>Color Challenge</Text>
                  <Text style={styles.modeDesc}>Test your knowledge and earn points!</Text>
                </View>
                <View style={[styles.pointsBadge, { backgroundColor: "#F59E0B" }]}>
                  <Text style={styles.pointsText}>+60 pts</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Color Theory Info */}
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>🌈 Did you know?</Text>
              <Text style={styles.infoText}>
                Red, Yellow, and Blue are called PRIMARY colors. When you mix two primary colors, you get SECONDARY colors like Orange, Green, and Purple!
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // Learn Mode (Color Lab)
  if (gameMode === "learn") {
    return (
      <LinearGradient colors={["#EC4899", "#F472B6", "#FBCFE8"]} style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => setGameMode(null)}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Color Lab 🔬</Text>
            <TouchableOpacity style={styles.resetButton} onPress={resetLearnMode}>
              <Ionicons name="refresh" size={22} color="white" />
            </TouchableOpacity>
          </View>

          <View style={styles.labContainer}>
            {/* Instructions */}
            <View style={styles.instructionCard}>
              <Text style={styles.instructionText}>
                {selectedColors.length === 0 
                  ? "Tap two colors to mix them!" 
                  : selectedColors.length === 1 
                    ? `You picked ${getColorName(selectedColors[0])}! Pick one more!`
                    : "Mixing..."}
              </Text>
            </View>

            {/* Color Palette */}
            <View style={styles.paletteContainer}>
              {Object.entries(PRIMARY_COLORS).map(([name, hex]) => (
                <TouchableOpacity
                  key={name}
                  style={[
                    styles.colorButton,
                    { backgroundColor: hex },
                    selectedColors.includes(name) && styles.colorButtonSelected,
                  ]}
                  onPress={() => handleColorSelect(name)}
                  disabled={showResult}
                  activeOpacity={0.7}
                >
                  <Text style={styles.colorButtonText}>{getColorName(name)}</Text>
                  {selectedColors.includes(name) && (
                    <Ionicons name="checkmark-circle" size={24} color="white" style={styles.checkIcon} />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Mixing Area */}
            {selectedColors.length === 2 && (
              <Animated.View 
                style={[
                  styles.mixingArea,
                  { 
                    opacity: mixAnimation,
                    transform: [{ scale: mixAnimation }]
                  }
                ]}
              >
                <View style={styles.mixingVisual}>
                  <View style={[styles.mixColor, { backgroundColor: PRIMARY_COLORS[selectedColors[0] as keyof typeof PRIMARY_COLORS] }]} />
                  <Text style={styles.plusSign}>+</Text>
                  <View style={[styles.mixColor, { backgroundColor: PRIMARY_COLORS[selectedColors[1] as keyof typeof PRIMARY_COLORS] }]} />
                  <Text style={styles.equalsSign}>=</Text>
                </View>
              </Animated.View>
            )}

            {/* Result */}
            {showResult && mixedColor && (
              <Animated.View 
                style={[
                  styles.resultContainer,
                  { transform: [{ scale: resultScale }] }
                ]}
              >
                <View style={[styles.resultColor, { backgroundColor: mixedColor.hex }]}>
                  <Text style={styles.resultEmoji}>✨</Text>
                </View>
                <Text style={styles.resultName}>{mixedColor.name}!</Text>
                <Text style={styles.resultHint}>
                  {getColorName(selectedColors[0])} + {getColorName(selectedColors[1])} = {mixedColor.name}
                </Text>
                <TouchableOpacity style={styles.tryAgainButton} onPress={resetLearnMode}>
                  <Text style={styles.tryAgainText}>Try Another Mix!</Text>
                </TouchableOpacity>
              </Animated.View>
            )}

            {/* Color Chart */}
            <View style={styles.colorChart}>
              <Text style={styles.chartTitle}>Color Mixing Chart</Text>
              <View style={styles.chartRow}>
                <View style={[styles.chartColor, { backgroundColor: PRIMARY_COLORS.red }]} />
                <Text style={styles.chartPlus}>+</Text>
                <View style={[styles.chartColor, { backgroundColor: PRIMARY_COLORS.yellow }]} />
                <Text style={styles.chartEquals}>=</Text>
                <View style={[styles.chartColor, { backgroundColor: "#F97316" }]} />
                <Text style={styles.chartName}>Orange</Text>
              </View>
              <View style={styles.chartRow}>
                <View style={[styles.chartColor, { backgroundColor: PRIMARY_COLORS.red }]} />
                <Text style={styles.chartPlus}>+</Text>
                <View style={[styles.chartColor, { backgroundColor: PRIMARY_COLORS.blue }]} />
                <Text style={styles.chartEquals}>=</Text>
                <View style={[styles.chartColor, { backgroundColor: "#8B5CF6" }]} />
                <Text style={styles.chartName}>Purple</Text>
              </View>
              <View style={styles.chartRow}>
                <View style={[styles.chartColor, { backgroundColor: PRIMARY_COLORS.yellow }]} />
                <Text style={styles.chartPlus}>+</Text>
                <View style={[styles.chartColor, { backgroundColor: PRIMARY_COLORS.blue }]} />
                <Text style={styles.chartEquals}>=</Text>
                <View style={[styles.chartColor, { backgroundColor: "#22C55E" }]} />
                <Text style={styles.chartName}>Green</Text>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // Challenge Mode
  if (gameMode === "challenge") {
    const challenge = CHALLENGES[currentChallenge];
    
    // Game completed screen
    if (gameCompleted) {
      const stars = score >= 50 ? 3 : score >= 30 ? 2 : 1;
      
      return (
        <LinearGradient colors={["#EC4899", "#F472B6", "#FBCFE8"]} style={styles.container}>
          <SafeAreaView style={styles.safeArea} edges={["top"]}>
            <View style={styles.completionContainer}>
              <View style={styles.completionCard}>
                <Text style={styles.completionEmoji}>🎨</Text>
                <Text style={styles.completionTitle}>Amazing Artist!</Text>
                <Text style={styles.completionSubtitle}>You completed the Color Quest!</Text>
                
                {/* Stars */}
                <View style={styles.starsContainer}>
                  {[1, 2, 3].map((star) => (
                    <Ionicons
                      key={star}
                      name={star <= stars ? "star" : "star-outline"}
                      size={40}
                      color={star <= stars ? "#F59E0B" : "#D1D5DB"}
                    />
                  ))}
                </View>
                
                {/* Score */}
                <View style={styles.scoreContainer}>
                  <View style={styles.scoreItem}>
                    <Text style={styles.scoreValue}>{score}</Text>
                    <Text style={styles.scoreLabel}>Score</Text>
                  </View>
                  <View style={styles.scoreItem}>
                    <Text style={styles.scoreValue}>{Math.min(score, 100)}</Text>
                    <Text style={styles.scoreLabel}>Points Earned</Text>
                  </View>
                </View>
                
                <TouchableOpacity style={styles.playAgainBtn} onPress={resetChallengeMode}>
                  <Text style={styles.playAgainBtnText}>Play Again</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.backToMenuBtn} onPress={() => setGameMode(null)}>
                  <Text style={styles.backToMenuText}>Back to Menu</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.exitBtn} onPress={() => router.back()}>
                  <Text style={styles.exitText}>Back to Games</Text>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>
      );
    }

    return (
      <LinearGradient colors={["#EC4899", "#F472B6", "#FBCFE8"]} style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
          {/* Header with stats */}
          <View style={styles.challengeHeader}>
            <TouchableOpacity style={styles.backButton} onPress={() => {
              Alert.alert("Leave Challenge?", "Your progress will be lost!", [
                { text: "Stay", style: "cancel" },
                { text: "Leave", onPress: () => setGameMode(null), style: "destructive" }
              ]);
            }}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            
            <View style={styles.challengeStats}>
              <View style={styles.statBadge}>
                <Ionicons name="star" size={16} color="#F59E0B" />
                <Text style={styles.statBadgeText}>{score}</Text>
              </View>
              <View style={styles.statBadge}>
                <Ionicons name="flame" size={16} color="#EF4444" />
                <Text style={styles.statBadgeText}>{streak}</Text>
              </View>
            </View>
          </View>

          {/* Progress bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${((currentChallenge + 1) / CHALLENGES.length) * 100}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>{currentChallenge + 1} / {CHALLENGES.length}</Text>
          </View>

          {/* Challenge content */}
          <Animated.View 
            style={[
              styles.challengeContent,
              { transform: [{ translateX: shakeAnimation }] }
            ]}
          >
            {/* Question */}
            <Text style={styles.questionText}>{challenge.question}</Text>
            
            {/* Target color preview */}
            <View style={styles.targetContainer}>
              <Text style={styles.targetLabel}>Make this color:</Text>
              <View style={[styles.targetColor, { backgroundColor: challenge.targetHex }]}>
                <Text style={styles.targetColorName}>{challenge.targetColor.toUpperCase()}</Text>
              </View>
            </View>

            {/* Options */}
            <View style={styles.optionsContainer}>
              {challenge.options.map((option, index) => {
                const isSelected = selectedOption === index;
                const mixKey = `${option[0]}+${option[1]}`;
                const resultColor = COLOR_MIXTURES[mixKey]?.hex || "#888";
                
                let optionStyle = styles.optionButton;
                if (showFeedback && isSelected) {
                  optionStyle = isCorrect ? styles.optionCorrect : styles.optionWrong;
                }
                
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.optionButton, showFeedback && isSelected && (isCorrect ? styles.optionCorrect : styles.optionWrong)]}
                    onPress={() => handleChallengeAnswer(index)}
                    disabled={showFeedback}
                    activeOpacity={0.7}
                  >
                    <View style={styles.optionColors}>
                      <View style={[styles.optionColor, { backgroundColor: PRIMARY_COLORS[option[0] as keyof typeof PRIMARY_COLORS] }]} />
                      <Text style={styles.optionPlus}>+</Text>
                      <View style={[styles.optionColor, { backgroundColor: PRIMARY_COLORS[option[1] as keyof typeof PRIMARY_COLORS] }]} />
                    </View>
                    <Text style={styles.optionText}>
                      {getColorName(option[0])} + {getColorName(option[1])}
                    </Text>
                    {showFeedback && isSelected && (
                      <Ionicons 
                        name={isCorrect ? "checkmark-circle" : "close-circle"} 
                        size={28} 
                        color={isCorrect ? "#22C55E" : "#EF4444"} 
                        style={styles.feedbackIcon}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Feedback message */}
            {showFeedback && (
              <Animated.View style={[styles.feedbackContainer, { transform: [{ scale: resultScale }] }]}>
                <Text style={[styles.feedbackText, { color: isCorrect ? "#22C55E" : "#EF4444" }]}>
                  {isCorrect ? "🎉 Correct! Great job!" : "❌ Not quite! Keep learning!"}
                </Text>
              </Animated.View>
            )}
          </Animated.View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return null;
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "white",
  },
  resetButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  
  // Mode Selection
  modeSelection: {
    alignItems: "center",
    padding: 20,
    paddingBottom: 40,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  gameIcon: {
    fontSize: 50,
  },
  modeTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    marginBottom: 8,
    textAlign: "center",
  },
  modeSubtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 30,
    textAlign: "center",
  },
  modeCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    width: "100%",
    marginBottom: 16,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  modeCardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  modeIcon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  modeEmoji: {
    fontSize: 28,
  },
  modeInfo: {
    flex: 1,
    marginLeft: 14,
  },
  modeName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
  },
  modeDesc: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 2,
  },
  pointsBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  pointsText: {
    color: "white",
    fontSize: 13,
    fontWeight: "700",
  },
  infoCard: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 16,
    padding: 16,
    width: "100%",
    marginTop: 10,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "white",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    lineHeight: 20,
  },

  // Learn Mode (Color Lab)
  labContainer: {
    flex: 1,
    padding: 16,
  },
  instructionCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    alignItems: "center",
  },
  instructionText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    textAlign: "center",
  },
  paletteContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 24,
  },
  colorButton: {
    width: (width - 80) / 3,
    height: 80,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  colorButtonSelected: {
    borderWidth: 4,
    borderColor: "white",
    transform: [{ scale: 1.05 }],
  },
  colorButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  checkIcon: {
    position: "absolute",
    top: 4,
    right: 4,
  },
  mixingArea: {
    alignItems: "center",
    marginBottom: 20,
  },
  mixingVisual: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
  },
  mixColor: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  plusSign: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#64748b",
    marginHorizontal: 12,
  },
  equalsSign: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#64748b",
    marginLeft: 12,
  },
  resultContainer: {
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  resultColor: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  resultEmoji: {
    fontSize: 40,
  },
  resultName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 8,
  },
  resultHint: {
    fontSize: 16,
    color: "#64748b",
    marginBottom: 16,
  },
  tryAgainButton: {
    backgroundColor: "#EC4899",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  tryAgainText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  colorChart: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginTop: "auto",
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 12,
    textAlign: "center",
  },
  chartRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  chartColor: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  chartPlus: {
    fontSize: 14,
    color: "#64748b",
    marginHorizontal: 6,
  },
  chartEquals: {
    fontSize: 14,
    color: "#64748b",
    marginHorizontal: 6,
  },
  chartName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
    marginLeft: 8,
    width: 60,
  },

  // Challenge Mode
  challengeHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  challengeStats: {
    flexDirection: "row",
    gap: 12,
  },
  statBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  statBadgeText: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
  },
  progressContainer: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  progressBar: {
    height: 8,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "white",
    borderRadius: 4,
  },
  progressText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    textAlign: "center",
    marginTop: 6,
  },
  challengeContent: {
    flex: 1,
    padding: 16,
  },
  questionText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    marginBottom: 24,
  },
  targetContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  targetLabel: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 12,
  },
  targetColor: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  targetColorName: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optionCorrect: {
    backgroundColor: "#D1FAE5",
    borderWidth: 2,
    borderColor: "#22C55E",
  },
  optionWrong: {
    backgroundColor: "#FEE2E2",
    borderWidth: 2,
    borderColor: "#EF4444",
  },
  optionColors: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },
  optionColor: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  optionPlus: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#64748b",
    marginHorizontal: 6,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
  },
  feedbackIcon: {
    marginLeft: "auto",
  },
  feedbackContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  feedbackText: {
    fontSize: 20,
    fontWeight: "bold",
  },

  // Completion Screen
  completionContainer: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  completionCard: {
    backgroundColor: "white",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
  },
  completionEmoji: {
    fontSize: 60,
    marginBottom: 12,
  },
  completionTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#EC4899",
    marginBottom: 4,
  },
  completionSubtitle: {
    fontSize: 16,
    color: "#64748b",
    marginBottom: 20,
  },
  starsContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 24,
  },
  scoreContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 24,
    paddingVertical: 16,
    backgroundColor: "#f8fafc",
    borderRadius: 16,
  },
  scoreItem: {
    alignItems: "center",
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1e293b",
  },
  scoreLabel: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  playAgainBtn: {
    backgroundColor: "#EC4899",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
    width: "100%",
    marginBottom: 12,
  },
  playAgainBtnText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  backToMenuBtn: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
    width: "100%",
    marginBottom: 12,
  },
  backToMenuText: {
    color: "#64748b",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  exitBtn: {
    paddingVertical: 10,
  },
  exitText: {
    color: "#94a3b8",
    fontSize: 14,
    fontWeight: "500",
  },
});
