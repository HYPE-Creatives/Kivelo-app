import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ROUTES } from "../../routes";

const { width } = Dimensions.get("window");

export default function CongratsScreen() {
  const router = useRouter();
  const { score = "0", highScore = "0", level = "1" } = useLocalSearchParams<{
    score: string;
    highScore: string;
    level: string;
  }>();

  // Animations
  const scale1 = useRef(new Animated.Value(0)).current;
  const scale2 = useRef(new Animated.Value(0)).current;
  const scale3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(250, [
      Animated.spring(scale1, { toValue: 1, friction: 4, useNativeDriver: true }),
      Animated.spring(scale2, { toValue: 1, friction: 4, useNativeDriver: true }),
      Animated.spring(scale3, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <LinearGradient colors={["#d8e1ff", "#f6f4ff"]} style={styles.container}>
      <SafeAreaView style={styles.inner}>
        {/* Crown / header asset */}
        <Image
          source={require("../../../assets/images/crown.png")}
          style={styles.crown}
          resizeMode="contain"
        />

        {/* Animated stars */}
        <View style={styles.starsRow}>
          {[scale1, scale2, scale3].map((scale, i) => (
            <Animated.Image
              key={i}
              source={require("../../../assets/images/star.png")}
              style={[styles.star, { transform: [{ scale }] }]}
              resizeMode="contain"
            />
          ))}
        </View>

        <Text style={styles.levelText}>Level {level} Complete</Text>

        {/* Score Card */}
        <View style={styles.scoreCard}>
          <Text style={styles.score}>{score}</Text>
          <Text style={styles.label}>Your Score</Text>
          <Text style={[styles.label, { color: "#6B63FF", marginTop: 4 }]}>
            High Score: {highScore}
          </Text>
        </View>

        {/* Buttons */}
        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.btn, styles.replayBtn]}
            onPress={() => router.replace(ROUTES.TETRIS_GAME)}
          >
            <Ionicons name="refresh" size={20} color="#fff" />
            <Text style={styles.btnText}>Replay</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.continueBtn]}
            onPress={() => router.push("/")}
          >
            <Ionicons name="home" size={20} color="#fff" />
            <Text style={styles.btnText}>Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  crown: {
    width: width * 0.25,
    height: width * 0.2,
    marginBottom: 20,
  },
  starsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  star: {
    width: 60,
    height: 60,
    marginHorizontal: 6,
  },
  levelText: {
    fontFamily: "Poppins-Bold",
    fontSize: 26,
    color: "#4A4AFF",
    marginBottom: 20,
  },
  scoreCard: {
    backgroundColor: "#fff",
    width: width * 0.75,
    borderRadius: 20,
    alignItems: "center",
    paddingVertical: 25,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 40,
  },
  score: {
    fontFamily: "Poppins-Bold",
    fontSize: 44,
    color: "#FF9800",
  },
  label: {
    fontFamily: "Poppins-Regular",
    fontSize: 16,
    color: "#666",
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 18,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
  },
  replayBtn: {
    backgroundColor: "#FF9F00",
  },
  continueBtn: {
    backgroundColor: "#6B63FF",
  },
  btnText: {
    color: "#fff",
    fontFamily: "Poppins-SemiBold",
    fontSize: 16,
    marginLeft: 6,
  },
});