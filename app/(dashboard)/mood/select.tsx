import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useState } from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as Animatable from "react-native-animatable";
import { useRouter } from "expo-router";

// --- Dimensions ---
const { width, height } = Dimensions.get("window");
const guidelineBaseWidth = 375;  // iPhone X width
const guidelineBaseHeight = 812; // iPhone X height

const scaleW = (size: number) => (width / guidelineBaseWidth) * size;
const scaleH = (size: number) => (height / guidelineBaseHeight) * size;
const scaleFont = (size: number) => Math.min(scaleW(size), scaleH(size));

// --- Mood Types ---
type Mood = "Happy" | "Angry" | "Sad" | "Disgusted" | "Bad" | "Surprised";

// --- Mood data: images and colors ---
const moods: Record<Mood, { image: any; color: string }> = {
  Happy: {
    image: require("../../../assets/images/happy.png"),
    color: "#f7dd8eff",
  },
  Sad: {
    image: require("../../../assets/images/sad.png"),
    color: "#4A90E2",
  },
  Angry: {
    image: require("../../../assets/images/angry.png"),
    color: "#F28B82",
  },
  Disgusted: {
    image: require("../../../assets/images/disgusted.png"),
    color: "#6BCB77",
  },
  Bad: {
    image: require("../../../assets/images/bad.png"),
    color: "#9A9A9A",
  },
  Surprised: {
    image: require("../../../assets/images/surprised.png"),
    color: "#A076F9",
  },
};

export default function MoodScreen() {
  const [selectedMood, setSelectedMood] = useState<Mood>("Happy");
  const router = useRouter();

  const handleContinue = async () => {
    const timestamp = new Date().toISOString();
    const moodLog = { mood: selectedMood, timestamp };

    try {
      let storedLogs = await AsyncStorage.getItem("moodLogs");
      let logs = storedLogs ? JSON.parse(storedLogs) : [];
      logs.push(moodLog);
      await AsyncStorage.setItem("moodLogs", JSON.stringify(logs));
    } catch (err) {
      console.error("Error saving mood:", err);
    }

    router.push({
      pathname: "/(dashboard)/mood/intensity",
      params: { mood: selectedMood },
    });
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: moods[selectedMood].color },
      ]}
    >
      {/* --- TOP SECTION --- */}
      <View style={styles.topSection}>
        <Text style={styles.feelingText}>I'm feeling</Text>

        {/* ✅ Hero Image with Pulse Animation */}
        <Animatable.Image
          animation="pulse"
          iterationCount="infinite"
          easing="ease-in-out"
          duration={2000}
          source={moods[selectedMood].image}
          style={styles.heroImage}
        />

        <Text style={styles.moodText}>{selectedMood}</Text>
      </View>

      {/* --- BOTTOM SECTION --- */}
      <View style={styles.bottomSection}>
        {/* Mood buttons grid (2 rows of 3) */}
        <View style={styles.moodGrid}>
          {(Object.keys(moods) as Mood[]).map((mood) => (
            <TouchableOpacity
              key={mood}
              activeOpacity={1}
              style={styles.moodButton}
              onPress={() => setSelectedMood(mood)}
            >
              <Animatable.Image
                animation={selectedMood === mood ? "pulse" : undefined}
                iterationCount="infinite"
                duration={1500}
                source={moods[mood].image}
                style={[
                  styles.moodIcon,
                  { opacity: selectedMood === mood ? 1 : 0.4 },
                ]}
              />
              <Text
                style={[
                  styles.moodLabel,
                  { opacity: selectedMood === mood ? 1 : 0.4 },
                ]}
              >
                {mood}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Continue Button */}
        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Animatable.Text
            animation="pulse"
            iterationCount="infinite"
            style={styles.continueText}
          >
            Continue
          </Animatable.Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: scaleH(32),
  },
  topSection: {
    alignItems: "center",
    marginTop: scaleH(40),
    gap: scaleH(8),
  },
  feelingText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: scaleFont(16),
    marginBottom: scaleH(-32),
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    color: "#fff",
  },
  heroImage: {
    width: scaleW(260),
    height: scaleW(260),
    resizeMode: "contain",
    marginVertical: scaleH(20),
  },
  moodText: {
    fontFamily: "Poppins-Bold",
    fontSize: scaleFont(30),
    marginTop: scaleH(-45),
    textShadowColor: "rgba(0, 0, 0, 0.23)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    color: "#fff",
  },
  bottomSection: {
    width: "100%",
    alignItems: "center",
    marginBottom: scaleH(120),
  },
  moodGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    width: "90%",
    marginBottom: scaleH(25),
  },
  moodButton: {
    width: "30%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scaleH(13),
    margin: scaleH(5),
    borderRadius: 11,
    backgroundColor: "white",
  },
  moodIcon: {
    width: scaleW(45),
    height: scaleW(45),
    resizeMode: "contain",
    marginBottom: scaleH(8),
  },
  moodLabel: {
    fontFamily: "Poppins-SemiBold",
    fontSize: scaleFont(10),
  },
  continueButton: {
    backgroundColor: "#fff",
    paddingVertical: scaleH(16),
    paddingHorizontal: scaleW(70),
    borderRadius: 50,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 5,
    elevation: 6,
  },
  continueText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: scaleFont(17),
  },
});
