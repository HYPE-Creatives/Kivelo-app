import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  isPaused: boolean;
  gameOver: boolean;
  onResume?: () => void;
};

export default function Overlay({ isPaused, gameOver, onResume }: Props) {
  if (!isPaused && !gameOver) return null;

  return (
    <View style={styles.overlay}>
      <LinearGradient
        colors={["rgba(0,0,0,0.7)", "rgba(0,0,0,0.85)"]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.content}>
        <Text style={styles.text}>{isPaused ? "PAUSED" : "GAME OVER"}</Text>
        {isPaused && onResume && (
          <Text style={styles.hint}>Tap the pause button to resume</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999, // Just below the pause button
  },
  content: {
    alignItems: "center",
  },
  text: {
    fontFamily: "Poppins-Bold",
    fontSize: 32,
    color: "#fff",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  hint: {
    fontFamily: "Poppins-Regular",
    fontSize: 16,
    color: "#ddd",
    marginTop: 8,
  },
});