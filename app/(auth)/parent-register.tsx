import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Checkbox } from "react-native-paper";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";

const SignupScreen = () => {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isEmailValid, setIsEmailValid] = useState(true);
  const [password, setPassword] = useState("");
  const [isPasswordValid, setIsPasswordValid] = useState(true);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [phone, setPhone] = useState("+234");
  const [dob, setDob] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ Email validation
  const validateEmail = (text) => {
    setEmail(text);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setIsEmailValid(emailRegex.test(text));
  };

  // ✅ Password validation
  const validatePassword = (text) => {
    setPassword(text);
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;
    setIsPasswordValid(passwordRegex.test(text));
  };

  // ✅ Phone input masking (+234 auto-prefix)
  const handlePhoneChange = (text) => {
    let cleaned = text.replace(/[^0-9+]/g, "");
    if (!cleaned.startsWith("+234")) {
      cleaned = "+234" + cleaned.replace(/^(\+|0|234)*/, "");
    }
    if (cleaned.length > 14) cleaned = cleaned.slice(0, 14);
    setPhone(cleaned);
  };

  // ✅ DOB input masking (YYYY-MM-DD)
  const handleDobChange = (text) => {
    let cleaned = text.replace(/[^0-9]/g, "");
    if (cleaned.length > 8) cleaned = cleaned.slice(0, 8);
    let formatted = cleaned;
    if (cleaned.length > 4 && cleaned.length <= 6)
      formatted = `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
    else if (cleaned.length > 6)
      formatted = `${cleaned.slice(0, 4)}-${cleaned.slice(4, 6)}-${cleaned.slice(6)}`;
    setDob(formatted);
  };

  // ✅ Dummy Signup Handler
  const handleSignup = async () => {
    if (!name || !email || !password || !phone || !dob) {
      Alert.alert("Incomplete Form", "Please fill all fields before submitting.");
      return;
    }

    if (!isChecked) {
      Alert.alert("Terms Not Accepted", "Please agree to the Terms & Conditions.");
      return;
    }

    if (!isEmailValid || !isPasswordValid) {
      Alert.alert("Invalid Details", "Check your email and password formats.");
      return;
    }

    setLoading(true);

    // Simulate network delay
    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        "Signup Successful 🎉",
        "Your account has been created successfully!",
        [
          {
            text: "Proceed",
            onPress: () => router.push("/(auth)/parent-verify-email"),
          },
        ]
      );
    }, 1500);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#B3D9FF" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={hp(4)}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topBackground}></View>

          <View style={styles.bottomSection}>
            <Text style={styles.title}>Sign Up</Text>

            {/* Full Name */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Full Name</Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.input}
                  placeholder="John Doe"
                  placeholderTextColor="#999"
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <View
                style={[styles.inputBox, !isEmailValid && { borderColor: "red" }]}
              >
                <TextInput
                  style={styles.input}
                  placeholder="Johndoe55@gmail.com"
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={validateEmail}
                />
                {isEmailValid && email.length > 0 && (
                  <Ionicons name="checkmark-circle" size={wp(5)} color="#4A90E2" />
                )}
              </View>
            </View>

            {/* Phone */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Phone</Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.input}
                  placeholder="+2348123456789"
                  placeholderTextColor="#999"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={handlePhoneChange}
                />
              </View>
            </View>

            {/* DOB */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Date of Birth (YYYY-MM-DD)</Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.input}
                  placeholder="1990-01-01"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  value={dob}
                  onChangeText={handleDobChange}
                  maxLength={10}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View
                style={[styles.inputBox, !isPasswordValid && { borderColor: "red" }]}
              >
                <TextInput
                  style={styles.input}
                  placeholder="*************"
                  placeholderTextColor="#999"
                  secureTextEntry={!isPasswordVisible}
                  autoCapitalize="none"
                  value={password}
                  onChangeText={validatePassword}
                />
                <TouchableOpacity
                  onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                >
                  <Ionicons
                    name={isPasswordVisible ? "eye-off" : "eye"}
                    size={wp(5)}
                    color="#555"
                  />
                </TouchableOpacity>
              </View>
              {!isPasswordValid && (
                <Text style={styles.errorText}>
                  Password must be at least 8 characters, include an uppercase
                  letter and a number.
                </Text>
              )}
            </View>

            {/* Terms Checkbox */}
            <View style={styles.rememberRow}>
              <View style={styles.checkboxRow}>
                <Checkbox
                  status={isChecked ? "checked" : "unchecked"}
                  onPress={() => setIsChecked(!isChecked)}
                  color="#4A90E2"
                />
                <Text style={styles.checkboxText}>
                  I agree to the{" "}
                  <Text style={styles.linkText}>Terms & Conditions</Text> and{" "}
                  <Text style={styles.linkText}>Privacy Policy</Text>
                </Text>
              </View>
            </View>

            {/* Sign Up Button */}
            <TouchableOpacity
              style={[styles.signupButton, loading && { opacity: 0.6 }]}
              onPress={handleSignup}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.signupText}>Sign Up</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.orText}>- or -</Text>

            <View style={styles.socialButton}>
              <Text style={styles.socialText}>Continue with Apple or Google</Text>
              <View style={styles.iconRow}>
                <View style={styles.iconCircle}>
                  <Ionicons name="logo-apple" size={wp(6)} color="#000" />
                </View>
                <View style={styles.iconCircle}>
                  <Ionicons name="logo-google" size={wp(6)} color="#DB4437" />
                </View>
              </View>
            </View>

            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push("/(auth)/parent-login")}>
                <Text style={styles.registerText}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default SignupScreen;

/* ✅ Styles */
const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: "#B3D9FF" },
  topBackground: { height: hp(18), backgroundColor: "#B3D9FF" },
  bottomSection: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: wp(10),
    borderTopRightRadius: wp(10),
    paddingHorizontal: wp(6),
    paddingVertical: hp(3),
  },
  title: {
    fontSize: wp(5),
    fontFamily: "Poppins-SemiBold",
    marginBottom: hp(1.5),
    marginTop: hp(1.5),
  },
  inputContainer: { marginBottom: hp(1) },
  label: {
    fontSize: wp(3.2),
    color: "#555",
    fontFamily: "Poppins-Regular",
    marginBottom: hp(0.35),
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: wp(3),
    paddingHorizontal: wp(3),
    height: hp(6),
  },
  input: {
    flex: 1,
    fontSize: wp(2.5),
    fontFamily: "Poppins-Regular",
    color: "#000",
  },
  errorText: {
    color: "red",
    fontSize: wp(2.5),
    marginTop: hp(0.5),
    fontFamily: "Poppins-Regular",
  },
  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: hp(1.7),
  },
  checkboxRow: { flexDirection: "row", alignItems: "center", flex: 1 },
  checkboxText: {
    color: "#555",
    flex: 1,
    fontSize: wp(2.7),
    flexWrap: "wrap",
    fontFamily: "Poppins-Regular",
  },
  linkText: { color: "#4A90E2", fontFamily: "Poppins-SemiBold" },
  signupButton: {
    backgroundColor: "#8A2BE2",
    paddingVertical: hp(1.9),
    borderRadius: wp(8),
    alignItems: "center",
    marginBottom: hp(0.5),
  },
  signupText: {
    color: "#fff",
    fontSize: wp(3.3),
    fontFamily: "Poppins-SemiBold",
  },
  orText: {
    alignSelf: "center",
    color: "#888",
    marginBottom: hp(0.5),
    fontSize: wp(3.5),
    fontFamily: "Poppins-SemiBold",
  },
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: wp(8),
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.3),
    marginBottom: hp(3),
  },
  socialText: {
    flex: 1,
    textAlign: "center",
    fontSize: wp(2.9),
    fontFamily: "Poppins-Regular",
    color: "#555",
  },
  iconRow: { flexDirection: "row", gap: wp(2) },
  iconCircle: {
    backgroundColor: "#f5f5f5",
    borderRadius: wp(5),
    width: wp(8.5),
    height: wp(8.5),
    alignItems: "center",
    justifyContent: "center",
  },
  footerContainer: { flexDirection: "row", justifyContent: "center" },
  footerText: { color: "#555", fontSize: wp(3), fontFamily: "Poppins-Regular" },
  registerText: {
    color: "#4A90E2",
    fontFamily: "Poppins-SemiBold",
    fontSize: wp(3),
  },
});
