import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { LoginMode } from '../types/auth';

interface LoginModeToggleProps {
  mode: LoginMode;
  onModeChange: (mode: LoginMode) => void;
}

export const LoginModeToggle: React.FC<LoginModeToggleProps> = ({ mode, onModeChange }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[
          styles.button, 
          mode === "password" && styles.buttonActive
        ]}
        onPress={() => onModeChange("password")}
      >
        <Text style={[
          styles.buttonText,
          mode === "password" && styles.buttonTextActive
        ]}>
          Password
        </Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[
          styles.button, 
          mode === "oneTimeCode" && styles.buttonActive
        ]}
        onPress={() => onModeChange("oneTimeCode")}
      >
        <Text style={[
          styles.buttonText,
          mode === "oneTimeCode" && styles.buttonTextActive
        ]}>
          One-Time Code
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#e8f5e8",
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonActive: {
    backgroundColor: "#2E8B57",
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2E8B57",
  },
  buttonTextActive: {
    color: "white",
  },
});