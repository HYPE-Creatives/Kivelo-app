// app/(dashboard)/child/space-explorer.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Modal,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ============ GAME DATA ============
const PLANETS = [
  { id: 1, name: "Mercury", emoji: "🪨", color: "#94A3B8", size: 40, fact: "Mercury is the smallest planet and closest to the Sun!", distance: "58M km" },
  { id: 2, name: "Venus", emoji: "🟡", color: "#FCD34D", size: 50, fact: "Venus spins backwards compared to other planets!", distance: "108M km" },
  { id: 3, name: "Earth", emoji: "🌍", color: "#3B82F6", size: 52, fact: "Earth is the only planet known to have life!", distance: "150M km" },
  { id: 4, name: "Mars", emoji: "🔴", color: "#EF4444", size: 45, fact: "Mars has the largest volcano in the solar system - Olympus Mons!", distance: "228M km" },
  { id: 5, name: "Jupiter", emoji: "🟤", color: "#F97316", size: 80, fact: "Jupiter is so big that 1,300 Earths could fit inside it!", distance: "778M km" },
  { id: 6, name: "Saturn", emoji: "🪐", color: "#EAB308", size: 75, fact: "Saturn's rings are made of ice and rock particles!", distance: "1.4B km" },
  { id: 7, name: "Uranus", emoji: "🔵", color: "#06B6D4", size: 60, fact: "Uranus rotates on its side like a rolling ball!", distance: "2.9B km" },
  { id: 8, name: "Neptune", emoji: "💙", color: "#2563EB", size: 58, fact: "Neptune has the strongest winds in the solar system!", distance: "4.5B km" },
];

const SPACE_QUIZ = [
  { q: "What is the closest star to Earth?", options: ["The Sun", "Alpha Centauri", "Sirius", "Polaris"], answer: 0, fact: "The Sun is about 93 million miles away from Earth!" },
  { q: "How many planets are in our solar system?", options: ["7", "8", "9", "10"], answer: 1, fact: "Pluto was reclassified as a dwarf planet in 2006." },
  { q: "Which planet is known as the Red Planet?", options: ["Venus", "Jupiter", "Mars", "Mercury"], answer: 2, fact: "Mars appears red due to iron oxide (rust) on its surface!" },
  { q: "What is the largest planet?", options: ["Saturn", "Jupiter", "Neptune", "Uranus"], answer: 1, fact: "Jupiter's Great Red Spot is a storm larger than Earth!" },
  { q: "Which planet has the most moons?", options: ["Jupiter", "Saturn", "Uranus", "Neptune"], answer: 1, fact: "Saturn has 146 known moons!" },
  { q: "What is a shooting star?", options: ["A dying star", "A meteor", "A comet", "A satellite"], answer: 1, fact: "Meteors burn up in Earth's atmosphere, creating bright streaks!" },
  { q: "How long does it take Earth to orbit the Sun?", options: ["24 hours", "30 days", "365 days", "100 days"], answer: 2, fact: "This is why we have years!" },
  { q: "What is the Milky Way?", options: ["A candy bar", "Our galaxy", "A planet", "A star"], answer: 1, fact: "The Milky Way contains 100-400 billion stars!" },
  { q: "Which planet is famous for its rings?", options: ["Mars", "Jupiter", "Saturn", "Venus"], answer: 2, fact: "Saturn's rings extend up to 282,000 km from the planet!" },
  { q: "What do astronauts wear in space?", options: ["Pajamas", "Space suits", "Swimsuits", "Uniforms"], answer: 1, fact: "Space suits protect astronauts and provide oxygen!" },
  { q: "What is the Moon?", options: ["A planet", "A star", "Earth's satellite", "An asteroid"], answer: 2, fact: "The Moon is about 384,400 km from Earth!" },
  { q: "Which planet rotates the fastest?", options: ["Earth", "Jupiter", "Mars", "Venus"], answer: 1, fact: "Jupiter completes a rotation in just 10 hours!" },
  { q: "What causes day and night?", options: ["The Moon", "Earth's rotation", "The Sun moving", "Clouds"], answer: 1, fact: "Earth spins once every 24 hours!" },
  { q: "What is a constellation?", options: ["A planet", "A star pattern", "A galaxy", "A meteor"], answer: 1, fact: "There are 88 official constellations!" },
  { q: "How old is the Sun?", options: ["1 million years", "4.6 billion years", "100 years", "1 billion years"], answer: 1, fact: "The Sun is middle-aged for a star!" },
];

const STAR_LEVELS = [
  { id: 1, name: "Asteroid Field", stars: 10, time: 20, speed: 1500 },
  { id: 2, name: "Nebula Zone", stars: 15, time: 25, speed: 1200 },
  { id: 3, name: "Galaxy Core", stars: 20, time: 30, speed: 1000 },
];

type GameMode = "menu" | "explore" | "quiz" | "collect" | "results";

export default function SpaceExplorer() {
  const router = useRouter();
  
  // Game state
  const [mode, setMode] = useState<GameMode>("menu");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  
  // Explore mode
  const [selectedPlanet, setSelectedPlanet] = useState<typeof PLANETS[0] | null>(null);
  const [visitedPlanets, setVisitedPlanets] = useState<number[]>([]);
  
  // Quiz mode
  const [quizQuestions, setQuizQuestions] = useState<typeof SPACE_QUIZ>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);
  const [showFact, setShowFact] = useState(false);
  const [lastAnswer, setLastAnswer] = useState<{ correct: boolean; fact: string } | null>(null);
  
  // Star collector mode
  const [collectorLevel, setCollectorLevel] = useState(0);
  const [starsCollected, setStarsCollected] = useState(0);
  const [starPositions, setStarPositions] = useState<{ id: number; x: number; y: number; collected: boolean }[]>([]);
  const [collectTime, setCollectTime] = useState(20);
  
  // Results
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  
  // Animations
  const rocketAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const spawnRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load high score
  useEffect(() => {
    loadHighScore();
    startRocketAnimation();
  }, []);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (spawnRef.current) clearInterval(spawnRef.current);
    };
  }, []);

  const loadHighScore = async () => {
    try {
      const saved = await AsyncStorage.getItem("space_explorer_high");
      if (saved) setHighScore(parseInt(saved));
    } catch (e) {
      console.log("Error loading high score");
    }
  };

  const saveHighScore = async (newScore: number) => {
    if (newScore > highScore) {
      setHighScore(newScore);
      await AsyncStorage.setItem("space_explorer_high", newScore.toString());
    }
  };

  const startRocketAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(rocketAnim, { toValue: -10, duration: 1000, useNativeDriver: true }),
        Animated.timing(rocketAnim, { toValue: 10, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  };

  // ========== EXPLORE MODE ==========
  const startExplore = () => {
    setMode("explore");
    setVisitedPlanets([]);
    setSelectedPlanet(null);
    setScore(0);
  };

  const visitPlanet = (planet: typeof PLANETS[0]) => {
    setSelectedPlanet(planet);
    if (!visitedPlanets.includes(planet.id)) {
      setVisitedPlanets([...visitedPlanets, planet.id]);
      setScore(s => s + 5);
    }
  };

  const finishExplore = async () => {
    const points = Math.min(visitedPlanets.length * 5, 100);
    setEarnedPoints(points);
    await saveHighScore(score);
    await awardPoints(points, `Explored ${visitedPlanets.length} planets`);
    setShowCelebration(true);
    setMode("results");
  };

  // ========== QUIZ MODE ==========
  const startQuiz = () => {
    const shuffled = [...SPACE_QUIZ].sort(() => Math.random() - 0.5).slice(0, 10);
    setQuizQuestions(shuffled);
    setCurrentQuestion(0);
    setQuizScore(0);
    setTimeLeft(20);
    setShowFact(false);
    setLastAnswer(null);
    setMode("quiz");
    startQuizTimer();
  };

  const startQuizTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          handleQuizAnswer(-1);
          return 20;
        }
        return t - 1;
      });
    }, 1000);
  };

  const handleQuizAnswer = (answerIndex: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    const question = quizQuestions[currentQuestion];
    if (!question) return;
    
    const correct = answerIndex === question.answer;
    if (correct) setQuizScore(s => s + 10);
    
    setLastAnswer({ correct, fact: question.fact });
    setShowFact(true);
    
    setTimeout(() => {
      setShowFact(false);
      setLastAnswer(null);
      
      if (currentQuestion < quizQuestions.length - 1) {
        setCurrentQuestion(c => c + 1);
        setTimeLeft(20);
        startQuizTimer();
      } else {
        finishQuiz();
      }
    }, 2500);
  };

  const finishQuiz = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    const points = Math.min(35 + Math.floor(quizScore / 10) * 3, 100);
    setEarnedPoints(points);
    setScore(quizScore);
    await saveHighScore(quizScore);
    
    if (quizScore >= 70) {
      await awardPoints(points, `Space Quiz - ${quizScore}% correct`);
      setShowCelebration(true);
    }
    
    setMode("results");
  };

  // ========== STAR COLLECTOR MODE ==========
  const startCollector = (levelIndex: number) => {
    const level = STAR_LEVELS[levelIndex];
    setCollectorLevel(levelIndex);
    setStarsCollected(0);
    setCollectTime(level.time);
    setStarPositions([]);
    setMode("collect");
    
    spawnStars(level);
    startCollectTimer();
  };

  const spawnStars = (level: typeof STAR_LEVELS[0]) => {
    if (spawnRef.current) clearInterval(spawnRef.current);
    
    let starId = 0;
    const spawn = () => {
      const newStar = {
        id: starId++,
        x: Math.random() * (SCREEN_WIDTH - 60) + 20,
        y: Math.random() * 300 + 150,
        collected: false,
      };
      setStarPositions(prev => [...prev.slice(-15), newStar]);
    };
    
    spawn();
    spawnRef.current = setInterval(spawn, level.speed);
  };

  const startCollectTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCollectTime(t => {
        if (t <= 1) {
          finishCollector();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const collectStar = (starId: number) => {
    setStarPositions(prev => prev.map(s => s.id === starId ? { ...s, collected: true } : s));
    setStarsCollected(s => s + 1);
  };

  const finishCollector = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (spawnRef.current) clearInterval(spawnRef.current);
    
    const level = STAR_LEVELS[collectorLevel];
    const percentage = Math.floor((starsCollected / level.stars) * 100);
    const points = Math.min(Math.floor(starsCollected * 2), 100);
    
    setScore(starsCollected);
    setEarnedPoints(points);
    await saveHighScore(starsCollected);
    
    if (percentage >= 50) {
      await awardPoints(points, `Star Collector - ${starsCollected} stars`);
      setShowCelebration(true);
    }
    
    setMode("results");
  };

  // ========== POINTS SYSTEM ==========
  const awardPoints = async (points: number, reason: string) => {
    try {
      const token = await AsyncStorage.getItem("kivelo_access_token");
      if (token) {
        await fetch("https://family-wellness.onrender.com/api/v1/gamification/self-points", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ points, reason: `Space Explorer - ${reason}` }),
        });
      }
    } catch (e) {
      console.log("Error awarding points");
    }
  };

  const resetGame = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (spawnRef.current) clearInterval(spawnRef.current);
    setMode("menu");
    setShowCelebration(false);
    setScore(0);
    setQuizScore(0);
    setStarsCollected(0);
  };

  // ========== RENDER FUNCTIONS ==========
  const renderStars = () => (
    <View style={styles.starsContainer}>
      {[...Array(25)].map((_, i) => (
        <Text key={i} style={[styles.bgStar, { left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, opacity: 0.3 + Math.random() * 0.5 }]}>
          {["✦", "★", "✧", "⋆"][Math.floor(Math.random() * 4)]}
        </Text>
      ))}
    </View>
  );

  // MENU SCREEN
  if (mode === "menu") {
    return (
      <LinearGradient colors={["#0F172A", "#1E1B4B", "#0F172A"]} style={styles.container}>
        {renderStars()}
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Space Explorer</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.menuScroll} contentContainerStyle={styles.menuContent}>
          <Animated.Text style={[styles.rocketBig, { transform: [{ translateY: rocketAnim }] }]}>🚀</Animated.Text>
          <Text style={styles.title}>Space Explorer</Text>
          <Text style={styles.subtitle}>Learn about space while having fun!</Text>

          {highScore > 0 && (
            <View style={styles.highScoreBox}>
              <Ionicons name="trophy" size={18} color="#FFD700" />
              <Text style={styles.highScoreText}>Best Score: {highScore}</Text>
            </View>
          )}

          <Text style={styles.sectionTitle}>🎮 Choose Your Mission</Text>

          {/* Explore Mode */}
          <TouchableOpacity style={[styles.modeCard, { borderColor: "#3B82F6" }]} onPress={startExplore}>
            <View style={[styles.modeIcon, { backgroundColor: "#3B82F6" }]}>
              <Text style={styles.modeEmoji}>🌍</Text>
            </View>
            <View style={styles.modeInfo}>
              <Text style={styles.modeName}>Planet Explorer</Text>
              <Text style={styles.modeDesc}>Visit all 8 planets and learn amazing facts!</Text>
              <Text style={styles.modePoints}>+5 pts per planet</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#3B82F6" />
          </TouchableOpacity>

          {/* Quiz Mode */}
          <TouchableOpacity style={[styles.modeCard, { borderColor: "#8B5CF6" }]} onPress={startQuiz}>
            <View style={[styles.modeIcon, { backgroundColor: "#8B5CF6" }]}>
              <Text style={styles.modeEmoji}>❓</Text>
            </View>
            <View style={styles.modeInfo}>
              <Text style={styles.modeName}>Space Quiz</Text>
              <Text style={styles.modeDesc}>Test your space knowledge with 10 questions!</Text>
              <Text style={styles.modePoints}>Up to 100 pts</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#8B5CF6" />
          </TouchableOpacity>

          {/* Star Collector */}
          <TouchableOpacity style={[styles.modeCard, { borderColor: "#F59E0B" }]} onPress={() => startCollector(0)}>
            <View style={[styles.modeIcon, { backgroundColor: "#F59E0B" }]}>
              <Text style={styles.modeEmoji}>⭐</Text>
            </View>
            <View style={styles.modeInfo}>
              <Text style={styles.modeName}>Star Collector</Text>
              <Text style={styles.modeDesc}>Tap stars as fast as you can!</Text>
              <Text style={styles.modePoints}>2 pts per star</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#F59E0B" />
          </TouchableOpacity>

          <View style={styles.factBox}>
            <Text style={styles.factTitle}>🌟 Did You Know?</Text>
            <Text style={styles.factText}>{PLANETS[Math.floor(Math.random() * PLANETS.length)].fact}</Text>
          </View>
        </ScrollView>
      </LinearGradient>
    );
  }

  // EXPLORE MODE
  if (mode === "explore") {
    return (
      <LinearGradient colors={["#0F172A", "#1E1B4B", "#0F172A"]} style={styles.container}>
        {renderStars()}
        
        <View style={styles.header}>
          <TouchableOpacity onPress={resetGame} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Planet Explorer</Text>
          <View style={styles.scoreChip}>
            <Text style={styles.scoreChipText}>⭐ {score}</Text>
          </View>
        </View>

        <Text style={styles.progressText}>Visited: {visitedPlanets.length}/8 planets</Text>

        <ScrollView contentContainerStyle={styles.planetsGrid}>
          {PLANETS.map(planet => (
            <TouchableOpacity
              key={planet.id}
              style={[styles.planetCard, visitedPlanets.includes(planet.id) && styles.planetVisited]}
              onPress={() => visitPlanet(planet)}
            >
              <Text style={[styles.planetEmoji, { fontSize: planet.size * 0.8 }]}>{planet.emoji}</Text>
              <Text style={styles.planetName}>{planet.name}</Text>
              <Text style={styles.planetDistance}>{planet.distance}</Text>
              {visitedPlanets.includes(planet.id) && (
                <View style={styles.visitedBadge}>
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Planet Detail Modal */}
        <Modal visible={selectedPlanet !== null} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.planetModal}>
              <Text style={styles.planetModalEmoji}>{selectedPlanet?.emoji}</Text>
              <Text style={styles.planetModalName}>{selectedPlanet?.name}</Text>
              <Text style={styles.planetModalDistance}>Distance from Sun: {selectedPlanet?.distance}</Text>
              <View style={styles.factCard}>
                <Text style={styles.factCardTitle}>🌟 Fun Fact</Text>
                <Text style={styles.factCardText}>{selectedPlanet?.fact}</Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedPlanet(null)}>
                <Text style={styles.closeBtnText}>Continue Exploring</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {visitedPlanets.length === 8 && (
          <TouchableOpacity style={styles.finishBtn} onPress={finishExplore}>
            <Text style={styles.finishBtnText}>🎉 Complete Mission!</Text>
          </TouchableOpacity>
        )}

        {visitedPlanets.length > 0 && visitedPlanets.length < 8 && (
          <TouchableOpacity style={[styles.finishBtn, { backgroundColor: "#64748B" }]} onPress={finishExplore}>
            <Text style={styles.finishBtnText}>Finish Early ({visitedPlanets.length}/8)</Text>
          </TouchableOpacity>
        )}
      </LinearGradient>
    );
  }

  // QUIZ MODE
  if (mode === "quiz") {
    const question = quizQuestions[currentQuestion];
    
    if (!question) {
      return (
        <LinearGradient colors={["#0F172A", "#1E1B4B", "#0F172A"]} style={styles.container}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        </LinearGradient>
      );
    }
    
    return (
      <LinearGradient colors={["#0F172A", "#1E1B4B", "#0F172A"]} style={styles.container}>
        {renderStars()}
        
        <View style={styles.header}>
          <TouchableOpacity onPress={resetGame} style={styles.backBtn}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.quizProgress}>
            <Text style={styles.quizProgressText}>{currentQuestion + 1}/{quizQuestions.length}</Text>
          </View>
          <View style={[styles.timerChip, timeLeft <= 5 && styles.timerWarning]}>
            <Ionicons name="time" size={16} color={timeLeft <= 5 ? "#EF4444" : "#fff"} />
            <Text style={[styles.timerText, timeLeft <= 5 && { color: "#EF4444" }]}>{timeLeft}s</Text>
          </View>
        </View>

        <View style={styles.quizContent}>
          <View style={styles.scoreBar}>
            <Text style={styles.scoreBarText}>Score: {quizScore}</Text>
          </View>

          <View style={styles.questionCard}>
            <Text style={styles.questionEmoji}>🚀</Text>
            <Text style={styles.questionText}>{question.q}</Text>
          </View>

          <View style={styles.optionsGrid}>
            {question.options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionBtn,
                  showFact && index === question.answer && styles.optionCorrect,
                  showFact && lastAnswer && !lastAnswer.correct && index !== question.answer && styles.optionWrong,
                ]}
                onPress={() => !showFact && handleQuizAnswer(index)}
                disabled={showFact}
              >
                <Text style={styles.optionLetter}>{["A", "B", "C", "D"][index]}</Text>
                <Text style={styles.optionText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {showFact && lastAnswer && (
            <View style={[styles.feedbackCard, lastAnswer.correct ? styles.feedbackCorrect : styles.feedbackWrong]}>
              <Text style={styles.feedbackEmoji}>{lastAnswer.correct ? "🎉" : "💫"}</Text>
              <Text style={styles.feedbackTitle}>{lastAnswer.correct ? "Correct!" : "Not quite!"}</Text>
              <Text style={styles.feedbackFact}>{lastAnswer.fact}</Text>
            </View>
          )}
        </View>
      </LinearGradient>
    );
  }

  // STAR COLLECTOR MODE
  if (mode === "collect") {
    const level = STAR_LEVELS[collectorLevel];
    
    return (
      <LinearGradient colors={["#0F172A", "#1E1B4B", "#0F172A"]} style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={resetGame} style={styles.backBtn}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{level.name}</Text>
          <View style={styles.timerChip}>
            <Ionicons name="time" size={16} color="#fff" />
            <Text style={styles.timerText}>{collectTime}s</Text>
          </View>
        </View>

        <View style={styles.collectStats}>
          <View style={styles.collectStat}>
            <Text style={styles.collectStatValue}>⭐ {starsCollected}</Text>
            <Text style={styles.collectStatLabel}>Collected</Text>
          </View>
          <View style={styles.collectStat}>
            <Text style={styles.collectStatValue}>🎯 {level.stars}</Text>
            <Text style={styles.collectStatLabel}>Goal</Text>
          </View>
        </View>

        <View style={styles.collectArea}>
          {starPositions.filter(s => !s.collected).map(star => (
            <TouchableOpacity
              key={star.id}
              style={[styles.collectStar, { left: star.x, top: star.y }]}
              onPress={() => collectStar(star.id)}
            >
              <Text style={styles.collectStarEmoji}>⭐</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.collectHint}>👆 Tap the stars!</Text>
      </LinearGradient>
    );
  }

  // RESULTS SCREEN
  if (mode === "results") {
    return (
      <LinearGradient colors={["#0F172A", "#1E1B4B", "#0F172A"]} style={styles.container}>
        {renderStars()}
        
        <Modal visible={showCelebration} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.celebrationModal}>
              <Text style={styles.celebrationEmoji}>🚀⭐🎉</Text>
              <Text style={styles.celebrationTitle}>Mission Complete!</Text>
              <Text style={styles.celebrationPoints}>+{earnedPoints} Points Earned!</Text>
              <TouchableOpacity style={styles.celebrationBtn} onPress={() => setShowCelebration(false)}>
                <Text style={styles.celebrationBtnText}>Awesome!</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <View style={styles.resultsContent}>
          <Text style={styles.resultsEmoji}>{earnedPoints > 0 ? "🏆" : "🚀"}</Text>
          <Text style={styles.resultsTitle}>{earnedPoints > 0 ? "Great Job!" : "Keep Trying!"}</Text>
          
          <View style={styles.resultsStats}>
            <View style={styles.resultsStat}>
              <Text style={styles.resultsStatValue}>{score}</Text>
              <Text style={styles.resultsStatLabel}>Score</Text>
            </View>
            {earnedPoints > 0 && (
              <View style={styles.resultsStat}>
                <Text style={[styles.resultsStatValue, { color: "#10B981" }]}>+{earnedPoints}</Text>
                <Text style={styles.resultsStatLabel}>Points</Text>
              </View>
            )}
          </View>

          <TouchableOpacity style={styles.playAgainBtn} onPress={resetGame}>
            <Ionicons name="refresh" size={20} color="#fff" />
            <Text style={styles.playAgainText}>Play Again</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.exitBtn} onPress={() => router.back()}>
            <Text style={styles.exitBtnText}>Back to Games</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  starsContainer: { ...StyleSheet.absoluteFillObject },
  bgStar: { position: "absolute", color: "#fff", fontSize: 10 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { color: "#fff", fontSize: 18 },
  
  // Header
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 50, paddingHorizontal: 16, paddingBottom: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#fff" },
  scoreChip: { backgroundColor: "rgba(255,255,255,0.15)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15 },
  scoreChipText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  
  // Menu
  menuScroll: { flex: 1 },
  menuContent: { padding: 20, alignItems: "center" },
  rocketBig: { fontSize: 70, marginBottom: 10 },
  title: { fontSize: 28, fontWeight: "bold", color: "#fff", marginBottom: 8 },
  subtitle: { fontSize: 15, color: "#94A3B8", textAlign: "center", marginBottom: 20 },
  highScoreBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(255,215,0,0.15)", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginBottom: 20 },
  highScoreText: { color: "#FFD700", fontWeight: "bold", fontSize: 14 },
  sectionTitle: { fontSize: 18, fontWeight: "600", color: "#fff", alignSelf: "flex-start", marginBottom: 15, marginTop: 10 },
  
  // Mode Cards
  modeCard: { width: "100%", flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 16, borderWidth: 2, padding: 16, marginBottom: 12, gap: 14 },
  modeIcon: { width: 50, height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center" },
  modeEmoji: { fontSize: 24 },
  modeInfo: { flex: 1 },
  modeName: { fontSize: 17, fontWeight: "bold", color: "#fff" },
  modeDesc: { fontSize: 13, color: "#94A3B8", marginTop: 2 },
  modePoints: { fontSize: 12, color: "#06B6D4", marginTop: 4 },
  
  factBox: { width: "100%", backgroundColor: "rgba(139,92,246,0.15)", borderRadius: 16, padding: 16, marginTop: 20 },
  factTitle: { fontSize: 14, fontWeight: "bold", color: "#A78BFA", marginBottom: 8 },
  factText: { fontSize: 14, color: "#E2E8F0", lineHeight: 20 },
  
  // Explore
  progressText: { textAlign: "center", color: "#94A3B8", fontSize: 14, marginBottom: 10 },
  planetsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", padding: 16, gap: 12 },
  planetCard: { width: (SCREEN_WIDTH - 56) / 2, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 16, padding: 16, alignItems: "center" },
  planetVisited: { borderColor: "#10B981", borderWidth: 2 },
  planetEmoji: { marginBottom: 8 },
  planetName: { fontSize: 16, fontWeight: "bold", color: "#fff" },
  planetDistance: { fontSize: 11, color: "#64748B", marginTop: 4 },
  visitedBadge: { position: "absolute", top: 8, right: 8 },
  
  // Planet Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.8)", alignItems: "center", justifyContent: "center" },
  planetModal: { backgroundColor: "#1E293B", borderRadius: 24, padding: 30, alignItems: "center", marginHorizontal: 30, width: "85%" },
  planetModalEmoji: { fontSize: 60, marginBottom: 10 },
  planetModalName: { fontSize: 26, fontWeight: "bold", color: "#fff", marginBottom: 6 },
  planetModalDistance: { fontSize: 14, color: "#94A3B8", marginBottom: 20 },
  factCard: { backgroundColor: "rgba(59,130,246,0.15)", borderRadius: 12, padding: 16, width: "100%", marginBottom: 20 },
  factCardTitle: { fontSize: 14, fontWeight: "bold", color: "#60A5FA", marginBottom: 8 },
  factCardText: { fontSize: 14, color: "#E2E8F0", lineHeight: 20 },
  closeBtn: { backgroundColor: "#3B82F6", paddingHorizontal: 30, paddingVertical: 14, borderRadius: 25 },
  closeBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  finishBtn: { backgroundColor: "#10B981", marginHorizontal: 20, marginBottom: 30, paddingVertical: 16, borderRadius: 16, alignItems: "center" },
  finishBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  
  // Quiz
  quizProgress: { backgroundColor: "rgba(255,255,255,0.15)", paddingHorizontal: 14, paddingVertical: 6, borderRadius: 15 },
  quizProgressText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  timerChip: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(255,255,255,0.15)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15 },
  timerWarning: { backgroundColor: "rgba(239,68,68,0.2)" },
  timerText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  quizContent: { flex: 1, padding: 20 },
  scoreBar: { alignSelf: "center", marginBottom: 20 },
  scoreBarText: { color: "#FFD700", fontWeight: "bold", fontSize: 16 },
  questionCard: { backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 20, padding: 24, alignItems: "center", marginBottom: 24 },
  questionEmoji: { fontSize: 40, marginBottom: 12 },
  questionText: { fontSize: 18, fontWeight: "600", color: "#fff", textAlign: "center", lineHeight: 26 },
  optionsGrid: { gap: 12 },
  optionBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 14, padding: 16, gap: 14 },
  optionCorrect: { backgroundColor: "rgba(16,185,129,0.3)", borderColor: "#10B981", borderWidth: 2 },
  optionWrong: { opacity: 0.5 },
  optionLetter: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.1)", textAlign: "center", lineHeight: 32, color: "#fff", fontWeight: "bold" },
  optionText: { flex: 1, color: "#fff", fontSize: 15 },
  feedbackCard: { marginTop: 20, borderRadius: 16, padding: 20, alignItems: "center" },
  feedbackCorrect: { backgroundColor: "rgba(16,185,129,0.2)" },
  feedbackWrong: { backgroundColor: "rgba(139,92,246,0.2)" },
  feedbackEmoji: { fontSize: 36, marginBottom: 8 },
  feedbackTitle: { fontSize: 18, fontWeight: "bold", color: "#fff", marginBottom: 8 },
  feedbackFact: { fontSize: 14, color: "#E2E8F0", textAlign: "center", lineHeight: 20 },
  
  // Star Collector
  collectStats: { flexDirection: "row", justifyContent: "center", gap: 30, marginVertical: 15 },
  collectStat: { alignItems: "center" },
  collectStatValue: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  collectStatLabel: { fontSize: 12, color: "#94A3B8", marginTop: 4 },
  collectArea: { flex: 1, position: "relative" },
  collectStar: { position: "absolute", width: 50, height: 50, alignItems: "center", justifyContent: "center" },
  collectStarEmoji: { fontSize: 36 },
  collectHint: { textAlign: "center", color: "#64748B", fontSize: 14, paddingBottom: 30 },
  
  // Results
  resultsContent: { flex: 1, alignItems: "center", justifyContent: "center", padding: 30 },
  resultsEmoji: { fontSize: 70, marginBottom: 15 },
  resultsTitle: { fontSize: 28, fontWeight: "bold", color: "#fff", marginBottom: 25 },
  resultsStats: { flexDirection: "row", gap: 40, marginBottom: 30 },
  resultsStat: { alignItems: "center" },
  resultsStatValue: { fontSize: 36, fontWeight: "bold", color: "#fff" },
  resultsStatLabel: { fontSize: 14, color: "#94A3B8", marginTop: 4 },
  playAgainBtn: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#06B6D4", paddingHorizontal: 30, paddingVertical: 16, borderRadius: 25, marginBottom: 15 },
  playAgainText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  exitBtn: { paddingVertical: 12 },
  exitBtnText: { color: "#64748B", fontSize: 14 },
  
  // Celebration Modal
  celebrationModal: { backgroundColor: "#1E293B", borderRadius: 24, padding: 35, alignItems: "center", marginHorizontal: 30 },
  celebrationEmoji: { fontSize: 50, marginBottom: 15 },
  celebrationTitle: { fontSize: 26, fontWeight: "bold", color: "#06B6D4", marginBottom: 10 },
  celebrationPoints: { fontSize: 18, color: "#10B981", marginBottom: 25 },
  celebrationBtn: { backgroundColor: "#06B6D4", paddingHorizontal: 40, paddingVertical: 14, borderRadius: 25 },
  celebrationBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
