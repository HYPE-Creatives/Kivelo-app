import React from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import GameCard from "./GameCard";
import type { Game } from "./types";

type Props = {
  games: Game[];
  columns?: number;
  onGamePress?: (game: Game) => void;
};

export default function GamesGrid({ games, columns = 2, onGamePress }: Props) {
  const { width: screenWidth } = Dimensions.get("window");
  // match the container padding used by the parent (16 left + 16 right)
  const horizontalPadding = 32;
  const gap = 10 * (columns - 1);
  const colWidth = Math.floor((screenWidth - horizontalPadding - gap) / columns);

  return (
    <View style={styles.grid}>
      {games.map((g, i) => (
        <GameCard key={i} game={g} onPress={onGamePress} width={colWidth} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
});
