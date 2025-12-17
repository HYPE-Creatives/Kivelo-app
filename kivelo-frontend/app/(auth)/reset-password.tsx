import {
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TextInput,
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
import { router, useLocalSearchParams } from "expo-router";
import { useState, useEffect, useRef } from "react";

// API URLs with fallback
const API_URLS = [
  "http://localhost:5000/api/v1",
  "https://family-wellness.onrender.com/api/v1",
];

const CODE_LENGTH = 6;

export default function ResetPassword() {
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(params.email || "");
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'code' | 'password' | 'success'>('code');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Refs for OTP inputs
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Animation values
  const iconScale = useSharedValue(0);
  const cardTranslateY = useSharedValue(30);
  const cardOpacity = useSharedValue(0);
  const footerOpacity = useSharedValue(0);
  const successCheckScale = useSharedValue(0);
  const successRingScale = useSharedValue(0);
  const confettiOpacity = useSharedValue(0);

  // Reset and play animations when step changes
  useEffect(() => {
    iconScale.value = 0;
    cardTranslateY.value = 30;
    cardOpacity.value = 0;
    footerOpacity.value = 0;
    
    iconScale.value = withDelay(100, withSpring(1, { damping: 12, stiffness: 100 }));
    cardTranslateY.value = withDelay(200, withSpring(0, { damping: 15, stiffness: 90 }));
    cardOpacity.value = withDelay(200, withTiming(1, { duration: 400 }));
    footerOpacity.value = withDelay(400, withTiming(1, { duration: 400 }));
    
    // Success step animations
    if (step === 'success') {
      successCheckScale.value = withDelay(300, withSpring(1, { damping: 8, stiffness: 100 }));
      successRingScale.value = withDelay(200, withSpring(1.2, { damping: 15, stiffness: 80 }));
      confettiOpacity.value = withDelay(500, withTiming(1, { duration: 600 }));
    } else {
      successCheckScale.value = 0;
      successRingScale.value = 0;
      confettiOpacity.value = 0;
    }
  }, [step]);

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

  const successCheckStyle = useAnimatedStyle(() => ({
    transform: [{ scale: successCheckScale.value }],
  }));

  const successRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: successRingScale.value }],
    opacity: successRingScale.value > 0 ? 0.3 : 0,
  }));

  const confettiStyle = useAnimatedStyle(() => ({
    opacity: confettiOpacity.value,
  }));

  // Get the full code as string
  const getFullCode = () => code.join("");

  // Handle individual digit input
  const handleCodeChange = (text: string, index: number) => {
    // Handle paste (text longer than 1 character)
    if (text.length > 1) {
      const pastedCode = text.replace(/[^0-9]/g, '').slice(0, CODE_LENGTH);
      const newCode = [...code];
      
      for (let i = 0; i < pastedCode.length; i++) {
        if (index + i < CODE_LENGTH) {
          newCode[index + i] = pastedCode[i];
        }
      }
      
      setCode(newCode);
      
      // Focus the next empty input or the last one
      const nextIndex = Math.min(index + pastedCode.length, CODE_LENGTH - 1);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    // Handle single digit input
    const digit = text.replace(/[^0-9]/g, '');
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);

    // Auto-focus next input
    if (digit && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace
  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const newCode = [...code];
      newCode[index - 1] = "";
      setCode(newCode);
    }
  };

  // Focus first input on mount
  useEffect(() => {
    if (step === 'code') {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 500);
    }
  }, [step]);

  const handleVerifyCode = async () => {
    if (!email.trim()) {
      showAlert("Email Required", "Please enter your email address");
      return;
    }

    const fullCode = getFullCode();
    if (fullCode.length !== CODE_LENGTH) {
      showAlert("Invalid Code", "Please enter the complete 6-digit code");
      return;
    }

    setLoading(true);
    try {
      let lastError: Error | null = null;
      for (const baseUrl of API_URLS) {
        try {
          const response = await fetch(`${baseUrl}/auth/verify-reset-token`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              email: email.toLowerCase().trim(),
              resetToken: fullCode
            }),
          });

          const data = await response.json();

          if (response.ok && data.success) {
            setStep('password');
            return;
          } else {
            throw new Error(data.message || "Invalid or expired code");
          }
        } catch (fetchError: any) {
          lastError = fetchError;
          continue;
        }
      }
      throw lastError || new Error("Failed to connect to server");
    } catch (err: any) {
      showAlert("Error", err.message || "Invalid or expired code");
      // Clear code on error
      setCode(Array(CODE_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      showAlert("Weak Password", "Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      showAlert("Password Mismatch", "Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      let lastError: Error | null = null;
      for (const baseUrl of API_URLS) {
        try {
          const response = await fetch(`${baseUrl}/auth/reset-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              email: email.toLowerCase().trim(),
              resetToken: getFullCode(),
              newPassword: newPassword
            }),
          });

          const data = await response.json();

          if (response.ok && data.success) {
            setStep('success');
            return;
          } else {
            throw new Error(data.message || "Failed to reset password");
          }
        } catch (fetchError: any) {
          lastError = fetchError;
          continue;
        }
      }
      throw lastError || new Error("Failed to connect to server");
    } catch (err: any) {
      showAlert("Error", err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Icon Header */}
        <Animated.View style={[styles.iconContainer, iconAnimatedStyle]}>
          {step === 'success' ? (
            <View style={styles.successIconWrapper}>
              <Animated.View style={[styles.successRing, successRingStyle]} />
              <Animated.View style={[styles.successCheckContainer, successCheckStyle]}>
                <LinearGradient
                  colors={['#16A34A', '#22C55E']}
                  style={styles.iconGradient}
                >
                  <Ionicons name="checkmark" size={44} color="#fff" />
                </LinearGradient>
              </Animated.View>
            </View>
          ) : (
            <LinearGradient
              colors={['#16A34A', '#22C55E']}
              style={styles.iconGradient}
            >
              <Ionicons 
                name={step === 'password' ? "key" : "shield-checkmark"} 
                size={40} 
                color="#fff" 
              />
            </LinearGradient>
          )}
        </Animated.View>

        {/* Title */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)}>
          <Text style={styles.title}>
            {step === 'success' 
              ? "Password Reset! 🎉" 
              : step === 'password' 
                ? "Create New Password" 
                : "Enter Reset Code"
            }
          </Text>
          <Text style={styles.subtitle}>
            {step === 'success'
              ? "Your password has been successfully reset."
              : step === 'password' 
                ? "Create a strong password for your account."
                : "Enter the 6-digit code we sent to your email."
            }
          </Text>
        </Animated.View>

        {/* Form Card */}
        <Animated.View style={[styles.card, cardAnimatedStyle]}>
          {step === 'success' ? (
            <>
              {/* Success Confetti Decoration */}
              <Animated.View style={[styles.confettiContainer, confettiStyle]}>
                <View style={styles.confettiRow}>
                  <Text style={styles.confetti}>🎊</Text>
                  <Text style={styles.confetti}>✨</Text>
                  <Text style={styles.confetti}>🎊</Text>
                </View>
              </Animated.View>

              {/* Success Message */}
              <View style={styles.successContent}>
                <View style={styles.successMessageBox}>
                  <Ionicons name="shield-checkmark" size={24} color="#16A34A" />
                  <Text style={styles.successMessageTitle}>Account Secured</Text>
                </View>
                <Text style={styles.successMessageText}>
                  Your new password is now active. You can use it to log in to your account on any device.
                </Text>

                {/* Security Tips */}
                <View style={styles.securityTips}>
                  <View style={styles.tipItem}>
                    <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
                    <Text style={styles.tipText}>Keep your password private</Text>
                  </View>
                  <View style={styles.tipItem}>
                    <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
                    <Text style={styles.tipText}>Use a unique password for each account</Text>
                  </View>
                  <View style={styles.tipItem}>
                    <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
                    <Text style={styles.tipText}>Enable two-factor authentication</Text>
                  </View>
                </View>
              </View>

              {/* Login Button */}
              <TouchableOpacity 
                style={styles.submitButton}
                onPress={() => router.replace("/(auth)/login")}
              >
                <LinearGradient
                  colors={['#16A34A', '#22C55E']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitGradient}
                >
                  <Ionicons name="log-in" size={20} color="#fff" />
                  <Text style={styles.submitText}>Continue to Login</Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          ) : step === 'code' ? (
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

              {/* OTP Code Input Boxes */}
              <Text style={styles.codeLabel}>Verification Code</Text>
              <View style={styles.otpContainer}>
                {Array(CODE_LENGTH).fill(0).map((_, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => { inputRefs.current[index] = ref; }}
                    style={[
                      styles.otpInput,
                      code[index] ? styles.otpInputFilled : null,
                    ]}
                    value={code[index]}
                    onChangeText={(text) => handleCodeChange(text, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    keyboardType="number-pad"
                    maxLength={index === 0 ? CODE_LENGTH : 1}
                    selectTextOnFocus
                    textContentType="oneTimeCode"
                    autoComplete="one-time-code"
                  />
                ))}
              </View>

              <TouchableOpacity 
                style={[styles.submitButton, (!email || getFullCode().length !== CODE_LENGTH || loading) && styles.submitButtonDisabled]}
                onPress={handleVerifyCode}
                disabled={loading || !email || getFullCode().length !== CODE_LENGTH}
              >
                <LinearGradient
                  colors={(!email || getFullCode().length !== CODE_LENGTH || loading) ? ['#94a3b8', '#94a3b8'] : ['#16A34A', '#22C55E']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitGradient}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={18} color="#fff" />
                      <Text style={styles.submitText}>Verify Code</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <PaperTextInput
                label="New Password"
                value={newPassword}
                onChangeText={setNewPassword}
                style={styles.input}
                secureTextEntry={!showPassword}
                mode="outlined"
                outlineColor="#e2e8f0"
                activeOutlineColor="#16A34A"
                textColor="#1e293b"
                placeholderTextColor="#94a3b8"
                left={<PaperTextInput.Icon icon="lock" color="#94a3b8" />}
                right={
                  <PaperTextInput.Icon 
                    icon={showPassword ? "eye-off" : "eye"} 
                    onPress={() => setShowPassword(!showPassword)}
                    color="#94a3b8"
                  />
                }
                dense
              />

              <PaperTextInput
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                style={styles.input}
                secureTextEntry={!showConfirmPassword}
                mode="outlined"
                outlineColor="#e2e8f0"
                activeOutlineColor="#16A34A"
                textColor="#1e293b"
                placeholderTextColor="#94a3b8"
                left={<PaperTextInput.Icon icon="lock-check" color="#94a3b8" />}
                right={
                  <PaperTextInput.Icon 
                    icon={showConfirmPassword ? "eye-off" : "eye"} 
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    color="#94a3b8"
                  />
                }
                dense
              />

              <TouchableOpacity 
                style={[styles.submitButton, (!newPassword || !confirmPassword || loading) && styles.submitButtonDisabled]}
                onPress={handleResetPassword}
                disabled={loading || !newPassword || !confirmPassword}
              >
                <LinearGradient
                  colors={(!newPassword || !confirmPassword || loading) ? ['#94a3b8', '#94a3b8'] : ['#16A34A', '#22C55E']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitGradient}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="key" size={18} color="#fff" />
                      <Text style={styles.submitText}>Reset Password</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>

        {/* Footer - Hide on success */}
        {step !== 'success' && (
          <Animated.View style={[styles.footer, footerAnimatedStyle]}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => {
                if (step === 'password') {
                  setStep('code');
                } else {
                  router.push("/(auth)/login");
                }
              }}
            >
              <Ionicons name="arrow-back" size={18} color="#16A34A" />
              <Text style={styles.backButtonText}>
                {step === 'password' ? 'Back to Code Entry' : 'Back to Login'}
              </Text>
            </TouchableOpacity>

            {step === 'code' && (
              <TouchableOpacity 
                style={styles.resendButton}
                onPress={() => router.push("/(auth)/forgot-password")}
              >
                <Text style={styles.resendText}>Didn't receive code? </Text>
                <Text style={styles.resendLink}>Resend</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        )}
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
    paddingHorizontal: 24,
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
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  codeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
    marginBottom: 12,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 8,
  },
  otpInput: {
    flex: 1,
    height: 56,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    color: '#1e293b',
    backgroundColor: '#f8fafc',
  },
  otpInputFilled: {
    borderColor: '#16A34A',
    backgroundColor: '#ECFDF5',
  },
  submitButton: {
    marginTop: 8,
    borderRadius: 14,
    overflow: 'hidden',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    marginTop: 30,
    alignItems: 'center',
    gap: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  backButtonText: {
    color: '#16A34A',
    fontSize: 15,
    fontWeight: '500',
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resendText: {
    color: '#64748b',
    fontSize: 14,
  },
  resendLink: {
    color: '#16A34A',
    fontSize: 14,
    fontWeight: '600',
  },
  // Success Step Styles
  successIconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#16A34A',
  },
  successCheckContainer: {
    zIndex: 1,
  },
  confettiContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  confettiRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  confetti: {
    fontSize: 28,
  },
  successContent: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  successMessageBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 10,
    marginBottom: 16,
  },
  successMessageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#16A34A',
  },
  successMessageText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  securityTips: {
    width: '100%',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  tipText: {
    fontSize: 13,
    color: '#475569',
    flex: 1,
  },
});
