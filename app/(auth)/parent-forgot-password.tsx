import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isValid, setIsValid] = useState(false);
  const [loading, setLoading] = useState(false);

  const validateEmail = (value: string) => {
    setEmail(value);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setIsValid(emailRegex.test(value));
  };

  const handleSend = async () => {
    if (!isValid) {
      Alert.alert("Invalid Email", "Please enter a valid email address");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        "https://family-wellness.onrender.com/api/auth/resend-verification",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        Alert.alert("Verification Sent", data.message || `A verification code has been sent to ${email}`);
        // ✅ Navigate to verify email screen with email passed along
        router.push({
          pathname: "/(auth)/parent-verify-email",
          params: { email },
        });
      } else {
        Alert.alert("Error", data.message || "Something went wrong");
      }
    } catch (error: any) {
      Alert.alert("Network Error", "Unable to reach server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Title */}
      <Text style={styles.title}>Forgot Password ?</Text>

      {/* Dummy Image */}
      <Image
        source={require("../../assets/images/password.png")}
        style={styles.image}
      />

      {/* Instruction Text */}
      <Text style={styles.instruction}>
        Please enter your email address to{"\n"}receive a verification code
      </Text>

      {/* Email Input */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Email Address</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            placeholder="Johndoe55@gmail.com"
            placeholderTextColor="#999"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={validateEmail}
            style={styles.input}
          />
          {isValid && (
            <Ionicons
              name="checkmark-circle"
              size={22}
              color="#4CAF50"
              style={styles.checkIcon}
            />
          )}
        </View>
      </View>

      {/* Send Button */}
      <TouchableOpacity
        style={[styles.button, loading && { opacity: 0.7 }]}
        onPress={handleSend}
        disabled={loading}
      >
        <LinearGradient
          colors={["#A335F0", "#7D31E8"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Send</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default ForgotPassword;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginTop: 60,
  },
  image: {
    width: 160,
    height: 160,
    marginTop: 30,
    resizeMode: "contain",
  },
  instruction: {
    textAlign: "center",
    color: "#444",
    fontSize: 14,
    marginTop: 10,
    lineHeight: 20,
  },
  inputContainer: {
    width: "100%",
    marginTop: 30,
  },
  label: {
    fontSize: 14,
    color: "#000",
    marginBottom: 6,
  },
  inputWrapper: {
    position: "relative",
    width: "100%",
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 14,
    color: "#000",
    paddingRight: 35,
  },
  checkIcon: {
    position: "absolute",
    right: 10,
    top: "50%",
    transform: [{ translateY: -11 }],
  },
  button: {
    width: "100%",
    marginTop: 40,
    borderRadius: 25,
    overflow: "hidden",
  },
  gradient: {
    paddingVertical: 15,
    alignItems: "center",
    borderRadius: 25,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
