// app/(auth)/login.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    setLoading(true);
    try {
      let role: "parent" | "child" = "child";

      // ✅ Mock login credentials
      if (email === "parent@test.com" && password === "123456") {
        role = "parent";
      } else if (email === "child@test.com" && password === "123456") {
        role = "child";
      } else {
        throw new Error("Invalid credentials");
      }

      // ✅ Fake user object (with username + profilePic)
      const fakeUser = {
        username: role === "parent" ? "Parent User" : "Child User",
        profilePic:
          role === "parent"
            ? "https://i.pravatar.cc/150?img=12"
            : "https://i.pravatar.cc/150?img=15",
        role,
        email,
      };

      const fakeData = {
        token: "FAKE_JWT_TOKEN",
        ...fakeUser,
      };

      // ✅ Save to AsyncStorage
      await AsyncStorage.setItem("userToken", fakeData.token);
      await AsyncStorage.setItem("dummyUser", JSON.stringify(fakeData));

      // ✅ Send full user object into AuthContext
      login(fakeUser);

      // ✅ Redirect based on role
      if (role === "parent") {
        router.replace("/(dashboard)/parent/home");
      } else {
        router.replace("/(dashboard)/child/home");
      }
    } catch (err: any) {
      Alert.alert("Login Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
      />

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />

      <TouchableOpacity
        style={[styles.loginButton, loading && { opacity: 0.7 }]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.loginButtonText}>Login</Text>
        )}
      </TouchableOpacity>

      {/* Forgot password link */}
      <TouchableOpacity onPress={() => router.push("/(auth)/forgot-password")}>
        <Text style={styles.linkText}>Forgot Password?</Text>
      </TouchableOpacity>

      {/* Back to Landing Page */}
      <TouchableOpacity onPress={() => router.push("/")}>
        <Text style={styles.backText}>Back to Home</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f7fdff", // green-50
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#0530ad", // green-700
    marginBottom: 24,
    fontFamily: "Poppins-Bold",
  },
  input: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderColor: "#d1d5db", // gray-300
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    fontFamily: "Poppins-Regular",
  },
  loginButton: {
    backgroundColor: "#0530ad", // green-700
    paddingVertical: 13,
    borderRadius: 35,
    width: "100%",
    alignItems: "center",
    marginBottom: 16,
  },
  loginButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontFamily: "Poppins-Regular",
  },
  linkText: {
    color: "#0530ad", // green-700
    textAlign: "center",
    marginTop: 16,
    fontFamily: "Poppins-Regular",
  },
  backText: {
    color: "#4b5563", // gray-600
    textAlign: "center",
    marginTop: 16,
    fontFamily: "Poppins-Regular",
  },
});
