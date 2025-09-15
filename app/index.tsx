import { useFonts } from "expo-font";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useCallback } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";

SplashScreen.preventAutoHideAsync();

export default function LandingPage() {
  const [fontsLoaded, fontError] = useFonts({
    "Poppins-Bold": require("../assets/fonts/Poppins-Bold.ttf"),
    "Poppins-SemiBold": require("../assets/fonts/Poppins-SemiBold.ttf"),
    "Poppins-Regular": require("../assets/fonts/Poppins-Regular.ttf"),
  });

  const router = useRouter();

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <LinearGradient
      colors={["#4CAF50", "#81C784"]}
      className="flex-1"
      onLayout={onLayoutRootView}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
        }}
      >
        <View className="w-full items-center">
          {/* Logo / Illustration */}
          <Image
            source={require("./../assets/images/Family-Wellness-logo.png")}
            style={{
              width: 200,
              height: 200,
              marginBottom: 10,
              shadowColor: "black",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.5,
            }}
          />

          <Text
            className="text-3xl text-center font-bold text-white mb-6"
            style={{ fontFamily: "Poppins-Bold" }}
          >
            Welcome to Family Wellness.
          </Text>

          <Text
            className="text-white text-base text-center mb-4"
            style={{ fontFamily: "Poppins-Regular" }}
          >
           Where kids explore emotions playfully, and parents stay connected with care
          </Text>
        </View>
        {/* Buttons Row */}
<View className="flex-row justify-between w-full px-4 mt-4">
  <TouchableOpacity
    className="bg-white py-3 px-4 rounded-xl flex-1 items-center mr-2 shadow"
    onPress={() => router.push("/(auth)/register")}
  >
    <Text
      className="text-green-600 text-base font-bold"
      style={{ fontFamily: "Poppins-Bold" }}
    >
      Get Started
    </Text>
  </TouchableOpacity>

  <TouchableOpacity
    className="bg-green-700 py-3 px-4 rounded-xl flex-1 items-center ml-2 shadow"
    onPress={() => router.push("/(auth)/login")}
  >
    <Text
      className="text-white text-base font-bold"
      style={{ fontFamily: "Poppins-Bold" }}
    >
      Login
    </Text>
  </TouchableOpacity>
</View>


      </ScrollView>
    </LinearGradient>
  );
}
