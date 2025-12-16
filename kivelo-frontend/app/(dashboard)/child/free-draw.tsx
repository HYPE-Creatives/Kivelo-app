// app/(dashboard)/child/free-draw.tsx
import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Platform,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import DrawingBoard from "@/components/DrawingBoard";
import { showAlert } from "@/utils/showAlert";

export default function FreeDraw() {
  const router = useRouter();
  const [savedDrawings, setSavedDrawings] = useState<string[]>([]);

  const handleSave = async (imageData: string) => {
    setSavedDrawings((prev) => [...prev, imageData]);
    
    showAlert(
      "🎨 Drawing Saved!",
      "Your masterpiece has been saved! Would you like to share it?",
      [
        { text: "Keep Drawing", style: "cancel" },
        {
          text: "Share",
          onPress: async () => {
            try {
              if (Platform.OS === "web") {
                // For web, create a download link
                const link = document.createElement("a");
                link.download = `drawing-${Date.now()}.png`;
                link.href = imageData;
                link.click();
                showAlert("Downloaded!", "Your drawing has been downloaded.");
              } else {
                // For mobile, use the Share API
                await Share.share({
                  url: imageData,
                  message: "Check out my drawing from KIVELO! 🎨",
                });
              }
            } catch (error) {
              console.error("Share error:", error);
            }
          },
        },
      ]
    );
  };

  const handleClose = () => {
    if (savedDrawings.length === 0) {
      router.back();
    } else {
      showAlert(
        "Leave Drawing?",
        "Are you sure you want to leave? Your current drawing will be saved.",
        [
          { text: "Keep Drawing", style: "cancel" },
          { text: "Leave", onPress: () => router.back() },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <DrawingBoard
        onSave={handleSave}
        onClose={handleClose}
        canvasHeight={450}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
});
