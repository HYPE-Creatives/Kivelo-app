import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions, Platform, ActivityIndicator } from "react-native";
import { useRouter, Redirect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useCallback, useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming, 
  withDelay,
  withSequence,
  withRepeat,
  Easing,
  interpolate,
  FadeIn,
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

SplashScreen.preventAutoHideAsync();

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function WelcomePage() {
  const [fontsLoaded, fontError] = useFonts({
    "Inter-Bold": require("../assets/fonts/Inter-Bold.otf"),
    "Inter-Regular": require("../assets/fonts/Inter-Regular.otf"),
  });

  const router = useRouter();
  const { user, isLoading, isAuthenticated, loginWithGoogle } = useAuth();
  const [processingOAuth, setProcessingOAuth] = useState(false);

  // Animation values
  const logoScale = useSharedValue(0.3);
  const logoRotate = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const subtitleOpacity = useSharedValue(0);
  const buttonsTranslateY = useSharedValue(50);
  const floatY = useSharedValue(0);

  // Handle OAuth callback at root level
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    
    const hash = window.location.hash;
    if (hash && hash.includes('id_token=')) {
      console.log('🔐 OAuth callback detected at root, processing...');
      setProcessingOAuth(true);
      
      const params = new URLSearchParams(hash.substring(1));
      const idToken = params.get('id_token');
      
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

  // Start animations when component mounts
  useEffect(() => {
    if (fontsLoaded && !isLoading && !processingOAuth) {
      // Logo entrance animation
      logoScale.value = withSpring(1, { damping: 12, stiffness: 100 });
      logoRotate.value = withSequence(
        withTiming(-5, { duration: 100 }),
        withSpring(0, { damping: 8 })
      );
      
      // Title fade in
      titleOpacity.value = withDelay(300, withTiming(1, { duration: 600 }));
      
      // Subtitle fade in
      subtitleOpacity.value = withDelay(500, withTiming(1, { duration: 600 }));
      
      // Buttons slide up
      buttonsTranslateY.value = withDelay(700, withSpring(0, { damping: 15 }));
      
      // Floating animation for logo
      floatY.value = withDelay(1000, withRepeat(
        withSequence(
          withTiming(-8, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      ));
    }
  }, [fontsLoaded, isLoading, processingOAuth]);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Animated styles
  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: logoScale.value },
      { rotate: `${logoRotate.value}deg` },
      { translateY: floatY.value },
    ],
  }));

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: interpolate(titleOpacity.value, [0, 1], [20, 0]) }],
  }));

  const subtitleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
    transform: [{ translateY: interpolate(subtitleOpacity.value, [0, 1], [15, 0]) }],
  }));

  const buttonsAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: buttonsTranslateY.value }],
    opacity: interpolate(buttonsTranslateY.value, [50, 0], [0, 1]),
  }));

  // Show loading while checking auth status or processing OAuth
  if (isLoading || processingOAuth || (!fontsLoaded && !fontError)) {
    return (
      <LinearGradient colors={["#059669", "#10B981", "#34D399"]} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
        {processingOAuth && (
          <Text style={styles.loadingText}>Signing in with Google...</Text>
        )}
      </LinearGradient>
    );
  }

  // If user is logged in, redirect to their dashboard
  if (isAuthenticated && user) {
    if (user.role === "parent") {
      return <Redirect href="/(dashboard)/parent" />;
    }
    if (user.role === "child") {
      if (!user.hasSetPassword) {
        return <Redirect href="/(auth)/set-password" />;
      }
      return <Redirect href="/(dashboard)/child" />;
    }
  }

  return (
    <LinearGradient
      colors={["#059669", "#10B981", "#34D399"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
      onLayout={onLayoutRootView}
    >
      {/* Decorative circles */}
      <View style={[styles.decorCircle, styles.decorCircle1]} />
      <View style={[styles.decorCircle, styles.decorCircle2]} />
      <View style={[styles.decorCircle, styles.decorCircle3]} />

      <View style={styles.content}>
        {/* Logo with animation */}
        <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
          <View style={styles.logoGlow}>
            <Image
              source={require("../assets/images/Family-Wellness-logo.png")}
              style={styles.logo}
            />
          </View>
        </Animated.View>

        {/* Welcome Text */}
        <Animated.View style={[styles.textContainer, titleAnimatedStyle]}>
          <Text style={styles.welcomeText}>Welcome to</Text>
          <Text style={styles.brandName}>KIVELO</Text>
        </Animated.View>

        {/* Tagline */}
        <Animated.View style={[styles.taglineContainer, subtitleAnimatedStyle]}>
          <Text style={styles.tagline}>
            Nurturing happy families through{'\n'}emotional wellness & connection
          </Text>
        </Animated.View>

        {/* Feature Pills */}
        <Animated.View style={[styles.featuresContainer, subtitleAnimatedStyle]}>
          <View style={styles.featurePill}>
            <Ionicons name="heart" size={14} color="#059669" />
            <Text style={styles.featureText}>Emotional Check-ins</Text>
          </View>
          <View style={styles.featurePill}>
            <Ionicons name="chatbubbles" size={14} color="#059669" />
            <Text style={styles.featureText}>AI Guide</Text>
          </View>
          <View style={styles.featurePill}>
            <Ionicons name="people" size={14} color="#059669" />
            <Text style={styles.featureText}>Family Bonding</Text>
          </View>
        </Animated.View>

        {/* Buttons */}
        <Animated.View style={[styles.buttonsContainer, buttonsAnimatedStyle]}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push("/(auth)/register")}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={["#ffffff", "#f0fdf4"]}
              style={styles.primaryButtonGradient}
            >
              <Text style={styles.primaryButtonText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={20} color="#059669" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push("/(auth)/login")}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>I already have an account</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Bottom decoration */}
        <View style={styles.bottomDecor}>
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  decorCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  decorCircle1: {
    width: 300,
    height: 300,
    top: -100,
    right: -100,
  },
  decorCircle2: {
    width: 200,
    height: 200,
    bottom: 100,
    left: -80,
  },
  decorCircle3: {
    width: 150,
    height: 150,
    top: height * 0.4,
    right: -50,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoGlow: {
    padding: 16,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  welcomeText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    letterSpacing: 1,
  },
  brandName: {
    fontSize: 48,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  taglineContainer: {
    marginBottom: 24,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '400',
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 40,
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  featureText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  buttonsContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
  },
  primaryButton: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
    gap: 10,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#059669',
  },
  secondaryButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  secondaryButtonText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    textDecorationLine: 'underline',
    textDecorationColor: 'rgba(255, 255, 255, 0.5)',
  },
  bottomDecor: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 40,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dotActive: {
    backgroundColor: '#fff',
    width: 24,
  },
});
