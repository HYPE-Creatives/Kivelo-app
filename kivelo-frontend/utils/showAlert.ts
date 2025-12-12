import { Alert, Platform } from 'react-native';

/**
 * Cross-platform alert utility for React Native + Web.
 * Falls back to window.alert on web.
 */
export function showAlert(title: string, message?: string, buttons?: any) {
  if (Platform.OS === 'web') {
    window.alert(`${title}${message ? '\n' + message : ''}`);
  } else {
    Alert.alert(title, message, buttons);
  }
}
