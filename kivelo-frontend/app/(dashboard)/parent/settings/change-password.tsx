// app/(dashboard)/parent/settings/change-password.tsx
import React, { useState } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { TextInput, Button, Text } from "react-native-paper";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { showAlert } from "@/utils/showAlert";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ParentChangePasswordScreen() {
  const router = useRouter();
  const { changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChanging, setIsChanging] = useState(false);

  const handleChangePassword = async () => {
    // Validation
    if (!currentPassword.trim()) {
      showAlert("Missing Information", "Please enter your current password.");
      return;
    }

    if (!newPassword.trim()) {
      showAlert("Missing Information", "Please enter a new password.");
      return;
    }

    if (newPassword.length < 8) {
      showAlert(
        "Password Too Short",
        "Your new password must be at least 8 characters long for security."
      );
      return;
    }

    // Password strength check
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumbers = /\d/.test(newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      showAlert(
        "Weak Password",
        "Password must contain at least one uppercase letter, one lowercase letter, and one number."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      showAlert("Passwords Don't Match", "Please make sure both passwords match.");
      return;
    }

    if (currentPassword === newPassword) {
      showAlert(
        "Same Password",
        "Your new password must be different from your current password."
      );
      return;
    }

    setIsChanging(true);
    try {
      const result = await changePassword(currentPassword, newPassword);

      if (result.success) {
        showAlert(
          "Password Updated",
          "Your password has been changed successfully.",
          [
            {
              text: "OK",
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        showAlert(
          "Password Change Failed",
          result.message || "Could not change your password. Please verify your current password and try again."
        );
      }
    } catch (error: any) {
      showAlert("Error", error.message || "Something went wrong. Please try again.");
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#16A34A" />
            </TouchableOpacity>
            <View>
              <Text style={styles.title}>Change Password</Text>
              <Text style={styles.subtitle}>Update your account security</Text>
            </View>
          </View>

          {/* Security Notice */}
          <View style={styles.securityCard}>
            <Ionicons name="shield-checkmark" size={28} color="#16A34A" />
            <View style={styles.securityTextContainer}>
              <Text style={styles.securityTitle}>Account Security</Text>
              <Text style={styles.securityText}>
                For your protection, you'll need to verify your current password before setting a new one.
              </Text>
            </View>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Current Password */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Current Password</Text>
              <TextInput
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry={!showCurrentPassword}
                placeholder="Enter your current password"
                placeholderTextColor="#94a3b8"
                textColor="#1e293b"
                mode="outlined"
                outlineColor="#e2e8f0"
                activeOutlineColor="#16A34A"
                style={styles.input}
                right={
                  <TextInput.Icon
                    icon={showCurrentPassword ? "eye-off" : "eye"}
                    onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                    color="#94a3b8"
                  />
                }
              />
            </View>

            {/* New Password */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>New Password</Text>
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNewPassword}
                placeholder="Enter your new password"
                placeholderTextColor="#94a3b8"
                textColor="#1e293b"
                mode="outlined"
                outlineColor="#e2e8f0"
                activeOutlineColor="#16A34A"
                style={styles.input}
                right={
                  <TextInput.Icon
                    icon={showNewPassword ? "eye-off" : "eye"}
                    onPress={() => setShowNewPassword(!showNewPassword)}
                    color="#94a3b8"
                  />
                }
              />
              <Text style={styles.hint}>
                At least 8 characters with uppercase, lowercase, and numbers
              </Text>
            </View>

            {/* Password Strength Indicator */}
            {newPassword.length > 0 && (
              <View style={styles.strengthContainer}>
                <Text style={styles.strengthLabel}>Password Strength:</Text>
                <View style={styles.strengthBars}>
                  <View
                    style={[
                      styles.strengthBar,
                      newPassword.length >= 8 && styles.strengthBarActive,
                    ]}
                  />
                  <View
                    style={[
                      styles.strengthBar,
                      /[A-Z]/.test(newPassword) &&
                        /[a-z]/.test(newPassword) &&
                        styles.strengthBarActive,
                    ]}
                  />
                  <View
                    style={[
                      styles.strengthBar,
                      /\d/.test(newPassword) && styles.strengthBarActive,
                    ]}
                  />
                  <View
                    style={[
                      styles.strengthBar,
                      /[!@#$%^&*(),.?":{}|<>]/.test(newPassword) &&
                        styles.strengthBarActive,
                    ]}
                  />
                </View>
                <Text style={styles.strengthText}>
                  {getPasswordStrength(newPassword)}
                </Text>
              </View>
            )}

            {/* Confirm New Password */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirm New Password</Text>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                placeholder="Re-enter your new password"
                placeholderTextColor="#94a3b8"
                textColor="#1e293b"
                mode="outlined"
                outlineColor={
                  confirmPassword && confirmPassword !== newPassword
                    ? "#ef4444"
                    : "#e2e8f0"
                }
                activeOutlineColor={
                  confirmPassword && confirmPassword !== newPassword
                    ? "#ef4444"
                    : "#16A34A"
                }
                style={styles.input}
                right={
                  <TextInput.Icon
                    icon={showConfirmPassword ? "eye-off" : "eye"}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    color="#94a3b8"
                  />
                }
              />
              {confirmPassword && confirmPassword !== newPassword && (
                <Text style={styles.errorText}>Passwords do not match</Text>
              )}
              {confirmPassword && confirmPassword === newPassword && newPassword && (
                <Text style={styles.successText}>✓ Passwords match</Text>
              )}
            </View>

            {/* Submit Button */}
            <Button
              mode="contained"
              onPress={handleChangePassword}
              loading={isChanging}
              disabled={isChanging || !currentPassword || !newPassword || !confirmPassword}
              style={[
                styles.submitButton,
                (!currentPassword || !newPassword || !confirmPassword) &&
                  styles.submitButtonDisabled,
              ]}
              labelStyle={styles.submitButtonLabel}
              buttonColor="#16A34A"
            >
              {isChanging ? "Updating Password..." : "Update Password"}
            </Button>

            {/* Cancel Button */}
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          {/* Security Tips */}
          <View style={styles.tipsCard}>
            <View style={styles.tipsHeader}>
              <Ionicons name="bulb" size={20} color="#d97706" />
              <Text style={styles.tipsTitle}>Security Tips</Text>
            </View>
            <View style={styles.tipsList}>
              <View style={styles.tip}>
                <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
                <Text style={styles.tipText}>
                  Use a unique password not used elsewhere
                </Text>
              </View>
              <View style={styles.tip}>
                <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
                <Text style={styles.tipText}>
                  Include special characters for extra security
                </Text>
              </View>
              <View style={styles.tip}>
                <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
                <Text style={styles.tipText}>
                  Avoid personal information like birthdays
                </Text>
              </View>
              <View style={styles.tip}>
                <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
                <Text style={styles.tipText}>
                  Consider using a password manager
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Helper function to calculate password strength
function getPasswordStrength(password: string): string {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;

  switch (strength) {
    case 0:
    case 1:
      return "Weak";
    case 2:
      return "Fair";
    case 3:
      return "Good";
    case 4:
      return "Strong";
    default:
      return "";
  }
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  backButton: {
    padding: 10,
    marginRight: 16,
    backgroundColor: "#f0fdf4",
    borderRadius: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
  },
  subtitle: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 2,
  },
  securityCard: {
    flexDirection: "row",
    backgroundColor: "#f0fdf4",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  securityTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#166534",
    marginBottom: 4,
  },
  securityText: {
    fontSize: 14,
    color: "#15803d",
    lineHeight: 20,
  },
  form: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#fff",
  },
  hint: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 6,
  },
  errorText: {
    fontSize: 12,
    color: "#ef4444",
    marginTop: 6,
  },
  successText: {
    fontSize: 12,
    color: "#16A34A",
    marginTop: 6,
  },
  strengthContainer: {
    marginBottom: 20,
  },
  strengthLabel: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 8,
  },
  strengthBars: {
    flexDirection: "row",
    gap: 4,
    marginBottom: 4,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    backgroundColor: "#e2e8f0",
    borderRadius: 2,
  },
  strengthBarActive: {
    backgroundColor: "#16A34A",
  },
  strengthText: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
  },
  submitButton: {
    borderRadius: 12,
    paddingVertical: 6,
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonLabel: {
    fontSize: 16,
    fontWeight: "bold",
  },
  cancelButton: {
    alignItems: "center",
    paddingVertical: 16,
  },
  cancelText: {
    fontSize: 16,
    color: "#64748b",
  },
  tipsCard: {
    backgroundColor: "#fffbeb",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#fde68a",
  },
  tipsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#92400e",
    marginLeft: 8,
  },
  tipsList: {
    gap: 10,
  },
  tip: {
    flexDirection: "row",
    alignItems: "center",
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: "#78350f",
    marginLeft: 10,
  },
});
