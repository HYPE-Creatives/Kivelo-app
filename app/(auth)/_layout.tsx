import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  TouchableOpacity,
  View,
  Platform,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen"; // 📏 responsive scaling

export default function AuthLayout() {
  const router = useRouter();
  const { login } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("dummyUser");
        if (storedUser) {
          const user = JSON.parse(storedUser);

          if (user.role) {
            login(user.role);
            if (user.role === "parent") {
              router.replace("/(dashboard)/parent/");
            } else if (user.role === "child") {
              router.replace("/(dashboard)/child/");
            }
          }
        }
      } catch (err) {
        console.error("Error restoring auth:", err);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0530ad" />
      </View>
    );
  }

  // ✅ Reusable Back Button
  const BackButton = () => (
    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
      <Ionicons name="chevron-back-outline" size={hp(2.4)} color="black" />
    </TouchableOpacity>
  );

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTransparent: true,
        headerStyle: {
          backgroundColor: "transparent",
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
        },
        headerTitle: "",
        presentation: "card",
      }}
    >
      {/* 👨‍👩‍👧 Parent Flow */}
      <Stack.Screen
        name="parent-login"
        options={{ headerLeft: () => <BackButton /> }}
      />
      <Stack.Screen
        name="parent-register"
        options={{ headerLeft: () => <BackButton /> }}
      />
      <Stack.Screen
        name="parent-forgot-password"
        options={{ headerLeft: () => <BackButton /> }}
      />
      <Stack.Screen
        name="parent-verify-email"
        options={{ headerLeft: () => <BackButton /> }}
      />
      <Stack.Screen
        name="parent-new-password"
        options={{ headerLeft: () => <BackButton /> }}
      />
      <Stack.Screen
        name="parent-veify-email"
        options={{ headerLeft: () => <BackButton /> }}
      />
      
      {/* child Flow */}
      <Stack.Screen
        name="child-login"
        options={{ headerLeft: () => <BackButton /> }}
      />
      <Stack.Screen
        name="child-register"
        options={{ headerLeft: () => <BackButton /> }}
      />
      <Stack.Screen
        name="child-forgot-password"
        options={{ headerLeft: () => <BackButton /> }}
      />
      <Stack.Screen
        name="child-verify-email"
        options={{ headerLeft: () => <BackButton /> }}
      />
      <Stack.Screen
        name="child-new-password"
        options={{ headerLeft: () => <BackButton /> }}
      />

      {/* 🏠 Parent Index */}
      <Stack.Screen name="parent-index" options={{ headerShown: false }} />

      {/* 👶 Child Index */}
      <Stack.Screen name="child-index" options={{ headerShown: false }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E9F5EC", // light tint
  },
  backButton: {
    marginLeft: wp(1.5),
    marginTop: Platform.OS === "ios" ? hp(5) : hp(3.5),
    backgroundColor: "#fff",
    borderRadius: hp(5),
    width: wp(11.5),
    height: wp(11.5),
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
  },
});
