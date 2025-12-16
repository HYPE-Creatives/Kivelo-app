import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
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

const { width, height } = Dimensions.get("window");

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
    } else {
      showAlert("Google Sign-In Failed", result.message || "Failed to sign in with Google");
    }
  };

  const { googleLoading, googleRequest, handleGoogleLogin } = useGoogleAuth(handleGoogleSuccess);

  // Show loading screen when processing Google OAuth callback
  if (googleLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#2E8B57" />
        <Text style={styles.loadingText}>Signing in with Google...</Text>
      </View>
    );
  }

  const validateForm = () => {
    if (!email.trim()) return "Email is required";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "Please enter a valid email";
    if (userType === "parent" && !password) return "Password is required";
    if (userType === "child") {
      if (childLoginMethod === "password" && !password) return "Password is required";
      if (childLoginMethod === "code" && !code) return "Login code is required";
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
        result = await login(email, password, "parent");
      } else {
        if (childLoginMethod === "password") {
          result = await login(email, password, "child");
        } else {
          result = await loginWithOneTimeCode(email, code);
        }
      }

      if (!result.success) {
        showAlert(userType === "child" ? "Oops! 😅" : "Login Failed", result.message || "Invalid credentials");
      }
    } catch (err) {
      console.error("Login Error:", err);
      showAlert("Error", "Something went wrong while logging in");
    }
  };

  const handleGoBackHome = () => router.replace("/");
  const handleRegisterRedirect = () => router.push("/(auth)/register");
  const handleForgotPassword = () => router.push("/(auth)/forgot-password");

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Back to Home Link */}
        <TouchableOpacity style={styles.backLink} onPress={handleGoBackHome}>
          <Ionicons name="chevron-back" size={16} color="#64748b" />
          <Text style={styles.backLinkText}>Back to Home</Text>
        </TouchableOpacity>

        {/* User Type Toggle */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity 
            style={[styles.toggleButton, userType === "parent" && styles.toggleButtonActiveParent]}
            onPress={() => { setUserType("parent"); setEmail(""); setPassword(""); setCode(""); }}
          >
            <Ionicons name="person" size={18} color={userType === "parent" ? "#fff" : "#2E8B57"} />
            <Text style={[styles.toggleText, userType === "parent" && styles.toggleTextActive]}>Parent</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.toggleButton, userType === "child" && styles.toggleButtonActiveChild]}
            onPress={() => { setUserType("child"); setEmail(""); setPassword(""); setCode(""); }}
          >
            <Ionicons name="happy" size={18} color={userType === "child" ? "#fff" : "#8B5CF6"} />
            <Text style={[styles.toggleText, userType === "child" && styles.toggleTextActive]}>Child</Text>
          </TouchableOpacity>
        </View>

        {/* Form Card */}
        <View style={[styles.card, userType === "child" && styles.cardChild]}>
          {userType === "child" && (
            <View style={styles.childMethodToggle}>
              <TouchableOpacity 
                style={[styles.methodButton, childLoginMethod === "password" && styles.methodButtonActive]}
                onPress={() => setChildLoginMethod("password")}
              >
                <Ionicons name="lock-closed" size={14} color={childLoginMethod === "password" ? "#fff" : "#8B5CF6"} />
                <Text style={[styles.methodText, childLoginMethod === "password" && styles.methodTextActive]}>Password</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.methodButton, childLoginMethod === "code" && styles.methodButtonActive]}
                onPress={() => setChildLoginMethod("code")}
              >
                <Ionicons name="key" size={14} color={childLoginMethod === "code" ? "#fff" : "#8B5CF6"} />
                <Text style={[styles.methodText, childLoginMethod === "code" && styles.methodTextActive]}>Code</Text>
              </TouchableOpacity>
            </View>
          )}

          <PaperTextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
            mode="outlined"
            outlineColor={userType === "child" ? "#DDD6FE" : "#e2e8f0"}
            activeOutlineColor={userType === "child" ? "#8B5CF6" : "#2E8B57"}
            left={<PaperTextInput.Icon icon="email" color="#94a3b8" />}
            dense
          />

          {(userType === "parent" || childLoginMethod === "password") && (
            <PaperTextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              style={styles.input}
              secureTextEntry={!showPassword}
              right={<PaperTextInput.Icon icon={showPassword ? 'eye-off' : 'eye'} onPress={() => setShowPassword(!showPassword)} />}
              left={<PaperTextInput.Icon icon="lock" color="#94a3b8" />}
              mode="outlined"
              outlineColor={userType === "child" ? "#DDD6FE" : "#e2e8f0"}
              activeOutlineColor={userType === "child" ? "#8B5CF6" : "#2E8B57"}
              dense
            />
          )}

          {userType === "child" && childLoginMethod === "code" && (
            <PaperTextInput
              label="Login Code"
              value={code}
              onChangeText={setCode}
              style={styles.input}
              autoCapitalize="characters"
              mode="outlined"
              outlineColor="#DDD6FE"
              activeOutlineColor="#8B5CF6"
              left={<PaperTextInput.Icon icon="key" color="#94a3b8" />}
              dense
            />
          )}

          {userType === "parent" && (
            <TouchableOpacity style={styles.forgotPassword} onPress={handleForgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          )}

          {userType === "parent" ? (
            <Button 
              mode="contained" 
              onPress={handleLogin} 
              loading={isLoading}
              disabled={isLoading || googleLoading}
              style={styles.loginButton}
              contentStyle={styles.loginButtonContent}
              labelStyle={styles.loginButtonLabel}
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>
          ) : (
            <TouchableOpacity 
              style={styles.childLoginButton}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <LinearGradient
                colors={['#8B5CF6', '#A78BFA']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.childLoginGradient}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.childLoginText}>Let's Go! 🚀</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}

          {userType === "parent" && (
            <>
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.socialRow}>
                <TouchableOpacity 
                  style={[styles.socialButton, (!googleRequest || googleLoading) && styles.socialButtonDisabled]}
                  onPress={handleGoogleLogin}
                  disabled={!googleRequest || googleLoading || isLoading}
                >
                  {googleLoading ? (
                    <ActivityIndicator size="small" color="#4285F4" />
                  ) : (
                    <>
                      <Image source={{ uri: 'https://www.google.com/favicon.ico' }} style={styles.socialIcon} />
                      <Text style={styles.socialText}>Google</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.appleButton}
                  onPress={() => showAlert("Coming Soon!", "Apple Sign-In will be available soon 🍎")}
                >
                  <Ionicons name="logo-apple" size={18} color="#fff" />
                  <Text style={styles.appleText}>Apple</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {userType === "child" && (
            <View style={styles.childHelp}>
              <Ionicons name="help-circle" size={16} color="#8B5CF6" />
              <Text style={styles.childHelpText}>
                {childLoginMethod === "code" ? "Ask your parent for your code!" : "Use your password"}
              </Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account?</Text>
          <TouchableOpacity onPress={handleRegisterRedirect}>
            <Text style={[styles.footerLink, userType === "child" && styles.footerLinkChild]}> Register</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
  },
  keyboardView: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 20,
    gap: 2,
  },
  backLinkText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '500',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  toggleButtonActiveParent: {
    backgroundColor: '#2E8B57',
  },
  toggleButtonActiveChild: {
    backgroundColor: '#8B5CF6',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  toggleTextActive: {
    color: '#fff',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardChild: {
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  childMethodToggle: {
    flexDirection: 'row',
    backgroundColor: '#EDE9FE',
    borderRadius: 10,
    padding: 3,
    marginBottom: 16,
    gap: 3,
  },
  methodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 4,
  },
  methodButtonActive: {
    backgroundColor: '#8B5CF6',
  },
  methodText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  methodTextActive: {
    color: '#fff',
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#fff',
    fontSize: 14,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
  forgotPasswordText: {
    color: '#2E8B57',
    fontSize: 13,
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#2E8B57',
    borderRadius: 12,
  },
  loginButtonContent: {
    paddingVertical: 6,
  },
  loginButtonLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  childLoginButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  childLoginGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  childLoginText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  dividerText: {
    color: '#94a3b8',
    fontSize: 12,
    paddingHorizontal: 12,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 12,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  socialButtonDisabled: {
    opacity: 0.6,
  },
  socialIcon: {
    width: 18,
    height: 18,
  },
  socialText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  appleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  appleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  childHelp: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EDE9FE',
    padding: 10,
    borderRadius: 10,
    marginTop: 12,
    gap: 6,
  },
  childHelpText: {
    fontSize: 12,
    color: '#7C3AED',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    color: '#64748b',
    fontSize: 14,
  },
  footerLink: {
    color: '#2E8B57',
    fontWeight: '600',
    fontSize: 14,
  },
  footerLinkChild: {
    color: '#8B5CF6',
  },
});
