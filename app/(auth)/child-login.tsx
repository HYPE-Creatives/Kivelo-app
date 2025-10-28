// app/(auth)/child-login.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Checkbox } from "react-native-paper";
import { useFonts } from "expo-font";
// import { useAuth } from "../../context/AuthContext"; // ✅ Uncomment later when real auth is ready

export default function LoginScreen() {
  const router = useRouter();
  // const { login } = useAuth(); // ✅ Uncomment when AuthContext is active

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);


  const handleLogin = () => {
    if (email && password) {
      // 🔹 Dummy Login → Replace later with `login(email, password)`
      router.push("/(dashboard)/child/");
    } else {
      Alert.alert("Missing Information", "Please enter your credentials");
    }
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
});
