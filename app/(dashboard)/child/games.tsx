import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    Dimensions,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const { width, height } = Dimensions.get("window");

// ✅ Columns adapt to device size
const getColumns = () => {
  if (width >= 1024) return 4; // iPad Pro / large tablets
  if (width >= 768) return 3;  // normal tablets
  return 2; // phones
};

const columns = getColumns();
const cardWidth = (width - 16 * 2 - 10 * (columns - 1)) / columns;

export default function Games() {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={{ uri: "https://i.pravatar.cc/100" }}
          style={styles.avatar}
        />
        <View>
          <Text style={styles.greeting}>Hello, Favor</Text>
          <Text style={styles.subText}>Ready to learn & play today?</Text>
        </View>
        <Ionicons
          name="notifications-outline"
          size={24}
          color="#333"
          style={{ marginLeft: "auto" }}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: height * 0.15 }} // 🔽 Clearance above tab bar
      >
        {/* Recent Games */}
        <Text style={styles.sectionTitle}>Your Recent Games</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { title: "Spelling Challenge", subtitle: "Play and get rewarded", bg: "#e6f3ff" },
            { title: "Math Quiz", subtitle: "Sharpen your skills", bg: "#ffe6cc" },
            { title: "Animal Puzzle", subtitle: "Solve and learn", bg: "#e6ffe6" },
            { title: "Memory Match", subtitle: "Boost your memory", bg: "#fce6ff" },
          ].map((game, i) => (
            <View key={i} style={[styles.recentCard, { backgroundColor: game.bg }]}>
              <Text style={styles.cardTitle}>{game.title}</Text>
              <Text style={styles.cardSubtitle}>{game.subtitle}</Text>
              <TouchableOpacity style={styles.continueBtn}>
                <Text style={styles.continueText}>Continue</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>

        {/* All Games */}
        <Text style={styles.sectionTitle}>All Games</Text>
        <View style={styles.tags}>
          <Text style={styles.tag}>Education</Text>
          <Text style={styles.tag}>Puzzles</Text>
          <Text style={styles.tag}>Drawing</Text>
        </View>

        <View style={styles.gamesGrid}>
          {Array.from({ length: 8 }).map((_, i) => (
            <View key={i} style={[styles.gameCard, { width: cardWidth }]}>
              <Image
                source={{ uri: "https://via.placeholder.com/150x100" }}
                style={styles.gameImage}
              />
              <TouchableOpacity style={styles.playBtn}>
                <Text style={styles.playText}>Play Now</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: height * 0.06, // responsive top
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: height * 0.025,
  },
  avatar: {
    width: width * 0.12,
    height: width * 0.12,
    borderRadius: (width * 0.12) / 2,
    marginRight: 12,
  },

  greeting: { 
    fontSize: width * 0.045, 
    color: "#333",
    fontFamily: "Poppins-Bold", 
  },
  subText: { 
    fontSize: width * 0.027, 
    color: "#666",
    marginTop: -12,
    fontFamily: "Poppins-Regular", 
  },

  sectionTitle: {
    fontSize: width * 0.04,
    marginVertical: height * 0.015,
    fontFamily: "Poppins-SemiBold",
  },

  recentCard: {
    width: width * 0.85,
    borderRadius: 18,
    padding: width * 0.04,
    marginRight: 10,
  },
  cardTitle: { 
    fontSize: width * 0.04, 
    marginBottom: -4,
    fontFamily: "Poppins-Bold",
  },
  cardSubtitle: { 
    fontSize: width * 0.03, 
    color: "#555",
    marginBottom: 14,
    fontFamily: "Poppins-Regular",
  },

  continueBtn: {
    marginTop: height * 0.01,
    backgroundColor: "#0530ad",
    paddingHorizontal: 20,
    paddingVertical: 5,
    borderRadius: 50,
    alignSelf: "flex-start",
  },
  continueText: { 
    color: "#fff", 
    fontSize: width * 0.025,
    fontFamily: "Poppins-Regular",
  },

  tags: { 
    flexDirection: "row", 
    marginBottom: height * 0.035 
  },
  tag: {
    backgroundColor: "#f2f2f2",
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.008,
    borderRadius: 50,
    marginRight: 8,
    fontSize: width * 0.03,
    fontFamily: "Poppins-Regular",
  },

  gamesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  gameCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 18,
    marginBottom: height * 0.03,
    overflow: "hidden",
  },
  gameImage: { 
    width: "100%", 
    height: height * 0.15 
  },
  playBtn: { 
    backgroundColor: "#0530ad", 
    padding: 8, 
    alignItems: "center" 
  },
  playText: { 
    color: "#fff", 
    fontSize: width * 0.03,
    fontFamily: "Poppins-Regular",
  },
});
