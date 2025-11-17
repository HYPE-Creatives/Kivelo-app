import React, { useState } from "react";
import {
  View,
  Alert,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  Image,
  ActivityIndicator,
} from "react-native";
import { TextInput as PaperTextInput, Button } from "react-native-paper";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";

type LoginMode = "password" | "oneTimeCode";

export default function LoginScreen() {
  const router = useRouter();
  const { login, loginWithOneTimeCode, isLoading } = useAuth();
  
  const [mode, setMode] = useState<LoginMode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = () => {
    if (!email.trim()) {
      return "Email is required";
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Please enter a valid email";
    }

    if (mode === "password" && !password) {
      return "Password is required";
    }

    if (mode === "oneTimeCode" && !code) {
      return "One-time code is required";
    }

    return null;
  };

  const handleLogin = async () => {
    const validationError = validateForm();
    if (validationError) {
      Alert.alert("Error", validationError);
      return;
    }

    try {
      let result;

      if (mode === "password") {
        result = await login(email, password);
      } else {
        result = await loginWithOneTimeCode(email, code);
      }

      if (result.success) {
        console.log("✅ Login successful");
        // Navigation will happen automatically via AuthContext
      } else {
        Alert.alert("Login Failed", result.message || "Invalid credentials");
      }
    } catch (err: any) {
      console.error("Login Error:", err);
      Alert.alert("Error", "Something went wrong while logging in");
    }
  };

  const handleGoBackHome = () => {
    router.replace("/");
  };

  const handleRegisterRedirect = () => {
    router.push("/(auth)/register");
  };

  const handleForgotPassword = () => {
    Alert.alert('Forgot Password', 
      "Parents: Please use your email and password to login.\n\nChildren: Ask your parent to generate a new one-time code."
    );
  };

  const toggleMode = () => {
    const newMode: LoginMode = mode === "password" ? "oneTimeCode" : "password";
    setMode(newMode);
    setPassword("");
    setCode("");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={handleGoBackHome}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Image 
            source={require('../../assets/images/Family-Wellness-logo.png')} 
            style={styles.logo} 
          />
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>
        </View>

        {/* Login Mode Toggle */}
        <View style={styles.modeToggle}>
          <TouchableOpacity 
            style={[styles.modeButton, mode === "password" && styles.activeModeButton]}
            onPress={() => setMode("password")}
          >
            <Text style={[styles.modeText, mode === "password" && styles.activeModeText]}>
              Parent Login
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.modeButton, mode === "oneTimeCode" && styles.activeModeButton]}
            onPress={() => setMode("oneTimeCode")}
          >
            <Text style={[styles.modeText, mode === "oneTimeCode" && styles.activeModeText]}>
              Child Login
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formContainer}>
          {/* Email Input */}
          <PaperTextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
            mode="outlined"
            outlineColor="#e2e8f0"
            activeOutlineColor="#2E8B57"
          />

          {/* Conditional Input Fields */}
          {mode === "password" ? (
            <PaperTextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              style={styles.input}
              secureTextEntry={!showPassword}
              right={
                <PaperTextInput.Icon 
                  icon={showPassword ? 'eye-off' : 'eye'} 
                  onPress={() => setShowPassword(!showPassword)} 
                />
              }
              mode="outlined"
              outlineColor="#e2e8f0"
              activeOutlineColor="#2E8B57"
            />
          ) : (
            <PaperTextInput
              label="One-Time Code"
              value={code}
              onChangeText={setCode}
              style={styles.input}
              keyboardType="numeric"
              mode="outlined"
              outlineColor="#e2e8f0"
              activeOutlineColor="#2E8B57"
            />
          )}

          {/* Forgot Password */}
          {mode === "password" && (
            <TouchableOpacity style={styles.forgotPassword} onPress={handleForgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          )}

          {/* Login Button */}
          <Button 
            mode="contained" 
            onPress={handleLogin} 
            loading={isLoading}
            disabled={isLoading}
            contentStyle={styles.loginButtonContent}
            style={styles.loginButton}
          >
            {isLoading ? "Signing In..." : "Sign In"}
          </Button>

          {/* Register Link */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Don't have an account?</Text>
            <TouchableOpacity onPress={handleRegisterRedirect}>
              <Text style={styles.registerLink}> Register</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Login Help</Text>
          <Text style={styles.infoText}>
            • Parents: Use your email and password{'\n'}
            • Children: Use your email and one-time code{'\n'}
            • Contact support if you need assistance
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
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  backButtonText: {
    color: '#475569',
    fontWeight: '600',
    fontSize: 14,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#2E8B57",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 4,
    marginBottom: 20,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeModeButton: {
    backgroundColor: '#2E8B57',
  },
  modeText: {
    color: '#64748b',
    fontWeight: '500',
  },
  activeModeText: {
    color: 'white',
    fontWeight: '600',
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
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: "#1976d2",
    fontSize: 14,
    fontWeight: "500",
  },
  loginButton: {
    marginBottom: 16,
    backgroundColor: "#2E8B57",
  },
  loginButtonContent: {
    paddingVertical: 8,
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  registerText: {
    color: "#666",
    fontSize: 14,
  },
  registerLink: {
    color: "#2E8B57",
    fontWeight: "bold",
    fontSize: 14,
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