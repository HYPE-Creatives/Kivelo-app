import {
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useState } from "react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email");
      return;
    }

    setLoading(true);
    try {
      // ✅ In the future, replace this with an API call to your backend
      // Example:
      // const response = await fetch("http://localhost:5000/api/auth/forgot-password", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ email }),
      // });
      // const data = await response.json();
      // if (!response.ok) throw new Error(data.message);

      // Mock success (temporary)
      await new Promise((resolve) => setTimeout(resolve, 1500));
      Alert.alert(
        "Password Reset",
        `If an account exists for ${email}, a password reset link has been sent.`
      );

      setEmail("");
      router.push("/(auth)/login");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
      }}
    >
      <Text className="text-3xl font-bold text-green-700 mb-6 text-center">
        Forgot Password
      </Text>

      <Text className="text-center text-gray-600 mb-6">
        Enter your email address to receive a password reset link.
      </Text>

      <TextInput
        className="w-full bg-white rounded-lg p-4 mb-6 shadow"
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TouchableOpacity
        disabled={loading || !email}
        className={`py-4 px-16 rounded-xl w-full items-center mb-4 ${
          loading || !email ? "bg-gray-400" : "bg-green-700"
        }`}
        onPress={handleReset}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white text-lg font-bold">Send Reset Link</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
        <Text className="text-green-700 text-center mt-4">Back to Login</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/")}>
        <Text className="text-gray-600 text-center mt-2">Back to Home</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
