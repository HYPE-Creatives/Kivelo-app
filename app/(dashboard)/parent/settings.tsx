// app/(child)/create-child-account.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useAuth } from "../../../context/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "https://family-wellness.onrender.com/api/auth/generate-code";

const CreateChildAccount = () => {
  const router = useRouter();
  const { logout } = useAuth();
  
  const [childName, setChildName] = useState("");
  const [childEmail, setChildEmail] = useState("");
  const [childDOB, setChildDOB] = useState("10/05/2014");
  const [childGender, setChildGender] = useState<string>("prefer_not_to_say");
  const [isLoading, setIsLoading] = useState(false);

  // 🚪 Logout Function
  const handleLogout = () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            // Clear stored data
            await AsyncStorage.removeItem("userToken");
            await AsyncStorage.removeItem("userData");
            
            // Logout from context
            logout();
            
            // Redirect to login
            router.replace("/(auth)/parent-login");
          },
        },
      ]
    );
  };

  // ✅ Convert date from MM/DD/YYYY to YYYY-MM-DD format
  const formatDateForBackend = (dateString: string) => {
    const [month, day, year] = dateString.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };

  // ✅ Email validation function
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // ✅ Generate One-Time Code for Child
  const handleGenerateCode = async () => {
    // Basic validation - matches backend requirements
    if (!childName || !childEmail || !childDOB) {
      Alert.alert("Incomplete", "Child name, email, and date of birth are required.");
      return;
    }

    // Email validation - matches backend validation
    if (!validateEmail(childEmail)) {
      Alert.alert("Invalid Email", "Please provide a valid child email address.");
      return;
    }

    setIsLoading(true);

    try {
      // Get the parent's token
      const token = await AsyncStorage.getItem("userToken");
      
      if (!token) {
        Alert.alert("Authentication Error", "You are not authenticated. Please log in again.");
        setIsLoading(false);
        return;
      }

      // Prepare the request data - EXACTLY matches backend expectations
      const requestData = {
        childName: childName.trim(),
        childEmail: childEmail.toLowerCase().trim(),
        childDOB: formatDateForBackend(childDOB),
        childGender: childGender // Backend defaults to 'prefer_not_to_say' if not provided
      };

      console.log("Sending request to backend:", requestData);

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();
      console.log("Backend Response:", data);

      if (response.ok && data.success) {
        // Success - show the one-time code to the parent
        Alert.alert(
          "Success!", 
          `One-time code generated for ${childName}!\n\nCode: ${data.code}\nExpires: ${new Date(data.expiresAt).toLocaleString()}`,
          [
            {
              text: "OK",
              onPress: () => {
                // Reset form
                setChildName("");
                setChildEmail("");
                setChildDOB("10/05/2014");
                setChildGender("prefer_not_to_say");
                
                // Optionally navigate to child management screen
                // router.push("/(dashboard)/parent/children");
              }
            }
          ]
        );
      } else {
        // Handle different error cases based on backend response
        if (response.status === 403) {
          Alert.alert("Access Denied", data.message || "Only parents can generate codes for children.");
        } else if (response.status === 400) {
          Alert.alert("Invalid Data", data.message || "Please check the information and try again.");
        } else if (response.status === 404) {
          Alert.alert("Profile Not Found", data.message || "Parent profile not found. Please contact support.");
        } else {
          Alert.alert("Failed to Generate Code", data.message || "Something went wrong. Please try again.");
        }
      }
    } catch (error) {
      console.error("Generate Code Error:", error);
      Alert.alert(
        "Network Error", 
        "Unable to connect to server. Please check your internet connection and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Logout Button in Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Generate Child Code</Text>
        <TouchableOpacity 
          onPress={handleLogout}
          style={styles.logoutButton}
        >
          <Ionicons name="log-out-outline" size={24} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Child Account Setup</Text>
          <Text style={styles.description}>
            Generate a one-time code for your child to create their account. 
            The code will expire in 24 hours.
          </Text>

          {/* Child Name */}
          <Text style={styles.label}>Child's Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter child's full name"
            placeholderTextColor="#999"
            value={childName}
            onChangeText={setChildName}
          />

          {/* Child Email */}
          <Text style={styles.label}>Child's Email *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter child's email address"
            placeholderTextColor="#999"
            keyboardType="email-address"
            value={childEmail}
            onChangeText={setChildEmail}
            autoCapitalize="none"
          />

          {/* Date of Birth */}
          <Text style={styles.label}>Child's Date of Birth *</Text>
          <View style={styles.dateInput}>
            <TextInput
              style={styles.dateTextInput}
              value={childDOB}
              onChangeText={setChildDOB}
              placeholder="MM/DD/YYYY"
            />
            <Ionicons name="calendar-outline" size={20} color="#777" />
          </View>
          <Text style={styles.subNote}>Format: MM/DD/YYYY</Text>

          {/* Child Gender Selection */}
          <Text style={styles.label}>Child's Gender</Text>
          <View style={styles.genderContainer}>
            <TouchableOpacity
              style={[
                styles.genderButton,
                childGender === 'male' && styles.genderButtonSelected
              ]}
              onPress={() => setChildGender('male')}
            >
              <Text style={[
                styles.genderText,
                childGender === 'male' && styles.genderTextSelected
              ]}>Male</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.genderButton,
                childGender === 'female' && styles.genderButtonSelected
              ]}
              onPress={() => setChildGender('female')}
            >
              <Text style={[
                styles.genderText,
                childGender === 'female' && styles.genderTextSelected
              ]}>Female</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.genderButton,
                childGender === 'prefer_not_to_say' && styles.genderButtonSelected
              ]}
              onPress={() => setChildGender('prefer_not_to_say')}
            >
              <Text style={[
                styles.genderText,
                childGender === 'prefer_not_to_say' && styles.genderTextSelected
              ]}>Prefer not to say</Text>
            </TouchableOpacity>
          </View>

          {/* Generate Code Button */}
          <TouchableOpacity 
            style={[styles.button, isLoading && styles.buttonDisabled]} 
            onPress={handleGenerateCode}
            disabled={isLoading}
          >
            <LinearGradient
              colors={["#6C33FF", "#4C00C9"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradient}
            >
              <Text style={styles.buttonText}>
                {isLoading ? "Generating Code..." : "Generate One-Time Code"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Information Box */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={20} color="#4C00C9" />
            <Text style={styles.infoText}>
              Your child will use this code to create their account. The code expires in 24 hours.
            </Text>
          </View>

          {/* Additional Logout Button at Bottom */}
          <TouchableOpacity 
            style={styles.bottomLogoutButton}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            <Text style={styles.bottomLogoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CreateChildAccount;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#fff",
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  container: {
    alignItems: "center",
    paddingBottom: 30,
    paddingTop: 20,
  },
  header: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 20,
    color: "#4C00C9",
  },
  card: {
    backgroundColor: "#B7B1B1",
    borderRadius: 20,
    width: "90%",
    paddingVertical: 25,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 18,
    color: "#222",
    marginBottom: 8,
    textAlign: "center",
  },
  description: {
    fontFamily: "Poppins-Regular",
    fontSize: 12,
    color: "#444",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 16,
  },
  label: {
    fontFamily: "Poppins-SemiBold",
    color: "#333",
    fontSize: 14,
    marginTop: 15,
    marginBottom: 5,
  },
  input: {
    backgroundColor: "#EFEAEA",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontFamily: "Poppins-Regular",
    fontSize: 14,
    color: "#333",
  },
  subNote: {
    fontFamily: "Poppins-Regular",
    fontSize: 11,
    color: "#666",
    marginTop: 4,
    marginLeft: 5,
  },
  dateInput: {
    backgroundColor: "#EFEAEA",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateTextInput: {
    flex: 1,
    fontFamily: "Poppins-Regular",
    fontSize: 14,
    color: "#333",
  },
  genderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
  },
  genderButton: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#EFEAEA",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  genderButtonSelected: {
    backgroundColor: "#4C00C9",
    borderColor: "#4C00C9",
  },
  genderText: {
    fontFamily: "Poppins-Regular",
    fontSize: 12,
    color: "#333",
  },
  genderTextSelected: {
    color: "#fff",
    fontFamily: "Poppins-SemiBold",
  },
  button: {
    marginTop: 25,
    alignSelf: "center",
    width: "100%",
    borderRadius: 30,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  gradient: {
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: "center",
  },
  buttonText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 16,
    color: "#fff",
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(76, 0, 201, 0.1)",
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  infoText: {
    fontFamily: "Poppins-Regular",
    fontSize: 12,
    color: "#4C00C9",
    marginLeft: 10,
    flex: 1,
    lineHeight: 16,
  },
  logoutButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  bottomLogoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 25,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "rgba(239, 68, 68, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.2)",
  },
  bottomLogoutText: {
    marginLeft: 8,
    color: "#ef4444",
    fontFamily: "Poppins-SemiBold",
    fontSize: 14,
  },
});