import { View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator, Platform } from "react-native";
import { useRouter, Redirect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

SplashScreen.preventAutoHideAsync();

export default function LandingPage() {
  const [fontsLoaded, fontError] = useFonts({
    "Inter-Bold": require("../assets/fonts/Inter-Bold.otf"),
    "Inter-Regular": require("../assets/fonts/Inter-Regular.otf"),
  });

  const router = useRouter();
  const { user, isLoading, isAuthenticated, loginWithGoogle } = useAuth();
  const [processingOAuth, setProcessingOAuth] = useState(false);

  // Handle OAuth callback at root level
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    
    const hash = window.location.hash;
    if (hash && hash.includes('id_token=')) {
      console.log('🔐 OAuth callback detected at root, processing...');
      setProcessingOAuth(true);
      
      const params = new URLSearchParams(hash.substring(1));
      const idToken = params.get('id_token');
      
      // Clean URL immediately
      window.history.replaceState(null, '', window.location.pathname);
      
      if (idToken) {
        loginWithGoogle(idToken)
          .then((result) => {
            console.log('✅ Google login result:', result);
            if (!result.success) {
              console.error('❌ Google login failed:', result.message);
            }
          })
          .catch((err) => {
            console.error('❌ Google login error:', err);
          })
          .finally(() => {
            setProcessingOAuth(false);
          });
      } else {
        setProcessingOAuth(false);
      }
    }
  }, [loginWithGoogle]);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Show loading while checking auth status or processing OAuth
  if (isLoading || processingOAuth || (!fontsLoaded && !fontError)) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#4CAF50" }}>
        <ActivityIndicator size="large" color="#fff" />
        {processingOAuth && (
          <Text style={{ color: '#fff', marginTop: 16, fontSize: 16 }}>
            Signing in with Google...
          </Text>
        )}
      </View>
    );
  }

  // If user is logged in, redirect to their dashboard
  if (isAuthenticated && user) {
    if (user.role === "parent") {
      return <Redirect href="/(dashboard)/parent" />;
    }
    if (user.role === "child") {
      // Check if child needs to set password first
      if (!user.hasSetPassword) {
        return <Redirect href="/(auth)/set-password" />;
      }
      return <Redirect href="/(dashboard)/child" />;
    }
  }

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
            style={{ fontFamily: "Inter-Bold" }}
          >
            Welcome to Family Wellness 🌿
          </Text>

          <Text
            className="text-white text-base text-center mb-4"
            style={{ fontFamily: "Inter-Regular" }}
          >
            A safe and playful app where children can express feelings,
            explore emotional check-ins, and interact with an AI guide.
          </Text>

          <Text
            className="text-white text-base text-center mb-10"
            style={{ fontFamily: "Inter-Regular" }}
          >
            Parents can observe and support their children’s emotional world
            in a friendly, non-intrusive way.
          </Text>

          {/* New User Section */}
          <Text
            className="text-white text-center mb-2"
            style={{ fontFamily: "Inter-Regular" }}
          >
            First time here?
          </Text>
          <TouchableOpacity
            className="bg-white py-4 px-16 rounded-xl mb-6 w-3/4 items-center shadow"
            onPress={() => router.push("/(auth)/register")}
          >
            <Text
              className="text-green-600 text-lg font-bold"
              style={{ fontFamily: "Inter-Bold" }}
            >
              Get Started
            </Text>
          </TouchableOpacity>

          {/* Returning User Section */}
          <Text
            className="text-white text-center mb-2"
            style={{ fontFamily: "Inter-Regular" }}
          >
            Already have an account?
          </Text>
          <TouchableOpacity
            className="bg-green-700 py-4 px-16 rounded-xl w-3/4 items-center shadow"
            onPress={() => router.push("/(auth)/login")}
          >
            <Text
              className="text-white text-lg font-bold"
              style={{ fontFamily: "Inter-Bold" }}
            >
              Login
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}
