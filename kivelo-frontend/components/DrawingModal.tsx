// components/DrawingModal.tsx
import React from "react";
import { Modal, View, StyleSheet, Platform, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import DrawingBoard from "./DrawingBoard";

interface DrawingModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (imageData: string) => void;
  backgroundColor?: string;
  initialImage?: string; // For editing existing drawings
}

export default function DrawingModal({
  visible,
  onClose,
  onSave,
  backgroundColor,
  initialImage,
}: DrawingModalProps) {
  const handleSave = (imageData: string) => {
    onSave(imageData);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
          <StatusBar barStyle="dark-content" />
          <DrawingBoard
            onSave={handleSave}
            onClose={onClose}
            backgroundColor={backgroundColor}
            initialImage={initialImage}
          />
        </SafeAreaView>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
});
