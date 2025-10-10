import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Slider from "@react-native-community/slider";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width, height } = Dimensions.get("window");

// 📏 Responsive scaling helpers
const baseWidth = 375;  // iPhone X width
const baseHeight = 812; // iPhone X height

const scaleW = (size: number) => (width / baseWidth) * size;
const scaleH = (size: number) => (height / baseHeight) * size;

type Mood = "Happy" | "Angry" | "Sad" | "Disgusted" | "Bad" | "Surprised";

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

export default function IntensityScreen() {
  const { mood } = useLocalSearchParams<{ mood: Mood }>();
  const router = useRouter();
  const [intensity, setIntensity] = useState(0.5);
  const [hasInteracted, setHasInteracted] = useState(false);

  const moodData = mood ? moods[mood] : moods.Happy;

  const handleDone = async () => {
    if (!hasInteracted) {
      Alert.alert("Hold on!", "Please choose your intensity first 🙂");
      return;
    }

    const timestamp = new Date().toISOString();
    const log = { mood, intensity, timestamp };

    try {
      const storedLogs = await AsyncStorage.getItem("moodLogs");
      let logs = storedLogs ? JSON.parse(storedLogs) : [];
      logs.push(log);
      await AsyncStorage.setItem("moodLogs", JSON.stringify(logs));
      console.log("Saved:", log);
    } catch (err) {
      console.error("Error saving:", err);
    }

    // 👉 Navigate to congratulations screen in the same folder
    router.push("./congratulations");
  };

  const getFeedback = () => {
    if (intensity < 0.3) return "A little";
    if (intensity < 0.7) return "Quite";
    return "Super!";
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: moodData.color,
          opacity: 0.8 + intensity * 0.2,
        },
      ]}
    >
      <Text style={styles.title}>{`How ${mood}\nare you?`}</Text>

      <Image source={moodData.image} style={[styles.icon]} />

      {/* Slider */}
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={1}
        step={0.01}
        value={intensity}
        onValueChange={(val) => {
          setIntensity(val);
          setHasInteracted(true);
        }}
        minimumTrackTintColor="#fff"
        maximumTrackTintColor="#555"
        thumbTintColor="#FFD700"
      />

      {/* Feedback */}
      <Text style={styles.intensityLabel}>{getFeedback()}</Text>

      <TouchableOpacity
        style={styles.doneButton}
        onPress={handleDone}
        activeOpacity={1}
      >
        <Text style={styles.doneText}>Finish!</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: scaleW(20),
  },
 title: {
  fontSize: scaleW(22),
  lineHeight: scaleH(27), 
  marginBottom: scaleH(25),
  fontFamily: "Poppins-Regular",
  top: scaleH(-15),
  left: scaleW(-35),
  width: scaleW(250),
  color: "#fff",
  textAlign: "left",
  textShadowColor: "rgba(0, 0, 0, 0.15)",
  textShadowOffset: { width: 1, height: 1 },
  textShadowRadius: 3,
},

  icon: {
    width: scaleW(280),
    height: scaleW(280),
    resizeMode: "contain",
    marginBottom: scaleH(30),
    top: scaleH(-15),
  },
  slider: {
    width: "90%",
    height: scaleH(70),
    marginBottom: scaleH(5),
    marginTop: scaleH(-50),
  },
  doneButton: {
    backgroundColor: "#fff",
    paddingVertical: scaleH(15),
    paddingHorizontal: scaleW(84),
    borderRadius: 50,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 5,
    elevation: 6,
    bottom: scaleH(-55),
  },
  doneText: {
    fontSize: scaleW(16),
    fontFamily: "Poppins-SemiBold",
    color: "#333",
  },
  intensityLabel: {
    fontSize: scaleW(22),
    marginBottom: scaleH(20),
    marginTop: scaleH(-25),
    fontFamily: "Poppins-SemiBold",
    color: "#fff",
    textShadowColor: "rgba(0, 0, 0, 0.16)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});
