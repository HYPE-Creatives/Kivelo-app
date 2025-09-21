// app/(auth)/login.tsx
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from "react-native";
import { ROLES } from "../../constants";

export default function Login() {
  const { login, validateOneTimeCode, registerChildWithCode, user } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [passwordOrCode, setPasswordOrCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [isCodeLogin, setIsCodeLogin] = useState(false);

  const handleLogin = async () => {
    if (!email || !passwordOrCode) {
      Alert.alert("Error", "Please enter both email and password/code");
      return;
    }

    setLoading(true);
    try {
      // First, check if this is a one-time code login
      const codeValidation = validateOneTimeCode(passwordOrCode);
      
      if (codeValidation.valid) {
        // This is a one-time code for child registration
        setIsCodeLogin(true);
        const result = await registerChildWithCode(passwordOrCode, email, "");
        
        if (result.success) {
          Alert.alert("Success", "Please set your password to continue");
          router.replace("/(auth)/set-password");
        } else {
          Alert.alert("Registration Failed", result.message || "Invalid code");
        }
      } else {
        // Regular email/password login
        const result = await login(email, passwordOrCode);
        
        if (result.success) {
          Alert.alert("Login Successful");
          
          // Get the user from context
          // You might need to adjust your AuthContext to provide the current user
                   
          // Role-based redirect
          if (user?.role === ROLES.PARENT) {
            router.replace("/(dashboard)/parent/home");
          } else if (user?.role === ROLES.CHILD) {
            if (!user.hasSetPassword) {
              router.replace("/(auth)/set-password");
            } else {
              router.replace("/(dashboard)/child/home");
            }
          }
        } else {
          Alert.alert("Login Failed", result.message || "Invalid credentials");
        }
      }
    } catch (err) {
      Alert.alert("Error", "Something went wrong");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#F3F4F6" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={60}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Login</Text>

        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.inputStyle}
        />

        <TextInput
          placeholder={isCodeLogin ? "One-time Code" : "Password"}
          value={passwordOrCode}
          onChangeText={setPasswordOrCode}
          secureTextEntry={!isCodeLogin}
          style={styles.inputStyle}
        />

        <TouchableOpacity
          onPress={handleLogin}
          style={styles.buttonStyle}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {isCodeLogin ? "Register with Code" : "Login"}
            </Text>
          )}
        </TouchableOpacity>

        <Text style={styles.helpText}>
          Parents: Use your email and password{"\n"}
          Children: Use your email and one-time code
        </Text>

        {/* Forgot password link */}
        <TouchableOpacity
          onPress={() => router.push("/(auth)/forgot-password")}
          style={{ marginTop: 16 }}
        >
          <Text style={styles.linkText}>Forgot Password?</Text>
        </TouchableOpacity>

        {/* Back to dashboard link */}
        <TouchableOpacity
          onPress={() => router.replace("/")}
          style={{ marginTop: 12 }}
        >
          <Text style={styles.linkText}>← Back to Dashboard</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#16A34A",
    marginBottom: 20,
  },
  inputStyle: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  buttonStyle: {
    backgroundColor: "#16A34A",
    paddingVertical: 14,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
    marginTop: 12,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  helpText: {
    marginTop: 16,
    textAlign: "center",
    color: "#666",
    fontSize: 14,
  },
  linkText: {
    color: "#16A34A",
    fontSize: 14,
    fontWeight: "600",
  },
});