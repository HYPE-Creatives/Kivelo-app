// app/(dashboard)/child/word-wizard.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
  Modal,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Game modes
type GameMode = "word-scramble" | "word-meaning" | "fill-blank" | "synonym";

interface GameModeConfig {
  id: GameMode;
  name: string;
  description: string;
  icon: string;
  color: string;
  points: number;
}

const GAME_MODES: GameModeConfig[] = [
  {
    id: "word-scramble",
    name: "Word Scramble",
    description: "Unscramble the letters to form a word",
    icon: "shuffle-outline",
    color: "#F59E0B",
    points: 15,
  },
  {
    id: "word-meaning",
    name: "Word Meaning",
    description: "Match words with their definitions",
    icon: "book-outline",
    color: "#8B5CF6",
    points: 20,
  },
  {
    id: "fill-blank",
    name: "Fill in the Blank",
    description: "Complete the sentence with the right word",
    icon: "create-outline",
    color: "#10B981",
    points: 18,
  },
  {
    id: "synonym",
    name: "Synonym Match",
    description: "Find words with similar meanings",
    icon: "git-compare-outline",
    color: "#EC4899",
    points: 22,
  },
];

// Difficulty levels
type Difficulty = "easy" | "medium" | "hard";

interface DifficultyConfig {
  id: Difficulty;
  name: string;
  color: string;
  multiplier: number;
}

const DIFFICULTIES: DifficultyConfig[] = [
  { id: "easy", name: "Easy", color: "#10B981", multiplier: 1 },
  { id: "medium", name: "Medium", color: "#F59E0B", multiplier: 1.5 },
  { id: "hard", name: "Hard", color: "#EF4444", multiplier: 2 },
];

// Word banks by difficulty
interface WordData {
  word: string;
  meaning: string;
  synonyms: string[];
  sentence: string;
  blankWord: string;
}

const WORD_BANKS: Record<Difficulty, WordData[]> = {
  easy: [
    { word: "happy", meaning: "Feeling joy or pleasure", synonyms: ["glad", "joyful", "cheerful"], sentence: "The children were very _____ at the party.", blankWord: "happy" },
    { word: "big", meaning: "Large in size", synonyms: ["large", "huge", "giant"], sentence: "The elephant is a _____ animal.", blankWord: "big" },
    { word: "fast", meaning: "Moving quickly", synonyms: ["quick", "speedy", "rapid"], sentence: "The cheetah is a very _____ animal.", blankWord: "fast" },
    { word: "cold", meaning: "Low temperature", synonyms: ["chilly", "cool", "freezing"], sentence: "Ice cream is _____ and sweet.", blankWord: "cold" },
    { word: "small", meaning: "Little in size", synonyms: ["tiny", "little", "mini"], sentence: "Ants are very _____ insects.", blankWord: "small" },
    { word: "kind", meaning: "Friendly and caring", synonyms: ["nice", "gentle", "caring"], sentence: "My teacher is very _____ to all students.", blankWord: "kind" },
    { word: "brave", meaning: "Not afraid of danger", synonyms: ["bold", "fearless", "courageous"], sentence: "The firefighter was _____ during the rescue.", blankWord: "brave" },
    { word: "clean", meaning: "Free from dirt", synonyms: ["tidy", "neat", "spotless"], sentence: "Please keep your room _____.", blankWord: "clean" },
    { word: "funny", meaning: "Causing laughter", synonyms: ["amusing", "hilarious", "comical"], sentence: "The clown was very _____.", blankWord: "funny" },
    { word: "smart", meaning: "Intelligent", synonyms: ["clever", "bright", "wise"], sentence: "She is very _____ in mathematics.", blankWord: "smart" },
    { word: "loud", meaning: "Making much noise", synonyms: ["noisy", "booming", "thunderous"], sentence: "The music was too _____.", blankWord: "loud" },
    { word: "soft", meaning: "Not hard or firm", synonyms: ["gentle", "smooth", "tender"], sentence: "The pillow is very _____.", blankWord: "soft" },
  ],
  medium: [
    { word: "courage", meaning: "Bravery in facing fear", synonyms: ["bravery", "valor", "boldness"], sentence: "It takes _____ to stand up for what is right.", blankWord: "courage" },
    { word: "ancient", meaning: "Very old; from long ago", synonyms: ["old", "historic", "antique"], sentence: "The pyramids are _____ structures.", blankWord: "ancient" },
    { word: "generous", meaning: "Willing to give and share", synonyms: ["giving", "charitable", "kind"], sentence: "She is _____ with her time and money.", blankWord: "generous" },
    { word: "curious", meaning: "Eager to learn or know", synonyms: ["inquisitive", "interested", "questioning"], sentence: "The _____ cat explored every room.", blankWord: "curious" },
    { word: "fragile", meaning: "Easily broken or damaged", synonyms: ["delicate", "breakable", "brittle"], sentence: "Handle the glass with care, it's _____.", blankWord: "fragile" },
    { word: "essential", meaning: "Absolutely necessary", synonyms: ["vital", "crucial", "important"], sentence: "Water is _____ for life.", blankWord: "essential" },
    { word: "brilliant", meaning: "Very bright or intelligent", synonyms: ["bright", "clever", "genius"], sentence: "Einstein was a _____ scientist.", blankWord: "brilliant" },
    { word: "peaceful", meaning: "Free from disturbance", synonyms: ["calm", "tranquil", "serene"], sentence: "The garden was _____ in the morning.", blankWord: "peaceful" },
    { word: "magnificent", meaning: "Extremely beautiful", synonyms: ["splendid", "grand", "gorgeous"], sentence: "The palace was _____.", blankWord: "magnificent" },
    { word: "cautious", meaning: "Careful to avoid danger", synonyms: ["careful", "wary", "prudent"], sentence: "Be _____ when crossing the road.", blankWord: "cautious" },
    { word: "abundant", meaning: "Existing in large quantities", synonyms: ["plentiful", "ample", "rich"], sentence: "The harvest was _____.", blankWord: "abundant" },
    { word: "peculiar", meaning: "Strange or unusual", synonyms: ["odd", "strange", "weird"], sentence: "There was a _____ smell in the room.", blankWord: "peculiar" },
  ],
  hard: [
    { word: "ephemeral", meaning: "Lasting for a very short time", synonyms: ["fleeting", "transient", "brief"], sentence: "Fame can be _____.", blankWord: "ephemeral" },
    { word: "ubiquitous", meaning: "Present everywhere", synonyms: ["omnipresent", "universal", "pervasive"], sentence: "Smartphones have become _____ in modern society.", blankWord: "ubiquitous" },
    { word: "eloquent", meaning: "Fluent and persuasive in speech", synonyms: ["articulate", "expressive", "fluent"], sentence: "The lawyer gave an _____ speech.", blankWord: "eloquent" },
    { word: "meticulous", meaning: "Very careful and precise", synonyms: ["thorough", "precise", "detailed"], sentence: "The surgeon was _____ in her work.", blankWord: "meticulous" },
    { word: "tenacious", meaning: "Persistent and determined", synonyms: ["persistent", "determined", "resolute"], sentence: "The _____ athlete never gave up.", blankWord: "tenacious" },
    { word: "ambiguous", meaning: "Having multiple meanings", synonyms: ["unclear", "vague", "equivocal"], sentence: "The message was _____ and confusing.", blankWord: "ambiguous" },
    { word: "pragmatic", meaning: "Practical and realistic", synonyms: ["practical", "realistic", "sensible"], sentence: "We need a _____ solution to this problem.", blankWord: "pragmatic" },
    { word: "benevolent", meaning: "Kind and generous", synonyms: ["kind", "charitable", "generous"], sentence: "The _____ donor gave millions to charity.", blankWord: "benevolent" },
    { word: "resilient", meaning: "Able to recover quickly", synonyms: ["tough", "strong", "hardy"], sentence: "Children are remarkably _____.", blankWord: "resilient" },
    { word: "scrutinize", meaning: "Examine closely", synonyms: ["inspect", "examine", "analyze"], sentence: "The detective will _____ all the evidence.", blankWord: "scrutinize" },
    { word: "profound", meaning: "Very deep or intense", synonyms: ["deep", "intense", "significant"], sentence: "The book had a _____ impact on me.", blankWord: "profound" },
    { word: "inquisitive", meaning: "Eager to learn", synonyms: ["curious", "questioning", "probing"], sentence: "The _____ student asked many questions.", blankWord: "inquisitive" },
  ],
};

interface Question {
  type: GameMode;
  question: string;
  options: string[];
  correctAnswer: string;
  hint?: string;
}

// Scramble a word
const scrambleWord = (word: string): string => {
  const arr = word.split("");
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  const scrambled = arr.join("");
  // If scrambled is same as original, try again
  return scrambled === word ? scrambleWord(word) : scrambled;
};

// Generate a question based on mode and difficulty
const generateQuestion = (mode: GameMode, difficulty: Difficulty): Question => {
  const words = WORD_BANKS[difficulty];
  const wordData = words[Math.floor(Math.random() * words.length)];
  
  const shuffleArray = <T,>(arr: T[]): T[] => {
    const newArr = [...arr];
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  };

  // Get random wrong options from other words
  const getWrongOptions = (correct: string, count: number, pool: string[]): string[] => {
    const filtered = pool.filter(w => w.toLowerCase() !== correct.toLowerCase());
    return shuffleArray(filtered).slice(0, count);
  };

  switch (mode) {
    case "word-scramble": {
      const scrambled = scrambleWord(wordData.word.toUpperCase());
      const wrongWords = words
        .filter(w => w.word !== wordData.word)
        .map(w => w.word)
        .slice(0, 3);
      
      return {
        type: mode,
        question: scrambled,
        options: shuffleArray([wordData.word, ...wrongWords]),
        correctAnswer: wordData.word,
        hint: wordData.meaning,
      };
    }

    case "word-meaning": {
      const wrongMeanings = words
        .filter(w => w.word !== wordData.word)
        .map(w => w.meaning)
        .slice(0, 3);
      
      return {
        type: mode,
        question: `What does "${wordData.word}" mean?`,
        options: shuffleArray([wordData.meaning, ...wrongMeanings]),
        correctAnswer: wordData.meaning,
        hint: `Used in: ${wordData.sentence.replace("_____", "...")}`,
      };
    }

    case "fill-blank": {
      const wrongWords = words
        .filter(w => w.word !== wordData.word)
        .map(w => w.word)
        .slice(0, 3);
      
      return {
        type: mode,
        question: wordData.sentence,
        options: shuffleArray([wordData.blankWord, ...wrongWords]),
        correctAnswer: wordData.blankWord,
        hint: wordData.meaning,
      };
    }

    case "synonym": {
      const correctSynonym = wordData.synonyms[0];
      const allSynonyms = words.flatMap(w => w.synonyms);
      const wrongSynonyms = getWrongOptions(correctSynonym, 3, allSynonyms);
      
      return {
        type: mode,
        question: `Which word is similar to "${wordData.word}"?`,
        options: shuffleArray([correctSynonym, ...wrongSynonyms]),
        correctAnswer: correctSynonym,
        hint: wordData.meaning,
      };
    }
  }
};

export default function WordWizard() {
  const router = useRouter();
  const [gameMode, setGameMode] = useState<GameMode | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [score, setScore] = useState(0);
  const [totalQuestions] = useState(10);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const celebrationAnim = useRef(new Animated.Value(0)).current;
  const hintAnim = useRef(new Animated.Value(0)).current;

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isTimerRunning) {
      handleTimeUp();
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  // Progress bar animation
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: (questionNumber - 1) / totalQuestions,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [questionNumber]);

  const handleTimeUp = () => {
    setIsTimerRunning(false);
    setIsCorrect(false);
    setStreak(0);
    
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();

    setTimeout(() => {
      if (questionNumber < totalQuestions) {
        nextQuestion();
      } else {
        finishGame();
      }
    }, 1500);
  };

  const getTimeForDifficulty = (diff: Difficulty | null): number => {
    if (!diff) return 30;
    switch (diff) {
      case "easy": return 35;
      case "medium": return 25;
      case "hard": return 20;
    }
  };

  const startGame = (mode: GameMode, diff: Difficulty) => {
    setGameMode(mode);
    setDifficulty(diff);
    setQuestionNumber(1);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setShowResult(false);
    setHintsUsed(0);
    const question = generateQuestion(mode, diff);
    setCurrentQuestion(question);
    setTimeLeft(getTimeForDifficulty(diff));
    setIsTimerRunning(true);
  };

  const handleAnswer = (answer: string) => {
    if (selectedAnswer) return;
    
    setSelectedAnswer(answer);
    setIsTimerRunning(false);
    setShowHint(false);
    hintAnim.setValue(0);
    
    const correct = answer.toLowerCase() === currentQuestion?.correctAnswer.toLowerCase();
    setIsCorrect(correct);

    if (correct) {
      setScore((prev) => prev + 1);
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > bestStreak) setBestStreak(newStreak);

      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.2, duration: 150, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();
    } else {
      setStreak(0);
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    }

    setTimeout(() => {
      if (questionNumber < totalQuestions) {
        nextQuestion();
      } else {
        finishGame();
      }
    }, 1500);
  };

  const nextQuestion = () => {
    if (!gameMode || !difficulty) return;
    setQuestionNumber((prev) => prev + 1);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setShowHint(false);
    hintAnim.setValue(0);
    const question = generateQuestion(gameMode, difficulty);
    setCurrentQuestion(question);
    setTimeLeft(getTimeForDifficulty(difficulty));
    setIsTimerRunning(true);
  };

  const useHint = () => {
    if (showHint || !currentQuestion?.hint) return;
    setShowHint(true);
    setHintsUsed((prev) => prev + 1);
    Animated.timing(hintAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const finishGame = async () => {
    setShowResult(true);
    setIsTimerRunning(false);

    const percentage = (score / totalQuestions) * 100;
    if (percentage >= 70 && gameMode && difficulty) {
      setShowCelebration(true);
      Animated.timing(celebrationAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();

      try {
        const token = await AsyncStorage.getItem("kivelo_access_token");
        if (token) {
          const modeConfig = GAME_MODES.find(m => m.id === gameMode);
          const diffConfig = DIFFICULTIES.find(d => d.id === difficulty);
          const basePoints = modeConfig?.points || 15;
          const multiplier = diffConfig?.multiplier || 1;
          const streakBonus = Math.floor(bestStreak * 2);
          const hintPenalty = hintsUsed * 2;
          const totalPoints = Math.max(10, Math.floor(basePoints * multiplier) + streakBonus - hintPenalty);

          await fetch("https://family-wellness.onrender.com/api/v1/gamification/self-points", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              points: Math.min(totalPoints, 100),
              reason: `Word Wizard - ${modeConfig?.name} (${diffConfig?.name}) - Score: ${score}/${totalQuestions}`,
            }),
          });
        }
      } catch (error) {
        console.log("Error awarding points:", error);
      }
    }
  };

  const resetGame = () => {
    setGameMode(null);
    setDifficulty(null);
    setCurrentQuestion(null);
    setQuestionNumber(1);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setShowResult(false);
    setShowCelebration(false);
    setShowHint(false);
    setHintsUsed(0);
    celebrationAnim.setValue(0);
    hintAnim.setValue(0);
  };

  // Mode Selection Screen
  if (!gameMode) {
    return (
      <LinearGradient colors={["#F59E0B", "#D97706"]} style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Word Wizard</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.modeScrollView} showsVerticalScrollIndicator={false}>
          <Text style={styles.selectText}>🧙‍♂️ Choose Your Challenge</Text>
          <Text style={styles.selectSubtext}>Master words and build vocabulary!</Text>
          
          <View style={styles.modeGrid}>
            {GAME_MODES.map((mode) => (
              <TouchableOpacity
                key={mode.id}
                style={[styles.modeCard, { backgroundColor: mode.color }]}
                onPress={() => setGameMode(mode.id)}
                activeOpacity={0.8}
              >
                <View style={styles.modeIconContainer}>
                  <Ionicons name={mode.icon as any} size={40} color="#fff" />
                </View>
                <Text style={styles.modeName}>{mode.name}</Text>
                <Text style={styles.modeDescription}>{mode.description}</Text>
                <View style={styles.modePoints}>
                  <Ionicons name="star" size={14} color="#FFD700" />
                  <Text style={styles.modePointsText}>{mode.points} pts base</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </LinearGradient>
    );
  }

  // Difficulty Selection Screen
  if (!difficulty) {
    const selectedMode = GAME_MODES.find(m => m.id === gameMode);
    return (
      <LinearGradient colors={[selectedMode?.color || "#F59E0B", "#D97706"]} style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setGameMode(null)} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{selectedMode?.name}</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.difficultyContainer}>
          <Text style={styles.selectText}>Select Difficulty</Text>
          <Text style={styles.selectSubtext}>Higher difficulty = More points!</Text>

          <View style={styles.difficultyGrid}>
            {DIFFICULTIES.map((diff) => (
              <TouchableOpacity
                key={diff.id}
                style={[styles.difficultyCard, { borderColor: diff.color }]}
                onPress={() => startGame(gameMode, diff.id)}
                activeOpacity={0.8}
              >
                <View style={[styles.difficultyBadge, { backgroundColor: diff.color }]}>
                  <Text style={styles.difficultyMultiplier}>{diff.multiplier}x</Text>
                </View>
                <Text style={styles.difficultyName}>{diff.name}</Text>
                <Text style={styles.difficultyTime}>
                  {diff.id === "easy" ? "35" : diff.id === "medium" ? "25" : "20"}s per question
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </LinearGradient>
    );
  }

  // Results Screen
  if (showResult) {
    const percentage = (score / totalQuestions) * 100;
    const modeConfig = GAME_MODES.find(m => m.id === gameMode);
    const diffConfig = DIFFICULTIES.find(d => d.id === difficulty);
    const passed = percentage >= 70;
    const basePoints = modeConfig?.points || 15;
    const multiplier = diffConfig?.multiplier || 1;
    const streakBonus = Math.floor(bestStreak * 2);
    const hintPenalty = hintsUsed * 2;
    const totalPoints = Math.max(10, Math.floor(basePoints * multiplier) + streakBonus - hintPenalty);

    return (
      <LinearGradient
        colors={passed ? ["#F59E0B", "#D97706"] : ["#EF4444", "#DC2626"]}
        style={styles.container}
      >
        <Modal visible={showCelebration} transparent animationType="fade">
          <View style={styles.celebrationOverlay}>
            <Animated.View
              style={[
                styles.celebrationContent,
                { transform: [{ scale: celebrationAnim }] },
              ]}
            >
              <Text style={styles.celebrationEmoji}>🧙‍♂️✨📚</Text>
              <Text style={styles.celebrationTitle}>Word Master!</Text>
              <Text style={styles.celebrationSubtitle}>
                +{Math.min(totalPoints, 100)} Points Earned!
              </Text>
              <TouchableOpacity
                style={styles.celebrationButton}
                onPress={() => setShowCelebration(false)}
              >
                <Text style={styles.celebrationButtonText}>Continue</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Modal>

        <View style={styles.resultContainer}>
          <Text style={styles.resultEmoji}>{passed ? "📚" : "💪"}</Text>
          <Text style={styles.resultTitle}>
            {passed ? "Excellent!" : "Keep Learning!"}
          </Text>
          <Text style={styles.resultLevel}>
            {modeConfig?.name} - {diffConfig?.name}
          </Text>

          <View style={styles.resultStats}>
            <View style={styles.resultStatItem}>
              <Text style={styles.resultStatValue}>{score}/{totalQuestions}</Text>
              <Text style={styles.resultStatLabel}>Correct</Text>
            </View>
            <View style={styles.resultStatItem}>
              <Text style={styles.resultStatValue}>{percentage.toFixed(0)}%</Text>
              <Text style={styles.resultStatLabel}>Score</Text>
            </View>
            <View style={styles.resultStatItem}>
              <Text style={styles.resultStatValue}>{bestStreak}</Text>
              <Text style={styles.resultStatLabel}>Best Streak</Text>
            </View>
          </View>

          {hintsUsed > 0 && (
            <Text style={styles.hintsUsedText}>Hints used: {hintsUsed} (-{hintPenalty} pts)</Text>
          )}

          {passed && (
            <View style={styles.pointsEarned}>
              <Ionicons name="star" size={24} color="#FFD700" />
              <Text style={styles.pointsEarnedText}>
                +{Math.min(totalPoints, 100)} Points
              </Text>
            </View>
          )}

          <View style={styles.resultButtons}>
            <TouchableOpacity
              style={[styles.resultButton, styles.playAgainButton]}
              onPress={() => startGame(gameMode, difficulty)}
            >
              <Ionicons name="refresh" size={20} color="#fff" />
              <Text style={styles.resultButtonText}>Play Again</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.resultButton, styles.changeModeButton]}
              onPress={resetGame}
            >
              <Ionicons name="list" size={20} color="#F59E0B" />
              <Text style={[styles.resultButtonText, { color: "#F59E0B" }]}>
                Change Mode
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.exitButton} onPress={() => router.back()}>
            <Text style={styles.exitButtonText}>Back to Games</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  // Game Screen
  const modeConfig = GAME_MODES.find(m => m.id === gameMode);
  const timerColor = timeLeft <= 5 ? "#EF4444" : timeLeft <= 10 ? "#F59E0B" : "#fff";

  const getQuestionLabel = () => {
    switch (gameMode) {
      case "word-scramble": return "Unscramble this word:";
      case "word-meaning": return "What does this word mean?";
      case "fill-blank": return "Complete the sentence:";
      case "synonym": return "Find the synonym:";
      default: return "";
    }
  };

  return (
    <LinearGradient colors={[modeConfig?.color || "#F59E0B", "#D97706"]} style={styles.container}>
      <View style={styles.gameHeader}>
        <TouchableOpacity onPress={resetGame} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.modeBadge}>
          <Ionicons name={modeConfig?.icon as any} size={16} color="#fff" />
          <Text style={styles.modeBadgeText}>{modeConfig?.name}</Text>
        </View>
        <View style={styles.timerContainer}>
          <Ionicons name="time-outline" size={20} color={timerColor} />
          <Text style={[styles.timerText, { color: timerColor }]}>{timeLeft}s</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", "100%"],
                }),
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {questionNumber}/{totalQuestions}
        </Text>
      </View>

      {/* Score and Streak */}
      <View style={styles.statsRow}>
        <View style={styles.statBadge}>
          <Ionicons name="checkmark-circle" size={16} color="#10B981" />
          <Text style={styles.statBadgeText}>{score}</Text>
        </View>
        {streak > 0 && (
          <View style={[styles.statBadge, styles.streakBadge]}>
            <Text style={styles.streakText}>🔥 {streak}</Text>
          </View>
        )}
        <TouchableOpacity
          style={[styles.hintButton, showHint && styles.hintButtonUsed]}
          onPress={useHint}
          disabled={showHint}
        >
          <Ionicons name="bulb-outline" size={16} color={showHint ? "#9CA3AF" : "#FFD700"} />
          <Text style={[styles.hintButtonText, showHint && { color: "#9CA3AF" }]}>Hint</Text>
        </TouchableOpacity>
      </View>

      {/* Question Card */}
      <Animated.View
        style={[
          styles.questionCard,
          {
            transform: [
              { scale: scaleAnim },
              { translateX: shakeAnim },
            ],
          },
        ]}
      >
        <Text style={styles.questionLabel}>{getQuestionLabel()}</Text>
        <Text style={[
          styles.questionText,
          gameMode === "word-scramble" && styles.scrambledText
        ]}>
          {currentQuestion?.question}
        </Text>
      </Animated.View>

      {/* Hint */}
      {showHint && currentQuestion?.hint && (
        <Animated.View style={[styles.hintCard, { opacity: hintAnim }]}>
          <Ionicons name="bulb" size={18} color="#F59E0B" />
          <Text style={styles.hintText}>{currentQuestion.hint}</Text>
        </Animated.View>
      )}

      {/* Options */}
      <ScrollView style={styles.optionsScrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.optionsContainer}>
          {currentQuestion?.options.map((option, index) => {
            const isSelected = selectedAnswer?.toLowerCase() === option.toLowerCase();
            const isCorrectOption = option.toLowerCase() === currentQuestion.correctAnswer.toLowerCase();
            let optionStyle = styles.optionButton;
            let textColor = "#1F2937";

            if (selectedAnswer) {
              if (isCorrectOption) {
                optionStyle = { ...styles.optionButton, ...styles.correctOption };
                textColor = "#fff";
              } else if (isSelected && !isCorrect) {
                optionStyle = { ...styles.optionButton, ...styles.wrongOption };
                textColor = "#fff";
              }
            }

            return (
              <TouchableOpacity
                key={index}
                style={optionStyle}
                onPress={() => handleAnswer(option)}
                disabled={!!selectedAnswer}
                activeOpacity={0.8}
              >
                <Text style={[styles.optionText, { color: textColor }]} numberOfLines={2}>
                  {option}
                </Text>
                {selectedAnswer && isCorrectOption && (
                  <Ionicons name="checkmark-circle" size={24} color="#fff" />
                )}
                {selectedAnswer && isSelected && !isCorrect && (
                  <Ionicons name="close-circle" size={24} color="#fff" />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
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
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
  },
  modeScrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  selectText: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginTop: 20,
  },
  selectSubtext: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    marginBottom: 25,
  },
  modeGrid: {
    gap: 15,
    paddingBottom: 30,
  },
  modeCard: {
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  modeIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  modeName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 6,
  },
  modeDescription: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    marginBottom: 10,
  },
  modePoints: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.15)",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 5,
  },
  modePointsText: {
    fontSize: 13,
    color: "#fff",
    fontWeight: "600",
  },
  difficultyContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  difficultyGrid: {
    gap: 15,
    marginTop: 20,
  },
  difficultyCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    borderWidth: 3,
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  difficultyBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  difficultyMultiplier: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  difficultyName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
    flex: 1,
  },
  difficultyTime: {
    fontSize: 13,
    color: "#6B7280",
  },
  gameHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  modeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  modeBadgeText: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#fff",
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  timerText: {
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 5,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#fff",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "600",
    marginLeft: 10,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 20,
  },
  statBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    gap: 5,
  },
  statBadgeText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1F2937",
  },
  streakBadge: {
    backgroundColor: "#FEF3C7",
  },
  streakText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#D97706",
  },
  hintButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    gap: 5,
  },
  hintButtonUsed: {
    backgroundColor: "#E5E7EB",
  },
  hintButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#D97706",
  },
  questionCard: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
    minHeight: 140,
    justifyContent: "center",
  },
  questionLabel: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 12,
  },
  questionText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
    textAlign: "center",
    lineHeight: 28,
  },
  scrambledText: {
    fontSize: 32,
    letterSpacing: 4,
    color: "#F59E0B",
  },
  hintCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  hintText: {
    fontSize: 14,
    color: "#92400E",
    flex: 1,
    fontStyle: "italic",
  },
  optionsScrollView: {
    flex: 1,
    marginTop: 20,
  },
  optionsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    gap: 12,
  },
  optionButton: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  correctOption: {
    backgroundColor: "#10B981",
  },
  wrongOption: {
    backgroundColor: "#EF4444",
  },
  optionText: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    paddingRight: 10,
  },
  resultContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  resultEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 5,
  },
  resultLevel: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 30,
  },
  resultStats: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    padding: 20,
    gap: 30,
    marginBottom: 15,
  },
  resultStatItem: {
    alignItems: "center",
  },
  resultStatValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
  },
  resultStatLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
  },
  hintsUsedText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 15,
  },
  pointsEarned: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
    marginBottom: 30,
  },
  pointsEarnedText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#F59E0B",
  },
  resultButtons: {
    flexDirection: "row",
    gap: 15,
    marginBottom: 20,
  },
  resultButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 15,
    gap: 8,
  },
  playAgainButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  changeModeButton: {
    backgroundColor: "#fff",
  },
  resultButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  exitButton: {
    paddingVertical: 12,
  },
  exitButtonText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
  },
  celebrationOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  celebrationContent: {
    backgroundColor: "#fff",
    borderRadius: 30,
    padding: 40,
    alignItems: "center",
    marginHorizontal: 30,
  },
  celebrationEmoji: {
    fontSize: 50,
    marginBottom: 15,
  },
  celebrationTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#F59E0B",
    marginBottom: 8,
  },
  celebrationSubtitle: {
    fontSize: 18,
    color: "#6B7280",
    marginBottom: 25,
  },
  celebrationButton: {
    backgroundColor: "#F59E0B",
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
  },
  celebrationButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
});
