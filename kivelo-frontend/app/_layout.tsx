// app/_layout.tsx
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View, ActivityIndicator, Platform } from "react-native";
import { PaperProvider } from "react-native-paper";
import "./global.css";
import { AuthProvider } from "../context/AuthContext";
import { AlertProvider } from "../components/AlertProvider";

// Create a typed alias so TypeScript treats View as a valid JSX component
const RNView = View as unknown as React.ComponentType<any>;
const RNActivityIndicator = ActivityIndicator as unknown as React.ComponentType<any>;

// Keep splash screen visible until app is ready (only on native platforms)
if (Platform.OS !== 'web') {
  SplashScreen.preventAutoHideAsync();
}

// Handle GitHub Pages SPA redirect (web only)
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  const redirect = sessionStorage.getItem('spa-redirect');
  if (redirect) {
    sessionStorage.removeItem('spa-redirect');
    window.history.replaceState(null, '', redirect);
  }
  
  // Handle the 404.html redirect query param
  const location = window.location;
  if (location.search.startsWith('?/')) {
    const path = location.search.slice(2).split('&')[0].replace(/~and~/g, '&');
    const search = location.search.slice(2).split('&').slice(1).join('&').replace(/~and~/g, '&');
    const fullPath = '/' + path + (search ? '?' + search : '') + location.hash;
    window.history.replaceState(null, '', '/Kivelo-app' + fullPath);
  }
}

function RootContent() {
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    // Simulate loading resources
    const timer = setTimeout(() => {
      setAppReady(true);
      if (Platform.OS !== 'web') {
        SplashScreen.hideAsync();
      }
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
      <PaperProvider>
        <AlertProvider>
          <AuthProvider>
            <RootContent />
          </AuthProvider>
        </AlertProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}