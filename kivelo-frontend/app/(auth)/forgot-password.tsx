import {
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { TextInput as PaperTextInput } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  FadeInDown,
} from "react-native-reanimated";
import { showAlert } from '@/utils/showAlert';
import { router } from "expo-router";
import { useState, useEffect } from "react";

// API URLs with fallback
const API_URLS = [
  "http://localhost:5000/api/v1",
  "https://family-wellness.onrender.com/api/v1",
];

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Animation values
  const iconScale = useSharedValue(0);
  const cardTranslateY = useSharedValue(30);
  const cardOpacity = useSharedValue(0);
  const footerOpacity = useSharedValue(0);

  useEffect(() => {
    // Staggered animations
    iconScale.value = withDelay(100, withSpring(1, { damping: 12, stiffness: 100 }));
    cardTranslateY.value = withDelay(200, withSpring(0, { damping: 15, stiffness: 90 }));
    cardOpacity.value = withDelay(200, withTiming(1, { duration: 400 }));
    footerOpacity.value = withDelay(400, withTiming(1, { duration: 400 }));
  }, []);

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: cardTranslateY.value }],
    opacity: cardOpacity.value,
  }));

  const footerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: footerOpacity.value,
  }));

  const handleReset = async () => {
    if (!email) {
      showAlert("Oops!", "Please enter your email address");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showAlert("Invalid Email", "Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      // Try each API URL until one works
      let lastError: Error | null = null;
      for (const baseUrl of API_URLS) {
        try {
          const response = await fetch(`${baseUrl}/auth/forgot-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email.toLowerCase().trim() }),
          });

          const data = await response.json();

          if (response.ok && data.success) {
            setEmailSent(true);
            showAlert(
              "Check Your Email! 📧",
              data.message || `If an account exists for ${email}, you'll receive a password reset code shortly.`
            );
            return; // Success - exit the function
          } else {
            // Handle specific error cases
            if (data.needsVerification) {
              showAlert(
                "Email Not Verified",
                "Please verify your email address before resetting your password."
              );
              return;
            }
            throw new Error(data.message || "Failed to send reset email");
          }
        } catch (fetchError: any) {
          lastError = fetchError;
          // Continue to next URL if this one fails
          continue;
        }
      }

      // If we get here, all URLs failed
      throw lastError || new Error("Failed to connect to server");
    } catch (err: any) {
      showAlert("Error", err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setEmail("");
    setEmailSent(false);
    router.push("/(auth)/login");
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Icon Header */}
        <Animated.View style={[styles.iconContainer, iconAnimatedStyle]}>
          <LinearGradient
            colors={['#16A34A', '#22C55E']}
            style={styles.iconGradient}
          >
            <Ionicons 
              name={emailSent ? "checkmark-circle" : "lock-closed"} 
              size={40} 
              color="#fff" 
            />
          </LinearGradient>
        </Animated.View>

        {/* Title */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)}>
          <Text style={styles.title}>
            {emailSent ? "Email Sent!" : "Forgot Password?"}
          </Text>
          <Text style={styles.subtitle}>
            {emailSent 
              ? "Check your inbox and follow the instructions to reset your password."
              : "No worries! Enter your email and we'll send you a reset link."
            }
          </Text>
        </Animated.View>

        {/* Form Card */}
        <Animated.View style={[styles.card, cardAnimatedStyle]}>
          {!emailSent ? (
            <>
              <PaperTextInput
                label="Email Address"
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                autoCapitalize="none"
                keyboardType="email-address"
                mode="outlined"
                outlineColor="#e2e8f0"
                activeOutlineColor="#16A34A"
                textColor="#1e293b"
                placeholderTextColor="#94a3b8"
                left={<PaperTextInput.Icon icon="email" color="#94a3b8" />}
                dense
              />

              <TouchableOpacity 
                style={[styles.submitButton, (!email || loading) && styles.submitButtonDisabled]}
                onPress={handleReset}
                disabled={loading || !email}
              >
                <LinearGradient
                  colors={(!email || loading) ? ['#94a3b8', '#94a3b8'] : ['#16A34A', '#22C55E']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitGradient}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="send" size={18} color="#fff" />
                      <Text style={styles.submitText}>Send Reset Link</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.successMessage}>
                <View style={styles.successIconContainer}>
                  <Ionicons name="mail-open" size={48} color="#16A34A" />
                </View>
                <Text style={styles.successText}>
                  We've sent a password reset code to:
                </Text>
                <Text style={styles.emailText}>{email}</Text>
              </View>

              {/* Primary action - Enter Reset Code */}
              <TouchableOpacity 
                style={styles.submitButton}
                onPress={() => {
                  router.push({
                    pathname: "/(auth)/reset-password",
                    params: { email }
                  });
                }}
              >
                <LinearGradient
                  colors={['#16A34A', '#22C55E']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitGradient}
                >
                  <Ionicons name="key" size={18} color="#fff" />
                  <Text style={styles.submitText}>Enter Reset Code</Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Secondary action - Try Different Email */}
              <TouchableOpacity 
                style={styles.secondaryButton}
                onPress={() => {
                  setEmailSent(false);
                  setEmail("");
                }}
              >
                <Ionicons name="refresh" size={18} color="#16A34A" />
                <Text style={styles.secondaryButtonText}>Try Different Email</Text>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>

        {/* Footer */}
        <Animated.View style={[styles.footer, footerAnimatedStyle]}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBackToLogin}
          >
            <Ionicons name="arrow-back" size={18} color="#16A34A" />
            <Text style={styles.backButtonText}>Back to Login</Text>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  input: {
    backgroundColor: '#fff',
    marginBottom: 16,
    fontSize: 15,
  },
  submitButton: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: 12,
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#16A34A',
    backgroundColor: 'transparent',
  },
  secondaryButtonText: {
    color: '#16A34A',
    fontSize: 16,
    fontWeight: '600',
  },
  successMessage: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 8,
  },
  emailText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#16A34A',
    marginBottom: 24,
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  backButtonText: {
    color: '#16A34A',
    fontSize: 15,
    fontWeight: '500',
  },
});

