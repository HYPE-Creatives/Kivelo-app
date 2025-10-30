// app/(auth)/parent-verify-email.tsx
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";

const VerifyEmail = () => {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const inputs = useRef<(TextInput | null)[]>([]);
  const [email, setEmail] = useState("example@email.com"); // Dummy email

  const handleChange = (text: string, index: number) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    if (text && index < code.length - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleVerify = () => {
    const enteredCode = code.join("");
    if (enteredCode.length < 6) {
      Alert.alert("Error", "Please enter the 6-digit code.");
      return;
    }

    setLoading(true);

    // Simulate network delay
    setTimeout(() => {
      setLoading(false);
      setShowSuccess(true);

      // Auto-close success and go to next screen
      setTimeout(() => {
        setShowSuccess(false);
        router.push("/(auth)/parent-login");
      }, 2000);
    }, 1000);
  };

  const handleResend = () => {
    setResending(true);
    setTimeout(() => {
      setResending(false);
      Alert.alert("Code Sent", "A new verification code was sent to your email.");
    }, 1000);
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

        {/* Success Popup */}
        {showSuccess && (
          <View style={styles.successPopup}>
            <Text style={styles.successText}>Email verified successfully!</Text>
          </View>
        )}

        {/* Verify Button */}
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
  successPopup: {
    position: "absolute",
    top: hp("35%"),
    backgroundColor: "#E8F5E9",
    borderRadius: 10,
    paddingVertical: hp("2%"),
    paddingHorizontal: wp("6%"),
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  successText: {
    color: "#4CAF50",
    fontSize: wp("4%"),
    fontWeight: "500",
    textAlign: "center",
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
