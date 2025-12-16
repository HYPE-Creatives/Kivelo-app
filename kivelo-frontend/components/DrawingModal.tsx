// components/DrawingModal.tsx
import React from "react";
import { Modal, View, StyleSheet, Platform, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DrawingBoard from "./DrawingBoard";

interface DrawingModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (imageData: string) => void;
  backgroundColor?: string;
}

export default function DrawingModal({
  visible,
  onClose,
  onSave,
  backgroundColor,
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
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <StatusBar barStyle="dark-content" />
        <DrawingBoard
          onSave={handleSave}
          onClose={onClose}
          backgroundColor={backgroundColor}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
});
