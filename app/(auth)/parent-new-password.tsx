// app/(auth)/create-new-password.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";

const CreateNewPassword = () => {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // ✅ Password validation
  const validatePassword = (text: string) => {
    setNewPassword(text);
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;
    setIsPasswordValid(passwordRegex.test(text));
  };

  const passwordsMatch =
    newPassword === confirmPassword && newPassword.length > 0;

  const handleVerify = () => {
    if (!isPasswordValid) {
      Alert.alert("Weak Password", "Password must include at least 1 uppercase letter, 1 number, and be at least 8 characters long.");
      return;
    }
    if (!passwordsMatch) {
      Alert.alert("Mismatch", "Passwords do not match.");
      return;
    }

    // ✅ Show success message
    setShowSuccess(true);

    // Auto-redirect to login after delay
    setTimeout(() => {
      setShowSuccess(false);
      router.push("/(auth)/parent-login");
    }, 2000);
  };

  const isButtonEnabled = isPasswordValid && passwordsMatch;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Title */}
        <Text style={styles.title}>Create New Password</Text>

        {/* Illustration */}
        <Image
          source={require("../../assets/images/password.png")} // dummy image
          style={styles.image}
          resizeMode="contain"
        />

        {/* Description */}
        <Text style={styles.description}>
          Now create a new strong password. Your new password must be different
          from the previous one.
        </Text>

        {/* Input Fields */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>New Password</Text>
          <TextInput
            style={styles.input}
            placeholder="****************"
            secureTextEntry
            value={newPassword}
            onChangeText={validatePassword}
          />

          <Text style={[styles.label, { marginTop: hp("2%") }]}>
            Confirm Password
          </Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="****************"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            {isPasswordValid && passwordsMatch && (
              <Ionicons
                name="checkmark-circle"
                size={22}
                color="#4CAF50"
                style={styles.icon}
              />
            )}
          </View>
        </View>

        {/* Success Message */}
        {showSuccess && (
          <Text style={styles.successText}>✅ Password reset successfully!</Text>
        )}

        {/* Verify Button */}
        <TouchableOpacity
          onPress={handleVerify}
          activeOpacity={0.8}
          disabled={!isButtonEnabled}
        >
          <LinearGradient
            colors={isButtonEnabled ? ["#A64CED", "#6521E3"] : ["#ccc", "#ccc"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Verify</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default CreateNewPassword;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: wp("8%"),
    paddingTop: hp("5%"),
  },
  title: {
    marginTop: 24,
    fontSize: wp("5%"),
    fontWeight: "600",
    color: "#000",
    marginBottom: hp("4%"),
  },
  image: {
    width: wp("35%"),
    height: hp("17%"),
    marginBottom: hp("3%"),
  },
  description: {
    textAlign: "center",
    color: "#666",
    fontSize: wp("3.5%"),
    marginBottom: hp("4%"),
    lineHeight: hp("2.8%"),
  },
  inputContainer: {
    width: "100%",
    marginBottom: hp("2%"),
  },
  label: {
    color: "#333",
    fontSize: wp("3.6%"),
    marginBottom: hp("0.8%"),
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    width: "100%",
    height: hp("6%"),
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: wp("4%"),
    fontSize: wp("3.6%"),
    backgroundColor: "#fff",
  },
  icon: {
    position: "absolute",
    right: wp("4%"),
  },
  successText: {
    color: "#4CAF50",
    fontSize: wp("3.8%"),
    fontWeight: "500",
    marginBottom: hp("2%"),
  },
  button: {
    width: wp("85%"),
    height: hp("6.5%"),
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: wp("4%"),
    fontWeight: "500",
  },
});
