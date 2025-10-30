import { Ionicons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Animated,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [fontsLoaded] = useFonts({
    Poppins: require("../../assets/fonts/Poppins-Regular.ttf"),
    "Poppins-Bold": require("../../assets/fonts/Poppins-Bold.ttf"),
  });

  if (!fontsLoaded) return null;

  const handleReset = () => {
    if (!email) {
      alert("Please enter your email or username.");
      return;
    }

    // ✅ Dummy success popup
    setShowSuccess(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    // Hide popup & go to next screen
    setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => setShowSuccess(false));
      router.push("(auth)/child-new-password");
    }, 2000);
  };

  return (
    <LinearGradient colors={["#79D8F2", "#48A8E2"]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Title */}
        <Text style={styles.title}>Forgot Password</Text>

        {/* Description */}
        <Text style={styles.subtitle}>
          Enter your email or username and we’ll send you instructions to reset
          your password.
        </Text>

        {/* Input Field */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Email or Username"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        {/* Reset Button */}
        <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
          <Text style={styles.resetText}>Reset Password</Text>
        </TouchableOpacity>

        {/* ✅ Success Popup */}
        {showSuccess && (
          <Animated.View style={[styles.popup, { opacity: fadeAnim }]}>
            <Ionicons name="checkmark-circle" size={50} color="#4CAF50" />
            <Text style={styles.popupText}>Reset link sent!</Text>
          </Animated.View>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  title: {
    fontFamily: "Poppins-Bold",
    fontSize: 32,
    color: "#fff",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontFamily: "Poppins",
    fontSize: 14,
    color: "#fff",
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 30,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: "Poppins",
    color: "#333",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  resetButton: {
    backgroundColor: "#8B1CFB",
    borderRadius: 30,
    paddingVertical: 14,
    marginTop: 10,
    alignItems: "center",
  },
  resetText: {
    color: "#fff",
    fontFamily: "Poppins-Bold",
    fontSize: 16,
  },
  popup: {
    position: "absolute",
    top: "40%",
    left: "10%",
    right: "10%",
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 20,
    paddingVertical: 30,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 8,
  },
  popupText: {
    fontFamily: "Poppins-Bold",
    fontSize: 16,
    color: "#333",
    marginTop: 10,
  },
});
