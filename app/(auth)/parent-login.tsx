import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Checkbox } from "react-native-paper";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { useAuth } from "../../context/AuthContext"; // ✅ still connected for global login state

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
        router.push("/(dashboard)/parent/");
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

  // ✅ Password validation
  const validatePassword = (text: string) => {
    setPassword(text);
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;
    setIsPasswordValid(passwordRegex.test(text));
  };

  // ✅ Dummy login flow (no backend)
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Missing Information", "Please enter both email and password.");
      return;
    }

    if (!isEmailValid || !isPasswordValid) {
      Alert.alert(
        "Invalid Credentials",
        "Please make sure your email and password are valid."
      );
      return;
    }

    // Simulate login delay and navigation
    Alert.alert("Logging in...", "Please wait while we log you in.");
    setTimeout(async () => {
      const dummyUser = {
        name: email.split("@")[0],
        role: "parent",
        profilePic: "https://via.placeholder.com/150",
      };

      // Save global login state
      login({
        username: dummyUser.name,
        role: dummyUser.role,
        profilePic: dummyUser.profilePic,
      });

      // Save locally if Remember Me is checked
      if (isChecked) {
        await AsyncStorage.setItem("userToken", "dummy-token");
        await AsyncStorage.setItem("userData", JSON.stringify(dummyUser));
      }

      Alert.alert("Login Successful", "Redirecting to parent dashboard...");
      router.push("/(dashboard)/parent/");
    }, 1200);
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
          <Text style={styles.accountText}>Don’t Have An Account? </Text>
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
