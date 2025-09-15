import { useFonts } from "expo-font";
import { router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useCallback, useState } from "react";
import { ScrollView, Text, TextInput, TouchableOpacity } from "react-native";

SplashScreen.preventAutoHideAsync();

export default function Register() {
  const [fontsLoaded, fontError] = useFonts({
    "Poppins-Bold": require("../../assets/fonts/Poppins-Bold.ttf"),
    "Poppins-Regular": require("../../assets/fonts/Poppins-Regular.ttf"),
  });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  const handleRegister = () => {
    // TODO: Add register API logic
    console.log("Registering:", { name, email, password });
  };

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1, justifyContent: "center", alignItems: "center", padding: 24 }}
    >
      <Text className="text-3xl font-bold text-green-700 mb-6" style={{ fontFamily: "Poppins-Bold" }}>
        Create an Account
      </Text>

      <TextInput
        className="w-full bg-white rounded-lg p-4 mb-4 shadow"
        placeholder="Full Name"
        value={name}
        onChangeText={setName}
      />

      <TextInput
        className="w-full bg-white rounded-lg p-4 mb-4 shadow"
        placeholder="Email"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />

      <TextInput
        className="w-full bg-white rounded-lg p-4 mb-6 shadow"
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        className="bg-green-700 py-4 px-16 rounded-xl w-full items-center mb-4"
        onPress={handleRegister}
      >
        <Text className="text-white text-lg font-bold" style={{ fontFamily: "Poppins-Bold" }}>
          Register
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
  <Text
    className="text-green-700 text-center mt-4"
    style={{ fontFamily: "Poppins-Regular" }}
  >
    Already have an account?{" "}
    <Text
      style={{ fontFamily: "Poppins-Bold", textDecorationLine: "underline" }}
    >
      Login
    </Text>
  </Text>
</TouchableOpacity>


      {/* Back to Home */}
      <TouchableOpacity onPress={() => router.push("/")}>
        <Text className="text-gray-600 text-center mt-4" style={{ fontFamily: "Poppins-Regular" }}>
          Back to Home
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
