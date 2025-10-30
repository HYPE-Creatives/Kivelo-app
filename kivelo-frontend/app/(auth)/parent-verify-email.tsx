import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Button, useTheme } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const VERIFY_URL = "https://family-wellness.onrender.com/api/auth/verify-email";
const RESEND_URL = "https://family-wellness.onrender.com/api/auth/resend-verification-code";

export default function ParentVerifyEmail() {
  const { colors } = useTheme();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const inputs = useRef<(TextInput | null)[]>([]);

  // Load email from storage
  useEffect(() => {
    const loadEmail = async () => {
      try {
        const stored = await AsyncStorage.getItem("pending_email");
        if (stored) setEmail(stored);
        else router.replace("/(auth)/register");
      } catch (err) {
        console.error("Failed to load email:", err);
      }
    };
    loadEmail();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Auto-focus next input
  const handleCodeChange = (text: string, index: number) => {
  // Allow only digits
  if (!/^\d*$/.test(text)) return;

  const newCode = code.split("");
  newCode[index] = text;
  setCode(newCode.join(""));

  // Auto-move to next
  if (text && index < 5) {
    inputs.current[index + 1]?.focus();
  }

  // === PASTE DETECTION ===
  if (text.length === 6 && index === 0) {
    // User pasted 6 digits into first box
    const pasted = text.split("");
    if (pasted.every((d) => /^\d$/.test(d))) {
      setCode(text);
      inputs.current[5]?.focus(); // Move to last
    }
  }
};

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  // === VERIFY CODE ===
  const handleVerify = async () => {
    if (code.length !== 6) {
      Alert.alert("Invalid Code", "Please enter the 6-digit code.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(VERIFY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, verificationCode: code }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert("Verification Failed", data.message || "Invalid or expired code.");
        return;
      }

      // Success
      await AsyncStorage.multiRemove(["pending_email"]);
      Alert.alert(
        "Verified!",
        "Your email is confirmed. Welcome to Kivelo!",
        [{ text: "Continue", onPress: () => router.replace("/(auth)/login") }]
      );
    } catch (err) {
      Alert.alert("Network Error", "Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  // === RESEND CODE ===
  const handleResend = async () => {
    setResending(true);
    try {
      const response = await fetch(RESEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert("Resend Failed", data.message || "Could not resend code.");
        return;
      }

      setCountdown(60);
      Alert.alert("Code Sent", "A new verification code has been sent to your email.");
    } catch (err) {
      Alert.alert("Network Error", "Failed to resend code.");
    } finally {
      setResending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: "#fff" }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24 }}>
        {/* Header */}
        <View style={{ alignItems: "center", marginBottom: 32 }}>
          <View
            style={{
              backgroundColor: "#E8F5E9",
              padding: 20,
              borderRadius: 50,
              marginBottom: 16,
            }}
          >
            <Ionicons name="mail-open" size={48} color="#4CAF50" />
          </View>
          <Text variant="headlineMedium" style={{ fontWeight: "bold", textAlign: "center" }}>
            Verify Your Email
          </Text>
          <Text style={{ color: "#666", textAlign: "center", marginTop: 8 }}>
            We sent a 6-digit code to
          </Text>
          <Text style={{ fontWeight: "bold", color: colors.primary, marginTop: 4 }}>
            {email || "..."}
          </Text>
        </View>

        {/* Code Input */}
        {/* === 6-DIGIT OTP INPUT (FINAL) === */}
        <View style={{ marginBottom: 32, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: "#555", marginBottom: 16, fontSize: 14 }}>
            Enter the 6-digit code
        </Text>

        <View style={{ flexDirection: "row", justifyContent: "center", gap: 10 }}>
            {[0, 1, 2, 3, 4, 5].map((index) => (
            <TextInput
                key={index}
                ref={(ref) => (inputs.current[index] = ref)}
                style={{
                width: 40,
                height: 52,
                borderWidth: 2,
                borderColor: code[index] ? colors.primary : "#E0E0E0",
                borderRadius: 14,
                textAlign: "center",
                fontSize: 24,
                fontWeight: "bold",
                backgroundColor: code[index] ? "#F8FFFE" : "#FAFAFA",
                color: "#000",
                elevation: 2,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                }}
                keyboardType="number-pad"
                maxLength={1}
                value={code[index] || ""}
                onChangeText={(text) => handleCodeChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                selectTextOnFocus
            />
            ))}
        </View>

        {/* Hidden paste helper */}
        <TextInput
            style={{ position: "absolute", opacity: 0, width: 1, height: 1 }}
            value={code}
            onChangeText={(text) => {
            const digits = text.replace(/\D/g, "").slice(0, 6);
            if (digits.length === 6) {
                setCode(digits);
                inputs.current[5]?.focus();
            }
            }}
            keyboardType="number-pad"
            maxLength={6}
        />

        <Text style={{ color: "#888", fontSize: 13, marginTop: 12 }}>
            Tap and hold to paste
        </Text>
        </View>

        {/* Verify Button */}
        <Button
          mode="contained"
          onPress={handleVerify}
          disabled={loading || code.length !== 6}
          contentStyle={{ paddingVertical: 8 }}
          style={{ marginBottom: 16 }}
        >
          {loading ? <ActivityIndicator color="#fff" /> : "Verify Email"}
        </Button>

        {/* Resend */}
        <View style={{ alignItems: "center" }}>
          {countdown > 0 ? (
            <Text style={{ color: "#888" }}>
              Resend code in <Text style={{ fontWeight: "bold" }}>{countdown}s</Text>
            </Text>
          ) : (
            <TouchableOpacity onPress={handleResend} disabled={resending}>
              <Text style={{ color: colors.primary, fontWeight: "bold" }}>
                {resending ? "Sending..." : "Didn't receive the code? Resend"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Back to Login */}
        <TouchableOpacity
          style={{ marginTop: 32, alignItems: "center" }}
          onPress={() => router.replace("/(auth)/login")}
        >
          <Text style={{ color: "#666" }}>
            <Ionicons name="arrow-back" size={16} /> Back to Login
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}