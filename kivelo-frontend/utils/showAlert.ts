import { Alert, Platform } from 'react-native';

// Button type for alerts
interface AlertButton {
  text?: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

// Store reference to the web alert render function (set by AlertProvider)
let webAlertHandler: ((title: string, message?: string, buttons?: AlertButton[]) => void) | null = null;

/**
 * Register the web alert handler (called by AlertProvider)
 */
export function registerWebAlertHandler(handler: (title: string, message?: string, buttons?: AlertButton[]) => void) {
  webAlertHandler = handler;
}

/**
 * Unregister the web alert handler
 */
export function unregisterWebAlertHandler() {
  webAlertHandler = null;
}

/**
 * Cross-platform alert utility for React Native + Web.
 * On web, uses a custom modal dialog with proper button support.
 * On native, uses React Native's Alert.alert.
 */
export function showAlert(title: string, message?: string, buttons?: AlertButton[]) {
  if (Platform.OS === 'web') {
    if (webAlertHandler) {
      // Use the registered modal handler
      webAlertHandler(title, message, buttons);
    } else {
      // Fallback: Use confirm/alert based on buttons
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
        // Execute the first button's onPress if it exists
        if (primaryButton?.onPress) {
          primaryButton.onPress();
        }
      }
    }
  } else {
    Alert.alert(title, message, buttons);
  }
}
