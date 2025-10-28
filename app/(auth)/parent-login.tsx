import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { Checkbox } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { useAuth } from "../../context/AuthContext";

const API_URL = "https://family-wellness.onrender.com/api/auth/login";

const ParentLoginScreen = () => {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [isEmailValid, setIsEmailValid] = useState(true);
  const [password, setPassword] = useState("");
  const [isPasswordValid, setIsPasswordValid] = useState(true);
  const [isChecked, setIsChecked] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  // ✅ Auto-login if token exists
  useEffect(() => {
    const checkLoginStatus = async () => {
      const token = await AsyncStorage.getItem("userToken");
      const userData = await AsyncStorage.getItem("userData");

      if (token && userData) {
        const user = JSON.parse(userData);
        login({
          username: user.name,
          role: user.role,
          profilePic: user.profilePic || "https://via.placeholder.com/150",
        });
        router.push("/(dashboard)/parent/home");
      }
    };
    checkLoginStatus();
  }, []);

  // ✅ Email validation
  const validateEmail = (text: string) => {
    setEmail(text);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setIsEmailValid(emailRegex.test(text));
  };

  // ✅ SIMPLE Password validation - accepts any password
  const validatePassword = (text: string) => {
    setPassword(text);
    setIsPasswordValid(text.length > 0); // Only check if not empty
  };

  // ✅ SIMPLE Login logic
 // ✅ Login logic
const handleLogin = async () => {
  if (!email || !password) {
    Alert.alert("Missing Information", "Please enter both email and password.");
    return;
  }

  if (!isEmailValid) {
    Alert.alert("Invalid Email", "Please enter a valid email address.");
    return;
  }

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    console.log("Login Response:", data);

    if (response.ok) {
      // ✅ FIX: Access user data from data.data.user instead of data.user
      const userData = data.data.user;
      
      // ✅ Save login details globally
      login({
        username: userData.name || userData.email,
        role: userData.role || "parent",
        profilePic: userData.profilePic || "https://via.placeholder.com/150",
      });

      // ✅ Store token locally if Remember Me is checked
      if (isChecked && data.accessToken) {
        await AsyncStorage.setItem("userToken", data.accessToken);
        await AsyncStorage.setItem("userData", JSON.stringify(userData));
      }

      Alert.alert("Login Successful", "Redirecting to parent dashboard...");
      router.push("/(dashboard)/parent/");
    } else if (response.status === 401) {
      Alert.alert("Login Failed", data.message || "Invalid email or password.");
    } else {
      Alert.alert("Login Failed", data.message || "Something went wrong. Try again.");
    }
  } catch (error) {
    console.error("Login Error:", error);
    Alert.alert("Network Error", "Unable to connect to server. Please try again later.");
  }
};
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Top Background */}
      <View style={styles.topBackground}></View>

      {/* White Bottom Section */}
      <View style={styles.bottomSection}>
        <Text style={styles.title}>Login</Text>

        {/* Email Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <View
            style={[
              styles.inputBox,
              !isEmailValid && email.length > 0 && { borderColor: "red" },
            ]}
          >
            <TextInput
              style={styles.input}
              placeholder="Johndoe55@gmail.com"
              keyboardType="email-address"
              value={email}
              onChangeText={validateEmail}
            />
            {isEmailValid && email.length > 0 && (
              <Ionicons name="checkmark-circle" size={wp(5.5)} color="green" />
            )}
          </View>
        </View>

        {/* Password Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <View
            style={[
              styles.inputBox,
              !isPasswordValid && password.length > 0 && { borderColor: "red" },
            ]}
          >
            <TextInput
              style={styles.input}
              placeholder="*************"
              secureTextEntry={!isPasswordVisible}
              value={password}
              onChangeText={validatePassword}
            />
            <TouchableOpacity
              onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            >
              <Ionicons
                name={isPasswordVisible ? "eye-off" : "eye"}
                size={wp(5.5)}
                color="#555"
                style={styles.icon}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Remember Me & Forgot Password */}
        <View style={styles.rememberRow}>
          <View style={styles.checkboxRow}>
            <Checkbox
              status={isChecked ? "checked" : "unchecked"}
              onPress={() => setIsChecked(!isChecked)}
              color="#4A90E2"
            />
            <Text style={styles.rememberText}>Remember me</Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/parent-forgot-password")}>
            <Text style={styles.linkText}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        {/* ✅ Login Button */}
        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginText}>Login</Text>
        </TouchableOpacity>

        {/* OR Separator */}
        <Text style={styles.orText}>- or -</Text>

        {/* Continue with Apple or Google */}
        <View style={styles.socialButton}>
          <Text style={styles.socialText}>Continue with Apple or Google</Text>
          <View style={styles.iconRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="logo-apple" size={wp(5.5)} color="#000" />
            </View>
            <View style={styles.iconCircle}>
              <Ionicons name="logo-google" size={wp(5.5)} color="#DB4437" />
            </View>
          </View>
        </View>

        {/* Register */}
        <View style={styles.registerRow}>
          <Text style={styles.accountText}>Don't Have An Account? </Text>
          <TouchableOpacity onPress={() => router.push("/parent-register")}>
            <Text style={styles.registerText}>Register</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

export default ParentLoginScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#B3D9FF",
  },
  topBackground: {
    height: hp(22),
    justifyContent: "flex-start",
    paddingTop: hp(7),
    paddingLeft: wp(5),
  },
  bottomSection: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: wp(10),
    borderTopRightRadius: wp(10),
    paddingHorizontal: wp(6),
    paddingVertical: hp(4),
  },
  title: {
    fontSize: wp(5),
    fontFamily: "Poppins-SemiBold",
    marginBottom: hp(1.5),
    marginTop: hp(1.5),
  },
  inputContainer: {
    marginBottom: hp(1),
  },
  label: {
    fontSize: wp(3),
    fontFamily: "Poppins-Regular",
    color: "#555",
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
    fontFamily: "Poppins-Regular",
    fontSize: wp(2.5),
  },
  icon: {
    marginLeft: wp(2),
  },
  rememberRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: hp(4),
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  rememberText: {
    marginLeft: wp(-1),
    color: "#555",
    fontFamily: "Poppins-Regular",
    fontSize: wp(2.9),
  },
  linkText: {
    color: "#4A90E2",
    fontFamily: "Poppins-SemiBold",
    fontSize: wp(2.9),
  },
  loginButton: {
    backgroundColor: "#8A2BE2",
    paddingVertical: hp(1.8),
    borderRadius: wp(8),
    alignItems: "center",
    marginBottom: hp(0.5),
  },
  loginText: {
    color: "white",
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
    paddingVertical: hp(1.5),
    marginBottom: hp(3),
  },
  socialText: {
    flex: 1,
    textAlign: "center",
    fontSize: wp(2.9),
    fontFamily: "Poppins-Regular",
    color: "#555",
  },
  iconRow: {
    flexDirection: "row",
    gap: wp(2),
  },
  iconCircle: {
    backgroundColor: "#f5f5f5",
    borderRadius: wp(5),
    width: wp(8),
    height: wp(8),
    alignItems: "center",
    justifyContent: "center",
  },
  registerRow: {
    flexDirection: "row",
    justifyContent: "center",
  },
  accountText: {
    color: "#555",
    fontSize: wp(3),
    fontFamily: "Poppins-Regular",
  },
  registerText: {
    color: "#4A90E2",
    fontWeight: "600",
    fontFamily: "Poppins-SemiBold",
    fontSize: wp(3),
  },
});