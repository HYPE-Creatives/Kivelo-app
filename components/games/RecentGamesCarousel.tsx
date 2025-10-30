import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { Game } from "./types";

type Props = {
  recent: (Game & { subtitle?: string; bg?: string })[];
  onContinue?: (game: Game) => void;
};

export default function RecentGamesCarousel({ recent, onContinue }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.row}>
      {recent.map((g, i) => (
        <View key={i} style={[styles.card, { backgroundColor: g.bg || "#fff" }]}>
          <Text style={styles.title}>{g.title}</Text>
          <Text style={styles.subtitle}>{g.subtitle}</Text>
          <TouchableOpacity style={styles.continueBtn} onPress={() => onContinue?.(g)}>
            <Text style={styles.continueText}>Continue</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { marginBottom: 12 },
  card: {
    width: 260,
    borderRadius: 14,
    padding: 16,
    marginRight: 10,
  },
  title: { fontFamily: "Poppins-Bold", fontSize: 16, marginBottom: 6 },
  subtitle: { fontFamily: "Poppins-Regular", color: "#555", marginBottom: 12 },
  continueBtn: { backgroundColor: "#0530ad", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  continueText: { color: "#fff" },
});
