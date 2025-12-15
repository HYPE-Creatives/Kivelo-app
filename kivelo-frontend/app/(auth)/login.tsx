import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  Image,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { showAlert } from '@/utils/showAlert';
import { TextInput as PaperTextInput, Button } from "react-native-paper";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

type UserType = "parent" | "child";
type ChildLoginMethod = "password" | "code";

export default function LoginScreen() {
  const router = useRouter();
  const { login, loginWithOneTimeCode, loginWithGoogle, isLoading } = useAuth();
  
  const [userType, setUserType] = useState<UserType>("parent");
  const [childLoginMethod, setChildLoginMethod] = useState<ChildLoginMethod>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Google OAuth handler
  const handleGoogleSuccess = async (tokens: { idToken: string | null; accessToken: string | null }) => {
    if (!tokens.idToken) {
      showAlert("Google Sign-In Failed", "No authentication token received");
      return;
    }

    const result = await loginWithGoogle(tokens.idToken, tokens.accessToken);
    
    if (result.success) {
      console.log("✅ Google login successful");
      // Navigation handled by AuthContext
    } else {
      showAlert("Google Sign-In Failed", result.message || "Failed to sign in with Google");
    }
  };

  const { googleLoading, googleRequest, handleGoogleLogin } = useGoogleAuth(handleGoogleSuccess);

  const validateForm = () => {
    if (!email.trim()) {
      return "Email is required";
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Please enter a valid email";
    }

    if (userType === "parent" && !password) {
      return "Password is required";
    }

    if (userType === "child") {
      if (childLoginMethod === "password" && !password) {
        return "Password is required";
      }
      if (childLoginMethod === "code" && !code) {
        return "Login code is required";
      }
    }

    return null;
  };

  const handleLogin = async () => {
    const validationError = validateForm();
    if (validationError) {
      showAlert("Oops!", validationError);
      return;
    }

    try {
      let result;

      if (userType === "parent") {
        // Parent always uses email + password, enforce parent role
        result = await login(email, password, "parent");
      } else {
        // Child can use either password or code
        if (childLoginMethod === "password") {
          result = await login(email, password, "child");
        } else {
          result = await loginWithOneTimeCode(email, code);
        }
      }

      if (result.success) {
        console.log("✅ Login successful");
        // Navigation handled by AuthContext
      } else {
        showAlert(
          userType === "child" ? "Oops! 😅" : "Login Failed", 
          result.message || "Invalid credentials"
        );
      }
    } catch (err: any) {
      console.error("Login Error:", err);
      showAlert("Error", "Something went wrong while logging in");
    }
  };

  const handleGoBackHome = () => {
    router.replace("/");
  };

  const handleRegisterRedirect = () => {
    router.push("/(auth)/register");
  };

  const handleForgotPassword = () => {
    router.push("/(auth)/forgot-password");
  };

  // Render Parent Login Form
  const renderParentLogin = () => (
    <View style={styles.formContainer}>
      <View style={styles.formHeader}>
        <Ionicons name="person" size={32} color="#2E8B57" />
        <Text style={styles.formTitle}>Parent Sign In</Text>
        <Text style={styles.formSubtitle}>Welcome back! Sign in to manage your family</Text>
      </View>

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
        left={<PaperTextInput.Icon icon="email" color="#64748b" />}
      />

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
        left={<PaperTextInput.Icon icon="lock" color="#64748b" />}
        mode="outlined"
        outlineColor="#e2e8f0"
        activeOutlineColor="#2E8B57"
      />

      <TouchableOpacity style={styles.forgotPassword} onPress={handleForgotPassword}>
        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
      </TouchableOpacity>

      <Button 
        mode="contained" 
        onPress={handleLogin} 
        loading={isLoading}
        disabled={isLoading || googleLoading}
        contentStyle={styles.loginButtonContent}
        style={styles.loginButton}
        labelStyle={styles.loginButtonLabel}
      >
        {isLoading ? "Signing In..." : "Sign In"}
      </Button>

      {/* Divider */}
      <View style={styles.dividerContainer}>
        <View style={styles.divider} />
        <Text style={styles.dividerText}>or continue with</Text>
        <View style={styles.divider} />
      </View>

      {/* Social Sign-In Buttons - Side by Side */}
      <View style={styles.socialButtonsContainer}>
        {/* Google Sign-In Button */}
        <TouchableOpacity 
          style={[styles.socialButton, styles.googleButton, (!googleRequest || googleLoading) && styles.socialButtonDisabled]}
          onPress={handleGoogleLogin}
          disabled={!googleRequest || googleLoading || isLoading}
        >
          {googleLoading ? (
            <ActivityIndicator size="small" color="#4285F4" />
          ) : (
            <>
              <Image 
                source={{ uri: 'https://www.google.com/favicon.ico' }} 
                style={styles.socialIcon}
              />
              <Text style={styles.googleButtonText}>Google</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Apple Sign-In Button (Coming Soon) */}
        <TouchableOpacity 
          style={[styles.socialButton, styles.appleButton]}
          onPress={() => showAlert("Coming Soon!", "Apple Sign-In will be available soon. Stay tuned! 🍎")}
        >
          <Ionicons name="logo-apple" size={20} color="#fff" />
          <Text style={styles.appleButtonText}>Apple</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.registerContainer}>
        <Text style={styles.registerText}>Don{"'"}t have an account?</Text>
        <TouchableOpacity onPress={handleRegisterRedirect}>
          <Text style={styles.registerLink}> Register</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render Child Login Form
  const renderChildLogin = () => (
    <View style={styles.childFormContainer}>
      <View style={styles.childFormHeader}>
        <Text style={styles.childWelcomeEmoji}>👋</Text>
        <Text style={styles.childFormTitle}>Hey there!</Text>
        <Text style={styles.childFormSubtitle}>Let's get you signed in</Text>
      </View>

      {/* Child Login Method Toggle */}
      <View style={styles.childMethodToggle}>
        <TouchableOpacity 
          style={[
            styles.childMethodButton, 
            childLoginMethod === "password" && styles.childMethodButtonActive
          ]}
          onPress={() => setChildLoginMethod("password")}
        >
          <Ionicons 
            name="key" 
            size={20} 
            color={childLoginMethod === "password" ? "#fff" : "#8B5CF6"} 
          />
          <Text style={[
            styles.childMethodText,
            childLoginMethod === "password" && styles.childMethodTextActive
          ]}>
            Password
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.childMethodButton, 
            childLoginMethod === "code" && styles.childMethodButtonActive
          ]}
          onPress={() => setChildLoginMethod("code")}
        >
          <Ionicons 
            name="qr-code" 
            size={20} 
            color={childLoginMethod === "code" ? "#fff" : "#8B5CF6"} 
          />
          <Text style={[
            styles.childMethodText,
            childLoginMethod === "code" && styles.childMethodTextActive
          ]}>
            Login Code
          </Text>
        </TouchableOpacity>
      </View>

      <PaperTextInput
        label="Your Email"
        value={email}
        onChangeText={setEmail}
        style={styles.childInput}
        autoCapitalize="none"
        keyboardType="email-address"
        mode="outlined"
        outlineColor="#DDD6FE"
        activeOutlineColor="#8B5CF6"
        left={<PaperTextInput.Icon icon="email" color="#8B5CF6" />}
      />

      {childLoginMethod === "password" ? (
        <PaperTextInput
          label="Your Password"
          value={password}
          onChangeText={setPassword}
          style={styles.childInput}
          secureTextEntry={!showPassword}
          right={
            <PaperTextInput.Icon 
              icon={showPassword ? 'eye-off' : 'eye'} 
              onPress={() => setShowPassword(!showPassword)} 
            />
          }
          left={<PaperTextInput.Icon icon="lock" color="#8B5CF6" />}
          mode="outlined"
          outlineColor="#DDD6FE"
          activeOutlineColor="#8B5CF6"
        />
      ) : (
        <PaperTextInput
          label="Login Code (from parent)"
          value={code}
          onChangeText={(text) => setCode(text.toUpperCase())}
          style={styles.childInput}
          autoCapitalize="characters"
          mode="outlined"
          outlineColor="#DDD6FE"
          activeOutlineColor="#8B5CF6"
          left={<PaperTextInput.Icon icon="ticket" color="#8B5CF6" />}
        />
      )}

      <TouchableOpacity 
        style={styles.childLoginButton} 
        onPress={handleLogin}
        disabled={isLoading}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={["#8B5CF6", "#7C3AED"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.childLoginButtonGradient}
        >
          {isLoading ? (
            <Text style={styles.childLoginButtonText}>Signing In... ⏳</Text>
          ) : (
            <Text style={styles.childLoginButtonText}>Let's Go! 🚀</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>

      {/* Help text for children */}
      <View style={styles.childHelpContainer}>
        <Ionicons name="help-circle" size={18} color="#A78BFA" />
        <Text style={styles.childHelpText}>
          {childLoginMethod === "code" 
            ? "Ask your parent for your login code!" 
            : "Use the password you created earlier"}
        </Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={handleGoBackHome}>
          <Ionicons name="arrow-back" size={20} color="#475569" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        {/* Logo & Header */}
        <View style={styles.header}>
          <Image 
            source={require('../../assets/images/Family-Wellness-logo.png')} 
            style={styles.logo} 
          />
          <Text style={styles.title}>Welcome to Kivelo</Text>
        </View>

        {/* User Type Toggle */}
        <View style={styles.userTypeToggle}>
          <TouchableOpacity 
            style={[
              styles.userTypeButton, 
              userType === "parent" && styles.parentTypeButtonActive
            ]}
            onPress={() => {
              setUserType("parent");
              setEmail("");
              setPassword("");
              setCode("");
            }}
          >
            <Ionicons 
              name="person" 
              size={24} 
              color={userType === "parent" ? "#fff" : "#2E8B57"} 
            />
            <Text style={[
              styles.userTypeText,
              userType === "parent" && styles.userTypeTextActive
            ]}>
              I'm a Parent
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.userTypeButton, 
              userType === "child" && styles.childTypeButtonActive
            ]}
            onPress={() => {
              setUserType("child");
              setEmail("");
              setPassword("");
              setCode("");
            }}
          >
            <Ionicons 
              name="happy" 
              size={24} 
              color={userType === "child" ? "#fff" : "#8B5CF6"} 
            />
            <Text style={[
              styles.userTypeText,
              userType === "child" && styles.childUserTypeTextActive
            ]}>
              I'm a Child
            </Text>
          </TouchableOpacity>
        </View>

        {/* Conditional Form Rendering */}
        {userType === "parent" ? renderParentLogin() : renderChildLogin()}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 50,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
  },
  backButtonText: {
    color: '#475569',
    fontWeight: '600',
    fontSize: 14,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#1e293b",
    textAlign: "center",
  },
  
  // User Type Toggle
  userTypeToggle: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 6,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  userTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  parentTypeButtonActive: {
    backgroundColor: '#2E8B57',
  },
  childTypeButtonActive: {
    backgroundColor: '#8B5CF6',
  },
  userTypeText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748b',
  },
  userTypeTextActive: {
    color: '#fff',
  },
  childUserTypeTextActive: {
    color: '#fff',
  },

  // Parent Form Styles
  formContainer: {
    backgroundColor: "white",
    padding: 24,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  formHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 12,
  },
  formSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
  },
  input: {
    marginBottom: 16,
    backgroundColor: "white",
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: "#2E8B57",
    fontSize: 14,
    fontWeight: "500",
  },
  loginButton: {
    marginBottom: 16,
    backgroundColor: "#2E8B57",
    borderRadius: 12,
  },
  loginButtonContent: {
    paddingVertical: 8,
  },
  loginButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Divider styles
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  dividerText: {
    color: '#94a3b8',
    fontSize: 13,
    paddingHorizontal: 12,
    fontWeight: '500',
  },
  
  // Google Sign-In Button
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    gap: 12,
  },
  googleButtonDisabled: {
    opacity: 0.6,
  },
  googleIcon: {
    width: 20,
    height: 20,
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },

  // Social Buttons Container (side by side)
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 8,
  },
  socialButtonDisabled: {
    opacity: 0.6,
  },
  socialIcon: {
    width: 20,
    height: 20,
  },

  // Google Sign-In Button
  googleButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },

  // Apple Sign-In Button
  appleButton: {
    backgroundColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  appleButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  registerText: {
    color: "#64748b",
    fontSize: 14,
  },
  registerLink: {
    color: "#2E8B57",
    fontWeight: "bold",
    fontSize: 14,
  },

  // Child Form Styles
  childFormContainer: {
    backgroundColor: "#F5F3FF",
    padding: 24,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#DDD6FE",
  },
  childFormHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  childWelcomeEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  childFormTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#5B21B6',
  },
  childFormSubtitle: {
    fontSize: 16,
    color: '#7C3AED',
    marginTop: 4,
  },
  childMethodToggle: {
    flexDirection: 'row',
    backgroundColor: '#EDE9FE',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    gap: 4,
  },
  childMethodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 6,
  },
  childMethodButtonActive: {
    backgroundColor: '#8B5CF6',
  },
  childMethodText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  childMethodTextActive: {
    color: '#fff',
  },
  childInput: {
    marginBottom: 16,
    backgroundColor: "#fff",
  },
  childLoginButton: {
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 14,
    overflow: 'hidden',
  },
  childLoginButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  childLoginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  childHelpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EDE9FE',
    padding: 12,
    borderRadius: 10,
    gap: 8,
  },
  childHelpText: {
    fontSize: 13,
    color: '#7C3AED',
    flex: 1,
  },
});