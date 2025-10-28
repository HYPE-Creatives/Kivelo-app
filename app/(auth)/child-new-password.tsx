import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useFonts } from "expo-font";

export default function NewPasswordScreen() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [fontsLoaded] = useFonts({
    Poppins: require("../../assets/fonts/Poppins-Regular.ttf"),
    "Poppins-Bold": require("../../assets/fonts/Poppins-Bold.ttf"),
  });

  if (!fontsLoaded) return null;

  const passwordsMatch =
    password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;

  const handleSubmit = () => {
    if (!password || !confirmPassword) {
      alert("Please fill in both fields.");
    } else if (!passwordsMatch) {
      alert("Passwords do not match.");
    } else {
      alert("Password successfully reset!");
      router.push("/(auth)/child-login");
    }
  };

  return (
    <LinearGradient colors={["#79D8F2", "#48A8E2"]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
       

        {/* Title */}
        <Text style={styles.title}>Create New Password</Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>
          Your new password must be different from previous passwords.
        </Text>

        {/* New Password */}
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="New Password"
            placeholderTextColor="#999"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.iconRight}
          >
            <Ionicons
              name={showPassword ? "eye" : "eye-off"}
              size={20}
              color="#888"
            />
          </TouchableOpacity>
        </View>

        {/* Confirm Password */}
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            placeholderTextColor="#999"
            secureTextEntry={!showConfirm}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <TouchableOpacity
            onPress={() => setShowConfirm(!showConfirm)}
            style={styles.iconRight}
          >
            <Ionicons
              name={showConfirm ? "eye" : "eye-off"}
              size={20}
              color="#888"
            />
          </TouchableOpacity>

          {/* ✅ Match Icon */}
          {passwordsMatch && (
            <Ionicons
              name="checkmark-circle"
              size={22}
              color="#4CAF50"
              style={styles.iconCheck}
            />
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity style={styles.resetButton} onPress={handleSubmit}>
          <Text style={styles.resetText}>Save Password</Text>
        </TouchableOpacity>
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
  backButton: {
    position: "absolute",
    top: 20,
    left: 16,
    width: 50,
    height: 50,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: "Poppins-Bold",
    fontSize: 28,
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
  inputWrapper: {
    position: "relative",
    marginBottom: 20,
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
  iconRight: {
    position: "absolute",
    right: 15,
    top: 12,
    padding: 4,
  },
  iconCheck: {
    position: "absolute",
    right: 45,
    top: 13,
  },
  resetButton: {
    backgroundColor: "#8B1CFB",
    borderRadius: 30,
    paddingVertical: 14,
    marginTop: 30,
    alignItems: "center",
  },
  resetText: {
    color: "#fff",
    fontFamily: "Poppins-Bold",
    fontSize: 16,
  },
});
