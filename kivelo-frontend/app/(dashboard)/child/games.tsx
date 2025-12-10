// app/(dashboard)/child/games.tsx
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const GAMES = [
  {
    id: 1,
    icon: "extension-puzzle-outline",
    title: "Memory Match",
    description: "Match pairs of cards to sharpen your memory!",
    color: "#3B82F6",
    difficulty: "Easy",
    ageRange: "6-12",
    category: "Brain Training",
    route: "memory-match",
    available: true
  },
  {
    id: 2,
    icon: "color-palette-outline",
    title: "Color Quest",
    description: "Mix colors and learn color theory!",
    color: "#EC4899",
    difficulty: "Easy",
    ageRange: "5-10",
    category: "Creative",
    route: "color-quest",
    available: true
  },
  {
    id: 3,
    icon: "calculator-outline",
    title: "Math Challenge",
    description: "KG1 to SS3 math problems for all levels!",
    color: "#10B981",
    difficulty: "All Levels",
    ageRange: "3-17",
    category: "Educational",
    route: "math-challenge",
    available: true
  },
  {
    id: 4,
    icon: "bulb-outline",
    title: "Word Wizard",
    description: "Scramble, match & learn new words!",
    color: "#F59E0B",
    difficulty: "All Levels",
    ageRange: "6-18",
    category: "Language",
    route: "word-wizard",
    available: true
  },
  {
    id: 5,
    icon: "trophy-outline",
    title: "Trivia Master",
    description: "Test your knowledge with fun facts!",
    color: "#8B5CF6",
    difficulty: "All Levels",
    ageRange: "6-99",
    category: "Knowledge",
    route: "trivia-master",
    available: true
  },
  {
    id: 6,
    icon: "rocket-outline",
    title: "Space Explorer",
    description: "Navigate through space and collect stars!",
    color: "#06B6D4",
    difficulty: "All Levels",
    ageRange: "6-99",
    category: "Adventure",
    route: "space-explorer",
    available: true
  },
  {
    id: 7,
    icon: "musical-notes-outline",
    title: "Rhythm Beat",
    description: "Match the beat and create music!",
    color: "#EF4444",
    difficulty: "Medium",
    ageRange: "7-15",
    category: "Music",
    route: null,
    available: false
  },
  {
    id: 8,
    icon: "pizza-outline",
    title: "Chef's Kitchen",
    description: "Learn cooking by making virtual recipes!",
    color: "#F97316",
    difficulty: "Easy",
    ageRange: "6-14",
    category: "Life Skills",
    route: null,
    available: false
  },
  {
    id: 9,
    icon: "fitness-outline",
    title: "Move & Groove",
    description: "Physical activity challenges and dance moves!",
    color: "#84CC16",
    difficulty: "Easy",
    ageRange: "5-16",
    category: "Physical",
    route: null,
    available: false
  },
  {
    id: 10,
    icon: "earth-outline",
    title: "Geography Quiz",
    description: "Explore the world and learn about countries!",
    color: "#14B8A6",
    difficulty: "Medium",
    ageRange: "10-18",
    category: "Geography",
    route: null,
    available: false
  }
];

export default function Games() {
  const router = useRouter();

  const handleGamePress = (game: typeof GAMES[0]) => {
    if (game.available && game.route) {
      // Navigate to the game
      router.push(`/(dashboard)/child/${game.route}` as any);
    } else {
      Alert.alert(
        game.title,
        `${game.description}\n\nDifficulty: ${game.difficulty}\nAge: ${game.ageRange}`,
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Coming Soon!", 
            onPress: () => Alert.alert("🎮 Coming Soon!", "This game will be available in the next update!")
          }
        ]
      );
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy": return "#22C55E";
      case "Medium": return "#F59E0B";
      case "Hard": return "#EF4444";
      default: return "#6B7280";
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🎮 Fun Zone</Text>
        <Text style={styles.subtitle}>Choose a game and start playing!</Text>
      </View>

      {/* Games Grid */}
      <ScrollView 
        style={styles.gamesContainer}
        contentContainerStyle={styles.gamesContent}
        showsVerticalScrollIndicator={false}
      >
        {GAMES.map((game) => (
          <TouchableOpacity
            key={game.id}
            style={[
              styles.gameCard, 
              { borderLeftColor: game.color, borderLeftWidth: 4 },
              !game.available && styles.gameCardDisabled
            ]}
            onPress={() => handleGamePress(game)}
            activeOpacity={0.7}
          >
            <View style={styles.gameHeader}>
              <View style={[styles.iconContainer, { backgroundColor: game.color + '20' }]}>
                <Ionicons name={game.icon as any} size={32} color={game.color} />
              </View>
              <View style={styles.badgesRow}>
                {game.available && (
                  <View style={[styles.playBadge, { backgroundColor: '#22C55E' }]}>
                    <Ionicons name="play" size={10} color="white" />
                    <Text style={styles.playBadgeText}>Play Now</Text>
                  </View>
                )}
                <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(game.difficulty) }]}>
                  <Text style={styles.difficultyText}>{game.difficulty}</Text>
                </View>
              </View>
            </View>
            
            <Text style={styles.gameTitle}>{game.title}</Text>
            <Text style={styles.gameDescription}>{game.description}</Text>
            
            <View style={styles.gameFooter}>
              <View style={styles.gameInfo}>
                <Ionicons name="people-outline" size={14} color="#64748b" />
                <Text style={styles.ageText}>{game.ageRange}</Text>
              </View>
              <View style={styles.categoryTag}>
                <Text style={styles.categoryText}>{game.category}</Text>
              </View>
            </View>
            
            {!game.available && (
              <View style={styles.comingSoonOverlay}>
                <Text style={styles.comingSoonText}>Coming Soon</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f5f7fa' 
  },
  header: { 
    backgroundColor: 'white', 
    padding: 20, 
    paddingBottom: 20,
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.08, 
    shadowRadius: 8, 
    elevation: 4,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: '#1e293b', 
    marginBottom: 4
  },
  subtitle: { 
    fontSize: 15, 
    color: '#64748b'
  },
  gamesContainer: { 
    flex: 1
  },
  gamesContent: {
    padding: 16,
    paddingBottom: 24
  },
  gameCard: { 
    backgroundColor: 'white', 
    padding: 16, 
    borderRadius: 16, 
    marginBottom: 16, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 12, 
    elevation: 5
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  playBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4
  },
  playBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700'
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12
  },
  difficultyText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700'
  },
  gameTitle: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: '#1e293b',
    marginBottom: 6
  },
  gameDescription: { 
    fontSize: 14, 
    color: '#64748b', 
    marginBottom: 12, 
    lineHeight: 20 
  },
  gameFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8
  },
  gameInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  ageText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600'
  },
  categoryTag: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8
  },
  categoryText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  gameCardDisabled: {
    opacity: 0.7
  },
  comingSoonOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#94a3b8',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8
  },
  comingSoonText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase'
  }
});
