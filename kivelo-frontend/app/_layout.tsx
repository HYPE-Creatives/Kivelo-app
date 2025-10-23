// app/_layout.tsx
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View, ActivityIndicator } from "react-native";
import "./global.css";
import { AuthProvider } from "../context/AuthContext";

// Create a typed alias so TypeScript treats View as a valid JSX component
const RNView = View as unknown as React.ComponentType<any>;
const RNActivityIndicator = ActivityIndicator as unknown as React.ComponentType<any>;

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
      <RNView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <RNActivityIndicator size="large" color="#16A34A" />
      </RNView>
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