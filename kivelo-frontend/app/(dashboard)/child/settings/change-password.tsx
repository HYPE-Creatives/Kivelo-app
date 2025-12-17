// app/(dashboard)/child/settings/change-password.tsx
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

export default function ChangePasswordScreen() {
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
      showAlert("Oops!", "Please enter your current password 🔑");
      return;
    }

    if (!newPassword.trim()) {
      showAlert("Oops!", "Please enter a new password 🔐");
      return;
    }

    if (newPassword.length < 6) {
      showAlert("Password Too Short", "Your new password needs at least 6 characters! 📏");
      return;
    }

    if (newPassword !== confirmPassword) {
      showAlert("Passwords Don't Match", "Make sure both passwords are the same! 🔄");
      return;
    }

    if (currentPassword === newPassword) {
      showAlert("Same Password", "Your new password should be different from your current one! ✨");
      return;
    }

    setIsChanging(true);
    try {
      const result = await changePassword(currentPassword, newPassword);

      if (result.success) {
        showAlert(
          "🎉 Password Changed!",
          "Your password has been updated successfully!",
          [
            {
              text: "Awesome!",
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        showAlert("Oops!", result.message || "Could not change your password. Please try again.");
      }
    } catch (error: any) {
      showAlert("Error", error.message || "Something went wrong. Please try again.");
    } finally {
      setIsChanging(false);
    }
  };

  return (
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
          <Text style={styles.title}>🔐 Change Password</Text>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>💡</Text>
          <Text style={styles.infoText}>
            Keep your account safe by using a strong password that only you know!
          </Text>
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
            <Text style={styles.hint}>Must be at least 6 characters</Text>
          </View>

          {/* Confirm New Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm New Password</Text>
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              placeholder="Type your new password again"
              placeholderTextColor="#94a3b8"
              textColor="#1e293b"
              mode="outlined"
              outlineColor="#e2e8f0"
              activeOutlineColor="#16A34A"
              style={styles.input}
              right={
                <TextInput.Icon
                  icon={showConfirmPassword ? "eye-off" : "eye"}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  color="#94a3b8"
                />
              }
            />
          </View>

          {/* Submit Button */}
          <Button
            mode="contained"
            onPress={handleChangePassword}
            loading={isChanging}
            disabled={isChanging}
            style={styles.submitButton}
            labelStyle={styles.submitButtonLabel}
            buttonColor="#16A34A"
          >
            {isChanging ? "Changing Password..." : "Change Password"}
          </Button>

          {/* Cancel Button */}
          <TouchableOpacity onPress={() => router.back()} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        {/* Security Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>🛡️ Password Tips</Text>
          <View style={styles.tip}>
            <Text style={styles.tipBullet}>•</Text>
            <Text style={styles.tipText}>Don't share your password with anyone</Text>
          </View>
          <View style={styles.tip}>
            <Text style={styles.tipBullet}>•</Text>
            <Text style={styles.tipText}>Use a mix of letters and numbers</Text>
          </View>
          <View style={styles.tip}>
            <Text style={styles.tipBullet}>•</Text>
            <Text style={styles.tipText}>Make it something easy for you to remember</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    marginTop: Platform.OS === "ios" ? 50 : 20,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
    backgroundColor: "#f0fdf4",
    borderRadius: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
  },
  infoCard: {
    flexDirection: "row",
    backgroundColor: "#f0fdf4",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    alignItems: "center",
  },
  infoIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: "#166534",
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
    marginTop: 4,
  },
  submitButton: {
    borderRadius: 12,
    paddingVertical: 6,
    marginTop: 8,
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
    backgroundColor: "#fef3c7",
    borderRadius: 12,
    padding: 16,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#92400e",
    marginBottom: 12,
  },
  tip: {
    flexDirection: "row",
    marginBottom: 8,
  },
  tipBullet: {
    fontSize: 14,
    color: "#b45309",
    marginRight: 8,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: "#92400e",
  },
});
