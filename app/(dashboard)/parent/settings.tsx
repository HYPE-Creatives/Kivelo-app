// app/(child)/create-child-account.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const avatars = [
 require("../../../assets/images/surprised.png"),
  require("../../../assets/images/bad.png"),
  require("../../../assets/images/disgusted.png"),
  require("../../../assets/images/angry.png"),
  require("../../../assets/images/sad.png"),
  require("../../../assets/images/happy.png"),
];

const CreateChildAccount = () => {
  const [childName, setChildName] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("10/05/2014");
  const [selectedAvatar, setSelectedAvatar] = useState<number | null>(null);

  const handleSetup = () => {
    // basic validation
    if (!childName || !email || selectedAvatar === null) {
      Alert.alert("Incomplete", "Please fill all fields and select an avatar.");
      return;
    }

    // dummy success
    Alert.alert("Success", "Child account created successfully!");

    // reset form
    setChildName("");
    setEmail("");
    setDob("10/05/2014");
    setSelectedAvatar(null);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <Text style={styles.header}>Create child's account</Text>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Child Setup</Text>

          {/* Child Name */}
          <Text style={styles.label}>Child's Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter child's name"
            placeholderTextColor="#999"
            value={childName}
            onChangeText={setChildName}
          />

          {/* Email */}
          <Text style={styles.label}>Enter Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter email"
            placeholderTextColor="#999"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <Text style={styles.subNote}>A OTP would be sent to your child</Text>

          {/* Date of Birth */}
          <Text style={styles.label}>Child's Date of birth</Text>
          <View style={styles.dateInput}>
            <Text style={styles.dateText}>{dob}</Text>
            <Ionicons name="calendar-outline" size={20} color="#777" />
          </View>

          {/* Avatar Selection */}
          <Text style={styles.label}>Choose Avatar</Text>
          <View style={styles.avatarContainer}>
            {avatars.map((avatar, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.avatarWrapper,
                  selectedAvatar === index && styles.selectedAvatar,
                ]}
                onPress={() => setSelectedAvatar(index)}
              >
                <Image source={avatar} style={styles.avatar} />
              </TouchableOpacity>
            ))}
          </View>

          {/* Setup Button */}
          <TouchableOpacity style={styles.button} onPress={handleSetup}>
            <LinearGradient
              colors={["#6C33FF", "#4C00C9"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradient}
            >
              <Text style={styles.buttonText}>Setup</Text>
            </LinearGradient>
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
  container: {
    alignItems: "center",
    paddingVertical: 30,
  },
  header: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 20,
    color: "#4C00C9",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#B7B1B1",
    borderRadius: 20,
    width: "85%",
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 16,
    color: "#222",
    marginBottom: 10,
  },
  label: {
    fontFamily: "Poppins-Regular",
    color: "#333",
    fontSize: 13,
    marginTop: 10,
  },
  input: {
    backgroundColor: "#EFEAEA",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontFamily: "Poppins-Regular",
    fontSize: 13,
    color: "#333",
    marginTop: 5,
  },
  subNote: {
    fontFamily: "Poppins-Regular",
    fontSize: 11,
    color: "#2F55BD",
    marginTop: 5,
  },
  dateInput: {
    backgroundColor: "#EFEAEA",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 5,
  },
  dateText: {
    fontFamily: "Poppins-Regular",
    fontSize: 13,
    color: "#333",
  },
  avatarContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 10,
  },
  avatarWrapper: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: "#DCDCDC",
    alignItems: "center",
    justifyContent: "center",
  },
  selectedAvatar: {
    borderWidth: 2,
    borderColor: "#3CB043",
  },
  avatar: {
    width: 45,
    height: 45,
    resizeMode: "contain",
  },
  button: {
    marginTop: 25,
    alignSelf: "center",
    width: "100%",
    borderRadius: 30,
    overflow: "hidden",
  },
  gradient: {
    paddingVertical: 12,
    borderRadius: 30,
    alignItems: "center",
  },
  buttonText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 15,
    color: "#fff",
  },
});
