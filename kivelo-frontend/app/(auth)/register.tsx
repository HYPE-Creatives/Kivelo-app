import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import {
  TextInput,
  Button,
  Text,
  Checkbox,
  useTheme,
} from "react-native-paper";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const REGISTER_URL = "https://family-wellness.onrender.com/api/auth/register-parent";

export default function Register() {
  const { colors } = useTheme();
  const router = useRouter();

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("+234");
  const [dob, setDob] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  // Validation states
  const [emailValid, setEmailValid] = useState(true);
  const [passwordValid, setPasswordValid] = useState(true);

  // === VALIDATION HELPERS ===
  const validateEmail = (text: string) => {
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);
    setEmail(text);
    setEmailValid(valid);
    return valid;
  };

  const validatePassword = (text: string) => {
    const valid = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/.test(text);
    setPassword(text);
    setPasswordValid(valid);
    return valid;
  };

  const handlePhoneChange = (text: string) => {
    let cleaned = text.replace(/[^0-9+]/g, "");
    if (!cleaned.startsWith("+234")) {
      cleaned = "+234" + cleaned.replace(/^(\+|0|234)*/, "");
    }
    if (cleaned.length > 14) cleaned = cleaned.slice(0, 14);
    setPhone(cleaned);
  };

  const handleDobChange = (text: string) => {
    let cleaned = text.replace(/[^0-9]/g, "");
    if (cleaned.length > 8) cleaned = cleaned.slice(0, 8);
    let formatted = cleaned;
    if (cleaned.length > 4 && cleaned.length <= 6)
      formatted = `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
    else if (cleaned.length > 6)
      formatted = `${cleaned.slice(0, 4)}-${cleaned.slice(4, 6)}-${cleaned.slice(6)}`;
    setDob(formatted);
  };

  // === SUBMIT HANDLER ===
  const handleRegister = async () => {
    // 1. Basic required fields
    if (!name.trim() || !email.trim() || !password || !phone.trim() || !dob.trim()) {
      Alert.alert("Missing Fields", "Please fill all required fields.");
      return;
    }

    // 2. Terms acceptance
    if (!termsAccepted) {
      Alert.alert("Terms Required", "You must agree to the Terms & Conditions.");
      return;
    }

    // 3. Local validation (same as backend)
    if (!emailValid || !passwordValid) {
      Alert.alert("Invalid Input", "Please fix email or password format.");
      return;
    }

    if (!/^\+234[1-9]\d{9}$/.test(phone)) {
      Alert.alert("Invalid Phone", "Use format: +234XXXXXXXXXX");
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
      Alert.alert("Invalid DOB", "Use format: YYYY-MM-DD");
      return;
    }

    setLoading(true);

    try {
      console.log("Sending registration:", { name, email, phone, dob });

      const response = await fetch(REGISTER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          phone,
          dob,
          termsAccepted: true, // ← REQUIRED BY BACKEND
        }),
      });

      const data = await response.json();
      console.log("Response:", data);

      if (!response.ok) {
        const msg = data.message || "Registration failed. Try again.";
        if (response.status === 409) {
          Alert.alert("Already Registered", msg);
        } else {
          Alert.alert("Error", msg);
        }
        return;
      }

      // Success: Save email & navigate
      await AsyncStorage.setItem("pending_email", email);
      Alert.alert(
        "Success!",
        "Account created! Check your email for the verification code.",
        [{ text: "OK", onPress: () => router.push("/(auth)/parent-verify-email") }]
      );
    } catch (err: any) {
      console.error("Network error:", err);
      Alert.alert("Network Error", "Please check your internet and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: "#fff" }}
    >
      <ScrollView
        contentContainerStyle={{ padding: 20, flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={{ alignItems: "center", marginBottom: 24 }}>
          <Ionicons name="person-add" size={48} color={colors.primary} />
          <Text variant="headlineMedium" style={{ fontWeight: "bold", marginTop: 8 }}>
            Create Account
          </Text>
          <Text variant="bodyMedium" style={{ color: "#666", marginTop: 4 }}>
            Join Kivelo and start your family journey
          </Text>
        </View>

        {/* Full Name */}
        <TextInput
          label="Full Name"
          value={name}
          onChangeText={setName}
          mode="outlined"
          style={{ marginBottom: 12 }}
        />

        {/* Email */}
        <TextInput
          label="Email"
          value={email}
          onChangeText={validateEmail}
          mode="outlined"
          keyboardType="email-address"
          autoCapitalize="none"
          error={!emailValid && email.length > 0}
          style={{ marginBottom: 12 }}
        />
        {!emailValid && email.length > 0 && (
          <Text style={{ color: "red", fontSize: 12, marginBottom: 8 }}>
            Please enter a valid email
          </Text>
        )}

        {/* Phone */}
        <TextInput
          label="Phone Number"
          value={phone}
          onChangeText={handlePhoneChange}
          mode="outlined"
          keyboardType="phone-pad"
          style={{ marginBottom: 12 }}
        />

        {/* DOB */}
        <TextInput
          label="Date of Birth (YYYY-MM-DD)"
          value={dob}
          onChangeText={handleDobChange}
          mode="outlined"
          keyboardType="numeric"
          maxLength={10}
          style={{ marginBottom: 12 }}
        />

        {/* Password */}
        <TextInput
          label="Password"
          value={password}
          onChangeText={validatePassword}
          mode="outlined"
          secureTextEntry
          error={!passwordValid && password.length > 0}
          style={{ marginBottom: 8 }}
        />
        {!passwordValid && password.length > 0 && (
          <Text style={{ color: "red", fontSize: 12, marginBottom: 12 }}>
            8+ chars, 1 uppercase, 1 number
          </Text>
        )}

        {/* Terms Checkbox */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
          <Checkbox
            status={termsAccepted ? "checked" : "unchecked"}
            onPress={() => setTermsAccepted(!termsAccepted)}
            color={colors.primary}
          />
          <Text style={{ flex: 1, marginLeft: 8, fontSize: 13 }}>
            I agree to the{" "}
            <Text style={{ color: colors.primary, fontWeight: "bold" }}>
              Terms & Conditions
            </Text>{" "}
            and{" "}
            <Text style={{ color: colors.primary, fontWeight: "bold" }}>
              Privacy Policy
            </Text>
          </Text>
        </View>

        {/* Submit Button */}
        <Button
          mode="contained"
          onPress={handleRegister}
          disabled={loading}
          contentStyle={{ paddingVertical: 8 }}
          style={{ marginBottom: 16 }}
        >
          {loading ? <ActivityIndicator color="#fff" /> : "Create Account"}
        </Button>

        {/* Social Login */}
        <View style={{ flexDirection: "row", justifyContent: "center", gap: 16, marginBottom: 20 }}>
          <Button
            mode="outlined"
            icon="google"
            onPress={() => Alert.alert("Google Sign-In", "Coming soon!")}
            compact
          >
            Google
          </Button>
          <Button
            mode="outlined"
            icon="apple"
            onPress={() => Alert.alert("Apple Sign-In", "Coming soon!")}
            compact
          >
            Apple
          </Button>
        </View>

        {/* Login Link */}
        <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
          <Text style={{ textAlign: "center", color: "#666" }}>
            Already have an account?{" "}
            <Text style={{ color: colors.primary, fontWeight: "bold" }}>Login</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}