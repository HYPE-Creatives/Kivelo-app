import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";

const { width } = Dimensions.get("window");

export default function OTPVerification() {
  const [otp, setOtp] = useState(["", "", "", ""]);

  const handleKeyPress = (key: string) => {
    const nextIndex = otp.findIndex((digit) => digit === "");
    if (key === "back") {
      // Delete last filled digit
      const lastIndex = otp.slice().reverse().findIndex((d) => d !== "");
      if (lastIndex !== -1) {
        const actualIndex = otp.length - 1 - lastIndex;
        const updated = [...otp];
        updated[actualIndex] = "";
        setOtp(updated);
      }
    } else if (nextIndex !== -1) {
      const updated = [...otp];
      updated[nextIndex] = key;
      setOtp(updated);
    }
  };

  const handleVerify = () => {
    alert(`Entered OTP: ${otp.join("")}`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>OTP Verification</Text>
      <Text style={styles.subtitle}>code just sent to 08***23</Text>

      {/* OTP boxes */}
      <View style={styles.otpContainer}>
        {otp.map((digit, index) => (
          <View key={index} style={styles.otpBox}>
            <Text style={styles.otpText}>{digit}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.resendText}>
        Didn’t get the otp? <Text style={styles.resendLink}>Resend</Text>
      </Text>

      {/* Verify Button */}
      <TouchableOpacity style={styles.verifyButton} onPress={handleVerify}>
        <Text style={styles.verifyText}>Verify</Text>
      </TouchableOpacity>

      {/* Keypad */}
      <View style={styles.keypad}>
        {[
          ["1", "2", "3"],
          ["4", "5", "6"],
          ["7", "8", "9"],
          ["0", "back"],
        ].map((row, rowIndex) => (
          <View key={rowIndex} style={styles.keypadRow}>
            {row.map((key) => (
              <TouchableOpacity
                key={key}
                style={styles.key}
                onPress={() => handleKeyPress(key)}
              >
                <Text style={styles.keyText}>
                  {key === "back" ? "⌫" : key}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 100,
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#000",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#555",
    marginBottom: 30,
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: width * 0.6,
    marginBottom: 20,
  },
  otpBox: {
    width: 50,
    height: 55,
    borderWidth: 1.5,
    borderColor: "#C9C9C9",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  otpText: {
    fontSize: 22,
    fontWeight: "600",
    color: "#000",
  },
  resendText: {
    fontSize: 13,
    color: "#555",
    marginTop: 4,
  },
  resendLink: {
    color: "#6C63FF",
    fontWeight: "600",
  },
  verifyButton: {
    marginTop: 25,
    backgroundColor: "#6C63FF",
    paddingVertical: 14,
    paddingHorizontal: 70,
    borderRadius: 30,
  },
  verifyText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  keypad: {
    marginTop: 50,
  },
  keypadRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 10,
  },
  key: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 10,
  },
  keyText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
  },
});
