import { Alert, Platform } from 'react-native';

// Button type for alerts
interface AlertButton {
  text?: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

// Store reference to the custom alert render function (set by AlertProvider)
let customAlertHandler: ((title: string, message?: string, buttons?: AlertButton[]) => void) | null = null;

/**
 * Register the custom alert handler (called by AlertProvider)
 */
export function registerWebAlertHandler(handler: (title: string, message?: string, buttons?: AlertButton[]) => void) {
  customAlertHandler = handler;
}

/**
 * Unregister the custom alert handler
 */
export function unregisterWebAlertHandler() {
  customAlertHandler = null;
}

/**
 * Cross-platform alert utility for React Native + Web.
 * Uses beautiful custom modal on all platforms when AlertProvider is mounted.
 * Falls back to native Alert on mobile if AlertProvider is not available.
 */
export function showAlert(title: string, message?: string, buttons?: AlertButton[]) {
  // Use custom alert handler if available (works on all platforms)
  if (customAlertHandler) {
    customAlertHandler(title, message, buttons);
    return;
  }

  // Fallback for web without AlertProvider
  if (Platform.OS === 'web') {
    const hasCancel = buttons?.some(b => b.style === 'cancel');
    const primaryButton = buttons?.find(b => b.style !== 'cancel') || buttons?.[0];
    
    if (hasCancel && buttons && buttons.length > 1) {
      const confirmed = window.confirm(`${title}${message ? '\n\n' + message : ''}`);
      if (confirmed && primaryButton?.onPress) {
        primaryButton.onPress();
      } else if (!confirmed) {
        const cancelButton = buttons.find(b => b.style === 'cancel');
        cancelButton?.onPress?.();
      }
    } else {
      window.alert(`${title}${message ? '\n\n' + message : ''}`);
      if (primaryButton?.onPress) {
        primaryButton.onPress();
      }
    }
  } else {
    // Fallback for native without AlertProvider
    Alert.alert(title, message, buttons);
  }
}
