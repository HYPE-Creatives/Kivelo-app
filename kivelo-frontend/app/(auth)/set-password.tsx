// app/(auth)/set-password.tsx
import React, { useState, useEffect } from "react";
import { 
  View, 
  Alert, 
  StyleSheet, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  ActivityIndicator // ✅ ADD THIS IMPORT
} from "react-native";
import { TextInput, Button, Text } from "react-native-paper";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuth } from "../../context/AuthContext";

export default function SetPasswordScreen() {
  const router = useRouter();
  const { user, setChildPassword, isLoading } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSetting, setIsSetting] = useState(false);
  const params = useLocalSearchParams();

  // Check if user should be on this screen
  useEffect(() => {
    if (user && user.role === "child" && user.hasSetPassword) {
      // Child already has password set, redirect to dashboard
      router.replace("/(dashboard)/child");
    } else if (user && user.role !== "child") {
      // Not a child user, redirect to appropriate dashboard
      router.replace("/(dashboard)/parent");
    }
  }, [user, router]);

  const handleSetPassword = async () => {
    if (!password.trim() || !confirmPassword.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    if (!user?.id) {
      Alert.alert("Error", "User not found. Please login again.");
      return;
    }

    if (!user) {
      return (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#16A34A" />
          <Text style={styles.loadingText}>Loading user information...</Text>
        </View>
      );
    }
    
    setIsSetting(true);
    try {
      const result = await setChildPassword(user.id, password);

      if (result.success) {
        Alert.alert(
          "Success", 
          "Password set successfully! You can now login with your email and password.",
          [
            {
              text: "Go to Dashboard",
              onPress: () => router.replace("/(dashboard)/child")
            }
          ]
        );
      } else {
        Alert.alert("Error", result.message || "Failed to set password");
      }
    } catch (error: any) {
      console.error("Set password error:", error);
      Alert.alert("Error", "Failed to set password. Please try again.");
    } finally {
      setIsSetting(false);
    }
  };

  const handleCancel = () => {
    router.replace("/(auth)/login");
  };

  // Show loading if still checking auth state
  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#16A34A" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Don't show the form if user shouldn't be here
  if (user && (user.role !== "child" || user.hasSetPassword)) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#16A34A" />
        <Text style={styles.loadingText}>Redirecting...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Set Your Password</Text>
          <Text style={styles.subtitle}>
            Welcome {user?.name}! Create a secure password for your account.
          </Text>
        </View>

        <View style={styles.formContainer}>
          <TextInput
            label="New Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            style={styles.input}
            mode="outlined"
            left={<TextInput.Icon icon="lock" />}
            right={
              <TextInput.Icon 
                icon={showPassword ? "eye-off" : "eye"} 
                onPress={() => setShowPassword(!showPassword)}
              />
            }
            placeholder="Enter your new password"
            autoComplete="password-new"
          />

          <TextInput
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showPassword}
            style={styles.input}
            mode="outlined"
            left={<TextInput.Icon icon="lock-check" />}
            placeholder="Re-enter your password"
            autoComplete="password-new"
          />

          <Text style={styles.passwordHint}>
            🔒 Password must be at least 6 characters long
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancel}
              disabled={isSetting}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <Button
              mode="contained"
              onPress={handleSetPassword}
              loading={isSetting}
              disabled={isSetting || !password || !confirmPassword}
              style={[styles.button, styles.primaryButton]}
              contentStyle={styles.buttonContent}
            >
              {isSetting ? "Setting Password..." : "Set Password"}
            </Button>
          </View>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Why set a password?</Text>
          <Text style={styles.infoText}>
            • Secure your account with a personal password{"\n"}
            • Login faster next time with just your email{"\n"}
            • Keep your account safe and private
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
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
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
    color: "#2E8B57",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
  formContainer: {
    backgroundColor: "white",
    padding: 24,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  input: {
    marginBottom: 16,
    backgroundColor: "white",
  },
  passwordHint: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
    fontStyle: "italic",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flex: 1,
  },
  cancelButton: {
    backgroundColor: "#f1f5f9",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  primaryButton: {
    backgroundColor: "#2E8B57",
  },
  cancelButtonText: {
    color: "#475569",
    fontWeight: "600",
    fontSize: 16,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  infoContainer: {
    backgroundColor: "#e3f2fd",
    padding: 16,
    borderRadius: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1976d2",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#1565c0",
    lineHeight: 20,
  },
});