// app/(dashboard)/child/memory-match.tsx
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
const CARD_MARGIN = 6;
const GRID_PADDING = 16;

// Difficulty configurations
const DIFFICULTY_CONFIG = {
  easy: { pairs: 6, gridCols: 3, points: 20, timeBonus: 60 },
  medium: { pairs: 8, gridCols: 4, points: 35, timeBonus: 90 },
  hard: { pairs: 10, gridCols: 5, points: 50, timeBonus: 120 },
};

// Fun emoji pairs for matching
const EMOJI_SETS = [
  "🐶", "🐱", "🐰", "🦊", "🐻", "🐼", "🐨", "🦁", "🐸", "🐵",
  "🌟", "🌙", "☀️", "🌈", "⭐", "💫", "✨", "🔥", "💎", "🎈",
  "🍎", "🍓", "🍊", "🍋", "🍇", "🍉", "🍒", "🥝", "🍑", "🥭",
  "🚀", "🎮", "🎨", "🎵", "🎪", "🏆", "🎁", "🎯", "🎲", "🧩",
];

type Difficulty = "easy" | "medium" | "hard";

interface Card {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
  flipAnim: Animated.Value;
}

export default function MemoryMatch() {
  const router = useRouter();
  const { refreshStats } = useGamification();
  
  // Game state
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  
  // Timer interval ref
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Calculate card size based on grid columns
  const getCardSize = (cols: number) => {
    const totalMargin = (cols + 1) * CARD_MARGIN * 2;
    const availableWidth = width - (GRID_PADDING * 2) - totalMargin;
    return Math.floor(availableWidth / cols);
  };

  // Initialize game with selected difficulty
  const initializeGame = useCallback((diff: Difficulty) => {
    const config = DIFFICULTY_CONFIG[diff];
    
    // Select random emojis for this game
    const shuffledEmojis = [...EMOJI_SETS].sort(() => Math.random() - 0.5);
    const selectedEmojis = shuffledEmojis.slice(0, config.pairs);
    
    // Create pairs and shuffle
    const cardPairs = [...selectedEmojis, ...selectedEmojis];
    const shuffledCards = cardPairs
      .sort(() => Math.random() - 0.5)
      .map((emoji, index) => ({
        id: index,
        emoji,
        isFlipped: false,
        isMatched: false,
        flipAnim: new Animated.Value(0),
      }));

    setCards(shuffledCards);
    setFlippedCards([]);
    setMoves(0);
    setMatchedPairs(0);
    setTimer(0);
    setGameStarted(true);
    setGameCompleted(false);
    setShowCelebration(false);
    setDifficulty(diff);
  }, []);

  // Start timer when game begins
  useEffect(() => {
    if (gameStarted && !gameCompleted) {
      timerRef.current = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [gameStarted, gameCompleted]);

  // Flip card animation
  const flipCard = (cardId: number, toValue: number) => {
    const card = cards.find(c => c.id === cardId);
    if (card) {
      Animated.timing(card.flipAnim, {
        toValue,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  // Handle card press
  const handleCardPress = useCallback((cardId: number) => {
    if (isProcessing || gameCompleted) return;

    const card = cards.find(c => c.id === cardId);
    if (!card || card.isFlipped || card.isMatched) return;

    // Flip the card
    flipCard(cardId, 1);
    
    setCards(prev => prev.map(c => 
      c.id === cardId ? { ...c, isFlipped: true } : c
    ));

    const newFlipped = [...flippedCards, cardId];
    setFlippedCards(newFlipped);

    // Check for match if two cards are flipped
    if (newFlipped.length === 2) {
      setMoves(prev => prev + 1);
      setIsProcessing(true);

      const [firstId, secondId] = newFlipped;
      const firstCard = cards.find(c => c.id === firstId);
      const secondCard = cards.find(c => c.id === secondId);

      if (firstCard && secondCard && firstCard.emoji === secondCard.emoji) {
        // Match found!
        setTimeout(() => {
          setCards(prev => prev.map(c => 
            c.id === firstId || c.id === secondId
              ? { ...c, isMatched: true }
              : c
          ));
          setMatchedPairs(prev => prev + 1);
          setFlippedCards([]);
          setIsProcessing(false);
        }, 500);
      } else {
        // No match - flip back
        setTimeout(() => {
          flipCard(firstId, 0);
          flipCard(secondId, 0);
          setCards(prev => prev.map(c => 
            c.id === firstId || c.id === secondId
              ? { ...c, isFlipped: false }
              : c
          ));
          setFlippedCards([]);
          setIsProcessing(false);
        }, 1000);
      }
    }
  }, [cards, flippedCards, isProcessing, gameCompleted]);

  // Award points via API
  const awardPoints = useCallback(async (points: number, reason: string) => {
    try {
      const accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
      if (!accessToken) {
        console.log("No access token, skipping points award");
        return false;
      }

      // Try to award points via backend
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
            body: JSON.stringify({ points, reason }),
          });

          if (response.ok) {
            console.log("Points awarded successfully!");
            return true;
          }
        } catch (err) {
          console.log(`Failed to connect to ${baseUrl}, trying next...`);
        }
      }

      // If dedicated endpoint fails, try standard endpoint
      console.log("Using fallback - points will sync on next refresh");
      return false;
    } catch (err) {
      console.error("Error awarding points:", err);
      return false;
    }
  }, []);

  // Check for game completion
  useEffect(() => {
    if (difficulty && matchedPairs === DIFFICULTY_CONFIG[difficulty].pairs) {
      setGameCompleted(true);
      setShowCelebration(true);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      // Calculate points
      const config = DIFFICULTY_CONFIG[difficulty];
      let points = config.points;
      
      // Time bonus: extra points for fast completion
      if (timer < config.timeBonus) {
        const timeBonus = Math.floor((config.timeBonus - timer) / 10) * 5;
        points += timeBonus;
      }
      
      // Efficiency bonus: fewer moves = more points
      const perfectMoves = config.pairs;
      if (moves <= perfectMoves * 2) {
        points += 10;
      }

      setPointsEarned(points);

      // Award points and refresh stats
      setTimeout(async () => {
        await awardPoints(points, `Memory Match (${difficulty}) completed!`);
        await refreshStats();
      }, 1500);
    }
  }, [matchedPairs, difficulty, timer, moves, awardPoints, refreshStats]);

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Render difficulty selection screen
  if (!difficulty) {
    return (
      <LinearGradient colors={["#7C3AED", "#A78BFA", "#C4B5FD"]} style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Memory Match</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Difficulty Selection */}
          <ScrollView 
            contentContainerStyle={styles.selectionContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.iconCircle}>
              <Text style={styles.gameIcon}>🧠</Text>
            </View>
            <Text style={styles.selectionTitle}>Choose Your Challenge!</Text>
            <Text style={styles.selectionSubtitle}>
              Match the pairs and train your brain
            </Text>

            {/* Easy */}
            <TouchableOpacity
              style={[styles.difficultyCard, { borderLeftColor: "#22C55E" }]}
              onPress={() => initializeGame("easy")}
              activeOpacity={0.8}
            >
              <View style={styles.difficultyHeader}>
                <View style={[styles.difficultyIcon, { backgroundColor: "#22C55E20" }]}>
                  <Text style={styles.difficultyEmoji}>😊</Text>
                </View>
                <View style={styles.difficultyInfo}>
                  <Text style={styles.difficultyName}>Easy</Text>
                  <Text style={styles.difficultyDesc}>6 pairs • 3×4 grid</Text>
                </View>
                <View style={[styles.pointsBadge, { backgroundColor: "#22C55E" }]}>
                  <Text style={styles.pointsText}>+20 pts</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Medium */}
            <TouchableOpacity
              style={[styles.difficultyCard, { borderLeftColor: "#F59E0B" }]}
              onPress={() => initializeGame("medium")}
              activeOpacity={0.8}
            >
              <View style={styles.difficultyHeader}>
                <View style={[styles.difficultyIcon, { backgroundColor: "#F59E0B20" }]}>
                  <Text style={styles.difficultyEmoji}>🤔</Text>
                </View>
                <View style={styles.difficultyInfo}>
                  <Text style={styles.difficultyName}>Medium</Text>
                  <Text style={styles.difficultyDesc}>8 pairs • 4×4 grid</Text>
                </View>
                <View style={[styles.pointsBadge, { backgroundColor: "#F59E0B" }]}>
                  <Text style={styles.pointsText}>+35 pts</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Hard */}
            <TouchableOpacity
              style={[styles.difficultyCard, { borderLeftColor: "#EF4444" }]}
              onPress={() => initializeGame("hard")}
              activeOpacity={0.8}
            >
              <View style={styles.difficultyHeader}>
                <View style={[styles.difficultyIcon, { backgroundColor: "#EF444420" }]}>
                  <Text style={styles.difficultyEmoji}>😤</Text>
                </View>
                <View style={styles.difficultyInfo}>
                  <Text style={styles.difficultyName}>Hard</Text>
                  <Text style={styles.difficultyDesc}>10 pairs • 5×4 grid</Text>
                </View>
                <View style={[styles.pointsBadge, { backgroundColor: "#EF4444" }]}>
                  <Text style={styles.pointsText}>+50 pts</Text>
                </View>
              </View>
            </TouchableOpacity>

            <Text style={styles.tipText}>
              💡 Tip: Complete faster with fewer moves for bonus points!
            </Text>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const config = DIFFICULTY_CONFIG[difficulty];
  const cardSize = getCardSize(config.gridCols);

  // Render game screen
  return (
    <LinearGradient colors={["#7C3AED", "#A78BFA", "#C4B5FD"]} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        {/* Game Header */}
        <View style={styles.gameHeader}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => {
              Alert.alert(
                "Leave Game?",
                "Your progress will be lost!",
                [
                  { text: "Stay", style: "cancel" },
                  { text: "Leave", onPress: () => setDifficulty(null), style: "destructive" }
                ]
              );
            }}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={18} color="white" />
              <Text style={styles.statText}>{formatTime(timer)}</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="swap-horizontal" size={18} color="white" />
              <Text style={styles.statText}>{moves}</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="checkmark-circle" size={18} color="white" />
              <Text style={styles.statText}>{matchedPairs}/{config.pairs}</Text>
            </View>
          </View>
        </View>

        {/* Game Board */}
        <View style={styles.boardContainer}>
          <View style={[
            styles.gameBoard,
            { 
              width: cardSize * config.gridCols + CARD_MARGIN * (config.gridCols + 1) * 2 + 20,
            }
          ]}>
            <View style={styles.cardsGrid}>
              {cards.map((card) => {
                const frontInterpolate = card.flipAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0deg", "180deg"],
                });
                const backInterpolate = card.flipAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["180deg", "360deg"],
                });

                return (
                  <TouchableOpacity
                    key={card.id}
                    onPress={() => handleCardPress(card.id)}
                    disabled={card.isFlipped || card.isMatched || isProcessing}
                    activeOpacity={0.8}
                    style={{ margin: CARD_MARGIN }}
                  >
                    <View style={[styles.cardContainer, { width: cardSize, height: cardSize }]}>
                      {/* Card Back (Question Mark) */}
                      <Animated.View
                        style={[
                          styles.card,
                          styles.cardBack,
                          { 
                            width: cardSize, 
                            height: cardSize,
                            transform: [{ rotateY: frontInterpolate }],
                          },
                          card.isMatched && styles.cardMatched,
                        ]}
                      >
                        <Text style={[styles.cardBackText, { fontSize: cardSize * 0.4 }]}>❓</Text>
                      </Animated.View>
                      
                      {/* Card Front (Emoji) */}
                      <Animated.View
                        style={[
                          styles.card,
                          styles.cardFront,
                          { 
                            width: cardSize, 
                            height: cardSize,
                            transform: [{ rotateY: backInterpolate }],
                          },
                          card.isMatched && styles.cardMatched,
                        ]}
                      >
                        <Text style={[styles.cardEmoji, { fontSize: cardSize * 0.5 }]}>
                          {card.emoji}
                        </Text>
                      </Animated.View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* Celebration Modal */}
        {showCelebration && (
          <View style={styles.celebrationOverlay}>
            <View style={styles.celebrationModal}>
              <Text style={styles.celebrationEmoji}>🎉</Text>
              <Text style={styles.celebrationTitle}>Amazing!</Text>
              <Text style={styles.celebrationSubtitle}>You completed the puzzle!</Text>
              
              <View style={styles.resultsContainer}>
                <View style={styles.resultItem}>
                  <Ionicons name="time" size={24} color="#7C3AED" />
                  <Text style={styles.resultValue}>{formatTime(timer)}</Text>
                  <Text style={styles.resultLabel}>Time</Text>
                </View>
                <View style={styles.resultItem}>
                  <Ionicons name="swap-horizontal" size={24} color="#7C3AED" />
                  <Text style={styles.resultValue}>{moves}</Text>
                  <Text style={styles.resultLabel}>Moves</Text>
                </View>
                <View style={styles.resultItem}>
                  <Ionicons name="star" size={24} color="#F59E0B" />
                  <Text style={styles.resultValue}>+{pointsEarned}</Text>
                  <Text style={styles.resultLabel}>Points</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.playAgainButton}
                onPress={() => initializeGame(difficulty)}
              >
                <Text style={styles.playAgainText}>Play Again</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.changeDifficultyButton}
                onPress={() => setDifficulty(null)}
              >
                <Text style={styles.changeDifficultyText}>Change Difficulty</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.exitButton}
                onPress={() => router.back()}
              >
                <Text style={styles.exitText}>Back to Games</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
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
  selectionContainer: {
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
  selectionTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    marginBottom: 8,
    textAlign: "center",
  },
  selectionSubtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 30,
    textAlign: "center",
  },
  difficultyCard: {
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
  difficultyHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  difficultyIcon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  difficultyEmoji: {
    fontSize: 28,
  },
  difficultyInfo: {
    flex: 1,
    marginLeft: 14,
  },
  difficultyName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
  },
  difficultyDesc: {
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
  tipText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    marginTop: 20,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  gameHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  statsContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 20,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  boardContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: GRID_PADDING,
  },
  gameBoard: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 20,
    padding: 10,
  },
  cardsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  cardContainer: {
    // perspective is not supported on React Native, using transform instead
  },
  card: {
    position: "absolute",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backfaceVisibility: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  cardBack: {
    backgroundColor: "white",
  },
  cardFront: {
    backgroundColor: "#FEF3C7",
  },
  cardMatched: {
    backgroundColor: "#D1FAE5",
    borderWidth: 2,
    borderColor: "#22C55E",
  },
  cardBackText: {
    opacity: 0.6,
  },
  cardEmoji: {},
  celebrationOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  celebrationModal: {
    backgroundColor: "white",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    width: "100%",
    maxWidth: 340,
  },
  celebrationEmoji: {
    fontSize: 60,
    marginBottom: 12,
  },
  celebrationTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#7C3AED",
    marginBottom: 4,
  },
  celebrationSubtitle: {
    fontSize: 16,
    color: "#64748b",
    marginBottom: 20,
  },
  resultsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 24,
    paddingVertical: 16,
    backgroundColor: "#f8fafc",
    borderRadius: 16,
  },
  resultItem: {
    alignItems: "center",
  },
  resultValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1e293b",
    marginTop: 6,
  },
  resultLabel: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  playAgainButton: {
    backgroundColor: "#7C3AED",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
    width: "100%",
    marginBottom: 12,
  },
  playAgainText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  changeDifficultyButton: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
    width: "100%",
    marginBottom: 12,
  },
  changeDifficultyText: {
    color: "#64748b",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  exitButton: {
    paddingVertical: 10,
  },
  exitText: {
    color: "#94a3b8",
    fontSize: 14,
    fontWeight: "500",
  },
});
