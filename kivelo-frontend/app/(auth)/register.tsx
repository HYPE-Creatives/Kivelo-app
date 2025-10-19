import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { TextInput, Button, Text, useTheme, ActivityIndicator } from "react-native-paper";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useAuth } from "../../context/AuthContext"; // adjust if path differs
import { Ionicons } from "@expo/vector-icons";

export default function Register() {
  const { registerParent } = useAuth();
  const { colors } = useTheme();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState<Date | null>(null);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!firstName || !lastName || !dob || !email || !password) {
      Alert.alert("Missing Fields", "Please fill all required fields.");
      return;
    }

    const fullName = `${firstName} ${lastName}`;

    try {
      setLoading(true);
      const result = await registerParent(
        email,
        password,
        fullName,
        phone,
        dob.toISOString()
      );

      if (result.success) {
        Alert.alert("Success 🎉", result.message || "Account created successfully!");
      } else {
        Alert.alert("Error", result.message || "Registration failed");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "An error occurred during registration");
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) setDob(selectedDate);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-white"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center mb-6">
          <Ionicons name="person-add-outline" size={50} color={colors.primary} />
          <Text variant="headlineMedium" className="text-center font-bold mt-2">
            Create Account
          </Text>
          <Text variant="bodyMedium" className="text-gray-500 text-center mt-1">
            Fill in your details to get started
          </Text>
        </View>

        <TextInput
          label="First Name"
          value={firstName}
          onChangeText={setFirstName}
          mode="outlined"
          style={{ marginBottom: 10 }}
        />
        <TextInput
          label="Last Name"
          value={lastName}
          onChangeText={setLastName}
          mode="outlined"
          style={{ marginBottom: 10 }}
        />

        <TouchableOpacity onPress={() => setShowDatePicker(true)}>
          <TextInput
            label="Date of Birth"
            value={dob ? dob.toLocaleDateString() : ""}
            mode="outlined"
            editable={false}
            right={<TextInput.Icon icon="calendar" />}
            style={{ marginBottom: 10 }}
          />
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={dob || new Date()}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        )}

        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          mode="outlined"
          keyboardType="email-address"
          autoCapitalize="none"
          style={{ marginBottom: 10 }}
        />
        <TextInput
          label="Phone Number"
          value={phone}
          onChangeText={setPhone}
          mode="outlined"
          keyboardType="phone-pad"
          style={{ marginBottom: 10 }}
        />
        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          mode="outlined"
          secureTextEntry
          style={{ marginBottom: 20 }}
        />

        <Button
          mode="contained"
          onPress={handleRegister}
          disabled={loading}
          contentStyle={{ paddingVertical: 6 }}
        >
          {loading ? <ActivityIndicator animating color="#fff" /> : "Finish Registration"}
        </Button>

        <View className="flex-row justify-center items-center mt-5 space-x-3">
          <Button
            mode="outlined"
            icon="google"
            onPress={() => Alert.alert("Google Signup")}
          >
            Google
          </Button>
          <Button
            mode="outlined"
            icon="apple"
            onPress={() => Alert.alert("Apple Signup")}
          >
            Apple
          </Button>
        </View>

        <TouchableOpacity
          onPress={() => Alert.alert("Navigate to Login")}
          className="mt-6"
        >
          <Text className="text-center text-gray-600">
            Already have an account?{" "}
            <Text style={{ color: colors.primary }}>Login</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
