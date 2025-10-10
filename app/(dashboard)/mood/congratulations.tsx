import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView, // ✅ was missing
  Image,        // ✅ was missing
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const OrderConfirmationScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      {/* Top Section - Image Area */}
      <View style={styles.imageSection}>
        <Image
          source={require("../../../assets/images/gile.png")}
          style={styles.image}
        />
      </View>

      {/* Bottom Section - Text + Actions */}
      <View style={styles.bottomSection}>
        {/* Thank You Message */}
        <View style={styles.messageContainer}>
          <Text style={styles.thankYouText}>
            Thanks for sharing{"\n"}how you feel
          </Text>

          <Text style={styles.orderNumber}>
            Want to write a quick note about this feeling in your journal?
          </Text>
        </View>

        {/* Primary Button */}
        <TouchableOpacity style={styles.primaryButton}>
          <LinearGradient
            colors={["rgba(34,139,34,1)", "rgba(50,205,50,1)"]} // 🔴 red gradient
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.primaryButtonBackground}
          >
            <Text style={styles.primaryButtonText}>Write in Journal</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Secondary Button */}
        <TouchableOpacity style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default OrderConfirmationScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3efee",
  },

  /** TOP SECTION */
  imageSection: {
    flex: 1,
    backgroundColor: "#f3efee",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 30,
  },
  image: {
    width: 400,
    height: 400,
    marginBottom: -108,
    resizeMode: "contain",
  },

  /** BOTTOM SECTION */
  bottomSection: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: 20,
    paddingVertical: 30,
    alignItems: "center",
    justifyContent: "flex-start",

    // Shadow for iOS
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,

    // Shadow for Android
    elevation: 6,
  },

  /** MESSAGE SECTION */
  messageContainer: {
    alignItems: "center",
    marginBottom: 30,
  },

  thankYouText: {
    lineHeight: 22,
    fontSize: 20,
    fontFamily: "Poppins-SemiBold",
    color: "#000",
    textAlign: "center",
    marginVertical: 13,
  },
  orderNumber: {
    marginBottom: -22,
    fontSize: 10,
    textAlign: "center",
    width: 250,
    color: "#555",
    fontFamily: "Poppins-Regular",
  },

  /** BUTTONS */
  primaryButton: {
    width: "90%",
    borderRadius: 50,
    alignItems: "center",
    marginBottom: 6,
    overflow: "hidden", // ✅ needed so gradient rounds properly
  },
  primaryButtonBackground: {
    paddingVertical: 17,
    alignItems: "center",
    borderRadius: 50,
    width: "100%",
  },
  primaryButtonText: {
    color: "#fff", // ✅ white text for red gradient
    fontWeight: "600",
    fontSize: 13,
  },

  secondaryButton: {
    backgroundColor: "#EAEAEA",
    width: "90%",
    paddingVertical: 17,
    borderRadius: 50,
    alignItems: "center",
    marginBottom: 30,
  },
  secondaryButtonText: {
    color: "#333",
    fontWeight: "500",
    fontSize: 13,
  },
});
