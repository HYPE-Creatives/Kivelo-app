// app/(dashboard)/child/math-challenge.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Alert,
  ScrollView,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Education levels in Nigerian system
const EDUCATION_LEVELS = [
  { id: "kg1", name: "KG 1", description: "Kindergarten 1", ageRange: "3-4 years", color: "#F472B6" },
  { id: "kg2", name: "KG 2", description: "Kindergarten 2", ageRange: "4-5 years", color: "#A78BFA" },
  { id: "primary1", name: "Primary 1", description: "Basic 1", ageRange: "6 years", color: "#60A5FA" },
  { id: "primary2", name: "Primary 2", description: "Basic 2", ageRange: "7 years", color: "#34D399" },
  { id: "primary3", name: "Primary 3", description: "Basic 3", ageRange: "8 years", color: "#FBBF24" },
  { id: "primary4", name: "Primary 4", description: "Basic 4", ageRange: "9 years", color: "#F87171" },
  { id: "primary5", name: "Primary 5", description: "Basic 5", ageRange: "10 years", color: "#FB923C" },
  { id: "primary6", name: "Primary 6", description: "Basic 6", ageRange: "11 years", color: "#A3E635" },
  { id: "jss1", name: "JSS 1", description: "Junior Secondary 1", ageRange: "12 years", color: "#22D3EE" },
  { id: "jss2", name: "JSS 2", description: "Junior Secondary 2", ageRange: "13 years", color: "#818CF8" },
  { id: "jss3", name: "JSS 3", description: "Junior Secondary 3", ageRange: "14 years", color: "#F472B6" },
  { id: "ss1", name: "SS 1", description: "Senior Secondary 1", ageRange: "15 years", color: "#10B981" },
  { id: "ss2", name: "SS 2", description: "Senior Secondary 2", ageRange: "16 years", color: "#6366F1" },
  { id: "ss3", name: "SS 3", description: "Senior Secondary 3", ageRange: "17 years", color: "#EF4444" },
];

// Question types based on level
type QuestionType = "counting" | "addition" | "subtraction" | "multiplication" | "division" | "fractions" | "algebra" | "geometry" | "percentage" | "indices" | "logarithm" | "quadratic";

interface MathQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  type: QuestionType;
  explanation?: string;
}

// Generate questions based on education level
const generateQuestion = (levelId: string): MathQuestion => {
  const random = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
  
  const shuffleOptions = (correct: string, wrongs: string[]): string[] => {
    const all = [correct, ...wrongs];
    return all.sort(() => Math.random() - 0.5);
  };

  switch (levelId) {
    case "kg1": {
      // Counting 1-10, number recognition
      const num = random(1, 10);
      const questionTypes = [
        {
          question: `Count the stars: ${"⭐".repeat(num)}`,
          correct: num.toString(),
          wrongs: [
            (num + 1).toString(),
            Math.max(1, num - 1).toString(),
            (num + 2).toString()
          ]
        },
        {
          question: `What number comes after ${num}?`,
          correct: (num + 1).toString(),
          wrongs: [
            (num - 1).toString(),
            (num + 2).toString(),
            num.toString()
          ]
        },
        {
          question: `How many apples? ${"🍎".repeat(Math.min(num, 5))}`,
          correct: Math.min(num, 5).toString(),
          wrongs: [
            (Math.min(num, 5) + 1).toString(),
            Math.max(1, Math.min(num, 5) - 1).toString(),
            (Math.min(num, 5) + 2).toString()
          ]
        }
      ];
      const q = questionTypes[random(0, questionTypes.length - 1)];
      return {
        question: q.question,
        options: shuffleOptions(q.correct, q.wrongs),
        correctAnswer: q.correct,
        type: "counting"
      };
    }

    case "kg2": {
      // Counting 1-20, simple addition within 10
      const a = random(1, 5);
      const b = random(1, 5);
      const answer = a + b;
      return {
        question: `${a} + ${b} = ?`,
        options: shuffleOptions(answer.toString(), [
          (answer + 1).toString(),
          (answer - 1).toString(),
          (answer + 2).toString()
        ]),
        correctAnswer: answer.toString(),
        type: "addition",
        explanation: `${a} plus ${b} equals ${answer}`
      };
    }

    case "primary1": {
      // Addition and subtraction within 20
      const isAddition = Math.random() > 0.5;
      if (isAddition) {
        const a = random(1, 10);
        const b = random(1, 10);
        const answer = a + b;
        return {
          question: `${a} + ${b} = ?`,
          options: shuffleOptions(answer.toString(), [
            (answer + 1).toString(),
            (answer - 1).toString(),
            (answer + 2).toString()
          ]),
          correctAnswer: answer.toString(),
          type: "addition"
        };
      } else {
        const a = random(10, 20);
        const b = random(1, a);
        const answer = a - b;
        return {
          question: `${a} - ${b} = ?`,
          options: shuffleOptions(answer.toString(), [
            (answer + 1).toString(),
            Math.max(0, answer - 1).toString(),
            (answer + 2).toString()
          ]),
          correctAnswer: answer.toString(),
          type: "subtraction"
        };
      }
    }

    case "primary2": {
      // Addition and subtraction within 100
      const isAddition = Math.random() > 0.5;
      if (isAddition) {
        const a = random(10, 50);
        const b = random(10, 40);
        const answer = a + b;
        return {
          question: `${a} + ${b} = ?`,
          options: shuffleOptions(answer.toString(), [
            (answer + 5).toString(),
            (answer - 5).toString(),
            (answer + 10).toString()
          ]),
          correctAnswer: answer.toString(),
          type: "addition"
        };
      } else {
        const a = random(50, 99);
        const b = random(10, 40);
        const answer = a - b;
        return {
          question: `${a} - ${b} = ?`,
          options: shuffleOptions(answer.toString(), [
            (answer + 5).toString(),
            Math.max(0, answer - 5).toString(),
            (answer + 10).toString()
          ]),
          correctAnswer: answer.toString(),
          type: "subtraction"
        };
      }
    }

    case "primary3": {
      // Multiplication tables 1-5
      const a = random(1, 5);
      const b = random(1, 10);
      const answer = a * b;
      return {
        question: `${a} × ${b} = ?`,
        options: shuffleOptions(answer.toString(), [
          (answer + a).toString(),
          Math.max(1, answer - a).toString(),
          (answer + 2 * a).toString()
        ]),
        correctAnswer: answer.toString(),
        type: "multiplication",
        explanation: `${a} times ${b} equals ${answer}`
      };
    }

    case "primary4": {
      // Multiplication tables 1-12, simple division
      const isDivision = Math.random() > 0.5;
      if (isDivision) {
        const b = random(2, 10);
        const answer = random(2, 10);
        const a = b * answer;
        return {
          question: `${a} ÷ ${b} = ?`,
          options: shuffleOptions(answer.toString(), [
            (answer + 1).toString(),
            (answer - 1).toString(),
            (answer + 2).toString()
          ]),
          correctAnswer: answer.toString(),
          type: "division"
        };
      } else {
        const a = random(1, 12);
        const b = random(1, 12);
        const answer = a * b;
        return {
          question: `${a} × ${b} = ?`,
          options: shuffleOptions(answer.toString(), [
            (answer + a).toString(),
            Math.max(1, answer - b).toString(),
            (answer + b).toString()
          ]),
          correctAnswer: answer.toString(),
          type: "multiplication"
        };
      }
    }

    case "primary5": {
      // Fractions, larger numbers
      const types = ["fractions", "multiplication"];
      const type = types[random(0, types.length - 1)];
      
      if (type === "fractions") {
        const questions = [
          {
            question: "What is 1/2 of 10?",
            correct: "5",
            wrongs: ["4", "6", "10"]
          },
          {
            question: "What is 1/4 of 20?",
            correct: "5",
            wrongs: ["4", "10", "8"]
          },
          {
            question: "What is 3/4 of 8?",
            correct: "6",
            wrongs: ["4", "2", "8"]
          },
          {
            question: "Which is larger: 1/2 or 1/4?",
            correct: "1/2",
            wrongs: ["1/4", "They are equal", "Cannot tell"]
          },
          {
            question: "1/2 + 1/2 = ?",
            correct: "1",
            wrongs: ["2/4", "1/4", "2"]
          }
        ];
        const q = questions[random(0, questions.length - 1)];
        return {
          question: q.question,
          options: shuffleOptions(q.correct, q.wrongs),
          correctAnswer: q.correct,
          type: "fractions"
        };
      } else {
        const a = random(10, 50);
        const b = random(2, 20);
        const answer = a * b;
        return {
          question: `${a} × ${b} = ?`,
          options: shuffleOptions(answer.toString(), [
            (answer + 10).toString(),
            (answer - 10).toString(),
            (answer + 50).toString()
          ]),
          correctAnswer: answer.toString(),
          type: "multiplication"
        };
      }
    }

    case "primary6": {
      // Percentages, decimals, more complex operations
      const types = ["percentage", "division"];
      const type = types[random(0, types.length - 1)];
      
      if (type === "percentage") {
        const questions = [
          { question: "What is 10% of 100?", correct: "10", wrongs: ["1", "100", "20"] },
          { question: "What is 50% of 200?", correct: "100", wrongs: ["50", "150", "25"] },
          { question: "What is 25% of 40?", correct: "10", wrongs: ["15", "8", "20"] },
          { question: "What is 20% of 50?", correct: "10", wrongs: ["5", "15", "25"] },
          { question: "What is 75% of 80?", correct: "60", wrongs: ["40", "70", "75"] }
        ];
        const q = questions[random(0, questions.length - 1)];
        return {
          question: q.question,
          options: shuffleOptions(q.correct, q.wrongs),
          correctAnswer: q.correct,
          type: "percentage"
        };
      } else {
        const b = random(2, 12);
        const answer = random(10, 50);
        const a = b * answer;
        return {
          question: `${a} ÷ ${b} = ?`,
          options: shuffleOptions(answer.toString(), [
            (answer + 5).toString(),
            (answer - 5).toString(),
            (answer * 2).toString()
          ]),
          correctAnswer: answer.toString(),
          type: "division"
        };
      }
    }

    case "jss1": {
      // Basic algebra, integers
      const types = ["algebra", "integers"];
      const type = types[random(0, types.length - 1)];
      
      if (type === "algebra") {
        const x = random(2, 10);
        const b = random(1, 10);
        const result = x + b;
        return {
          question: `If x + ${b} = ${result}, what is x?`,
          options: shuffleOptions(x.toString(), [
            (x + 1).toString(),
            (x - 1).toString(),
            (x + 2).toString()
          ]),
          correctAnswer: x.toString(),
          type: "algebra",
          explanation: `x = ${result} - ${b} = ${x}`
        };
      } else {
        const a = random(-10, 10);
        const b = random(-10, 10);
        const answer = a + b;
        return {
          question: `${a >= 0 ? a : `(${a})`} + ${b >= 0 ? b : `(${b})`} = ?`,
          options: shuffleOptions(answer.toString(), [
            (answer + 2).toString(),
            (answer - 2).toString(),
            (answer * -1).toString()
          ]),
          correctAnswer: answer.toString(),
          type: "addition"
        };
      }
    }

    case "jss2": {
      // Linear equations, geometry basics
      const types = ["algebra", "geometry"];
      const type = types[random(0, types.length - 1)];
      
      if (type === "algebra") {
        const x = random(2, 10);
        const coefficient = random(2, 5);
        const result = coefficient * x;
        return {
          question: `Solve: ${coefficient}x = ${result}`,
          options: shuffleOptions(x.toString(), [
            (x + 1).toString(),
            (x - 1).toString(),
            (x * 2).toString()
          ]),
          correctAnswer: x.toString(),
          type: "algebra",
          explanation: `x = ${result} ÷ ${coefficient} = ${x}`
        };
      } else {
        const questions = [
          { question: "How many sides does a pentagon have?", correct: "5", wrongs: ["4", "6", "7"] },
          { question: "What is the sum of angles in a triangle?", correct: "180°", wrongs: ["90°", "360°", "270°"] },
          { question: "A rectangle has how many right angles?", correct: "4", wrongs: ["2", "3", "1"] },
          { question: "What is the perimeter of a square with side 5cm?", correct: "20cm", wrongs: ["25cm", "15cm", "10cm"] }
        ];
        const q = questions[random(0, questions.length - 1)];
        return {
          question: q.question,
          options: shuffleOptions(q.correct, q.wrongs),
          correctAnswer: q.correct,
          type: "geometry"
        };
      }
    }

    case "jss3": {
      // More complex algebra, indices
      const types = ["algebra", "indices"];
      const type = types[random(0, types.length - 1)];
      
      if (type === "indices") {
        const questions = [
          { question: "2³ = ?", correct: "8", wrongs: ["6", "9", "12"] },
          { question: "5² = ?", correct: "25", wrongs: ["10", "20", "15"] },
          { question: "3⁴ = ?", correct: "81", wrongs: ["12", "27", "64"] },
          { question: "10² = ?", correct: "100", wrongs: ["20", "1000", "50"] },
          { question: "4³ = ?", correct: "64", wrongs: ["12", "16", "48"] }
        ];
        const q = questions[random(0, questions.length - 1)];
        return {
          question: q.question,
          options: shuffleOptions(q.correct, q.wrongs),
          correctAnswer: q.correct,
          type: "indices"
        };
      } else {
        const x = random(2, 8);
        const a = random(2, 5);
        const b = random(1, 10);
        const result = a * x + b;
        return {
          question: `Solve: ${a}x + ${b} = ${result}`,
          options: shuffleOptions(x.toString(), [
            (x + 1).toString(),
            (x - 1).toString(),
            (x + 2).toString()
          ]),
          correctAnswer: x.toString(),
          type: "algebra",
          explanation: `${a}x = ${result} - ${b} = ${result - b}, so x = ${(result - b) / a}`
        };
      }
    }

    case "ss1": {
      // Quadratic intro, logarithms intro
      const types = ["indices", "factorization"];
      const type = types[random(0, types.length - 1)];
      
      if (type === "indices") {
        const questions = [
          { question: "Simplify: 2² × 2³", correct: "32", wrongs: ["10", "16", "64"] },
          { question: "What is √144?", correct: "12", wrongs: ["14", "11", "13"] },
          { question: "Simplify: 3² × 3²", correct: "81", wrongs: ["18", "27", "36"] },
          { question: "What is √225?", correct: "15", wrongs: ["14", "16", "25"] },
          { question: "2⁵ = ?", correct: "32", wrongs: ["10", "16", "64"] }
        ];
        const q = questions[random(0, questions.length - 1)];
        return {
          question: q.question,
          options: shuffleOptions(q.correct, q.wrongs),
          correctAnswer: q.correct,
          type: "indices"
        };
      } else {
        const questions = [
          { question: "Factorize: x² - 4", correct: "(x+2)(x-2)", wrongs: ["(x+4)(x-1)", "(x-2)(x-2)", "(x+1)(x-4)"] },
          { question: "Expand: (x+2)(x+3)", correct: "x²+5x+6", wrongs: ["x²+6x+5", "x²+5x+5", "x²+6x+6"] },
          { question: "If x² = 49, x = ?", correct: "±7", wrongs: ["7", "49", "±49"] }
        ];
        const q = questions[random(0, questions.length - 1)];
        return {
          question: q.question,
          options: shuffleOptions(q.correct, q.wrongs),
          correctAnswer: q.correct,
          type: "algebra"
        };
      }
    }

    case "ss2": {
      // Quadratics, logarithms
      const types = ["quadratic", "logarithm"];
      const type = types[random(0, types.length - 1)];
      
      if (type === "quadratic") {
        const questions = [
          { 
            question: "Solve: x² - 5x + 6 = 0", 
            correct: "x = 2 or 3", 
            wrongs: ["x = 1 or 6", "x = -2 or -3", "x = 2 or -3"],
            explanation: "(x-2)(x-3) = 0"
          },
          { 
            question: "Solve: x² - 9 = 0", 
            correct: "x = ±3", 
            wrongs: ["x = 3", "x = 9", "x = ±9"],
            explanation: "x² = 9, so x = ±√9 = ±3"
          },
          { 
            question: "Solve: x² + 2x - 8 = 0", 
            correct: "x = 2 or -4", 
            wrongs: ["x = 4 or -2", "x = -2 or 4", "x = 8 or -1"],
            explanation: "(x+4)(x-2) = 0"
          }
        ];
        const q = questions[random(0, questions.length - 1)];
        return {
          question: q.question,
          options: shuffleOptions(q.correct, q.wrongs),
          correctAnswer: q.correct,
          type: "quadratic",
          explanation: q.explanation
        };
      } else {
        const questions = [
          { question: "log₁₀(100) = ?", correct: "2", wrongs: ["10", "1", "100"] },
          { question: "log₁₀(1000) = ?", correct: "3", wrongs: ["10", "100", "30"] },
          { question: "log₂(8) = ?", correct: "3", wrongs: ["2", "4", "8"] },
          { question: "If log x = 2, then x = ?", correct: "100", wrongs: ["10", "20", "2"] }
        ];
        const q = questions[random(0, questions.length - 1)];
        return {
          question: q.question,
          options: shuffleOptions(q.correct, q.wrongs),
          correctAnswer: q.correct,
          type: "logarithm"
        };
      }
    }

    case "ss3": {
      // Advanced topics
      const types = ["quadratic", "calculus_intro", "logarithm"];
      const type = types[random(0, types.length - 1)];
      
      if (type === "quadratic") {
        const questions = [
          { 
            question: "Using quadratic formula, if b²-4ac < 0, the roots are:", 
            correct: "Complex/No real roots", 
            wrongs: ["Two equal roots", "Two distinct roots", "One root"] 
          },
          { 
            question: "The vertex of y = x² - 4x + 3 is at x = ?", 
            correct: "2", 
            wrongs: ["4", "-2", "3"],
            explanation: "x = -b/2a = 4/2 = 2"
          },
          { 
            question: "Sum of roots of x² - 7x + 12 = 0", 
            correct: "7", 
            wrongs: ["12", "-7", "5"],
            explanation: "Sum = -b/a = 7"
          }
        ];
        const q = questions[random(0, questions.length - 1)];
        return {
          question: q.question,
          options: shuffleOptions(q.correct, q.wrongs),
          correctAnswer: q.correct,
          type: "quadratic",
          explanation: q.explanation
        };
      } else if (type === "calculus_intro") {
        const questions = [
          { question: "If f(x) = x², then f'(x) = ?", correct: "2x", wrongs: ["x²", "2", "x"] },
          { question: "If f(x) = 3x³, then f'(x) = ?", correct: "9x²", wrongs: ["3x²", "x³", "9x³"] },
          { question: "The derivative of a constant is:", correct: "0", wrongs: ["1", "The constant", "Undefined"] },
          { question: "If f(x) = x⁴, then f'(x) = ?", correct: "4x³", wrongs: ["x⁴", "4x⁴", "x³"] }
        ];
        const q = questions[random(0, questions.length - 1)];
        return {
          question: q.question,
          options: shuffleOptions(q.correct, q.wrongs),
          correctAnswer: q.correct,
          type: "algebra"
        };
      } else {
        const questions = [
          { question: "Simplify: log a + log b", correct: "log(ab)", wrongs: ["log(a+b)", "log a × log b", "(log a)(log b)"] },
          { question: "Simplify: log a - log b", correct: "log(a/b)", wrongs: ["log(a-b)", "log a ÷ log b", "log(b/a)"] },
          { question: "Simplify: 2log x", correct: "log(x²)", wrongs: ["log(2x)", "(log x)²", "log 2x"] },
          { question: "If log₃(x) = 4, then x = ?", correct: "81", wrongs: ["12", "64", "27"] }
        ];
        const q = questions[random(0, questions.length - 1)];
        return {
          question: q.question,
          options: shuffleOptions(q.correct, q.wrongs),
          correctAnswer: q.correct,
          type: "logarithm"
        };
      }
    }

    default:
      return generateQuestion("primary1");
  }
};

// Points based on level
const getPointsForLevel = (levelId: string): number => {
  const levelPoints: Record<string, number> = {
    kg1: 10, kg2: 12,
    primary1: 15, primary2: 18, primary3: 20,
    primary4: 22, primary5: 25, primary6: 28,
    jss1: 30, jss2: 35, jss3: 40,
    ss1: 45, ss2: 50, ss3: 60
  };
  return levelPoints[levelId] || 15;
};

export default function MathChallenge() {
  const router = useRouter();
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<MathQuestion | null>(null);
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

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const celebrationAnim = useRef(new Animated.Value(0)).current;

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
    
    // Shake animation for wrong
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

  const startGame = (levelId: string) => {
    setSelectedLevel(levelId);
    setQuestionNumber(1);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setShowResult(false);
    const question = generateQuestion(levelId);
    setCurrentQuestion(question);
    setTimeLeft(getTimeForLevel(levelId));
    setIsTimerRunning(true);
  };

  const getTimeForLevel = (levelId: string | null): number => {
    if (!levelId) return 30; // Default fallback
    if (levelId.includes("kg")) return 45;
    if (levelId.includes("primary")) return 30;
    if (levelId.includes("jss")) return 25;
    return 20; // SS levels
  };

  const handleAnswer = (answer: string) => {
    if (selectedAnswer) return;
    
    setSelectedAnswer(answer);
    setIsTimerRunning(false);
    const correct = answer === currentQuestion?.correctAnswer;
    setIsCorrect(correct);

    if (correct) {
      setScore((prev) => prev + 1);
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > bestStreak) setBestStreak(newStreak);

      // Success animation
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.2, duration: 150, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();
    } else {
      setStreak(0);
      // Shake animation
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
    setQuestionNumber((prev) => prev + 1);
    setSelectedAnswer(null);
    setIsCorrect(null);
    const question = generateQuestion(selectedLevel!);
    setCurrentQuestion(question);
    setTimeLeft(getTimeForLevel(selectedLevel!));
    setIsTimerRunning(true);
  };

  const finishGame = async () => {
    setShowResult(true);
    setIsTimerRunning(false);

    const percentage = (score / totalQuestions) * 100;
    if (percentage >= 70) {
      setShowCelebration(true);
      Animated.timing(celebrationAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();

      // Award points
      try {
        const token = await AsyncStorage.getItem("kivelo_access_token");
        if (token) {
          const points = getPointsForLevel(selectedLevel!);
          const bonusPoints = Math.floor(bestStreak * 2);
          const totalPoints = points + bonusPoints;

          await fetch("https://family-wellness.onrender.com/api/v1/gamification/self-points", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              points: Math.min(totalPoints, 100),
              reason: `Math Challenge - ${EDUCATION_LEVELS.find(l => l.id === selectedLevel)?.name} - Score: ${score}/${totalQuestions}`,
            }),
          });
        }
      } catch (error) {
        console.log("Error awarding points:", error);
      }
    }
  };

  const resetGame = () => {
    setSelectedLevel(null);
    setCurrentQuestion(null);
    setQuestionNumber(1);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setShowResult(false);
    setShowCelebration(false);
    celebrationAnim.setValue(0);
  };

  // Level Selection Screen
  if (!selectedLevel) {
    return (
      <LinearGradient colors={["#10B981", "#059669"]} style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Math Challenge</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.levelScrollView} showsVerticalScrollIndicator={false}>
          <Text style={styles.selectLevelText}>Select Your Level</Text>
          <Text style={styles.selectLevelSubtext}>From Kindergarten to Senior Secondary</Text>
          
          <View style={styles.levelGrid}>
            {EDUCATION_LEVELS.map((level) => (
              <TouchableOpacity
                key={level.id}
                style={[styles.levelCard, { backgroundColor: level.color }]}
                onPress={() => startGame(level.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.levelName}>{level.name}</Text>
                <Text style={styles.levelDescription}>{level.description}</Text>
                <Text style={styles.levelAge}>{level.ageRange}</Text>
                <View style={styles.levelPoints}>
                  <Ionicons name="star" size={12} color="#FFD700" />
                  <Text style={styles.levelPointsText}>{getPointsForLevel(level.id)} pts</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </LinearGradient>
    );
  }

  // Results Screen
  if (showResult) {
    const percentage = (score / totalQuestions) * 100;
    const level = EDUCATION_LEVELS.find((l) => l.id === selectedLevel);
    const passed = percentage >= 70;

    return (
      <LinearGradient
        colors={passed ? ["#10B981", "#059669"] : ["#EF4444", "#DC2626"]}
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
              <Text style={styles.celebrationEmoji}>🎉🏆🎉</Text>
              <Text style={styles.celebrationTitle}>Excellent Work!</Text>
              <Text style={styles.celebrationSubtitle}>
                +{Math.min(getPointsForLevel(selectedLevel) + Math.floor(bestStreak * 2), 100)} Points Earned!
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
          <Text style={styles.resultEmoji}>{passed ? "🌟" : "💪"}</Text>
          <Text style={styles.resultTitle}>
            {passed ? "Great Job!" : "Keep Practicing!"}
          </Text>
          <Text style={styles.resultLevel}>{level?.name} - {level?.description}</Text>

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

          {passed && (
            <View style={styles.pointsEarned}>
              <Ionicons name="star" size={24} color="#FFD700" />
              <Text style={styles.pointsEarnedText}>
                +{Math.min(getPointsForLevel(selectedLevel) + Math.floor(bestStreak * 2), 100)} Points
              </Text>
            </View>
          )}

          <View style={styles.resultButtons}>
            <TouchableOpacity
              style={[styles.resultButton, styles.playAgainButton]}
              onPress={() => startGame(selectedLevel)}
            >
              <Ionicons name="refresh" size={20} color="#fff" />
              <Text style={styles.resultButtonText}>Play Again</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.resultButton, styles.changeLevelButton]}
              onPress={resetGame}
            >
              <Ionicons name="list" size={20} color="#10B981" />
              <Text style={[styles.resultButtonText, { color: "#10B981" }]}>
                Change Level
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
  const level = EDUCATION_LEVELS.find((l) => l.id === selectedLevel);
  const timerColor = timeLeft <= 5 ? "#EF4444" : timeLeft <= 10 ? "#F59E0B" : "#fff";

  return (
    <LinearGradient colors={["#10B981", "#059669"]} style={styles.container}>
      <View style={styles.gameHeader}>
        <TouchableOpacity onPress={resetGame} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.levelBadge}>
          <Text style={styles.levelBadgeText}>{level?.name}</Text>
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
        <Text style={styles.questionType}>{currentQuestion?.type.toUpperCase()}</Text>
        <Text style={styles.questionText}>{currentQuestion?.question}</Text>
      </Animated.View>

      {/* Options */}
      <View style={styles.optionsContainer}>
        {currentQuestion?.options.map((option, index) => {
          const isSelected = selectedAnswer === option;
          const isCorrectOption = option === currentQuestion.correctAnswer;
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
              <Text style={[styles.optionText, { color: textColor }]}>{option}</Text>
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

      {/* Explanation */}
      {selectedAnswer && currentQuestion?.explanation && (
        <View style={styles.explanationCard}>
          <Ionicons name="bulb" size={20} color="#F59E0B" />
          <Text style={styles.explanationText}>{currentQuestion.explanation}</Text>
        </View>
      )}
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
  levelScrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  selectLevelText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginTop: 20,
  },
  selectLevelSubtext: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    marginBottom: 25,
  },
  levelGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingBottom: 30,
  },
  levelCard: {
    width: "48%",
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  levelName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  levelDescription: {
    fontSize: 12,
    color: "rgba(255,255,255,0.9)",
    marginTop: 2,
  },
  levelAge: {
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
    marginTop: 4,
  },
  levelPoints: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    backgroundColor: "rgba(0,0,0,0.15)",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  levelPointsText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "600",
    marginLeft: 4,
  },
  gameHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  levelBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  levelBadgeText: {
    fontSize: 14,
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
    gap: 15,
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
    minHeight: 150,
    justifyContent: "center",
  },
  questionType: {
    fontSize: 12,
    color: "#10B981",
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 10,
  },
  questionText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F2937",
    textAlign: "center",
  },
  optionsContainer: {
    paddingHorizontal: 20,
    marginTop: 25,
  },
  optionButton: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 18,
    marginBottom: 12,
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
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
  },
  explanationCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.95)",
    marginHorizontal: 20,
    marginTop: 15,
    borderRadius: 12,
    padding: 15,
    gap: 10,
  },
  explanationText: {
    fontSize: 14,
    color: "#4B5563",
    flex: 1,
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
    marginBottom: 25,
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
    color: "#10B981",
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
  changeLevelButton: {
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
    fontSize: 60,
    marginBottom: 15,
  },
  celebrationTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#10B981",
    marginBottom: 8,
  },
  celebrationSubtitle: {
    fontSize: 18,
    color: "#6B7280",
    marginBottom: 25,
  },
  celebrationButton: {
    backgroundColor: "#10B981",
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
