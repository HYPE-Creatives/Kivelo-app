// app/_layout.tsx
import { SplashScreen, Stack } from "expo-router";
import { useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View, ActivityIndicator } from "react-native";
import "./global.css";
import { AuthProvider } from "../context/AuthContext";

// Keep splash screen visible until app is ready
SplashScreen.preventAutoHideAsync();

function RootContent() {
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    // Simulate loading resources
    const timer = setTimeout(() => {
      setAppReady(true);
      SplashScreen.hideAsync();
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);

  if (!appReady) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#16A34A" />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootContent />
      </AuthProvider>
    </SafeAreaProvider>
  );
}