import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  score: number;
  timeLeft: number;
  highScore: number;
  isPaused: boolean;
  onTogglePause: () => void;
};

export default function TopBar({ score, timeLeft, highScore, isPaused, onTogglePause }: Props) {
  return (
    <View style={styles.topBar}>
      <View style={styles.scoreBox}>
        <Text style={styles.smallLabel}>Score</Text>
        <Text style={styles.largeLabel}>{score}</Text>
      </View>

      <View style={styles.timerBox}>
        <Text style={styles.smallLabel}>Time</Text>
        <Text style={styles.largeLabel}>
          {String(Math.floor(timeLeft / 60000)).padStart(2, "0")}:
          {String(Math.floor((timeLeft % 60000) / 1000)).padStart(2, "0")}
        </Text>
      </View>

      <View style={styles.rightBox}>
        <TouchableOpacity onPress={onTogglePause} style={styles.iconBtn} accessibilityLabel={isPaused ? "Resume" : "Pause"}>
          <Ionicons name={isPaused ? "play" : "pause"} size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.smallLabel}>Hi {highScore}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  scoreBox: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 8,
    alignItems: "center",
    width: 120,
  },
  timerBox: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 8,
    alignItems: "center",
    width: 120,
  },
  rightBox: { alignItems: "center", width: 120 },
  smallLabel: { fontFamily: "Poppins-SemiBold", fontSize: 12, color: "#6b63ff" },
  largeLabel: { fontFamily: "Poppins-Bold", fontSize: 18, color: "#2b2b2b" },
  iconBtn: {
    backgroundColor: "#6b63ff",
    padding: 8,
    borderRadius: 10,
    marginBottom: 4,
    elevation: 10,
    zIndex: 1000,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});
