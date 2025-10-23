// app/(auth)/login.tsx
import React, { useState, useEffect } from "react";
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
} from "react-native";
import { TextInput as PaperTextInput, Button } from "react-native-paper";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

// Ensure auth sessions work properly
WebBrowser.maybeCompleteAuthSession();

// 🔥 REPLACE THESE WITH YOUR ACTUAL CLIENT IDs FROM GOOGLE CLOUD CONSOLE
const GOOGLE_CLIENT_IDS = {
  web: "765956834253-ham5mqf94dkcnqlvlhf68lg1lqkqtfnq.apps.googleusercontent.com",
  ios: "765956834253-4btchsr2mgarvqr09r5sto9vum76hjc8.apps.googleusercontent.com", 
  android: "765956834253-iqe4gdf3mar2nu482nu48i66v428bfdp.apps.googleusercontent.com",
};

type LoginMode = "password" | "oneTimeCode";

export default function LoginScreen() {
  const router = useRouter();
  const { login, loginWithOneTimeCode, isLoading } = useAuth();
  const [mode, setMode] = useState<LoginMode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // ✅ FIXED: Google Auth configuration
  const redirectUri = makeRedirectUri({
    useProxy: true,
    // 🔄 REPLACE with your actual Expo project name
    projectNameForProxy: "@your-username/your-app-slug"
  });

  const [googleRequest, googleResponse, googlePromptAsync] = Google.useAuthRequest(
    {
      clientId: Platform.OS === 'ios' ? GOOGLE_CLIENT_IDS.ios : 
                Platform.OS === 'android' ? GOOGLE_CLIENT_IDS.android : 
                GOOGLE_CLIENT_IDS.web,
      scopes: ['openid', 'profile', 'email'],
      redirectUri,
    }
  );

  // ✅ HANDLE GOOGLE LOGIN RESPONSE
  useEffect(() => {
    const handleGoogleResponse = async () => {
      if (googleResponse?.type === 'success') {
        const { authentication } = googleResponse;
        await handleGoogleSignIn(authentication?.accessToken);
      } else if (googleResponse?.type === 'error') {
        setGoogleLoading(false);
        console.error('Google auth error:', googleResponse.error);
        Alert.alert(
          'Google Login Failed', 
          `Something went wrong with Google login: ${googleResponse.error?.message || 'Unknown error'}`
        );
      }
    };

    if (googleResponse) {
      handleGoogleResponse();
    }
  }, [googleResponse]);

  // ✅ IMPROVED: Google login function
  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      if (!googleRequest) {
        throw new Error('Google auth request not ready');
      }
      
      await googlePromptAsync();
    } catch (error) {
      console.error('Google prompt error:', error);
      setGoogleLoading(false);
      Alert.alert('Error', 'Failed to start Google login. Please try again.');
    }
  };

  // ✅ IMPROVED: Google sign-in
// In your login.tsx - update the handleGoogleSignIn function
  const handleGoogleSignIn = async (accessToken: string | undefined) => {
  if (!accessToken) {
    Alert.alert('Error', 'No access token received from Google');
    setGoogleLoading(false);
    return;
  }

  try {
    const result = await loginWithGoogle(accessToken);
    
    if (result.success) {
      console.log("✅ Google login successful - navigation handled by layout");
      // The route protection will automatically redirect to appropriate dashboard
    } else {
      Alert.alert("Google Login Failed", result.message || "Failed to login with Google");
    }
  } catch (error: any) {
    console.error('Google sign-in error:', error);
    Alert.alert(
      'Error', 
      error.message || 'Failed to complete Google login. Please try again.'
    );
  } finally {
    setGoogleLoading(false);
  }
  };

  const handleGoBackHome = () => {
    router.replace("/");
  };

  // ✅ IMPROVED: Login function
  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    try {
      let result;

      if (mode === "password") {
        if (!password.trim()) {
          Alert.alert("Error", "Please enter your password");
          return;
        }
        result = await login(email, password);
      } else {
        if (!code.trim()) {
          Alert.alert("Error", "Please enter your one-time code");
          return;
        }
        result = await loginWithOneTimeCode(email, code);
      }

      if (result.success) {
        if (mode === "password") {
          Alert.alert("Success", result.message || "Login successful!");
        }
        console.log("✅ Login successful - navigation will be handled by layout");
      } else {
        Alert.alert("Login Failed", result.message || "Invalid credentials");
      }
    } catch (err: any) {
      console.error("Login Error:", err);
      Alert.alert("Error", err.message || "Something went wrong while logging in");
    }
  };

  const handleRegisterRedirect = () => {
    router.push("/(auth)/register");
  };

  const handleForgotPassword = () => {
    Alert.alert('Forgot Password', 
      "Parents: Please use your email and password to login.\n\nChildren: Ask your parent to generate a new one-time code in their settings."
    );
  };

  const toggleMode = () => {
    setMode(mode === "password" ? "oneTimeCode" : "password");
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
        <View style={styles.modeToggleContainer}>
          <TouchableOpacity 
            style={[
              styles.modeButton, 
              mode === "password" && styles.modeButtonActive
            ]}
            onPress={() => setMode("password")}
          >
            <Text style={[
              styles.modeButtonText,
              mode === "password" && styles.modeButtonTextActive
            ]}>
              Password
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.modeButton, 
              mode === "oneTimeCode" && styles.modeButtonActive
            ]}
            onPress={() => setMode("oneTimeCode")}
          >
            <Text style={[
              styles.modeButtonText,
              mode === "oneTimeCode" && styles.modeButtonTextActive
            ]}>
              One-Time Code
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

          {/* Forgot Password (only in password mode) */}
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

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Login */}
          <View style={styles.socialLoginContainer}>
            <Text style={styles.socialLoginTitle}>Continue with</Text>
            <View style={styles.socialButtonsContainer}>
              <TouchableOpacity 
                style={[
                  styles.googleButton,
                  (googleLoading || !googleRequest) && styles.buttonDisabled
                ]}
                onPress={handleGoogleLogin}
                disabled={googleLoading || !googleRequest}
              >
                <View style={styles.googleButtonContent}>
                  <Image 
                    source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }}
                    style={styles.googleLogo}
                  />
                  <Text style={styles.googleButtonText}>
                    {googleLoading ? 'Loading...' : 'Google'}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

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
  // Back Button Styles
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
  modeToggleContainer: {
    flexDirection: "row",
    backgroundColor: "#e8f5e8",
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  modeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  modeButtonActive: {
    backgroundColor: "#2E8B57",
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2E8B57",
  },
  modeButtonTextActive: {
    color: "white",
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
  // Divider Styles
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#64748b',
    fontSize: 14,
    fontWeight: '500',
  },
  // Social Login Section
  socialLoginContainer: {
    marginBottom: 16,
  },
  socialLoginTitle: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: 14,
    marginBottom: 16,
    fontWeight: '500',
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  // Google Button
  googleButton: {
    flex: 1,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  googleLogo: {
    width: 18,
    height: 18,
  },
  googleButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  // Disabled state
  buttonDisabled: {
    opacity: 0.6,
  },
});