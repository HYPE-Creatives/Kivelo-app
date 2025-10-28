// app/(auth)/parent-verify-email.tsx
import React, { useState, useRef } from "react";
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
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

const VERIFY_URL = "https://family-wellness.onrender.com/api/auth/verify-email";
const RESEND_URL = "https://family-wellness.onrender.com/api/auth/resend-verification";

const VerifyEmail = () => {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputs = useRef<(TextInput | null)[]>([]);
  const [email, setEmail] = useState<string>("");

  // 🔹 On mount, fetch email stored during signup (if saved)
  React.useEffect(() => {
    (async () => {
      const storedEmail = await AsyncStorage.getItem("pending_email");
      if (storedEmail) setEmail(storedEmail);
    })();
  }, []);

  const handleChange = (text: string, index: number) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    if (text && index < code.length - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const enteredCode = code.join("");
    if (enteredCode.length < 6) {
      Alert.alert("Error", "Please enter the 6-digit code.");
      return;
    }
    if (!email) {
      Alert.alert("Error", "Missing email information. Please sign up again.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(VERIFY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: enteredCode }),
      });

      const data = await res.json();
      console.log("📩 Verify Email Response:", data);

      setLoading(false);

      if (!res.ok) {
        Alert.alert("Verification Failed", data?.message || "Invalid code. Try again.");
        return;
      }

      Alert.alert("✅ Success", "Email verified successfully!", [
        { text: "Continue", onPress: () => router.push("/(auth)/parent-login") },
      ]);
    } catch (err) {
      console.error("❌ Verify Error:", err);
      setLoading(false);
      Alert.alert("Network Error", "Could not connect to server. Try again later.");
    }
  };

  const handleResend = async () => {
    if (!email) {
      Alert.alert("Error", "Email not found. Please sign up again.");
      return;
    }

    setResending(true);
    try {
      const res = await fetch(RESEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      console.log("📩 Resend Response:", data);
      setResending(false);

      if (!res.ok) {
        Alert.alert("Error", data?.message || "Could not resend code. Try again.");
        return;
      }

      Alert.alert("Sent", "A new verification code has been sent to your email.");
    } catch (err) {
      console.error("❌ Resend Error:", err);
      setResending(false);
      Alert.alert("Network Error", "Please check your connection and try again.");
    }
  };

  const isButtonEnabled = code.every((digit) => digit.length === 1);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Verify Your Email</Text>

        <Image
          source={require("../../assets/images/mail.png")}
          style={styles.image}
          resizeMode="contain"
        />

        <Text style={styles.description}>
          Please enter the 6-digit code sent to{" "}
          <Text style={{ fontWeight: "600", color: "#000" }}>{email}</Text>
        </Text>

        <View style={styles.codeContainer}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputs.current[index] = ref)}
              style={styles.codeInput}
              maxLength={1}
              keyboardType="numeric"
              value={digit}
              onChangeText={(text) => handleChange(text, index)}
            />
          ))}
        </View>

        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>Didn’t receive a code?</Text>
          <TouchableOpacity onPress={handleResend} disabled={resending}>
            <Text style={styles.resendButton}>
              {resending ? "Sending..." : "Resend"}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={handleVerify}
          activeOpacity={0.8}
          disabled={!isButtonEnabled || loading}
        >
          <LinearGradient
            colors={
              isButtonEnabled && !loading
                ? ["#A64CED", "#6521E3"]
                : ["#ccc", "#ccc"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.button}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Verify</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default VerifyEmail;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  content: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: wp("8%"),
    paddingTop: hp("5%"),
  },
  title: {
    marginTop: 60,
    fontSize: wp("5%"),
    fontWeight: "600",
    color: "#000",
    marginBottom: hp("4%"),
  },
  image: {
    width: wp("45%"),
    height: hp("22%"),
    marginBottom: hp("3%"),
  },
  description: {
    textAlign: "center",
    color: "#666",
    fontSize: wp("3.5%"),
    marginBottom: hp("5%"),
    lineHeight: hp("2.8%"),
  },
  codeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "80%",
    marginBottom: hp("3%"),
  },
  codeInput: {
    width: wp("12%"),
    height: hp("7%"),
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    textAlign: "center",
    fontSize: wp("5%"),
    fontWeight: "500",
    color: "#000",
  },
  resendContainer: {
    flexDirection: "row",
    marginBottom: hp("4%"),
  },
  resendText: { color: "#666", fontSize: wp("3.5%") },
  resendButton: {
    color: "#3366FF",
    fontWeight: "500",
    marginLeft: 5,
    fontSize: wp("3.5%"),
  },
  button: {
    width: wp("85%"),
    height: hp("6.5%"),
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: wp("4%"),
    fontWeight: "500",
  },
});
