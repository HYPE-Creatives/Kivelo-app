import { LinearGradient } from "expo-linear-gradient";
import React, { memo } from "react";
import { Animated, Image, StyleSheet, View } from "react-native";
import type { GridCell } from "./types";

import { ImageSourcePropType } from "react-native";

type Props = {
  cell: GridCell;
  size: number;
  tileImages: ImageSourcePropType[];
  spinInterpolate?: Animated.AnimatedInterpolation<string>;
};

function Cell({ cell, size, tileImages, spinInterpolate }: Props) {
  if (!cell) return <View style={[styles.cell, { width: size, height: size, borderRadius: size * 0.2 }]} />;

  const isActive = cell.isActive;
  const ImageComponent = isActive && spinInterpolate ? Animated.Image : Image;

  return (
    <View style={[styles.cell, { width: size, height: size, borderRadius: size * 0.2 }]}>
      <ImageComponent
        source={tileImages[cell.tileIdx]}
        style={[
          styles.tileImage,
          isActive && spinInterpolate && { transform: [{ rotate: spinInterpolate }] },
        ]}
      />
      <LinearGradient
        colors={["rgba(255,255,255,0.3)", "rgba(0,0,0,0.05)"]}
        style={[styles.tileOverlay, { borderRadius: size * 0.2 }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  cell: {
    margin: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tileImage: {
    width: "95%",
    height: "95%",
  },
  tileOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "95%",
    height: "40%",
  },
});

export default memo(Cell);