import { Ionicons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Alert,
  Animated,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Checkbox } from "react-native-paper";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [fontsLoaded] = useFonts({
    Poppins: require("../../assets/fonts/Poppins-Regular.ttf"),
    "Poppins-Bold": require("../../assets/fonts/Poppins-Bold.ttf"),
  });

  if (!fontsLoaded) return null;

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert("Missing Information", "Please enter your credentials");
      return;
    }

    // ✅ Dummy success popup flow
    setShowSuccess(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    // Auto-hide popup + navigate to dashboard
    setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => setShowSuccess(false));
      router.push("/(dashboard)/child/");
    }, 2000);
  };

  return (
    <LinearGradient colors={["#79D8F2", "#48A8E2"]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Title */}
        <Text style={styles.title}>Login</Text>

        {/* Input Fields */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Email or Username"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
          />

          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, { flex: 1, borderWidth: 0 }]}
              placeholder="Password"
              placeholderTextColor="#999"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              <Ionicons
                name={showPassword ? "eye" : "eye-off"}
                size={20}
                color="#888"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Remember Me & Forgot Password */}
        <View style={styles.row}>
          <View style={styles.rememberContainer}>
            <Checkbox
              status={rememberMe ? "checked" : "unchecked"}
              onPress={() => setRememberMe(!rememberMe)}
              color="#8B1CFB"
            />
            <Text style={styles.rememberText}>Remember Me</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/child-forgot-password")}
          >
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        {/* Login Button */}
        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginText}>Login</Text>
        </TouchableOpacity>

        {/* ✅ Success Popup */}
        {showSuccess && (
          <Animated.View style={[styles.popup, { opacity: fadeAnim }]}>
            <Ionicons name="checkmark-circle" size={48} color="#4CAF50" />
            <Text style={styles.popupText}>Login Successful!</Text>
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
    fontSize: 40,
    color: "#fff",
    textAlign: "center",
    marginBottom: 40,
  },
  inputContainer: {
    gap: 15,
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
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#ddd",
    paddingHorizontal: 10,
  },
  eyeIcon: {
    padding: 6,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  rememberContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  rememberText: {
    fontFamily: "Poppins",
    fontSize: 13,
    color: "#fff",
  },
  forgotText: {
    fontFamily: "Poppins-Bold",
    fontSize: 13,
    color: "#fff",
    textDecorationLine: "underline",
  },
  loginButton: {
    backgroundColor: "#8B1CFB",
    borderRadius: 30,
    paddingVertical: 14,
    marginTop: 40,
    alignItems: "center",
  },
  loginText: {
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
