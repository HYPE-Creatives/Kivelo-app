import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useCallback, useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { EMAIL_REGEX } from "../../constants";

SplashScreen.preventAutoHideAsync();

export default function Register() {
  const { registerParent } = useAuth();

  const [fontsLoaded, fontError] = useFonts({
    "Inter-Bold": require("../../assets/fonts/Inter-Bold.otf"),
    "Inter-Regular": require("../../assets/fonts/Inter-Regular.otf"),
    "Inter-SemiBold": require("../../assets/fonts/Inter_18pt-SemiBold.ttf"),
  });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    dob: ""
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) await SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  // Validate form in real-time
  const validateField = (field, value) => {
    let error = "";
    
    switch (field) {
      case "name":
        if (!value.trim()) error = "Full name is required";
        else if (value.trim().length < 2) error = "Name must be at least 2 characters";
        break;
      case "email":
        if (!value) error = "Email is required";
        else if (!EMAIL_REGEX.test(value)) error = "Please enter a valid email address";
        break;
      case "password":
        if (!value) error = "Password is required";
        else if (value.length < 6) error = "Password must be at least 6 characters";
        else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) error = "Include uppercase, lowercase & number";
        break;
      case "phone":
        if (!value) error = "Phone number is required";
        else if (value.length < 10) error = "Please enter a valid phone number";
        break;
      case "dob":
        if (!value) error = "Date of birth is required";
        else if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) error = "Please use YYYY-MM-DD format";
        break;
    }
    
    setErrors(prev => ({ ...prev, [field]: error }));
    return !error;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    validateField(field, value);
  };

  const handleFocus = (field) => {
    setFocusedField(field);
  };

  const handleBlur = (field) => {
    setFocusedField(null);
    validateField(field, formData[field]);
  };

  // Check form validity whenever formData or errors change
  useEffect(() => {
    const allFieldsFilled = Object.values(formData).every(value => value.trim());
    const noErrors = Object.values(errors).every(error => !error);
    setIsFormValid(allFieldsFilled && noErrors);
  }, [formData, errors]);

  const handleRegister = async () => {
    console.log("Register button pressed");
    console.log("Form data:", formData);
    console.log("Errors:", errors);
    console.log("Is form valid:", isFormValid);

    // Final validation before submission
    let hasErrors = false;
    Object.entries(formData).forEach(([field, value]) => {
      const isValid = validateField(field, value);
      if (!isValid) {
        hasErrors = true;
      }
    });

    if (hasErrors || !isFormValid) {
      Alert.alert("Error", "Please fix the errors in the form");
      return;
    }

    setLoading(true);
    try {
      const result = await registerParent(
        formData.email, 
        formData.password, 
        formData.name, 
        formData.phone, 
        formData.dob
      );

      if (result.success) {
        Alert.alert("Success", "Registration successful! 🎉", [
          { 
            text: "Continue to Login", 
            onPress: () => router.push("/(auth)/login") 
          }
        ]);
      } else {
        Alert.alert("Registration Failed", result.message || "Registration failed. Please try again.");
      }
    } catch (error) {
      console.error("Registration failed:", error);
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!fontsLoaded && !fontError) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#16A34A" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.title}>Create Your Family Account</Text>
          <Text style={styles.subtitle}>
            Join us and start managing your family's wellness journey
          </Text>
        </View>

        {/* Form Section */}
        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Parent Information</Text>

          {/* Name Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput 
              placeholder="Enter your full name"
              value={formData.name}
              onChangeText={(value) => handleInputChange("name", value)}
              onFocus={() => handleFocus("name")}
              onBlur={() => handleBlur("name")}
              style={[
                styles.input, 
                errors.name && styles.inputError,
                focusedField === "name" && styles.inputFocused
              ]}
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email Address *</Text>
            <TextInput 
              placeholder="your.email@example.com"
              value={formData.email}
              onChangeText={(value) => handleInputChange("email", value)}
              onFocus={() => handleFocus("email")}
              onBlur={() => handleBlur("email")}
              keyboardType="email-address"
              autoCapitalize="none"
              style={[
                styles.input, 
                errors.email && styles.inputError,
                focusedField === "email" && styles.inputFocused
              ]}
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password *</Text>
            <TextInput 
              placeholder="Create a password (min. 6 characters)"
              value={formData.password}
              onChangeText={(value) => handleInputChange("password", value)}
              onFocus={() => handleFocus("password")}
              onBlur={() => handleBlur("password")}
              secureTextEntry
              style={[
                styles.input, 
                errors.password && styles.inputError,
                focusedField === "password" && styles.inputFocused
              ]}
            />
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            <Text style={styles.passwordHint}>
              Include uppercase, lowercase letters and numbers for security
            </Text>
          </View>

          {/* Phone Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone Number *</Text>
            <TextInput 
              placeholder="1234567890"
              value={formData.phone}
              onChangeText={(value) => handleInputChange("phone", value)}
              onFocus={() => handleFocus("phone")}
              onBlur={() => handleBlur("phone")}
              keyboardType="phone-pad"
              style={[
                styles.input, 
                errors.phone && styles.inputError,
                focusedField === "phone" && styles.inputFocused
              ]}
            />
            {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
          </View>

          {/* Date of Birth Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Date of Birth *</Text>
            <TextInput 
              placeholder="YYYY-MM-DD"
              value={formData.dob}
              onChangeText={(value) => handleInputChange("dob", value)}
              onFocus={() => handleFocus("dob")}
              onBlur={() => handleBlur("dob")}
              style={[
                styles.input, 
                errors.dob && styles.inputError,
                focusedField === "dob" && styles.inputFocused
              ]}
            />
            {errors.dob && <Text style={styles.errorText}>{errors.dob}</Text>}
          </View>

          {/* Register Button */}
          <TouchableOpacity 
            onPress={handleRegister} 
            style={[styles.registerButton, (!isFormValid || loading) && styles.registerButtonDisabled]}
            disabled={!isFormValid || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.registerButtonText}>
                Create Account
              </Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Alternative Actions */}
          <View style={styles.alternativeActions}>
            <Text style={styles.alternativeText}>Already have an account?</Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
              <Text style={styles.alternativeLink}>Sign In</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            onPress={() => router.push("/")}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>← Back to Home</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By registering, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
    paddingTop: 20,
  },
  title: {
    fontFamily: "Inter-Bold",
    fontSize: 32,
    color: "#16A34A",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: "Inter-Regular",
    fontSize: 16,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 24,
    maxWidth: 300,
  },
  formContainer: {
    backgroundColor: "white",
    padding: 24,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: "Inter-SemiBold",
    fontSize: 22,
    color: "#1E293B",
    marginBottom: 24,
    textAlign: "center",
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontFamily: "Inter-SemiBold",
    fontSize: 14,
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: "Inter-Regular",
    color: "#1F2937",
  },
  inputFocused: {
    borderColor: "#16A34A",
    backgroundColor: "#FFFFFF",
    shadowColor: "#16A34A",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  inputError: {
    borderColor: "#EF4444",
    backgroundColor: "#FEF2F2",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 12,
    marginTop: 4,
    fontFamily: "Inter-Regular",
  },
  passwordHint: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 6,
    fontFamily: "Inter-Regular",
    fontStyle: "italic",
  },
  registerButton: {
    backgroundColor: "#16A34A",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 24,
    shadowColor: "#16A34A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  registerButtonDisabled: {
    backgroundColor: "#9CA3AF",
    shadowColor: "transparent",
  },
  registerButtonText: {
    color: "white",
    fontFamily: "Inter-Bold",
    fontSize: 16,
    letterSpacing: 0.5,
  },
  divider: {
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
    fontFamily: "Inter-Regular",
    color: "#6B7280",
    paddingHorizontal: 16,
    fontSize: 14,
  },
  alternativeActions: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    flexWrap: "wrap",
  },
  alternativeText: {
    fontFamily: "Inter-Regular",
    color: "#6B7280",
    marginRight: 8,
    fontSize: 14,
  },
  alternativeLink: {
    fontFamily: "Inter-SemiBold",
    color: "#16A34A",
    fontSize: 14,
  },
  backButton: {
    alignItems: "center",
    padding: 12,
    marginTop: 8,
  },
  backButtonText: {
    fontFamily: "Inter-Regular",
    color: "#6B7280",
    fontSize: 14,
  },
  footer: {
    padding: 16,
    marginTop: 10,
  },
  footerText: {
    fontFamily: "Inter-Regular",
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 18,
  },
});