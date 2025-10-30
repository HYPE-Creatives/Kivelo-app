// import { Ionicons } from "@expo/vector-icons";
// import { useRouter } from "expo-router";
// import React from "react";
// import {
//   Dimensions,
//   Image,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from "react-native";

// allow flexible route strings used across the app
type RouteType = string;

// // ✅ Responsive column layout
// const getColumns = () => {
//   if (width >= 1024) return 4;
//   if (width >= 768) return 3;
//   return 2;
// };

// const columns = getColumns();
// const cardWidth = (width - 16 * 2 - 10 * (columns - 1)) / columns;

// export default function Games() {
//   const router = useRouter();

//   // Dummy game list (could later be dynamic)
//   const gamesList = [
//     { title: "Tetris", image: "https://via.placeholder.com/150x100", route: "/tetris/tetris" },
//     { title: "Spelling Challenge", image: "https://via.placeholder.com/150x100" },
//     { title: "Math Quiz", image: "https://via.placeholder.com/150x100" },
//     { title: "Animal Puzzle", image: "https://via.placeholder.com/150x100" },
//     { title: "Memory Match", image: "https://via.placeholder.com/150x100" },
//     { title: "Drawing Fun", image: "https://via.placeholder.com/150x100" },
//     { title: "Word Hunt", image: "https://via.placeholder.com/150x100" },
//     { title: "Logic Builder", image: "https://via.placeholder.com/150x100" },
//   ];

//   return (
//     <View style={styles.container}>
//       {/* Header */}
//       <View style={styles.header}>
//         <Image source={{ uri: "https://i.pravatar.cc/100" }} style={styles.avatar} />
//         <View>
//           <Text style={styles.greeting}>Hello, Favor</Text>
//           <Text style={styles.subText}>Ready to learn & play today?</Text>
//         </View>
//         <Ionicons
//           name="notifications-outline"
//           size={24}
//           color="#333"
//           style={{ marginLeft: "auto" }}
//         />
//       </View>

//       <ScrollView
//         showsVerticalScrollIndicator={false}
//         contentContainerStyle={{ paddingBottom: height * 0.15 }}
//       >
//         {/* Recent Games */}
//         <Text style={styles.sectionTitle}>Your Recent Games</Text>
//         <ScrollView horizontal showsHorizontalScrollIndicator={false}>
//           {[
//             { title: "Spelling Challenge", subtitle: "Play and get rewarded", bg: "#e6f3ff" },
//             { title: "Math Quiz", subtitle: "Sharpen your skills", bg: "#ffe6cc" },
//             { title: "Animal Puzzle", subtitle: "Solve and learn", bg: "#e6ffe6" },
//             { title: "Memory Match", subtitle: "Boost your memory", bg: "#fce6ff" },
//           ].map((game, i) => (
//             <View key={i} style={[styles.recentCard, { backgroundColor: game.bg }]}>
//               <Text style={styles.cardTitle}>{game.title}</Text>
//               <Text style={styles.cardSubtitle}>{game.subtitle}</Text>
//               <TouchableOpacity style={styles.continueBtn}>
//                 <Text style={styles.continueText}>Continue</Text>
//               </TouchableOpacity>
//             </View>
//           ))}
//         </ScrollView>
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Dimensions, Image, ScrollView, StyleSheet, Text, View } from "react-native";
import GamesGrid from "../../../components/games/GamesGrid";
import RecentGamesCarousel from "../../../components/games/RecentGamesCarousel";
import { useGames } from "../../../components/games/useGames";

const { width, height } = Dimensions.get("window");

export default function Games() {
  const router = useRouter();
  const { games, recent } = useGames();

  const columns = width >= 1024 ? 4 : width >= 768 ? 3 : 2;

  const handleGame = (game: { route?: string; title: string }) => {
    if (game.route) router.push(game.route as any);
    else alert(`You tapped on ${game.title}`);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image source={{ uri: "https://i.pravatar.cc/100" }} style={styles.avatar} />
        <View>
          <Text style={styles.greeting}>Hello, Favor</Text>
          <Text style={styles.subText}>Ready to learn & play today?</Text>
        </View>
        <Ionicons name="notifications-outline" size={24} color="#333" style={{ marginLeft: "auto" }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: height * 0.15 }}>
        <Text style={styles.sectionTitle}>Your Recent Games</Text>
        <RecentGamesCarousel recent={recent} onContinue={handleGame} />

        <Text style={styles.sectionTitle}>All Games</Text>
        <View style={styles.tags}>
          <Text style={styles.tag}>Education</Text>
          <Text style={styles.tag}>Puzzles</Text>
          <Text style={styles.tag}>Drawing</Text>
        </View>

        <GamesGrid games={games} columns={columns} onGamePress={handleGame} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingHorizontal: 16, paddingTop: height * 0.06 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: height * 0.025 },
  avatar: { width: width * 0.12, height: width * 0.12, borderRadius: (width * 0.12) / 2, marginRight: 12 },
  greeting: { fontSize: width * 0.045, color: "#333", fontFamily: "Poppins-Bold" },
  subText: { fontSize: width * 0.027, color: "#666", marginTop: -12, fontFamily: "Poppins-Regular" },
  sectionTitle: { fontSize: width * 0.04, marginVertical: height * 0.015, fontFamily: "Poppins-SemiBold" },
  tags: { flexDirection: "row", marginBottom: height * 0.035 },
  tag: {
    backgroundColor: "#f2f2f2",
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.008,
    borderRadius: 50,
    marginRight: 8,
    fontSize: width * 0.03,
    fontFamily: "Poppins-Regular",
  },
});

