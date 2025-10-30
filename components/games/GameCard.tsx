import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { Game } from "./types";

type Props = {
  game: Game;
  onPress?: (game: Game) => void;
  width?: number;
};

export default function GameCard({ game, onPress, width }: Props) {
  const style = width ? [styles.card, { width }] : styles.card;
  return (
    <TouchableOpacity style={style} onPress={() => onPress?.(game)} activeOpacity={0.85}>
      <Image source={{ uri: game.image }} style={styles.image} resizeMode="cover" />
      <View style={styles.footer}>
        <Text numberOfLines={1} style={styles.title}>{game.title}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
  },
  image: {
    width: "100%",
    height: 110,
  },
  footer: {
    padding: 10,
  },
  title: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 14,
    color: "#222",
  },
});
