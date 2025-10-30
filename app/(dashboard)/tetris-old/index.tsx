import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { ROUTES } from "../../routes";

const { width, height } = Dimensions.get("window");

export default function HomeScreen() {
  const router = useRouter();

  // Animated cloud movement
  const cloud1 = useRef(new Animated.Value(0)).current;
  const cloud2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const floatCloud = (cloudAnim: Animated.Value) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(cloudAnim, {
            toValue: 10,
            duration: 4000,
            useNativeDriver: true,
          }),
          Animated.timing(cloudAnim, {
            toValue: -10,
            duration: 4000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };
    floatCloud(cloud1);
    floatCloud(cloud2);
  }, []);

  return (
    <LinearGradient colors={["#d8e1ff", "#f6f4ff"]} style={styles.container}>
      <SafeAreaView style={styles.inner}>
        {/* Floating clouds */}
        <Animated.Image
          source={require("../../../assets/images/cloud1.png")}
          style={[styles.cloud, { top: 40, left: 20, transform: [{ translateY: cloud1 }] }]}
          resizeMode="contain"
        />
        <Animated.Image
          source={require("../../../assets/images/cloud2.png")}
          style={[styles.cloud, { top: 100, right: 20, transform: [{ translateY: cloud2 }] }]}
          resizeMode="contain"
        />

        {/* Title */}
        <Text style={styles.title}>
          Tetris <Text style={styles.combo}>Combo</Text>
        </Text>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.classicButton]}
            onPress={() => router.push(ROUTES.TETRIS_GAME)}
          >
            <Text style={styles.classicText}>Classic</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.adventureButton]}
            onPress={() => router.push(ROUTES.TETRIS_GAME)}
          >
            <Text style={styles.adventureText}>Adventures ▶</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  cloud: {
    position: "absolute",
    width: width * 0.35,
    height: height * 0.12,
    opacity: 0.9,
  },
  title: {
    fontFamily: "Poppins-Bold",
    fontSize: 42,
    color: "#6b63ff",
    textAlign: "center",
    marginBottom: 40,
  },
  combo: {
    color: "#ff9f00",
  },
  blocks: {
    width: width * 0.8,
    height: height * 0.25,
    marginBottom: 50,
  },
  buttonContainer: {
    width: "80%",
    alignItems: "center",
  },
  button: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginVertical: 10,
    elevation: 3,
  },
  classicButton: {
    backgroundColor: "#9c7dfc",
  },
  adventureButton: {
    backgroundColor: "#ff9f00",
  },
  classicText: {
    color: "#fff",
    fontFamily: "Poppins-SemiBold",
    fontSize: 18,
  },
  adventureText: {
    color: "#fff",
    fontFamily: "Poppins-SemiBold",
    fontSize: 18,
  },
});