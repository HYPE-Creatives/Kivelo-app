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
  Image
} from "react-native";
import { TextInput, Button } from "react-native-paper";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

// Call this at the top level to ensure auth sessions work properly
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

  // ✅ FIXED: Updated Google Auth configuration without AuthSession dependency
  const [googleRequest, googleResponse, googlePromptAsync] = Google.useAuthRequest(
    {
      clientId: GOOGLE_CLIENT_IDS.web,
      iosClientId: GOOGLE_CLIENT_IDS.ios,
      androidClientId: GOOGLE_CLIENT_IDS.android,
      scopes: ['openid', 'profile', 'email'],
    },
    {
      // ✅ Add this second parameter to fix the proxy issue
      useProxy: true,
      projectNameForProxy: "@your-username/your-app-slug" // 🔄 REPLACE with your actual Expo project name
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

  // ✅ IMPROVED: Google login function with better error handling
  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      // Check if request is ready
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

  // ✅ IMPROVED: Google sign-in with better error handling
  const handleGoogleSignIn = async (accessToken: string | undefined) => {
    if (!accessToken) {
      Alert.alert('Error', 'No access token received from Google');
      setGoogleLoading(false);
      return;
    }

    try {
      // Get user info from Google
      const userInfoResponse = await fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: { 
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      });
      
      if (!userInfoResponse.ok) {
        const errorText = await userInfoResponse.text();
        throw new Error(`HTTP ${userInfoResponse.status}: ${errorText}`);
      }
      
      const userInfo = await userInfoResponse.json();
      
      console.log('Google User Info:', userInfo);
      
      // ✅ TODO: Integrate with your backend here
      // In a real app, you would send the accessToken or userInfo to your backend
      // to create/authenticate the user and get your app's JWT token
      
      // For demo purposes, show success message
      Alert.alert(
        'Success', 
        `Welcome ${userInfo.name || userInfo.email}!`,
        [{ 
          text: 'Continue', 
          onPress: () => {
            // Here you would typically:
            // 1. Update your AuthContext with the user data from your backend
            // 2. The auth layout will automatically redirect to appropriate dashboard
            console.log('Google login completed - implement backend integration');
          }
        }]
      );
      
    } catch (error) {
      console.error('Google sign-in error:', error);
      Alert.alert(
        'Error', 
        'Failed to get user information from Google. Please try again.'
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoBackHome = () => {
    router.replace("/");
  };

  // ✅ IMPROVED: Login function with better validation
  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    // Email validation
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
        // Don't show alert for one-time code login - let the redirect handle it
        if (mode === "password") {
          Alert.alert("Success", result.message || "Login successful!");
        }
        
        console.log("✅ Login successful - navigation will be handled by layout");
      } else {
        Alert.alert("Login Failed", result.message || "Invalid credentials");
      }
    } catch (err: any) {
      console.error("Login Error:", err);
      Alert.alert(
        "Error", 
        err.message || "Something went wrong while logging in"
      );
    }
  };

  const handleRegisterRedirect = () => {
    router.push("/(auth)/register");
  };

  const handleForgotPassword = () => {
    Alert.alert(
      "Forgot Password", 
      "Parents: Please use your email and password to login.\n\n" +
      "Children: Ask your parent to generate a new one-time code in their settings."
    );
  };

  const toggleMode = () => {
    setMode(mode === "password" ? "oneTimeCode" : "password");
    // Clear fields when switching modes
    setPassword("");
    setCode("");
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back to Home Button */}
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleGoBackHome}
        >
          <Text style={styles.backButtonText}>← Back to Home</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Family Wellness</Text>
          <Text style={styles.subtitle}>
            {mode === "password" ? "Sign in to your account" : "Child Login with One-Time Code"}
          </Text>
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
              👨‍👩‍👧‍👦 Parent/Child Login
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
              🧒 Child One-Time Code
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formContainer}>
          {/* Email Input */}
          <TextInput
            label="Email Address"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
            mode="outlined"
            left={<TextInput.Icon icon="email" />}
          />

          {/* Password Input (shown in password mode) */}
          {mode === "password" && (
            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              style={styles.input}
              mode="outlined"
              left={<TextInput.Icon icon="lock" />}
              right={
                <TextInput.Icon 
                  icon={showPassword ? "eye-off" : "eye"} 
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
            />
          )}

          {/* One-Time Code Input (shown in oneTimeCode mode) */}
          {mode === "oneTimeCode" && (
            <TextInput
              label="One-Time Code"
              value={code}
              onChangeText={setCode}
              style={styles.input}
              mode="outlined"
              left={<TextInput.Icon icon="key" />}
              placeholder="Enter the code from your parent"
            />
          )}

          {/* Mode-specific instructions */}
          {mode === "oneTimeCode" && (
            <View style={styles.instructionsContainer}>
              <Text style={styles.instructionsText}>
                💡 Ask your parent for the one-time code. This is for children who haven't set a password yet.
              </Text>
            </View>
          )}

          <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>Need Help?</Text>
          </TouchableOpacity>

          <Button
            mode="contained"
            onPress={handleLogin}
            loading={isLoading}
            disabled={isLoading}
            style={styles.loginButton}
            contentStyle={styles.loginButtonContent}
          >
            {isLoading ? "Signing In..." : mode === "password" ? "Sign In" : "Login with Code"}
          </Button>

          {/* Mode toggle hint */}
          <TouchableOpacity onPress={toggleMode} style={styles.modeSwitch}>
            <Text style={styles.modeSwitchText}>
              {mode === "password" 
                ? "🧒 Child without password? Use one-time code" 
                : "👨‍👩‍👧‍👦 Have a password? Use regular login"}
            </Text>
          </TouchableOpacity>

          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={handleRegisterRedirect}>
              <Text style={styles.registerLink}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* OR Divider */}
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Social Login Section */}
        <View style={styles.socialLoginContainer}>
          <Text style={styles.socialLoginTitle}>Continue with</Text>
          
          <View style={styles.socialButtonsContainer}>
            {/* Google Login Button - FIXED CONFIGURATION */}
            <TouchableOpacity 
              style={[
                styles.googleButton,
                (isLoading || googleLoading || !googleRequest) && styles.buttonDisabled
              ]}
              onPress={handleGoogleLogin}
              disabled={isLoading || googleLoading || !googleRequest}
            >
              <View style={styles.googleButtonContent}>
                <Image 
                  source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }}
                  style={styles.googleLogo}
                />
                <Text style={styles.googleButtonText}>
                  {googleLoading ? "Signing in..." : "Google"}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Apple Login Button (Placeholder for future) */}
            <TouchableOpacity 
              style={[
                styles.appleButton,
                (isLoading || googleLoading) && styles.buttonDisabled
              ]}
              onPress={() => Alert.alert('Coming Soon', 'Apple login will be available soon')}
              disabled={isLoading || googleLoading}
            >
              <View style={styles.appleButtonContent}>
                <Text style={styles.appleIcon}></Text>
                <Text style={styles.appleButtonText}>Apple</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Role Information */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Login Options:</Text>
          <Text style={styles.infoText}>• Parents: Use email and password</Text>
          <Text style={styles.infoText}>• Children with password: Use email and password</Text>
          <Text style={styles.infoText}>• Children first time: Use one-time code from parent</Text>
          <Text style={styles.infoText}>• Social login for parents (coming soon)</Text>
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
    textAlign: "center",
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
  },
  input: {
    marginBottom: 16,
    backgroundColor: "white",
  },
  instructionsContainer: {
    backgroundColor: "#fff3cd",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#ffc107",
  },
  instructionsText: {
    fontSize: 14,
    color: "#856404",
    lineHeight: 20,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: "#1976d2",
    fontSize: 14,
  },
  loginButton: {
    marginBottom: 16,
    backgroundColor: "#2E8B57",
  },
  loginButtonContent: {
    paddingVertical: 8,
  },
  modeSwitch: {
    alignItems: "center",
    marginBottom: 20,
    padding: 8,
  },
  modeSwitchText: {
    color: "#2E8B57",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  registerText: {
    color: "#666",
  },
  registerLink: {
    color: "#2E8B57",
    fontWeight: "bold",
  },
  infoContainer: {
    backgroundColor: "#e3f2fd",
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
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
    marginBottom: 4,
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
    marginTop: 8,
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

  // Apple Button
  appleButton: {
    flex: 1,
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 12,
    padding: 12,
  },
  appleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  appleIcon: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  appleButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },

  // Disabled state
  buttonDisabled: {
    opacity: 0.6,
  },
});