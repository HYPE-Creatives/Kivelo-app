import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  Modal,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Animatable from "react-native-animatable";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

// --- Mood Types ---
type Mood = "Happy" | "Angry" | "Sad";

// --- Mood data: images and colors ---
const moods: Record<Mood, { image: any; color: string }> = {
  Happy: {
    image: require("../../../assets/images/happy.png"),
    color: "#f7dd8eff",
  },
  Angry: {
    image: require("../../../assets/images/angry.png"),
    color: "#F28B82",
  },
  Sad: {
    image: require("../../../assets/images/sad.png"),
    color: "#ade9cbff",
  },
};

export default function MoodScreen() {
  // --- State Variables ---
  const [selectedMood, setSelectedMood] = useState<Mood>("Happy"); // currently selected mood
  const [showPopup, setShowPopup] = useState(false); // controls popup visibility
  const [isSaving, setIsSaving] = useState(false); // activity indicator while saving
  const [cooldown, setCooldown] = useState(false); // is button in cooldown?
  const [countdown, setCountdown] = useState(0); // countdown timer

  // --- Countdown logic ---
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (cooldown && countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval); // stop interval
            setCooldown(false); // button is active again
            return 0;
          }
          return prev - 1; // decrease countdown
        });
      }, 1000); // every second
    }

    return () => clearInterval(interval); // cleanup on unmount or state change
  }, [cooldown, countdown]);

  // --- Handle save mood ---
  const handleSaveMood = async () => {
    if (cooldown) return; // do nothing if still cooling down

    setShowPopup(true); // show popup
    setIsSaving(true); // show loader

    const timestamp = new Date().toISOString();
    const moodLog = { mood: selectedMood, timestamp };

    try {
      // --- Save to AsyncStorage ---
      let storedLogs = await AsyncStorage.getItem("moodLogs");
      let logs = storedLogs ? JSON.parse(storedLogs) : [];
      logs.push(moodLog);
      await AsyncStorage.setItem("moodLogs", JSON.stringify(logs));

      // simulate save delay for UX
      setTimeout(() => setIsSaving(false), 850);

      // --- START 30 SECONDS COOLDOWN ---
      const cooldownSeconds = 3; // <- this is where you control cooldown duration
      setCooldown(true);
      setCountdown(cooldownSeconds);

    } catch (err) {
      console.error("Error saving mood:", err);
      setIsSaving(false);
    }
  };

  // --- Button opacity independent of popup ---
  const buttonOpacity = cooldown ? 0.5 : 1;

  return (
    <View style={[styles.container, { backgroundColor: moods[selectedMood].color }]}>
      
      {/* --- TOP SECTION: Mood Display --- */}
      <View style={styles.topSection}>
        <Text style={styles.feelingText}>I'm feeling</Text>
        <Image source={moods[selectedMood].image} style={styles.heroImage} />
        <Text style={styles.moodText}>{selectedMood}</Text>
      </View>

      {/* --- BOTTOM SECTION: Mood buttons + Save --- */}
      <View style={styles.bottomSection}>
        {/* Mood selection buttons */}
        <View style={styles.moodRow}>
          {(Object.keys(moods) as Mood[]).map((mood) => (
            <TouchableOpacity
              key={mood}
              activeOpacity={1}
              style={styles.moodButton}
              onPress={() => setSelectedMood(mood)}
            >
              <Image
                source={moods[mood].image}
                style={[styles.moodIcon, { opacity: selectedMood === mood ? 1 : 0.4 }]}
              />
              <Text
                style={{
                  fontFamily: "Poppins-SemiBold",
                  fontSize: width * 0.04,
                  opacity: selectedMood === mood ? 1 : 0.4,
                }}
              >
                {mood}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Save Mood Button */}
        <TouchableOpacity
          style={[styles.continueButton, { opacity: buttonOpacity }]}
          onPress={handleSaveMood}
          disabled={cooldown} // disables button during cooldown
        >
          <Animatable.Text
            animation={!cooldown ? "pulse" : undefined} // pulse only if active
            iterationCount="infinite"
            style={styles.continueText}
          >
            {cooldown ? `Refreshing... (${countdown}s)` : "Save mood"}
          </Animatable.Text>
        </TouchableOpacity>
      </View>

      {/* --- POPUP: Save confirmation --- */}
      <Modal transparent visible={showPopup} animationType="fade">
        <View style={styles.overlay}>
          <Animatable.View animation="zoomIn" duration={800} style={styles.popup}>
            
            {/* Close button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowPopup(false)}
            >
              <Ionicons name="close" size={20} color="white" />
            </TouchableOpacity>

            {/* Popup content */}
            <View style={styles.popupContent}>
              {isSaving ? (
                <ActivityIndicator size="large" color="#16A34A" />
              ) : (
                <>
                  <Text style={styles.checkmark}>✔</Text>
                  <Text style={styles.popupText}>Mood Saved! 🎉</Text>
                </>
              )}
            </View>
          </Animatable.View>
        </View>
      </Modal>
    </View>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "space-between", paddingVertical: 40 },
  topSection: { alignItems: "center", gap: 4 },
  feelingText: { fontFamily: "Poppins-SemiBold", fontSize: 25, opacity: 0.75 },
  heroImage: { width: height * 0.3, height: height * 0.3, resizeMode: "contain" },
  moodText: { fontFamily: "Poppins-Bold", fontSize: 28 },
  bottomSection: { width: "100%", alignItems: "center", marginBottom: 25 },
  moodRow: { flexDirection: "row", justifyContent: "space-between", marginHorizontal: "12.5%", marginBottom: 20 },
  moodButton: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: width * 0.035, paddingHorizontal: width * 0.025, borderRadius: 16, backgroundColor: "white", marginHorizontal: 5 },
  moodIcon: { width: width * 0.1, height: width * 0.1, resizeMode: "contain", marginBottom: 5 },
  continueButton: { backgroundColor: "white", paddingVertical: 15, paddingHorizontal: 15, borderRadius: 10, minWidth: 260, maxWidth: 260, alignItems: "center", justifyContent: "center" },
  continueText: { fontFamily: "Poppins-SemiBold", fontSize: 18 },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  popup: { backgroundColor: "white", padding: 30, borderRadius: 20, alignItems: "center", width: width * 0.8, shadowColor: "#000", shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 8, position: "relative" },
  popupContent: { minHeight: 120, minWidth: 120, justifyContent: "center", alignItems: "center" },
  checkmark: { fontSize: 60, color: "green", fontWeight: "bold" },
  popupText: { fontFamily: "Poppins-Regular", fontSize: 20, marginTop: 10, textAlign: "center" },
  closeButton: { position: "absolute", top: 10, right: 10, backgroundColor: "red", borderRadius: 20, padding: 5 },
});
