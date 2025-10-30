import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const SecureCodeScreen = () => {
  const code = "472913";

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {/* Back Button */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#555" />
        </TouchableOpacity>
        <Ionicons name="notifications-outline" size={22} color="#8aa4c5" />
      </View>

      {/* Envelope Image */}
      <View style={styles.imageContainer}>
        <Image
          source={{
            uri: "https://img.icons8.com/color/96/open-envelope.png",
          }}
          style={styles.image}
        />
      </View>

      {/* Text */}
      <Text style={styles.title}>
        Share this secure code with your child to connect safely.
      </Text>

      {/* Code Box */}
      <LinearGradient
        colors={["#4A90E2", "#357ABD"]}
        style={styles.codeBox}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.code}>{code}</Text>
        <Text style={styles.expiry}>Code expires in 15 minutes</Text>

        <View style={styles.privateNote}>
          <View style={styles.dot} />
          <Text style={styles.privateText}>
            This code is private. Only share it with your child!
          </Text>
        </View>
      </LinearGradient>

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.shareButton}>
          <Ionicons name="share-outline" size={18} color="#555" />
          <Text style={styles.shareText}>Share code</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.copyButton}>
          <Ionicons name="copy-outline" size={18} color="#fff" />
          <Text style={styles.copyText}>Copy code</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default SecureCodeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E8F2FF",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  header: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  backButton: {
    backgroundColor: "#F3F6FA",
    padding: 8,
    borderRadius: 20,
  },
  imageContainer: {
    marginTop: 40,
    backgroundColor: "white",
    borderRadius: 100,
    padding: 25,
    elevation: 3,
  },
  image: {
    width: 80,
    height: 80,
  },
  title: {
    fontSize: 15,
    textAlign: "center",
    color: "#555",
    marginTop: 20,
    marginHorizontal: 15,
    lineHeight: 22,
  },
  codeBox: {
    width: "90%",
    marginTop: 30,
    borderRadius: 15,
    paddingVertical: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
  },
  code: {
    color: "white",
    fontSize: 36,
    fontWeight: "bold",
    letterSpacing: 5,
  },
  expiry: {
    color: "#E8EDFF",
    fontSize: 13,
    marginTop: 8,
  },
  privateNote: {
    backgroundColor: "rgba(255,255,255,0.15)",
    marginTop: 15,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFD700",
    marginRight: 6,
  },
  privateText: {
    color: "#fff",
    fontSize: 12,
    flex: 1,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 40,
    width: "90%",
  },
  shareButton: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 25,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    marginRight: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
  },
  shareText: {
    color: "#555",
    marginLeft: 6,
    fontWeight: "600",
  },
  copyButton: {
    flex: 1,
    backgroundColor: "#8B5CF6",
    borderRadius: 25,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
  },
  copyText: {
    color: "#fff",
    marginLeft: 6,
    fontWeight: "600",
  },
});
