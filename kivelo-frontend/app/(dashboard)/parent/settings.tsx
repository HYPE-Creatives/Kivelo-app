// app/(dashboard)/parent/settings.tsx
import { useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  Alert, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  KeyboardAvoidingView,
  Platform 
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "expo-router";

export default function Settings() {
  const { user, generateOneTimeCode, resetChildPassword, logout } = useAuth();
  const router = useRouter();

  const [childName, setChildName] = useState("");
  const [childEmail, setChildEmail] = useState("");
  const [childDOB, setChildDOB] = useState("");
  const [childGender, setChildGender] = useState("");
  const [resetChildEmail, setResetChildEmail] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleGenerateCode = async () => {
    if (!childName || !childEmail || !childDOB) {
        console.log("❌ MISSING FIELDS:", {
        hasName: !!childName,
        hasEmail: !!childEmail, 
        hasDOB: !!childDOB
      });
      Alert.alert("Error", "Please fill in all child information fields.");
      return;
    }

    if (!user?.id) {
      Alert.alert("Error", "User not found. Please log in again.");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(childEmail)) {
      Alert.alert("Error", "Please enter a valid email address for your child.");
      return;
    }

    // Date validation (basic)
    const dobRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dobRegex.test(childDOB)) {
      Alert.alert("Error", "Please enter date of birth in YYYY-MM-DD format.");
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateOneTimeCode(
        user.id, 
        childName, 
        childEmail, 
        childDOB, 
        childGender
      );

      if (result.success && result.code) {
        setGeneratedCode(result.code);

        Alert.alert(
          "Success", 
          `One-time code generated for ${childName}!\n\nCode: ${result.code}\n\nShare this code with your child.`,
          [
            { 
              text: "Copy Code", 
              onPress: () => {
                Clipboard.setStringAsync(result.code!);
                Alert.alert("Copied!", "Code copied to clipboard.");
              } 
            },
            { text: "OK", style: "cancel" }
          ]
        );

        // Clear form
        setChildName("");
        setChildEmail("");
        setChildDOB("");
        setChildGender("");
      } else {
        Alert.alert("Error", result.message || "Failed to generate code. Please try again.");
      }
    } catch (error: any) {
      console.error("Generate code error:", error);
      Alert.alert("Error", error.message || "Failed to generate code. Please check your connection.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetChildEmail) {
      Alert.alert("Error", "Please enter the child's email address.");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(resetChildEmail)) {
      Alert.alert("Error", "Please enter a valid email address.");
      return;
    }

    if (!user?.id) {
      Alert.alert("Error", "User not found. Please log in again.");
      return;
    }

    setIsResetting(true);
    try {
      const result = await resetChildPassword(user.id, resetChildEmail);
      
      if (result.success) {
        Alert.alert("Success", result.message || "Password reset initiated successfully. Your child will receive a new one-time code.");
        setResetChildEmail("");
      } else {
        Alert.alert("Error", result.message || "Failed to reset password. Please check the email address.");
      }
    } catch (error: any) {
      console.error("Reset password error:", error);
      Alert.alert("Error", error.message || "Failed to reset password. Please check your connection.");
    } finally {
      setIsResetting(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Logout", 
          style: "destructive",
          onPress: async () => {
            await logout();
            // Navigation will be handled by the layout
          }
        }
      ]
    );
  };

  const handleUpdateEmail = () => {
    Alert.alert("Coming Soon", "Email update feature will be available soon.");
  };

  const handleChangePassword = () => {
    Alert.alert("Coming Soon", "Password change feature will be available soon.");
  };

  const handleManageFamily = () => {
    Alert.alert("Coming Soon", "Family management feature will be available soon.");
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={100}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>⚙️ Settings</Text>
          <Text style={styles.subtitle}>
            Manage your account & register children.
          </Text>
        </View>

        {/* Family Code Display */}
        {user?.parent?.familyCode && (
          <View style={styles.familyCodeContainer}>
            <Text style={styles.familyCodeLabel}>Your Family Code</Text>
            <Text selectable style={styles.familyCodeText}>{user.parent.familyCode}</Text>
            <Text style={styles.familyCodeHint}>
              Share this code with family members to connect to your family group.
            </Text>
          </View>
        )}

        {/* Child Registration Form */}
        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Register a New Child</Text>
          <Text style={styles.sectionDescription}>
            Create a new account for your child with a one-time registration code.
          </Text>

          <TextInput
            placeholder="Child's Full Name *"
            value={childName}
            onChangeText={setChildName}
            style={styles.input}
            placeholderTextColor="#999"
          />

          <TextInput
            placeholder="Child's Email *"
            value={childEmail}
            onChangeText={setChildEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
            placeholderTextColor="#999"
          />

          <TextInput
            placeholder="Date of Birth (YYYY-MM-DD) *"
            value={childDOB}
            onChangeText={setChildDOB}
            style={styles.input}
            placeholderTextColor="#999"
          />

          <TextInput
            placeholder="Gender *"
            value={childGender}
            onChangeText={setChildGender}
            style={styles.input}
            placeholderTextColor="#999"
          />

          <TouchableOpacity
            style={[styles.button, isGenerating && styles.buttonDisabled]}
            onPress={handleGenerateCode}
            disabled={isGenerating}
          >
            <Text style={styles.buttonText}>
              {isGenerating ? "Generating Code..." : "Generate One-Time Code"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Password Reset Section */}
        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Reset Child Password</Text>
          <Text style={styles.sectionDescription}>
            If your child forgot their password or needs a new one-time code, you can reset it here.
          </Text>

          <TextInput
            placeholder="Child's Email Address *"
            value={resetChildEmail}
            onChangeText={setResetChildEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
            placeholderTextColor="#999"
          />

          <TouchableOpacity
            style={[styles.button, isResetting && styles.buttonDisabled]}
            onPress={handleResetPassword}
            disabled={isResetting}
          >
            <Text style={styles.buttonText}>
              {isResetting ? "Resetting..." : "Reset Password"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Account Management Section */}
        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Account Management</Text>
          
          <TouchableOpacity style={styles.accountButton} onPress={handleUpdateEmail}>
            <Text style={styles.accountButtonText}>📧 Update Email Address</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.accountButton} onPress={handleChangePassword}>
            <Text style={styles.accountButtonText}>🔒 Change Password</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.accountButton} onPress={handleManageFamily}>
            <Text style={styles.accountButtonText}>👥 Manage Family Members</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.accountButton, styles.logoutButton]} 
            onPress={handleLogout}
          >
            <Text style={[styles.accountButtonText, styles.logoutButtonText]}>🚪 Logout</Text>
          </TouchableOpacity>
        </View>

        {generatedCode && (
          <View style={styles.codeContainer}>
            <Text style={styles.codeLabel}>Generated Code for Registration:</Text>
            <Text selectable style={styles.codeText}>{generatedCode}</Text>

            <TouchableOpacity
              style={styles.copyButton}
              onPress={() => {
                Clipboard.setStringAsync(generatedCode);
                Alert.alert("Copied!", "One-time code copied to clipboard.");
              }}
            >
              <Text style={styles.copyButtonText}>📋 Copy Code</Text>
            </TouchableOpacity>

            <Text style={styles.instructions}>
              Share this code with your child. They will use it with their email to login 
              for the first time and set their own password. This code expires in 1 hour.
            </Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Parent Dashboard v1.0 • Secure Family Management
          </Text>
          <Text style={styles.userInfo}>
            Logged in as: {user?.email} • Role: {user?.role}
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    paddingTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: '#16A34A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  familyCodeContainer: {
    backgroundColor: '#dbeafe',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#93c5fd',
  },
  familyCodeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 4,
  },
  familyCodeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e3a8a',
    textAlign: 'center',
    marginVertical: 8,
  },
  familyCodeHint: {
    fontSize: 12,
    color: '#4b5563',
    fontStyle: 'italic',
  },
  formContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2d3748',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 20,
    lineHeight: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#f7fafc',
    fontSize: 16,
    color: '#2d3748',
  },
  button: {
    backgroundColor: '#16A34A',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#a7f3d0',
    opacity: 0.7,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  accountButton: {
    backgroundColor: '#f1f5f9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  accountButtonText: {
    color: '#475569',
    fontWeight: '600',
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: '#fee2e2',
    borderColor: '#fecaca',
    marginTop: 10,
  },
  logoutButtonText: {
    color: '#dc2626',
  },
  codeContainer: {
    backgroundColor: '#dcfce7',
    padding: 20,
    borderRadius: 15,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  codeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#166534',
    marginBottom: 8,
  },
  codeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#065f46',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 2,
    backgroundColor: '#bbf7d0',
    padding: 10,
    borderRadius: 8,
  },
  copyButton: {
    backgroundColor: '#16A34A',
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  copyButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  instructions: {
    fontSize: 14,
    color: '#15803d',
    lineHeight: 20,
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  footerText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 4,
  },
  userInfo: {
    fontSize: 11,
    color: '#cbd5e1',
    textAlign: 'center',
  },
});