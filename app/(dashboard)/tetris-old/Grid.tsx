import { LinearGradient } from "expo-linear-gradient";
import React, { memo } from "react";
import { Animated, StyleSheet, View, ViewStyle } from "react-native";
import Cell from "./Cell";
import type { Grid as GridType } from "./types";

import { ImageSourcePropType } from "react-native";

type Props = {
  grid: GridType;
  cellSize: number;
  tileImages: ImageSourcePropType[];
  spinInterpolate?: Animated.AnimatedInterpolation<string>;
  style?: ViewStyle;
};

function Grid({ grid, cellSize, tileImages, spinInterpolate, style }: Props) {
  return (
    <View style={[styles.gridWrap, style]}>
      <LinearGradient colors={["#8e7aff", "#c1b7ff", "#f3edff"]} style={styles.gridBg} />
      <View style={styles.grid}>
        {grid.map((row, r) => (
          <View key={r} style={styles.row}>
            {row.map((cell, c) => (
              <Cell
                key={c}
                cell={cell}
                size={cellSize}
                tileImages={tileImages}
                spinInterpolate={spinInterpolate}
              />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  gridWrap: {
    alignSelf: "center",
    marginTop: 10,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#6b63ff",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    position: "relative",
    elevation: 5,
  },
  gridBg: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
  },
  grid: {
    padding: 1, // Reduced padding
    minHeight: 0,
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  row: {
    flexDirection: "row",
    gap: 1, // Small gap between cells
  },
});

export default memo(Grid);