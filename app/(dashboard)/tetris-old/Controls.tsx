import React from "react";
import { Dimensions, PanResponder, StyleSheet, View } from "react-native";
import type { GameActions } from "./types";

const { width } = Dimensions.get("window");

type Props = {
  actions: GameActions;
  onGesture?: ReturnType<typeof PanResponder.create>['panHandlers'];
  onTap?: (doubleTap: boolean) => void;
};

export default function Controls({ onGesture, onTap, actions }: Props) {
  // Touch controls are handled via PanResponder in the main game component
  // This component is a placeholder for future on-screen controls or visual feedback
  return (
    <View style={styles.container}>
      {/* Space for future on-screen controls */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: width * 0.9,
    height: 60,
    alignSelf: "center",
    marginTop: 20,
  },
});