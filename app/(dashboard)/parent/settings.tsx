import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import React, { useRef, useState } from "react";
import {
  Animated,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const avatarPaths = [
  require("../../../assets/images/surprised.png"),
  require("../../../assets/images/bad.png"),
  require("../../../assets/images/disgusted.png"),
  require("../../../assets/images/angry.png"),
  require("../../../assets/images/sad.png"),
  require("../../../assets/images/happy.png"),
];

export default function CreateChildAccount() {
  const [childName, setChildName] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<number | null>(null);
  const [popupType, setPopupType] = useState<"success" | "error" | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowPicker(Platform.OS === "ios");
    if (selectedDate) setDob(selectedDate);
  };

  const handleSetup = () => {
    if (!childName || !email || !dob || selectedAvatar === null) {
      triggerPopup("error");
      return;
    }
    triggerPopup("success");

    // reset form after delay
    setTimeout(() => {
      setChildName("");
      setEmail("");
      setDob(null);
      setSelectedAvatar(null);
    }, 2000);
  };

  const triggerPopup = (type: "success" | "error") => {
    setPopupType(type);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }).start(() => setPopupType(null));
      }, 2000);
    });
  };

  const formattedDob = dob
    ? dob.toLocaleDateString("en-GB")
    : "Select date of birth";

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.header}>Create Child’s Account</Text>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Child Setup</Text>

          {/* Child's Name */}
          <Text style={styles.label}>Child’s Name</Text>
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
          <Text style={styles.subNote}>An OTP will be sent to your child</Text>

          {/* Date of Birth */}
          <Text style={styles.label}>Child’s Date of Birth</Text>
          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => setShowPicker(true)}
          >
            <Text
              style={[
                styles.dateText,
                !dob && { color: "#999" },
              ]}
            >
              {formattedDob}
            </Text>
            <Ionicons name="calendar-outline" size={20} color="#777" />
          </TouchableOpacity>

          {showPicker && (
            <DateTimePicker
              value={dob || new Date()}
              mode="date"
              display="default"
              maximumDate={new Date()}
              onChange={handleDateChange}
            />
          )}

          {/* Avatar Selection */}
          <Text style={styles.label}>Choose Avatar</Text>
          <View style={styles.avatarContainer}>
            {avatarPaths.map((avatar, index) => (
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

      {/* ✅ Popup Feedback */}
      {popupType && (
        <Animated.View
          style={[
            styles.popup,
            {
              opacity: fadeAnim,
              backgroundColor:
                popupType === "success"
                  ? "rgba(76,175,80,0.95)"
                  : "rgba(244,67,54,0.95)",
            },
          ]}
        >
          <Ionicons
            name={
              popupType === "success" ? "checkmark-circle" : "alert-circle"
            }
            size={50}
            color="#fff"
          />
          <Text style={styles.popupText}>
            {popupType === "success"
              ? "Child account created successfully!"
              : "Please fill all fields and select an avatar."}
          </Text>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  container: { alignItems: "center", paddingVertical: 30 },
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
    padding: 20,
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
  popup: {
    position: "absolute",
    top: "40%",
    left: "10%",
    right: "10%",
    borderRadius: 20,
    paddingVertical: 30,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 8,
  },
  popupText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 16,
    color: "#fff",
    marginTop: 10,
    textAlign: "center",
    paddingHorizontal: 10,
  },
});
