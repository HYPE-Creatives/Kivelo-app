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
} from "react-native";
import { useAuth } from "../../context/AuthContext";

export default function AuthLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { role, user, isLoading } = useAuth();

  // Check if we're currently on the set-password route
  const isSetPasswordRoute = segments[segments.length - 1] === "set-password";

  // Redirect logic - don't redirect if we're on the set-password page
  useEffect(() => {
    if (!isLoading && user && !isSetPasswordRoute) {
      if (role === "parent") {
        router.replace("/(dashboard)/parent/home");
      } else if (role === "child") {
        // Only redirect child to home if they already have a password set
        if (user.hasSetPassword) {
          router.replace("/(dashboard)/child/home");
        }
        // If child doesn't have password set, they stay on auth pages to set it
      }
    }
  }, [isLoading, role, user, router, isSetPasswordRoute]);

  // Show loading spinner while auth state is restoring
  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#16A34A" />
      </View>
    );
  }

  // If not logged in, show auth screens (login/register/etc.)
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={60}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <Image
          source={require("../../assets/images/Family-Wellness-logo.png")}
          style={styles.logo}
        />

        {/* Render child routes (login/register/etc.) */}
        <View style={styles.slotContainer}>
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
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  logo: {
    width: 180,
    height: 180,
    marginBottom: 24,
    resizeMode: "contain",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.5,
    elevation: 5,
  },
  slotContainer: {
    width: "100%",
  },
});