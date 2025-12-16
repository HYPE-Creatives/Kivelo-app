import React, { useState, useEffect, useRef } from "react";
import {
  View,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Dimensions,
  TextInput as RNTextInput,
  StyleSheet,
  Modal,
  Pressable,
} from "react-native";
import { showAlert } from "@/utils/showAlert";
import { Text } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../../context/AuthContext";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  withRepeat,
  interpolate,
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInUp,
  FadeOut,
} from "react-native-reanimated";

const { width, height } = Dimensions.get("window");
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Beautiful Date Picker Component
const DatePickerModal = ({
  visible,
  onClose,
  onSelect,
  selectedDate,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (date: string) => void;
  selectedDate: string;
}) => {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  // Parse existing date or use defaults
  const parsedDate = selectedDate ? selectedDate.split("-") : [];
  const [selectedYear, setSelectedYear] = useState(
    parsedDate[0] ? parseInt(parsedDate[0]) : currentYear - 25
  );
  const [selectedMonth, setSelectedMonth] = useState(
    parsedDate[1] ? parseInt(parsedDate[1]) - 1 : 0
  );
  const [selectedDay, setSelectedDay] = useState(
    parsedDate[2] ? parseInt(parsedDate[2]) : 1
  );
  const [activeTab, setActiveTab] = useState<"year" | "month" | "day">("year");

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const days = Array.from(
    { length: getDaysInMonth(selectedYear, selectedMonth) },
    (_, i) => i + 1
  );

  const handleConfirm = () => {
    const month = String(selectedMonth + 1).padStart(2, "0");
    const day = String(selectedDay).padStart(2, "0");
    onSelect(`${selectedYear}-${month}-${day}`);
    onClose();
  };

  const scrollViewRef = useRef<ScrollView>(null);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={datePickerStyles.overlay}>
        <Pressable style={datePickerStyles.backdrop} onPress={onClose} />
        <Animated.View
          entering={FadeInDown.duration(300).springify()}
          style={datePickerStyles.container}
        >
          {/* Header */}
          <LinearGradient
            colors={["#059669", "#10B981"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={datePickerStyles.header}
          >
            <Text style={datePickerStyles.headerTitle}>Select Date of Birth</Text>
            <Text style={datePickerStyles.headerDate}>
              {months[selectedMonth]} {selectedDay}, {selectedYear}
            </Text>
          </LinearGradient>

          {/* Tab Selector */}
          <View style={datePickerStyles.tabContainer}>
            {(["year", "month", "day"] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[
                  datePickerStyles.tab,
                  activeTab === tab && datePickerStyles.tabActive,
                ]}
              >
                <Text
                  style={[
                    datePickerStyles.tabText,
                    activeTab === tab && datePickerStyles.tabTextActive,
                  ]}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Picker Content */}
          <View style={datePickerStyles.pickerContent}>
            {activeTab === "year" && (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={datePickerStyles.scrollContent}
              >
                <View style={datePickerStyles.optionsGrid}>
                  {years.map((year) => (
                    <TouchableOpacity
                      key={year}
                      onPress={() => {
                        setSelectedYear(year);
                        setActiveTab("month");
                      }}
                      style={[
                        datePickerStyles.optionButton,
                        selectedYear === year && datePickerStyles.optionButtonActive,
                      ]}
                    >
                      <Text
                        style={[
                          datePickerStyles.optionText,
                          selectedYear === year && datePickerStyles.optionTextActive,
                        ]}
                      >
                        {year}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            )}

            {activeTab === "month" && (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={datePickerStyles.scrollContent}
              >
                <View style={datePickerStyles.optionsGrid}>
                  {months.map((month, index) => (
                    <TouchableOpacity
                      key={month}
                      onPress={() => {
                        setSelectedMonth(index);
                        // Adjust day if necessary
                        const maxDays = getDaysInMonth(selectedYear, index);
                        if (selectedDay > maxDays) setSelectedDay(maxDays);
                        setActiveTab("day");
                      }}
                      style={[
                        datePickerStyles.optionButton,
                        datePickerStyles.monthButton,
                        selectedMonth === index && datePickerStyles.optionButtonActive,
                      ]}
                    >
                      <Text
                        style={[
                          datePickerStyles.optionText,
                          selectedMonth === index && datePickerStyles.optionTextActive,
                        ]}
                      >
                        {month.slice(0, 3)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            )}

            {activeTab === "day" && (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={datePickerStyles.scrollContent}
              >
                <View style={datePickerStyles.optionsGrid}>
                  {days.map((day) => (
                    <TouchableOpacity
                      key={day}
                      onPress={() => setSelectedDay(day)}
                      style={[
                        datePickerStyles.optionButton,
                        datePickerStyles.dayButton,
                        selectedDay === day && datePickerStyles.optionButtonActive,
                      ]}
                    >
                      <Text
                        style={[
                          datePickerStyles.optionText,
                          selectedDay === day && datePickerStyles.optionTextActive,
                        ]}
                      >
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            )}
          </View>

          {/* Footer Actions */}
          <View style={datePickerStyles.footer}>
            <TouchableOpacity
              onPress={onClose}
              style={datePickerStyles.cancelButton}
            >
              <Text style={datePickerStyles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleConfirm}
              style={datePickerStyles.confirmButton}
            >
              <LinearGradient
                colors={["#059669", "#10B981"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={datePickerStyles.confirmGradient}
              >
                <Text style={datePickerStyles.confirmText}>Confirm</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const datePickerStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    backgroundColor: "#fff",
    borderRadius: 24,
    width: "100%",
    maxWidth: 380,
    maxHeight: height * 0.65,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    paddingVertical: 24,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "500",
    marginBottom: 4,
  },
  headerDate: {
    fontSize: 22,
    color: "#fff",
    fontWeight: "700",
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
  },
  tabActive: {
    backgroundColor: "#ECFDF5",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  tabTextActive: {
    color: "#059669",
  },
  pickerContent: {
    height: 220,
  },
  scrollContent: {
    padding: 12,
    paddingBottom: 16,
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
  },
  optionButton: {
    width: 72,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
  },
  monthButton: {
    width: 80,
  },
  dayButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  optionButtonActive: {
    backgroundColor: "#059669",
    borderColor: "#059669",
  },
  optionText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
  },
  optionTextActive: {
    color: "#fff",
  },
  footer: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    minHeight: 48,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
  },
  confirmButton: {
    flex: 1,
    borderRadius: 14,
    overflow: "hidden",
  },
  confirmGradient: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
});

// Custom animated input component
const AnimatedInput = ({
  icon,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType = "default",
  autoCapitalize = "none",
  maxLength,
  error,
  delay = 0,
  onTogglePassword,
  showPasswordToggle,
  showPassword,
}: {
  icon: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address" | "phone-pad" | "numeric";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  maxLength?: number;
  error?: string;
  delay?: number;
  onTogglePassword?: () => void;
  showPasswordToggle?: boolean;
  showPassword?: boolean;
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<RNTextInput>(null);

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(500).springify()}
      style={styles.inputWrapper}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => inputRef.current?.focus()}
        style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
          error && styles.inputContainerError,
        ]}
      >
        <View style={[styles.iconContainer, isFocused && styles.iconContainerFocused]}>
          <Ionicons
            name={icon as any}
            size={20}
            color={isFocused ? "#059669" : error ? "#EF4444" : "#9CA3AF"}
          />
        </View>
        <RNTextInput
          ref={inputRef}
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          maxLength={maxLength}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        {showPasswordToggle && (
          <TouchableOpacity onPress={onTogglePassword} style={styles.passwordToggle}>
            <Ionicons
              name={showPassword ? "eye-off" : "eye"}
              size={20}
              color="#9CA3AF"
            />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
      {error && (
        <Animated.Text entering={FadeIn.duration(200)} style={styles.errorText}>
          {error}
        </Animated.Text>
      )}
    </Animated.View>
  );
};

export default function Register() {
  const router = useRouter();
  const { registerParent, loginWithGoogle, isLoading } = useAuth();

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("+234");
  const [dob, setDob] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Validation states
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Animation values
  const headerScale = useSharedValue(0.8);
  const headerOpacity = useSharedValue(0);
  const formTranslateY = useSharedValue(30);
  const checkboxScale = useSharedValue(1);
  const buttonGlow = useSharedValue(0);

  // Start animations
  useEffect(() => {
    headerScale.value = withSpring(1, { damping: 12, stiffness: 100 });
    headerOpacity.value = withTiming(1, { duration: 600 });
    formTranslateY.value = withDelay(200, withSpring(0, { damping: 15 }));

    // Button glow animation
    buttonGlow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  // Animated styles
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: headerScale.value }],
    opacity: headerOpacity.value,
  }));

  const formAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: formTranslateY.value }],
    opacity: interpolate(formTranslateY.value, [30, 0], [0, 1]),
  }));

  const checkboxAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkboxScale.value }],
  }));

  const buttonGlowStyle = useAnimatedStyle(() => ({
    shadowOpacity: interpolate(buttonGlow.value, [0, 1], [0.2, 0.5]),
    shadowRadius: interpolate(buttonGlow.value, [0, 1], [10, 20]),
  }));

  // Google OAuth handler
  const handleGoogleSuccess = async (tokens: {
    idToken: string | null;
    accessToken: string | null;
  }) => {
    if (!tokens.idToken) {
      showAlert("Google Sign-Up Failed", "No authentication token received");
      return;
    }

    const result = await loginWithGoogle(tokens.idToken, tokens.accessToken);

    if (result.success) {
      console.log("✅ Google registration/login successful");
    } else {
      showAlert(
        "Google Sign-Up Failed",
        result.message || "Failed to sign up with Google"
      );
    }
  };

  const { googleLoading, googleRequest, handleGoogleLogin } =
    useGoogleAuth(handleGoogleSuccess);

  // Validation functions
  const validateEmail = (text: string) => {
    setEmail(text);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (text.length > 0 && !emailRegex.test(text)) {
      setEmailError("Please enter a valid email");
    } else {
      setEmailError("");
    }
  };

  const validatePassword = (text: string) => {
    setPassword(text);
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (text.length > 0 && !passwordRegex.test(text)) {
      setPasswordError("8+ chars, 1 uppercase, 1 number");
    } else {
      setPasswordError("");
    }
  };

  // Phone formatting
  const handlePhoneChange = (text: string) => {
    let cleaned = text.replace(/[^\d+]/g, "");
    if (!cleaned.startsWith("+234")) {
      cleaned = "+234" + cleaned.replace(/^\+?234?/, "");
    }
    if (cleaned.length <= 14) {
      setPhone(cleaned);
    }
  };

  // DOB formatting
  const handleDobChange = (text: string) => {
    let cleaned = text.replace(/[^0-9]/g, "");
    if (cleaned.length >= 4) {
      cleaned = cleaned.slice(0, 4) + "-" + cleaned.slice(4);
    }
    if (cleaned.length >= 7) {
      cleaned = cleaned.slice(0, 7) + "-" + cleaned.slice(7);
    }
    if (cleaned.length <= 10) {
      setDob(cleaned);
    }
  };

  const toggleCheckbox = () => {
    checkboxScale.value = withSequence(
      withTiming(0.8, { duration: 100 }),
      withSpring(1, { damping: 10 })
    );
    setTermsAccepted(!termsAccepted);
  };

  const handleRegister = async () => {
    // Validation
    if (!name.trim()) {
      showAlert("Oops! 🤔", "Please enter your full name");
      return;
    }
    if (!email.trim() || emailError) {
      showAlert("Oops! 🤔", "Please enter a valid email");
      return;
    }
    if (!password || passwordError) {
      showAlert("Oops! 🤔", "Password needs 8+ chars, 1 uppercase, 1 number");
      return;
    }
    if (!termsAccepted) {
      showAlert("Almost there! 📝", "Please accept the Terms & Conditions");
      return;
    }

    try {
      console.log("🔄 Starting registration...");
      const result = await registerParent(
        email.trim(),
        password,
        name.trim(),
        phone,
        dob || "",
        true
      );

      console.log("📨 Registration result:", result);

      if (result.success) {
        await AsyncStorage.setItem("pending_email", email);
        showAlert(
          "Success! 🎉",
          "Account created! Check your email for the verification code.",
          [{ text: "OK", onPress: () => router.push("/(auth)/parent-verify-email") }]
        );
      } else {
        showAlert("Registration Failed", result.message || "Please try again.");
      }
    } catch (err: any) {
      console.error("Registration error:", err);
      showAlert("Error", "Registration failed. Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <Animated.View style={[styles.header, headerAnimatedStyle]}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>
          Join Kivelo and start your family wellness journey
        </Text>
      </Animated.View>

      {/* Form Section */}
      <Animated.View style={[styles.formContainer, formAnimatedStyle]}>
        {/* Name Input */}
        <AnimatedInput
          icon="person-outline"
          placeholder="Full Name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              delay={100}
            />

            {/* Email Input */}
            <AnimatedInput
              icon="mail-outline"
              placeholder="Email Address"
              value={email}
              onChangeText={validateEmail}
              keyboardType="email-address"
              error={emailError}
              delay={200}
            />

            {/* Phone Input */}
            <AnimatedInput
              icon="call-outline"
              placeholder="+234 Phone Number"
              value={phone}
              onChangeText={handlePhoneChange}
              keyboardType="phone-pad"
              delay={300}
            />

            {/* DOB Picker */}
            <Animated.View
              entering={FadeInDown.delay(400).duration(500).springify()}
              style={styles.inputWrapper}
            >
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                style={styles.datePickerButton}
                activeOpacity={0.8}
              >
                <View style={styles.iconContainer}>
                  <Ionicons name="calendar-outline" size={20} color="#9CA3AF" />
                </View>
                <Text
                  style={[
                    styles.datePickerText,
                    dob && styles.datePickerTextFilled,
                  ]}
                >
                  {dob || "Date of Birth"}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </Animated.View>

            {/* Date Picker Modal */}
            <DatePickerModal
              visible={showDatePicker}
              onClose={() => setShowDatePicker(false)}
              onSelect={setDob}
              selectedDate={dob}
            />

            {/* Password Input */}
            <AnimatedInput
              icon="lock-closed-outline"
              placeholder="Password"
              value={password}
              onChangeText={validatePassword}
              secureTextEntry
              error={passwordError}
              delay={500}
              showPasswordToggle
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword(!showPassword)}
            />

            {/* Terms Checkbox */}
            <Animated.View
              entering={FadeInDown.delay(600).duration(500).springify()}
              style={styles.termsContainer}
            >
              <AnimatedTouchable
                onPress={toggleCheckbox}
                style={[styles.checkbox, checkboxAnimatedStyle]}
              >
                <Animated.View
                  style={[
                    styles.checkboxInner,
                    termsAccepted && styles.checkboxChecked,
                  ]}
                >
                  {termsAccepted && (
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  )}
                </Animated.View>
              </AnimatedTouchable>
              <Text style={styles.termsText}>
                I agree to the{" "}
                <Text style={styles.termsLink}>Terms & Conditions</Text> and{" "}
                <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>
            </Animated.View>

            {/* Register Button */}
            <Animated.View
              entering={FadeInDown.delay(700).duration(500).springify()}
            >
              <AnimatedTouchable
                onPress={handleRegister}
                disabled={isLoading}
                activeOpacity={0.9}
                style={[styles.registerButton, buttonGlowStyle]}
              >
                <LinearGradient
                  colors={["#059669", "#10B981"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.registerButtonGradient}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.registerButtonText}>
                        Create Account
                      </Text>
                      <Ionicons name="arrow-forward" size={20} color="#fff" />
                    </>
                  )}
                </LinearGradient>
              </AnimatedTouchable>
            </Animated.View>

            {/* Divider */}
            <Animated.View
              entering={FadeInDown.delay(800).duration(500)}
              style={styles.dividerContainer}
            >
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </Animated.View>

            {/* Social Buttons */}
            <Animated.View
              entering={FadeInDown.delay(900).duration(500).springify()}
              style={styles.socialContainer}
            >
              {/* Google Button */}
              <TouchableOpacity
                onPress={handleGoogleLogin}
                disabled={!googleRequest || googleLoading}
                style={[
                  styles.socialButton,
                  (!googleRequest || googleLoading) && styles.socialButtonDisabled,
                ]}
                activeOpacity={0.8}
              >
                {googleLoading ? (
                  <ActivityIndicator size="small" color="#4285F4" />
                ) : (
                  <>
                    <Image
                      source={{
                        uri: "https://developers.google.com/identity/images/g-logo.png",
                      }}
                      style={styles.socialIcon}
                    />
                    <Text style={styles.socialText}>Google</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Apple Button */}
              <TouchableOpacity
                onPress={() =>
                  showAlert(
                    "Coming Soon!",
                    "Apple Sign-Up will be available soon. Stay tuned! 🍎"
                  )
                }
                style={styles.appleButton}
                activeOpacity={0.8}
              >
                <Ionicons name="logo-apple" size={20} color="#fff" />
                <Text style={styles.appleText}>Apple</Text>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View
              entering={FadeInUp.delay(1000).duration(500)}
              style={styles.loginLinkContainer}
            >
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
                <Text style={styles.loginLink}>Sign In</Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  iconBadge: {
    marginBottom: 16,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  iconBadgeGradient: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: "#6B7280",
    marginTop: 8,
    textAlign: "center",
    lineHeight: 22,
  },
  formContainer: {
    flex: 1,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    paddingHorizontal: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    paddingHorizontal: 4,
    paddingRight: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  datePickerText: {
    flex: 1,
    fontSize: 16,
    color: "#9CA3AF",
    paddingVertical: 16,
  },
  datePickerTextFilled: {
    color: "#111827",
  },
  inputContainerFocused: {
    borderColor: "#10B981",
    shadowColor: "#10B981",
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  inputContainerError: {
    borderColor: "#FCA5A5",
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    margin: 6,
  },
  iconContainerFocused: {
    backgroundColor: "#ECFDF5",
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
    paddingVertical: 16,
    paddingRight: 16,
  },
  passwordToggle: {
    padding: 12,
  },
  errorText: {
    color: "#EF4444",
    fontSize: 12,
    marginTop: 6,
    marginLeft: 8,
    fontWeight: "500",
  },
  termsContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  checkbox: {
    marginRight: 12,
    marginTop: 2,
  },
  checkboxInner: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: "#10B981",
    borderColor: "#10B981",
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 20,
  },
  termsLink: {
    color: "#059669",
    fontWeight: "600",
  },
  registerButton: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 24,
  },
  registerButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    gap: 10,
  },
  registerButtonText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.3,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 13,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  socialContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 28,
  },
  socialButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    paddingVertical: 14,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  socialButtonDisabled: {
    opacity: 0.6,
  },
  socialIcon: {
    width: 22,
    height: 22,
  },
  socialText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
  },
  appleButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111827",
    borderRadius: 14,
    paddingVertical: 14,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  appleText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  loginLinkContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 8,
  },
  loginText: {
    fontSize: 15,
    color: "#6B7280",
  },
  loginLink: {
    fontSize: 15,
    color: "#059669",
    fontWeight: "700",
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
});