import React from 'react';
import { TouchableOpacity, View, Text, Image, StyleSheet } from 'react-native';

interface GoogleLoginButtonProps {
  onPress: () => void;
  loading: boolean;
  disabled: boolean;
}

export const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({ 
  onPress, 
  loading, 
  disabled 
}) => {
  return (
    <TouchableOpacity 
      style={[
        styles.button,
        disabled && styles.buttonDisabled
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={styles.buttonContent}>
        <Image 
          source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }}
          style={styles.logo}
        />
        <Text style={styles.buttonText}>
          {loading ? 'Loading...' : 'Google'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flex: 1,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logo: {
    width: 18,
    height: 18,
  },
  buttonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});