import React, { useState } from "react";<<<<<<< HEAD

import {import React, { useState } from "react";

  View,import {

  Text,  View,

  TextInput,  Text,

  TouchableOpacity,  TextInput,

  StyleSheet,  TouchableOpacity,

  SafeAreaView,  StyleSheet,

  ScrollView,  SafeAreaView,

  Alert,  ScrollView,

} from "react-native";  Alert,

import { Ionicons } from "@expo/vector-icons";} from "react-native";

import { LinearGradient } from "expo-linear-gradient";import { Ionicons } from "@expo/vector-icons";

import { useRouter } from "expo-router";import { LinearGradient } from "expo-linear-gradient";

import { useAuth } from "../../../context/AuthContext";import { useRouter } from "expo-router";

import AsyncStorage from "@react-native-async-storage/async-storage";import { useAuth } from "../../../context/AuthContext";

import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "https://family-wellness.onrender.com/api/auth/generate-code";

const API_URL = "https://family-wellness.onrender.com/api/auth/generate-code";

const CreateChildAccount = () => {

  const router = useRouter();const CreateChildAccount = () {

  const { logout } = useAuth();  const [childName, setChildName] = useState("");

    const [email, setEmail] = useState("");

  const [childName, setChildName] = useState("");  const [dob, setDob] = useState<Date | null>(null);

  const [childEmail, setChildEmail] = useState("");  const [showPicker, setShowPicker] = useState(false);

  const [childDOB, setChildDOB] = useState("10/05/2014");  const [selectedAvatar, setSelectedAvatar] = useState<number | null>(null);

  const [childGender, setChildGender] = useState<string>("prefer_not_to_say");  const [popupType, setPopupType] = useState<"success" | "error" | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  // 🚪 Logout Function

  const handleLogout = () => {  const handleDateChange = (event: any, selectedDate?: Date) => {

    Alert.alert(    setShowPicker(Platform.OS === "ios");

      "Log Out",    if (selectedDate) setDob(selectedDate);

      "Are you sure you want to log out?",  };

      [

        {  const handleSetup = () => {

          text: "Cancel",    if (!childName || !email || !dob || selectedAvatar === null) {

          style: "cancel",      triggerPopup("error");

        },      return;

        {    }

          text: "Log Out",    triggerPopup("success");

          style: "destructive",

          onPress: async () => {    // reset form after delay

            // Clear stored data    setTimeout(() => {

            await AsyncStorage.removeItem("userToken");      setChildName("");

            await AsyncStorage.removeItem("userData");      setEmail("");

                  setDob(null);

            // Logout from context      setSelectedAvatar(null);

            logout();    }, 2000);

              };

            // Redirect to login

            router.replace("/(auth)/parent-login");  const triggerPopup = (type: "success" | "error") => {

          },    setPopupType(type);

        },    Animated.timing(fadeAnim, {

      ]      toValue: 1,

    );      duration: 400,

  };      useNativeDriver: true,

    }).start(() => {

  // ✅ Convert date from MM/DD/YYYY to YYYY-MM-DD format      setTimeout(() => {

  const formatDateForBackend = (dateString: string) => {        Animated.timing(fadeAnim, {

    const [month, day, year] = dateString.split('/');          toValue: 0,

    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;          duration: 400,

  };          useNativeDriver: true,

        }).start(() => setPopupType(null));

  // ✅ Email validation function      }, 2000);

  const validateEmail = (email: string) => {    });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;  };

    return emailRegex.test(email);

  };  const formattedDob = dob

    ? dob.toLocaleDateString("en-GB")

  // ✅ Generate One-Time Code for Child    : "Select date of birth";

  const handleGenerateCode = async () => {

    // Basic validation - matches backend requirements  return (

    if (!childName || !childEmail || !childDOB) {    <SafeAreaView style={styles.safe}>

      Alert.alert("Incomplete", "Child name, email, and date of birth are required.");      <ScrollView contentContainerStyle={styles.container}>

      return;        <Text style={styles.header}>Create Child’s Account</Text>

    }

        <View style={styles.card}>

    // Email validation - matches backend validation          <Text style={styles.sectionTitle}>Child Setup</Text>

    if (!validateEmail(childEmail)) {

      Alert.alert("Invalid Email", "Please provide a valid child email address.");          {/* Child's Name */}

      return;          <Text style={styles.label}>Child’s Name</Text>

    }          <TextInput

            style={styles.input}

    setIsLoading(true);            placeholder="Enter child's name"

=======

    try {// app/(child)/create-child-account.tsx

      // Get the parent's tokenimport React, { useState } from "react";

      const token = await AsyncStorage.getItem("userToken");import {

        View,

      if (!token) {  Text,

        Alert.alert("Authentication Error", "You are not authenticated. Please log in again.");  TextInput,

        setIsLoading(false);  TouchableOpacity,

        return;  StyleSheet,

      }  SafeAreaView,

  ScrollView,

      // Prepare the request data - EXACTLY matches backend expectations  Alert,

      const requestData = {} from "react-native";

        childName: childName.trim(),import { Ionicons } from "@expo/vector-icons";

        childEmail: childEmail.toLowerCase().trim(),import { LinearGradient } from "expo-linear-gradient";

        childDOB: formatDateForBackend(childDOB),import { useRouter } from "expo-router";

        childGender: childGender // Backend defaults to 'prefer_not_to_say' if not providedimport { useAuth } from "../../../context/AuthContext";

      };import AsyncStorage from "@react-native-async-storage/async-storage";



      console.log("Sending request to backend:", requestData);const API_URL = "https://family-wellness.onrender.com/api/auth/generate-code";



      const response = await fetch(API_URL, {const CreateChildAccount = () => {

        method: "POST",  const router = useRouter();

        headers: {  const { logout } = useAuth();

          "Content-Type": "application/json",  

          "Authorization": `Bearer ${token}`  const [childName, setChildName] = useState("");

        },  const [childEmail, setChildEmail] = useState("");

        body: JSON.stringify(requestData),  const [childDOB, setChildDOB] = useState("10/05/2014");

      });  const [childGender, setChildGender] = useState<string>("prefer_not_to_say");

  const [isLoading, setIsLoading] = useState(false);

      const data = await response.json();

      console.log("Backend Response:", data);  // 🚪 Logout Function

  const handleLogout = () => {

      if (response.ok && data.success) {    Alert.alert(

        // Success - show the one-time code to the parent      "Log Out",

        Alert.alert(      "Are you sure you want to log out?",

          "Success!",       [

          `One-time code generated for ${childName}!\n\nCode: ${data.code}\nExpires: ${new Date(data.expiresAt).toLocaleString()}`,        {

          [          text: "Cancel",

            {          style: "cancel",

              text: "OK",        },

              onPress: () => {        {

                // Reset form          text: "Log Out",

                setChildName("");          style: "destructive",

                setChildEmail("");          onPress: async () => {

                setChildDOB("10/05/2014");            // Clear stored data

                setChildGender("prefer_not_to_say");            await AsyncStorage.removeItem("userToken");

                            await AsyncStorage.removeItem("userData");

                // Optionally navigate to child management screen            

                // router.push("/(dashboard)/parent/children");            // Logout from context

              }            logout();

            }            

          ]            // Redirect to login

        );            router.replace("/(auth)/parent-login");

      } else {          },

        // Handle different error cases based on backend response        },

        if (response.status === 403) {      ]

          Alert.alert("Access Denied", data.message || "Only parents can generate codes for children.");    );

        } else if (response.status === 400) {  };

          Alert.alert("Invalid Data", data.message || "Please check the information and try again.");

        } else if (response.status === 404) {  // ✅ Convert date from MM/DD/YYYY to YYYY-MM-DD format

          Alert.alert("Profile Not Found", data.message || "Parent profile not found. Please contact support.");  const formatDateForBackend = (dateString: string) => {

        } else {    const [month, day, year] = dateString.split('/');

          Alert.alert("Failed to Generate Code", data.message || "Something went wrong. Please try again.");    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

        }  };

      }

    } catch (error) {  // ✅ Email validation function

      console.error("Generate Code Error:", error);  const validateEmail = (email: string) => {

      Alert.alert(    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        "Network Error",     return emailRegex.test(email);

        "Unable to connect to server. Please check your internet connection and try again."  };

      );

    } finally {  // ✅ Generate One-Time Code for Child

      setIsLoading(false);  const handleGenerateCode = async () => {

    }    // Basic validation - matches backend requirements

  };    if (!childName || !childEmail || !childDOB) {

      Alert.alert("Incomplete", "Child name, email, and date of birth are required.");

  return (      return;

    <SafeAreaView style={styles.safe}>    }

      {/* Logout Button in Header */}

      <View style={styles.headerContainer}>    // Email validation - matches backend validation

        <Text style={styles.header}>Generate Child Code</Text>    if (!validateEmail(childEmail)) {

        <TouchableOpacity       Alert.alert("Invalid Email", "Please provide a valid child email address.");

          onPress={handleLogout}      return;

          style={styles.logoutButton}    }

        >

          <Ionicons name="log-out-outline" size={24} color="#ef4444" />    setIsLoading(true);

        </TouchableOpacity>

      </View>    try {

      // Get the parent's token

      <ScrollView contentContainerStyle={styles.container}>      const token = await AsyncStorage.getItem("userToken");

        {/* Card */}      

        <View style={styles.card}>      if (!token) {

          <Text style={styles.sectionTitle}>Child Account Setup</Text>        Alert.alert("Authentication Error", "You are not authenticated. Please log in again.");

          <Text style={styles.description}>        setIsLoading(false);

            Generate a one-time code for your child to create their account.         return;

            The code will expire in 24 hours.      }

          </Text>

      // Prepare the request data - EXACTLY matches backend expectations

          {/* Child Name */}      const requestData = {

          <Text style={styles.label}>Child's Name *</Text>        childName: childName.trim(),

          <TextInput        childEmail: childEmail.toLowerCase().trim(),

            style={styles.input}        childDOB: formatDateForBackend(childDOB),

            placeholder="Enter child's full name"        childGender: childGender // Backend defaults to 'prefer_not_to_say' if not provided

            placeholderTextColor="#999"      };

            value={childName}

            onChangeText={setChildName}      console.log("Sending request to backend:", requestData);

          />

      const response = await fetch(API_URL, {

          {/* Child Email */}        method: "POST",

          <Text style={styles.label}>Child's Email *</Text>        headers: {

          <TextInput          "Content-Type": "application/json",

            style={styles.input}          "Authorization": `Bearer ${token}`

            placeholder="Enter child's email address"        },

            placeholderTextColor="#999"        body: JSON.stringify(requestData),

            keyboardType="email-address"      });

            value={childEmail}

            onChangeText={setChildEmail}      const data = await response.json();

            autoCapitalize="none"      console.log("Backend Response:", data);

          />

      if (response.ok && data.success) {

          {/* Date of Birth */}        // Success - show the one-time code to the parent

          <Text style={styles.label}>Child's Date of Birth *</Text>        Alert.alert(

          <View style={styles.dateInput}>          "Success!", 

            <TextInput          `One-time code generated for ${childName}!\n\nCode: ${data.code}\nExpires: ${new Date(data.expiresAt).toLocaleString()}`,

              style={styles.dateTextInput}          [

              value={childDOB}            {

              onChangeText={setChildDOB}              text: "OK",

              placeholder="MM/DD/YYYY"              onPress: () => {

            />                // Reset form

            <Ionicons name="calendar-outline" size={20} color="#777" />                setChildName("");

          </View>                setChildEmail("");

          <Text style={styles.subNote}>Format: MM/DD/YYYY</Text>                setChildDOB("10/05/2014");

                setChildGender("prefer_not_to_say");

          {/* Child Gender Selection */}                

          <Text style={styles.label}>Child's Gender</Text>                // Optionally navigate to child management screen

          <View style={styles.genderContainer}>                // router.push("/(dashboard)/parent/children");

            <TouchableOpacity              }

              style={[            }

                styles.genderButton,          ]

                childGender === 'male' && styles.genderButtonSelected        );

              ]}      } else {

              onPress={() => setChildGender('male')}        // Handle different error cases based on backend response

            >        if (response.status === 403) {

              <Text style={[          Alert.alert("Access Denied", data.message || "Only parents can generate codes for children.");

                styles.genderText,        } else if (response.status === 400) {

                childGender === 'male' && styles.genderTextSelected          Alert.alert("Invalid Data", data.message || "Please check the information and try again.");

              ]}>Male</Text>        } else if (response.status === 404) {

            </TouchableOpacity>          Alert.alert("Profile Not Found", data.message || "Parent profile not found. Please contact support.");

            <TouchableOpacity        } else {

              style={[          Alert.alert("Failed to Generate Code", data.message || "Something went wrong. Please try again.");

                styles.genderButton,        }

                childGender === 'female' && styles.genderButtonSelected      }

              ]}    } catch (error) {

              onPress={() => setChildGender('female')}      console.error("Generate Code Error:", error);

            >      Alert.alert(

              <Text style={[        "Network Error", 

                styles.genderText,        "Unable to connect to server. Please check your internet connection and try again."

                childGender === 'female' && styles.genderTextSelected      );

              ]}>Female</Text>    } finally {

            </TouchableOpacity>      setIsLoading(false);

            <TouchableOpacity    }

              style={[  };

                styles.genderButton,

                childGender === 'prefer_not_to_say' && styles.genderButtonSelected  return (

              ]}    <SafeAreaView style={styles.safe}>

              onPress={() => setChildGender('prefer_not_to_say')}      {/* Logout Button in Header */}

            >      <View style={styles.headerContainer}>

              <Text style={[        <Text style={styles.header}>Generate Child Code</Text>

                styles.genderText,        <TouchableOpacity 

                childGender === 'prefer_not_to_say' && styles.genderTextSelected          onPress={handleLogout}

              ]}>Prefer not to say</Text>          style={styles.logoutButton}

            </TouchableOpacity>        >

          </View>          <Ionicons name="log-out-outline" size={24} color="#ef4444" />

        </TouchableOpacity>

          {/* Generate Code Button */}      </View>

          <TouchableOpacity 

            style={[styles.button, isLoading && styles.buttonDisabled]}       <ScrollView contentContainerStyle={styles.container}>

            onPress={handleGenerateCode}        {/* Card */}

            disabled={isLoading}        <View style={styles.card}>

          >          <Text style={styles.sectionTitle}>Child Account Setup</Text>

            <LinearGradient          <Text style={styles.description}>

              colors={["#6C33FF", "#4C00C9"]}            Generate a one-time code for your child to create their account. 

              start={{ x: 0, y: 0 }}            The code will expire in 24 hours.

              end={{ x: 1, y: 1 }}          </Text>

              style={styles.gradient}

            >          {/* Child Name */}

              <Text style={styles.buttonText}>          <Text style={styles.label}>Child's Name *</Text>

                {isLoading ? "Generating Code..." : "Generate One-Time Code"}          <TextInput

              </Text>            style={styles.input}

            </LinearGradient>            placeholder="Enter child's full name"

          </TouchableOpacity>>>>>>>> a1a9ca42cf06c30071ec1224ccd9881413578144

            placeholderTextColor="#999"

          {/* Information Box */}            value={childName}

          <View style={styles.infoBox}>            onChangeText={setChildName}

            <Ionicons name="information-circle-outline" size={20} color="#4C00C9" />          />

            <Text style={styles.infoText}>

              Your child will use this code to create their account. The code expires in 24 hours.<<<<<<< HEAD

            </Text>          {/* Email */}

          </View>          <Text style={styles.label}>Enter Email</Text>

          <TextInput

          {/* Additional Logout Button at Bottom */}            style={styles.input}

          <TouchableOpacity             placeholder="Enter email"

            style={styles.bottomLogoutButton}            placeholderTextColor="#999"

            onPress={handleLogout}            keyboardType="email-address"

          >            value={email}

            <Ionicons name="log-out-outline" size={20} color="#ef4444" />            onChangeText={setEmail}

            <Text style={styles.bottomLogoutText}>Log Out</Text>          />

          </TouchableOpacity>          <Text style={styles.subNote}>An OTP will be sent to your child</Text>

        </View>

      </ScrollView>          {/* Date of Birth */}

    </SafeAreaView>          <Text style={styles.label}>Child’s Date of Birth</Text>

  );          <TouchableOpacity

};            style={styles.dateInput}

            onPress={() => setShowPicker(true)}

export default CreateChildAccount;          >

            <Text

const styles = StyleSheet.create({              style={[

  safe: {                styles.dateText,

    flex: 1,                !dob && { color: "#999" },

    backgroundColor: "#fff",              ]}

  },            >

  headerContainer: {              {formattedDob}

    flexDirection: "row",            </Text>

    justifyContent: "space-between",            <Ionicons name="calendar-outline" size={20} color="#777" />

    alignItems: "center",          </TouchableOpacity>

    paddingHorizontal: 20,

    paddingVertical: 15,          {showPicker && (

    backgroundColor: "#fff",            <DateTimePicker

    borderBottomWidth: 1,              value={dob || new Date()}

    borderBottomColor: "#f0f0f0",              mode="date"

  },              display="default"

  container: {              maximumDate={new Date()}

    alignItems: "center",              onChange={handleDateChange}

    paddingBottom: 30,            />

    paddingTop: 20,          )}

  },

  header: {          {/* Avatar Selection */}

    fontFamily: "Poppins-SemiBold",          <Text style={styles.label}>Choose Avatar</Text>

    fontSize: 20,          <View style={styles.avatarContainer}>

    color: "#4C00C9",            {avatarPaths.map((avatar, index) => (

  },              <TouchableOpacity

  card: {                key={index}

    backgroundColor: "#B7B1B1",                style={[

    borderRadius: 20,                  styles.avatarWrapper,

    width: "90%",                  selectedAvatar === index && styles.selectedAvatar,

    paddingVertical: 25,                ]}

    paddingHorizontal: 20,                onPress={() => setSelectedAvatar(index)}

  },              >

  sectionTitle: {                <Image source={avatar} style={styles.avatar} />

    fontFamily: "Poppins-SemiBold",              </TouchableOpacity>

    fontSize: 18,            ))}

    color: "#222",          </View>

    marginBottom: 8,

    textAlign: "center",          {/* Setup Button */}

  },          <TouchableOpacity style={styles.button} onPress={handleSetup}>

  description: {=======

    fontFamily: "Poppins-Regular",          {/* Child Email */}

    fontSize: 12,          <Text style={styles.label}>Child's Email *</Text>

    color: "#444",          <TextInput

    textAlign: "center",            style={styles.input}

    marginBottom: 20,            placeholder="Enter child's email address"

    lineHeight: 16,            placeholderTextColor="#999"

  },            keyboardType="email-address"

  label: {            value={childEmail}

    fontFamily: "Poppins-SemiBold",            onChangeText={setChildEmail}

    color: "#333",            autoCapitalize="none"

    fontSize: 14,          />

    marginTop: 15,

    marginBottom: 5,          {/* Date of Birth */}

  },          <Text style={styles.label}>Child's Date of Birth *</Text>

  input: {          <View style={styles.dateInput}>

    backgroundColor: "#EFEAEA",            <TextInput

    borderRadius: 10,              style={styles.dateTextInput}

    paddingHorizontal: 15,              value={childDOB}

    paddingVertical: 12,              onChangeText={setChildDOB}

    fontFamily: "Poppins-Regular",              placeholder="MM/DD/YYYY"

    fontSize: 14,            />

    color: "#333",            <Ionicons name="calendar-outline" size={20} color="#777" />

  },          </View>

  subNote: {          <Text style={styles.subNote}>Format: MM/DD/YYYY</Text>

    fontFamily: "Poppins-Regular",

    fontSize: 11,          {/* Child Gender Selection */}

    color: "#666",          <Text style={styles.label}>Child's Gender</Text>

    marginTop: 4,          <View style={styles.genderContainer}>

    marginLeft: 5,            <TouchableOpacity

  },              style={[

  dateInput: {                styles.genderButton,

    backgroundColor: "#EFEAEA",                childGender === 'male' && styles.genderButtonSelected

    borderRadius: 10,              ]}

    paddingHorizontal: 15,              onPress={() => setChildGender('male')}

    paddingVertical: 12,            >

    flexDirection: "row",              <Text style={[

    justifyContent: "space-between",                styles.genderText,

    alignItems: "center",                childGender === 'male' && styles.genderTextSelected

  },              ]}>Male</Text>

  dateTextInput: {            </TouchableOpacity>

    flex: 1,            <TouchableOpacity

    fontFamily: "Poppins-Regular",              style={[

    fontSize: 14,                styles.genderButton,

    color: "#333",                childGender === 'female' && styles.genderButtonSelected

  },              ]}

  genderContainer: {              onPress={() => setChildGender('female')}

    flexDirection: "row",            >

    justifyContent: "space-between",              <Text style={[

    marginTop: 5,                styles.genderText,

  },                childGender === 'female' && styles.genderTextSelected

  genderButton: {              ]}>Female</Text>

    flex: 1,            </TouchableOpacity>

    marginHorizontal: 4,            <TouchableOpacity

    paddingVertical: 10,              style={[

    borderRadius: 8,                styles.genderButton,

    backgroundColor: "#EFEAEA",                childGender === 'prefer_not_to_say' && styles.genderButtonSelected

    alignItems: "center",              ]}

    borderWidth: 1,              onPress={() => setChildGender('prefer_not_to_say')}

    borderColor: "transparent",            >

  },              <Text style={[

  genderButtonSelected: {                styles.genderText,

    backgroundColor: "#4C00C9",                childGender === 'prefer_not_to_say' && styles.genderTextSelected

    borderColor: "#4C00C9",              ]}>Prefer not to say</Text>

  },            </TouchableOpacity>

  genderText: {          </View>

    fontFamily: "Poppins-Regular",

    fontSize: 12,          {/* Generate Code Button */}

    color: "#333",          <TouchableOpacity 

  },            style={[styles.button, isLoading && styles.buttonDisabled]} 

  genderTextSelected: {            onPress={handleGenerateCode}

    color: "#fff",            disabled={isLoading}

    fontFamily: "Poppins-SemiBold",          >

  },>>>>>>> a1a9ca42cf06c30071ec1224ccd9881413578144

  button: {            <LinearGradient

    marginTop: 25,              colors={["#6C33FF", "#4C00C9"]}

    alignSelf: "center",              start={{ x: 0, y: 0 }}

    width: "100%",              end={{ x: 1, y: 1 }}

    borderRadius: 30,              style={styles.gradient}

    overflow: "hidden",            >

    shadowColor: "#000",<<<<<<< HEAD

    shadowOffset: { width: 0, height: 2 },              <Text style={styles.buttonText}>Setup</Text>

    shadowOpacity: 0.1,            </LinearGradient>

    shadowRadius: 4,          </TouchableOpacity>

    elevation: 3,        </View>

  },      </ScrollView>

  buttonDisabled: {

    opacity: 0.6,      {/* ✅ Popup Feedback */}

  },      {popupType && (

  gradient: {        <Animated.View

    paddingVertical: 15,          style={[

    borderRadius: 30,            styles.popup,

    alignItems: "center",            {

  },              opacity: fadeAnim,

  buttonText: {              backgroundColor:

    fontFamily: "Poppins-SemiBold",                popupType === "success"

    fontSize: 16,                  ? "rgba(76,175,80,0.95)"

    color: "#fff",                  : "rgba(244,67,54,0.95)",

  },            },

  infoBox: {          ]}

    flexDirection: "row",        >

    alignItems: "flex-start",          <Ionicons

    backgroundColor: "rgba(76, 0, 201, 0.1)",            name={

    padding: 15,              popupType === "success" ? "checkmark-circle" : "alert-circle"

    borderRadius: 10,            }

    marginTop: 20,            size={50}

  },            color="#fff"

  infoText: {          />

    fontFamily: "Poppins-Regular",          <Text style={styles.popupText}>

    fontSize: 12,            {popupType === "success"

    color: "#4C00C9",              ? "Child account created successfully!"

    marginLeft: 10,              : "Please fill all fields and select an avatar."}

    flex: 1,          </Text>

    lineHeight: 16,        </Animated.View>

  },      )}

  logoutButton: {    </SafeAreaView>

    padding: 8,  );

    borderRadius: 8,}

    backgroundColor: "rgba(239, 68, 68, 0.1)",

  },const styles = StyleSheet.create({

  bottomLogoutButton: {  safe: { flex: 1, backgroundColor: "#fff" },

    flexDirection: "row",  container: { alignItems: "center", paddingVertical: 30 },

    alignItems: "center",=======

    justifyContent: "center",              <Text style={styles.buttonText}>

    marginTop: 25,                {isLoading ? "Generating Code..." : "Generate One-Time Code"}

    padding: 12,              </Text>

    borderRadius: 10,            </LinearGradient>

    backgroundColor: "rgba(239, 68, 68, 0.05)",          </TouchableOpacity>

    borderWidth: 1,

    borderColor: "rgba(239, 68, 68, 0.2)",          {/* Information Box */}

  },          <View style={styles.infoBox}>

  bottomLogoutText: {            <Ionicons name="information-circle-outline" size={20} color="#4C00C9" />

    marginLeft: 8,            <Text style={styles.infoText}>

    color: "#ef4444",              Your child will use this code to create their account. The code expires in 24 hours.

    fontFamily: "Poppins-SemiBold",            </Text>

    fontSize: 14,          </View>

  },

});          {/* Additional Logout Button at Bottom */}
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
>>>>>>> a1a9ca42cf06c30071ec1224ccd9881413578144
  header: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 20,
    color: "#4C00C9",
<<<<<<< HEAD
    marginBottom: 20,
=======
>>>>>>> a1a9ca42cf06c30071ec1224ccd9881413578144
  },
  card: {
    backgroundColor: "#B7B1B1",
    borderRadius: 20,
<<<<<<< HEAD
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
=======
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
>>>>>>> a1a9ca42cf06c30071ec1224ccd9881413578144
  },
  input: {
    backgroundColor: "#EFEAEA",
    borderRadius: 10,
    paddingHorizontal: 15,
<<<<<<< HEAD
    paddingVertical: 10,
    fontFamily: "Poppins-Regular",
    fontSize: 13,
    color: "#333",
    marginTop: 5,
=======
    paddingVertical: 12,
    fontFamily: "Poppins-Regular",
    fontSize: 14,
    color: "#333",
>>>>>>> a1a9ca42cf06c30071ec1224ccd9881413578144
  },
  subNote: {
    fontFamily: "Poppins-Regular",
    fontSize: 11,
<<<<<<< HEAD
    color: "#2F55BD",
    marginTop: 5,
=======
    color: "#666",
    marginTop: 4,
    marginLeft: 5,
>>>>>>> a1a9ca42cf06c30071ec1224ccd9881413578144
  },
  dateInput: {
    backgroundColor: "#EFEAEA",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
<<<<<<< HEAD
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
=======
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
>>>>>>> a1a9ca42cf06c30071ec1224ccd9881413578144
  },
  button: {
    marginTop: 25,
    alignSelf: "center",
    width: "100%",
    borderRadius: 30,
    overflow: "hidden",
<<<<<<< HEAD
  },
  gradient: {
    paddingVertical: 12,
=======
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
>>>>>>> a1a9ca42cf06c30071ec1224ccd9881413578144
    borderRadius: 30,
    alignItems: "center",
  },
  buttonText: {
    fontFamily: "Poppins-SemiBold",
<<<<<<< HEAD
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
=======
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
>>>>>>> a1a9ca42cf06c30071ec1224ccd9881413578144
