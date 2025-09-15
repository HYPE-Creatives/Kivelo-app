// app/(auth)/login.tsx
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";

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

      // fake user object
      const fakeData = {
        token: "FAKE_JWT_TOKEN",
        role,
        user: { email },
      };

      await AsyncStorage.setItem("userToken", fakeData.token);
      await AsyncStorage.setItem("dummyUser", JSON.stringify(fakeData));

      login(role);

      // redirect based on role
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
    <View className="flex-1 items-center justify-center bg-green-50 px-6">
      <Text className="text-3xl font-bold text-green-700 mb-6" style={{ fontFamily: "Poppins-Bold" }}>Login</Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 mb-4"
      />

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 mb-6"
      />

       <TouchableOpacity
        className="bg-green-700 py-4 px-16 rounded-xl w-full items-center mb-4"
        onPress={handleLogin}
      >
        <Text className="text-white text-lg font-bold" style={{ fontFamily: "Poppins-Bold" }}>
          Login
        </Text>
      </TouchableOpacity>

      {/* Forgot password link */}
      <TouchableOpacity onPress={() => router.push("/(auth)/forgot-password")}>
        <Text className="text-green-700 text-center mt-4" style={{ fontFamily: "Poppins-Regular" }}>
          Forgot Password?
        </Text>
      </TouchableOpacity>

      {/* Back to Landing Page */}
      <TouchableOpacity onPress={() => router.push("/")}>
        <Text className="text-gray-600 text-center mt-4" style={{ fontFamily: "Poppins-Regular" }}>Back to Home</Text>
      </TouchableOpacity>
    </View>
  );
}
