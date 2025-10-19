// app/(auth)/_layout.tsx
import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import {
  View,
  Image,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Text
} from "react-native";
import { useAuth } from "../../context/AuthContext";

export default function AuthLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { user, isLoading } = useAuth();

  const currentRoute = segments[segments.length - 1];
  const isSetPasswordRoute = currentRoute === "set-password";
  const isLoginRoute = currentRoute === "login";
  const isRegisterRoute = currentRoute === "register";
  const shouldShowLogo = isLoginRoute || isRegisterRoute;

  // SIMPLIFIED REDIRECT LOGIC - NO COMPLEX STATE MANAGEMENT
  useEffect(() => {
    if (isLoading) return;

    // If no user, they should stay on auth screens
    if (!user) return;

    // If we have a user, handle redirects
    if (user.role === "parent") {
      console.log("✅ Redirecting parent to dashboard");
      router.replace("/(dashboard)/parent");
      return;
    }

    if (user.role === "child") {
      if (user.hasSetPassword) {
        console.log("✅ Redirecting child to dashboard (password is set)");
        router.replace("/(dashboard)/child");
      } else if (!isSetPasswordRoute) {
        console.log("🔐 Redirecting child to set password page");
        router.replace("/(auth)/set-password");
      }
      // If child is on set-password route and hasn't set password, stay there
      return;
    }
  }, [isLoading, user, isSetPasswordRoute]); // Minimal dependencies

  // Show loading spinner during initial auth check
  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#16A34A" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // If user exists and shouldn't be in auth flow, show brief redirect screen
  if (user && !isSetPasswordRoute && user.role === "child" && !user.hasSetPassword === false) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#16A34A" />
        <Text style={styles.loadingText}>Redirecting...</Text>
      </View>
    );
  }

  // Show auth screens for:
  // - Not logged in users
  // - Children who need to set password (on set-password route)
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          !shouldShowLogo && styles.scrollContainerNoLogo
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo Section - Only show on login/register pages */}
        {shouldShowLogo && (
          <View style={styles.logoContainer}>
            <Image
              source={require("../../assets/images/Family-Wellness-logo.png")}
              style={styles.logo}
            />
            <Text style={styles.appTitle}>Family Wellness</Text>
            <Text style={styles.appSubtitle}>Healthy Families, Happy Lives</Text>
          </View>
        )}

        {/* Render child routes (login/register/set-password) */}
        <View style={[
          styles.slotContainer,
          isSetPasswordRoute && styles.setPasswordContainer
        ]}>
          <Slot />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ECFDF5",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: "#16A34A",
    fontFamily: "Inter-Regular",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  scrollContainerNoLogo: {
    justifyContent: "flex-start",
    paddingTop: 60,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  logo: {
    width: 150,
    height: 150,
    resizeMode: "contain",
  },
  appTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#16A34A",
    marginTop: 16,
    textAlign: "center",
  },
  appSubtitle: {
    fontSize: 16,
    color: "#64748B",
    marginTop: 4,
    textAlign: "center",
  },
  slotContainer: {
    width: "100%",
    maxWidth: 400,
  },
  setPasswordContainer: {
    maxWidth: 450,
  },
});