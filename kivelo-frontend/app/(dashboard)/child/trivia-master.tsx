// app/(dashboard)/child/trivia-master.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Categories
type Category = "science" | "history" | "geography" | "animals" | "sports" | "general";

interface CategoryConfig {
  id: Category;
  name: string;
  icon: string;
  color: string;
  emoji: string;
}

const CATEGORIES: CategoryConfig[] = [
  { id: "science", name: "Science", icon: "flask-outline", color: "#8B5CF6", emoji: "🔬" },
  { id: "history", name: "History", icon: "time-outline", color: "#EF4444", emoji: "📜" },
  { id: "geography", name: "Geography", icon: "earth-outline", color: "#10B981", emoji: "🌍" },
  { id: "animals", name: "Animals", icon: "paw-outline", color: "#F59E0B", emoji: "🦁" },
  { id: "sports", name: "Sports", icon: "football-outline", color: "#3B82F6", emoji: "⚽" },
  { id: "general", name: "General Knowledge", icon: "bulb-outline", color: "#EC4899", emoji: "💡" },
];

// Difficulty levels
type Difficulty = "easy" | "medium" | "hard";

interface DifficultyConfig {
  id: Difficulty;
  name: string;
  color: string;
  points: number;
  timePerQuestion: number;
}

const DIFFICULTIES: DifficultyConfig[] = [
  { id: "easy", name: "Easy", color: "#10B981", points: 10, timePerQuestion: 30 },
  { id: "medium", name: "Medium", color: "#F59E0B", points: 20, timePerQuestion: 25 },
  { id: "hard", name: "Hard", color: "#EF4444", points: 35, timePerQuestion: 20 },
];

interface TriviaQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  funFact?: string;
}

// Trivia questions by category and difficulty
const TRIVIA_BANKS: Record<Category, Record<Difficulty, TriviaQuestion[]>> = {
  science: {
    easy: [
      { question: "What planet is known as the Red Planet?", options: ["Mars", "Venus", "Jupiter", "Saturn"], correctAnswer: "Mars", funFact: "Mars appears red because of iron oxide (rust) on its surface!" },
      { question: "What gas do plants breathe in?", options: ["Carbon dioxide", "Oxygen", "Nitrogen", "Hydrogen"], correctAnswer: "Carbon dioxide", funFact: "Plants use CO2 for photosynthesis to make food!" },
      { question: "How many legs does a spider have?", options: ["8", "6", "10", "4"], correctAnswer: "8", funFact: "Spiders are arachnids, not insects!" },
      { question: "What is the largest organ in the human body?", options: ["Skin", "Heart", "Liver", "Brain"], correctAnswer: "Skin", funFact: "An adult's skin weighs about 8 pounds!" },
      { question: "What do bees make?", options: ["Honey", "Milk", "Silk", "Wax only"], correctAnswer: "Honey", funFact: "Bees visit 2 million flowers to make 1 pound of honey!" },
      { question: "What is H2O commonly known as?", options: ["Water", "Salt", "Sugar", "Air"], correctAnswer: "Water", funFact: "H2O means 2 hydrogen atoms and 1 oxygen atom!" },
      { question: "Which is the closest star to Earth?", options: ["The Sun", "Alpha Centauri", "Sirius", "Polaris"], correctAnswer: "The Sun", funFact: "The Sun is about 93 million miles from Earth!" },
      { question: "What force keeps us on the ground?", options: ["Gravity", "Magnetism", "Friction", "Wind"], correctAnswer: "Gravity", funFact: "The Moon has only 1/6 of Earth's gravity!" },
    ],
    medium: [
      { question: "What is the chemical symbol for gold?", options: ["Au", "Ag", "Fe", "Cu"], correctAnswer: "Au", funFact: "Au comes from the Latin word 'aurum' meaning shining dawn!" },
      { question: "How many bones are in the adult human body?", options: ["206", "300", "150", "250"], correctAnswer: "206", funFact: "Babies are born with about 270 bones!" },
      { question: "What is the hardest natural substance on Earth?", options: ["Diamond", "Steel", "Titanium", "Quartz"], correctAnswer: "Diamond", funFact: "Diamonds are made of carbon under extreme pressure!" },
      { question: "What planet has the most moons?", options: ["Saturn", "Jupiter", "Uranus", "Neptune"], correctAnswer: "Saturn", funFact: "Saturn has over 140 known moons!" },
      { question: "What type of blood cells fight infection?", options: ["White blood cells", "Red blood cells", "Platelets", "Plasma"], correctAnswer: "White blood cells", funFact: "Your body makes about 100 billion white blood cells daily!" },
      { question: "What is the speed of light?", options: ["300,000 km/s", "150,000 km/s", "500,000 km/s", "100,000 km/s"], correctAnswer: "300,000 km/s", funFact: "Light from the Sun takes 8 minutes to reach Earth!" },
    ],
    hard: [
      { question: "What is the powerhouse of the cell?", options: ["Mitochondria", "Nucleus", "Ribosome", "Golgi body"], correctAnswer: "Mitochondria", funFact: "Mitochondria have their own DNA separate from the cell!" },
      { question: "What element has the atomic number 79?", options: ["Gold", "Silver", "Platinum", "Mercury"], correctAnswer: "Gold", funFact: "All the gold ever mined would fit in 3.5 Olympic pools!" },
      { question: "What is absolute zero in Celsius?", options: ["-273.15°C", "-100°C", "0°C", "-459.67°C"], correctAnswer: "-273.15°C", funFact: "At absolute zero, atoms stop moving completely!" },
      { question: "What particle has no electric charge?", options: ["Neutron", "Proton", "Electron", "Positron"], correctAnswer: "Neutron", funFact: "Neutrons were discovered in 1932 by James Chadwick!" },
      { question: "What is the most abundant gas in Earth's atmosphere?", options: ["Nitrogen", "Oxygen", "Carbon dioxide", "Argon"], correctAnswer: "Nitrogen", funFact: "Nitrogen makes up about 78% of our atmosphere!" },
    ],
  },
  history: {
    easy: [
      { question: "Who was the first President of the United States?", options: ["George Washington", "Abraham Lincoln", "John Adams", "Thomas Jefferson"], correctAnswer: "George Washington", funFact: "Washington was the only president elected unanimously!" },
      { question: "What ancient wonder was in Egypt?", options: ["Pyramids of Giza", "Hanging Gardens", "Colossus", "Lighthouse"], correctAnswer: "Pyramids of Giza", funFact: "The Great Pyramid was the tallest structure for 3,800 years!" },
      { question: "Who discovered America in 1492?", options: ["Christopher Columbus", "Marco Polo", "Vasco da Gama", "Magellan"], correctAnswer: "Christopher Columbus", funFact: "Columbus thought he had reached Asia, not a new continent!" },
      { question: "What ship sank in 1912?", options: ["Titanic", "Lusitania", "Britannic", "Olympic"], correctAnswer: "Titanic", funFact: "The Titanic was called 'unsinkable' before it sank!" },
      { question: "Who was the first man on the moon?", options: ["Neil Armstrong", "Buzz Aldrin", "Yuri Gagarin", "John Glenn"], correctAnswer: "Neil Armstrong", funFact: "Armstrong's first step was watched by 600 million people!" },
      { question: "What wall divided Berlin?", options: ["Berlin Wall", "Great Wall", "Hadrian's Wall", "Stone Wall"], correctAnswer: "Berlin Wall", funFact: "The Berlin Wall stood for 28 years from 1961-1989!" },
    ],
    medium: [
      { question: "In what year did World War II end?", options: ["1945", "1944", "1946", "1943"], correctAnswer: "1945", funFact: "WWII ended with Japan's surrender on September 2, 1945!" },
      { question: "Who was known as the Maid of Orleans?", options: ["Joan of Arc", "Marie Antoinette", "Queen Victoria", "Cleopatra"], correctAnswer: "Joan of Arc", funFact: "Joan of Arc led armies at just 17 years old!" },
      { question: "What empire did Julius Caesar rule?", options: ["Roman Empire", "Greek Empire", "Persian Empire", "Egyptian Empire"], correctAnswer: "Roman Empire", funFact: "July is named after Julius Caesar!" },
      { question: "Who wrote the Declaration of Independence?", options: ["Thomas Jefferson", "Benjamin Franklin", "John Adams", "George Washington"], correctAnswer: "Thomas Jefferson", funFact: "Jefferson wrote it in just 17 days!" },
      { question: "What year did Nigeria gain independence?", options: ["1960", "1957", "1963", "1965"], correctAnswer: "1960", funFact: "Nigeria gained independence from Britain on October 1, 1960!" },
    ],
    hard: [
      { question: "What year was the Magna Carta signed?", options: ["1215", "1066", "1492", "1776"], correctAnswer: "1215", funFact: "The Magna Carta limited the power of the king!" },
      { question: "Who was the first female Prime Minister of Britain?", options: ["Margaret Thatcher", "Theresa May", "Queen Victoria", "Elizabeth I"], correctAnswer: "Margaret Thatcher", funFact: "Thatcher was PM from 1979-1990, the longest in 150 years!" },
      { question: "What ancient civilization built Machu Picchu?", options: ["Inca", "Maya", "Aztec", "Olmec"], correctAnswer: "Inca", funFact: "Machu Picchu was built around 1450 AD!" },
      { question: "Who was the first Emperor of China?", options: ["Qin Shi Huang", "Han Wudi", "Kublai Khan", "Confucius"], correctAnswer: "Qin Shi Huang", funFact: "He unified China and started building the Great Wall!" },
    ],
  },
  geography: {
    easy: [
      { question: "What is the largest continent?", options: ["Asia", "Africa", "Europe", "North America"], correctAnswer: "Asia", funFact: "Asia covers about 30% of Earth's land area!" },
      { question: "What is the largest ocean?", options: ["Pacific Ocean", "Atlantic Ocean", "Indian Ocean", "Arctic Ocean"], correctAnswer: "Pacific Ocean", funFact: "The Pacific Ocean is larger than all land combined!" },
      { question: "What country is shaped like a boot?", options: ["Italy", "Spain", "France", "Greece"], correctAnswer: "Italy", funFact: "Italy has 3 active volcanoes!" },
      { question: "What is the capital of France?", options: ["Paris", "London", "Rome", "Berlin"], correctAnswer: "Paris", funFact: "Paris has over 470 parks and gardens!" },
      { question: "What is the longest river in Africa?", options: ["Nile", "Congo", "Niger", "Zambezi"], correctAnswer: "Nile", funFact: "The Nile flows through 11 countries!" },
      { question: "How many continents are there?", options: ["7", "5", "6", "8"], correctAnswer: "7", funFact: "Antarctica is the only continent with no countries!" },
      { question: "What is the capital of Nigeria?", options: ["Abuja", "Lagos", "Kano", "Port Harcourt"], correctAnswer: "Abuja", funFact: "Abuja became Nigeria's capital in 1991!" },
    ],
    medium: [
      { question: "What is the smallest country in the world?", options: ["Vatican City", "Monaco", "San Marino", "Liechtenstein"], correctAnswer: "Vatican City", funFact: "Vatican City is only 0.44 square kilometers!" },
      { question: "What mountain is the tallest in the world?", options: ["Mount Everest", "K2", "Kangchenjunga", "Lhotse"], correctAnswer: "Mount Everest", funFact: "Everest grows about 4mm taller each year!" },
      { question: "What country has the most people?", options: ["India", "China", "USA", "Indonesia"], correctAnswer: "India", funFact: "India surpassed China's population in 2023!" },
      { question: "What desert is the largest in the world?", options: ["Sahara", "Arabian", "Gobi", "Kalahari"], correctAnswer: "Sahara", funFact: "The Sahara is almost as big as the USA!" },
      { question: "What strait separates Europe and Africa?", options: ["Strait of Gibraltar", "English Channel", "Bosphorus", "Suez"], correctAnswer: "Strait of Gibraltar", funFact: "At its narrowest, it's only 14.3 km wide!" },
    ],
    hard: [
      { question: "What is the deepest point in the ocean?", options: ["Mariana Trench", "Puerto Rico Trench", "Java Trench", "Philippine Trench"], correctAnswer: "Mariana Trench", funFact: "It's about 11,034 meters deep - deeper than Everest is tall!" },
      { question: "What country has the most time zones?", options: ["France", "Russia", "USA", "China"], correctAnswer: "France", funFact: "France has 12 time zones due to overseas territories!" },
      { question: "What is the driest place on Earth?", options: ["Atacama Desert", "Sahara Desert", "Death Valley", "Antarctica"], correctAnswer: "Atacama Desert", funFact: "Some parts haven't had rain for 500 years!" },
      { question: "What African country has the most pyramids?", options: ["Sudan", "Egypt", "Ethiopia", "Libya"], correctAnswer: "Sudan", funFact: "Sudan has over 200 pyramids, more than Egypt!" },
    ],
  },
  animals: {
    easy: [
      { question: "What is the largest land animal?", options: ["Elephant", "Giraffe", "Hippo", "Rhino"], correctAnswer: "Elephant", funFact: "African elephants can weigh up to 14,000 pounds!" },
      { question: "What animal is known as man's best friend?", options: ["Dog", "Cat", "Horse", "Bird"], correctAnswer: "Dog", funFact: "Dogs have been domesticated for over 15,000 years!" },
      { question: "How many legs does a butterfly have?", options: ["6", "4", "8", "2"], correctAnswer: "6", funFact: "Butterflies taste with their feet!" },
      { question: "What is a baby dog called?", options: ["Puppy", "Kitten", "Calf", "Cub"], correctAnswer: "Puppy", funFact: "Puppies are born deaf and blind!" },
      { question: "What animal has black and white stripes?", options: ["Zebra", "Tiger", "Leopard", "Cheetah"], correctAnswer: "Zebra", funFact: "Every zebra has unique stripes like fingerprints!" },
      { question: "What do pandas mainly eat?", options: ["Bamboo", "Meat", "Fish", "Fruits"], correctAnswer: "Bamboo", funFact: "Pandas eat up to 38 kg of bamboo per day!" },
      { question: "What is the fastest land animal?", options: ["Cheetah", "Lion", "Leopard", "Horse"], correctAnswer: "Cheetah", funFact: "Cheetahs can run up to 70 mph!" },
    ],
    medium: [
      { question: "What is the largest species of shark?", options: ["Whale shark", "Great white", "Hammerhead", "Tiger shark"], correctAnswer: "Whale shark", funFact: "Whale sharks can grow up to 40 feet long!" },
      { question: "What animal sleeps standing up?", options: ["Horse", "Cow", "Elephant", "Giraffe"], correctAnswer: "Horse", funFact: "Horses can lock their legs to sleep standing!" },
      { question: "How long can a camel go without water?", options: ["2 weeks", "1 week", "1 month", "3 days"], correctAnswer: "2 weeks", funFact: "Camels can drink 40 gallons of water at once!" },
      { question: "What bird can fly backwards?", options: ["Hummingbird", "Eagle", "Sparrow", "Owl"], correctAnswer: "Hummingbird", funFact: "Hummingbirds beat their wings 80 times per second!" },
      { question: "What is a group of lions called?", options: ["Pride", "Pack", "Herd", "Flock"], correctAnswer: "Pride", funFact: "A pride typically has 10-15 lions!" },
    ],
    hard: [
      { question: "What animal has the longest lifespan?", options: ["Greenland shark", "Elephant", "Tortoise", "Whale"], correctAnswer: "Greenland shark", funFact: "Greenland sharks can live over 400 years!" },
      { question: "What is the only mammal that can fly?", options: ["Bat", "Flying squirrel", "Sugar glider", "Colugo"], correctAnswer: "Bat", funFact: "There are over 1,400 species of bats!" },
      { question: "What animal has three hearts?", options: ["Octopus", "Squid", "Jellyfish", "Starfish"], correctAnswer: "Octopus", funFact: "Two hearts pump blood to gills, one to the body!" },
      { question: "What percentage of an iceberg is underwater?", options: ["90%", "70%", "50%", "80%"], correctAnswer: "90%", funFact: "This is why icebergs are so dangerous to ships!" },
    ],
  },
  sports: {
    easy: [
      { question: "How many players are on a soccer team?", options: ["11", "10", "12", "9"], correctAnswer: "11", funFact: "Soccer is the most popular sport in the world!" },
      { question: "What sport uses a bat and ball?", options: ["Baseball", "Soccer", "Basketball", "Hockey"], correctAnswer: "Baseball", funFact: "Baseball is called America's pastime!" },
      { question: "What color are tennis balls?", options: ["Yellow", "White", "Green", "Orange"], correctAnswer: "Yellow", funFact: "Yellow balls are easier to see on TV!" },
      { question: "How many rings are on the Olympic flag?", options: ["5", "4", "6", "7"], correctAnswer: "5", funFact: "Each ring represents a continent!" },
      { question: "What sport is played at Wimbledon?", options: ["Tennis", "Golf", "Cricket", "Rugby"], correctAnswer: "Tennis", funFact: "Wimbledon is the oldest tennis tournament, started in 1877!" },
      { question: "In basketball, how many points is a free throw?", options: ["1", "2", "3", "0"], correctAnswer: "1", funFact: "The free throw line is 15 feet from the basket!" },
    ],
    medium: [
      { question: "What country invented the game of golf?", options: ["Scotland", "England", "USA", "Ireland"], correctAnswer: "Scotland", funFact: "Golf was invented in Scotland in the 15th century!" },
      { question: "How long is a marathon?", options: ["42.195 km", "40 km", "45 km", "50 km"], correctAnswer: "42.195 km", funFact: "The distance honors the legend of Pheidippides!" },
      { question: "What sport does Usain Bolt compete in?", options: ["Sprinting", "Long jump", "Swimming", "Cycling"], correctAnswer: "Sprinting", funFact: "Bolt's 100m record is 9.58 seconds!" },
      { question: "How many periods are in an ice hockey game?", options: ["3", "2", "4", "5"], correctAnswer: "3", funFact: "Each period is 20 minutes long!" },
      { question: "What country has won the most FIFA World Cups?", options: ["Brazil", "Germany", "Italy", "Argentina"], correctAnswer: "Brazil", funFact: "Brazil has won 5 World Cups!" },
    ],
    hard: [
      { question: "What is a perfect score in bowling?", options: ["300", "200", "250", "150"], correctAnswer: "300", funFact: "A perfect game requires 12 strikes in a row!" },
      { question: "What year were the first modern Olympics held?", options: ["1896", "1900", "1888", "1912"], correctAnswer: "1896", funFact: "They were held in Athens, Greece!" },
      { question: "How many Grand Slam tournaments are there in tennis?", options: ["4", "3", "5", "6"], correctAnswer: "4", funFact: "Australian Open, French Open, Wimbledon, US Open!" },
      { question: "What is the national sport of Japan?", options: ["Sumo wrestling", "Judo", "Karate", "Baseball"], correctAnswer: "Sumo wrestling", funFact: "Sumo wrestlers can weigh over 400 pounds!" },
    ],
  },
  general: {
    easy: [
      { question: "How many colors are in a rainbow?", options: ["7", "6", "8", "5"], correctAnswer: "7", funFact: "ROY G. BIV helps remember the colors!" },
      { question: "What is the currency of Japan?", options: ["Yen", "Yuan", "Won", "Dollar"], correctAnswer: "Yen", funFact: "Yen means 'circle' or 'round object'!" },
      { question: "How many days are in a week?", options: ["7", "5", "6", "8"], correctAnswer: "7", funFact: "The 7-day week was invented by Babylonians!" },
      { question: "What language has the most native speakers?", options: ["Mandarin Chinese", "English", "Spanish", "Hindi"], correctAnswer: "Mandarin Chinese", funFact: "Over 900 million people speak Mandarin!" },
      { question: "What is the currency of Nigeria?", options: ["Naira", "Cedi", "Shilling", "Rand"], correctAnswer: "Naira", funFact: "The Naira was introduced in 1973!" },
      { question: "How many letters are in the English alphabet?", options: ["26", "24", "27", "25"], correctAnswer: "26", funFact: "The letter E is the most common!" },
    ],
    medium: [
      { question: "Who painted the Mona Lisa?", options: ["Leonardo da Vinci", "Michelangelo", "Raphael", "Picasso"], correctAnswer: "Leonardo da Vinci", funFact: "The Mona Lisa has no eyebrows!" },
      { question: "What is the largest organ in the human body?", options: ["Skin", "Liver", "Brain", "Heart"], correctAnswer: "Skin", funFact: "Skin renews itself every 27 days!" },
      { question: "What company makes the iPhone?", options: ["Apple", "Samsung", "Google", "Microsoft"], correctAnswer: "Apple", funFact: "The first iPhone was released in 2007!" },
      { question: "How many teeth does an adult human have?", options: ["32", "28", "30", "34"], correctAnswer: "32", funFact: "Wisdom teeth are the last to appear!" },
      { question: "What is the largest planet in our solar system?", options: ["Jupiter", "Saturn", "Neptune", "Uranus"], correctAnswer: "Jupiter", funFact: "Jupiter could fit 1,300 Earths inside it!" },
    ],
    hard: [
      { question: "What year was the internet invented?", options: ["1969", "1975", "1983", "1990"], correctAnswer: "1969", funFact: "ARPANET was the first network, created in 1969!" },
      { question: "What is the capital of Australia?", options: ["Canberra", "Sydney", "Melbourne", "Perth"], correctAnswer: "Canberra", funFact: "Canberra was purpose-built to be the capital!" },
      { question: "What is the smallest bone in the human body?", options: ["Stapes", "Femur", "Radius", "Phalanx"], correctAnswer: "Stapes", funFact: "The stapes is in your ear and is just 3mm!" },
      { question: "What does DNA stand for?", options: ["Deoxyribonucleic acid", "Dioxynucleic acid", "Deoxyribo acid", "Dynamic nucleic acid"], correctAnswer: "Deoxyribonucleic acid", funFact: "If stretched out, your DNA would reach the sun!" },
    ],
  },
};

// Shuffle array helper
const shuffleArray = <T,>(arr: T[]): T[] => {
  const newArr = [...arr];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

export default function TriviaMaster() {
  const router = useRouter();
  const [category, setCategory] = useState<Category | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showFunFact, setShowFunFact] = useState(false);
  const [totalQuestions, setTotalQuestions] = useState(10);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const celebrationAnim = useRef(new Animated.Value(0)).current;
  const funFactAnim = useRef(new Animated.Value(0)).current;

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

  // Progress animation
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: currentQuestionIndex / totalQuestions,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [currentQuestionIndex]);

  const handleTimeUp = () => {
    setIsTimerRunning(false);
    setIsCorrect(false);
    setStreak(0);
    setShowFunFact(true);
    
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();

    Animated.timing(funFactAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      // Check if there are more questions available
      const nextIndex = currentQuestionIndex + 1;
      if (nextIndex < questions.length && nextIndex < totalQuestions) {
        nextQuestion();
      } else {
        finishGame();
      }
    }, 2500);
  };

  const startGame = (cat: Category, diff: Difficulty) => {
    setCategory(cat);
    setDifficulty(diff);
    
    // Get questions for the selected category and difficulty
    // Also include questions from adjacent difficulties to ensure we have enough
    const questionBank = [...TRIVIA_BANKS[cat][diff]];
    
    // If not enough questions, add from other difficulties
    if (questionBank.length < 10) {
      const allDifficulties: Difficulty[] = ["easy", "medium", "hard"];
      for (const d of allDifficulties) {
        if (d !== diff) {
          const additionalQuestions = TRIVIA_BANKS[cat][d].filter(
            q => !questionBank.some(existing => existing.question === q.question)
          );
          questionBank.push(...additionalQuestions);
        }
      }
    }
    
    const shuffled = shuffleArray(questionBank);
    const questionsToUse = shuffled.slice(0, Math.min(10, shuffled.length));
    setQuestions(questionsToUse);
    setTotalQuestions(questionsToUse.length);
    
    setCurrentQuestionIndex(0);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setShowResult(false);
    
    const diffConfig = DIFFICULTIES.find(d => d.id === diff);
    setTimeLeft(diffConfig?.timePerQuestion || 30);
    setIsTimerRunning(true);
  };

  const handleAnswer = (answer: string) => {
    if (selectedAnswer) return;
    
    setSelectedAnswer(answer);
    setIsTimerRunning(false);
    
    const currentQuestion = questions[currentQuestionIndex];
    const correct = answer === currentQuestion.correctAnswer;
    setIsCorrect(correct);
    setShowFunFact(true);

    Animated.timing(funFactAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    if (correct) {
      setScore((prev) => prev + 1);
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > bestStreak) setBestStreak(newStreak);

      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.1, duration: 150, useNativeDriver: true }),
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
      // Check if there are more questions available
      const nextIndex = currentQuestionIndex + 1;
      if (nextIndex < questions.length && nextIndex < totalQuestions) {
        nextQuestion();
      } else {
        finishGame();
      }
    }, 2500);
  };

  const nextQuestion = () => {
    const nextIndex = currentQuestionIndex + 1;
    // Safety check - don't go past available questions
    if (nextIndex >= questions.length) {
      finishGame();
      return;
    }
    
    setCurrentQuestionIndex(nextIndex);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setShowFunFact(false);
    funFactAnim.setValue(0);
    
    const diffConfig = DIFFICULTIES.find(d => d.id === difficulty);
    setTimeLeft(diffConfig?.timePerQuestion || 30);
    setIsTimerRunning(true);
  };

  const finishGame = async () => {
    setShowResult(true);
    setIsTimerRunning(false);

    const percentage = (score / totalQuestions) * 100;
    if (percentage >= 70 && difficulty) {
      setShowCelebration(true);
      Animated.timing(celebrationAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();

      try {
        const token = await AsyncStorage.getItem("kivelo_access_token");
        if (token) {
          const diffConfig = DIFFICULTIES.find(d => d.id === difficulty);
          const basePoints = diffConfig?.points || 10;
          const streakBonus = Math.floor(bestStreak * 3);
          const totalPoints = basePoints + streakBonus;

          await fetch("https://family-wellness.onrender.com/api/v1/gamification/self-points", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              points: Math.min(totalPoints, 100),
              reason: `Trivia Master - ${CATEGORIES.find(c => c.id === category)?.name} (${diffConfig?.name}) - Score: ${score}/${totalQuestions}`,
            }),
          });
        }
      } catch (error) {
        console.log("Error awarding points:", error);
      }
    }
  };

  const resetGame = () => {
    setCategory(null);
    setDifficulty(null);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setShowResult(false);
    setShowCelebration(false);
    setShowFunFact(false);
    celebrationAnim.setValue(0);
    funFactAnim.setValue(0);
  };

  // Category Selection Screen
  if (!category) {
    return (
      <LinearGradient colors={["#8B5CF6", "#6D28D9"]} style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Trivia Master</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <Text style={styles.selectText}>🏆 Choose a Category</Text>
          <Text style={styles.selectSubtext}>Test your knowledge!</Text>
          
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryCard, { backgroundColor: cat.color }]}
                onPress={() => setCategory(cat.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                <Text style={styles.categoryName}>{cat.name}</Text>
                <View style={styles.categoryIconContainer}>
                  <Ionicons name={cat.icon as any} size={24} color="rgba(255,255,255,0.8)" />
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
    const selectedCategory = CATEGORIES.find(c => c.id === category);
    return (
      <LinearGradient colors={[selectedCategory?.color || "#8B5CF6", "#6D28D9"]} style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setCategory(null)} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{selectedCategory?.emoji} {selectedCategory?.name}</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.difficultyContainer}>
          <Text style={styles.selectText}>Select Difficulty</Text>
          <Text style={styles.selectSubtext}>Harder = More points!</Text>

          <View style={styles.difficultyGrid}>
            {DIFFICULTIES.map((diff) => (
              <TouchableOpacity
                key={diff.id}
                style={[styles.difficultyCard, { borderColor: diff.color }]}
                onPress={() => startGame(category, diff.id)}
                activeOpacity={0.8}
              >
                <View style={[styles.difficultyBadge, { backgroundColor: diff.color }]}>
                  <Ionicons 
                    name={diff.id === "easy" ? "happy-outline" : diff.id === "medium" ? "alert-outline" : "flame-outline"} 
                    size={28} 
                    color="#fff" 
                  />
                </View>
                <View style={styles.difficultyInfo}>
                  <Text style={styles.difficultyName}>{diff.name}</Text>
                  <Text style={styles.difficultyDetails}>
                    {diff.timePerQuestion}s • {diff.points} pts base
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
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
    const catConfig = CATEGORIES.find(c => c.id === category);
    const diffConfig = DIFFICULTIES.find(d => d.id === difficulty);
    const passed = percentage >= 70;
    const basePoints = diffConfig?.points || 10;
    const streakBonus = Math.floor(bestStreak * 3);
    const totalPoints = basePoints + streakBonus;

    return (
      <LinearGradient
        colors={passed ? [catConfig?.color || "#8B5CF6", "#6D28D9"] : ["#EF4444", "#DC2626"]}
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
              <Text style={styles.celebrationEmoji}>🏆🎉🌟</Text>
              <Text style={[styles.celebrationTitle, { color: catConfig?.color }]}>Trivia Champion!</Text>
              <Text style={styles.celebrationSubtitle}>
                +{Math.min(totalPoints, 100)} Points Earned!
              </Text>
              <TouchableOpacity
                style={[styles.celebrationButton, { backgroundColor: catConfig?.color }]}
                onPress={() => setShowCelebration(false)}
              >
                <Text style={styles.celebrationButtonText}>Continue</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Modal>

        <View style={styles.resultContainer}>
          <Text style={styles.resultEmoji}>{passed ? "🏆" : "💪"}</Text>
          <Text style={styles.resultTitle}>
            {passed ? "Amazing!" : "Good Try!"}
          </Text>
          <Text style={styles.resultLevel}>
            {catConfig?.emoji} {catConfig?.name} - {diffConfig?.name}
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
              onPress={() => startGame(category, difficulty)}
            >
              <Ionicons name="refresh" size={20} color="#fff" />
              <Text style={styles.resultButtonText}>Play Again</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.resultButton, styles.changeCategoryButton]}
              onPress={resetGame}
            >
              <Ionicons name="grid" size={20} color={catConfig?.color} />
              <Text style={[styles.resultButtonText, { color: catConfig?.color }]}>
                Categories
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
  const catConfig = CATEGORIES.find(c => c.id === category);
  const currentQuestion = questions[currentQuestionIndex];
  const timerColor = timeLeft <= 5 ? "#EF4444" : timeLeft <= 10 ? "#F59E0B" : "#fff";

  // Safety check - if no question available, finish game
  if (!currentQuestion) {
    if (questions.length > 0 && currentQuestionIndex >= questions.length) {
      // We've run out of questions, finish the game
      finishGame();
    }
    return (
      <LinearGradient colors={[catConfig?.color || "#8B5CF6", "#6D28D9"]} style={styles.container}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ color: "#fff", fontSize: 18 }}>Loading...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[catConfig?.color || "#8B5CF6", "#6D28D9"]} style={styles.container}>
      <View style={styles.gameHeader}>
        <TouchableOpacity onPress={resetGame} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeEmoji}>{catConfig?.emoji}</Text>
          <Text style={styles.categoryBadgeText}>{catConfig?.name}</Text>
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
          {currentQuestionIndex + 1}/{totalQuestions}
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
        <Text style={styles.questionText}>{currentQuestion.question}</Text>
      </Animated.View>

      {/* Fun Fact */}
      {showFunFact && currentQuestion.funFact && (
        <Animated.View style={[styles.funFactCard, { opacity: funFactAnim }]}>
          <Ionicons name="bulb" size={18} color="#F59E0B" />
          <Text style={styles.funFactText}>{currentQuestion.funFact}</Text>
        </Animated.View>
      )}

      {/* Options */}
      <ScrollView style={styles.optionsScrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option, index) => {
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

            const optionLetters = ["A", "B", "C", "D"];

            return (
              <TouchableOpacity
                key={index}
                style={optionStyle}
                onPress={() => handleAnswer(option)}
                disabled={!!selectedAnswer}
                activeOpacity={0.8}
              >
                <View style={[styles.optionLetter, selectedAnswer && isCorrectOption && styles.optionLetterCorrect, selectedAnswer && isSelected && !isCorrect && styles.optionLetterWrong]}>
                  <Text style={[styles.optionLetterText, (selectedAnswer && (isCorrectOption || (isSelected && !isCorrect))) && { color: "#fff" }]}>
                    {optionLetters[index]}
                  </Text>
                </View>
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
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  scrollView: {
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
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingBottom: 30,
  },
  categoryCard: {
    width: "48%",
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  categoryEmoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
  categoryIconContainer: {
    position: "absolute",
    top: 10,
    right: 10,
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
    padding: 16,
    borderWidth: 3,
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  difficultyBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  difficultyInfo: {
    flex: 1,
  },
  difficultyName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
  },
  difficultyDetails: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  gameHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  categoryBadgeEmoji: {
    fontSize: 16,
  },
  categoryBadgeText: {
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
    minHeight: 120,
    justifyContent: "center",
  },
  questionText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
    textAlign: "center",
    lineHeight: 28,
  },
  funFactCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  funFactText: {
    fontSize: 13,
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
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    gap: 12,
  },
  correctOption: {
    backgroundColor: "#10B981",
  },
  wrongOption: {
    backgroundColor: "#EF4444",
  },
  optionLetter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  optionLetterCorrect: {
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  optionLetterWrong: {
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  optionLetterText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#6B7280",
  },
  optionText: {
    fontSize: 16,
    fontWeight: "600",
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
    color: "#8B5CF6",
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
  changeCategoryButton: {
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
    marginBottom: 8,
  },
  celebrationSubtitle: {
    fontSize: 18,
    color: "#6B7280",
    marginBottom: 25,
  },
  celebrationButton: {
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
