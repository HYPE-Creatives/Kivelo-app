import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Platform,
  Pressable,
} from 'react-native';
import { registerWebAlertHandler, unregisterWebAlertHandler } from '@/utils/showAlert';

interface AlertButton {
  text?: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertState {
  visible: boolean;
  title: string;
  message?: string;
  buttons: AlertButton[];
}

interface AlertProviderProps {
  children: React.ReactNode;
}

/**
 * AlertProvider - Provides beautiful modal alerts for web platform
 * Wrap your app with this component to enable styled alerts on web
 */
export function AlertProvider({ children }: AlertProviderProps) {
  const [alert, setAlert] = useState<AlertState>({
    visible: false,
    title: '',
    message: undefined,
    buttons: [],
  });

  const showAlert = useCallback((title: string, message?: string, buttons?: AlertButton[]) => {
    setAlert({
      visible: true,
      title,
      message,
      buttons: buttons || [{ text: 'OK', style: 'default' }],
    });
  }, []);

  const hideAlert = useCallback((button?: AlertButton) => {
    setAlert(prev => ({ ...prev, visible: false }));
    // Execute button callback after modal closes
    setTimeout(() => {
      button?.onPress?.();
    }, 100);
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') {
      registerWebAlertHandler(showAlert);
      return () => unregisterWebAlertHandler();
    }
  }, [showAlert]);

  // Only render modal on web
  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }

  // Sort buttons: cancel first (left), then others
  const sortedButtons = [...alert.buttons].sort((a, b) => {
    if (a.style === 'cancel') return -1;
    if (b.style === 'cancel') return 1;
    return 0;
  });

  return (
    <>
      {children}
      <Modal
        visible={alert.visible}
        transparent
        animationType="fade"
        onRequestClose={() => hideAlert()}
      >
        <Pressable 
          style={styles.overlay} 
          onPress={() => {
            // Close on backdrop tap if there's a cancel button
            const cancelBtn = alert.buttons.find(b => b.style === 'cancel');
            if (cancelBtn) {
              hideAlert(cancelBtn);
            }
          }}
        >
          <Pressable style={styles.container} onPress={(e) => e.stopPropagation()}>
            {/* Title */}
            <Text style={styles.title}>{alert.title}</Text>
            
            {/* Message */}
            {alert.message && (
              <Text style={styles.message}>{alert.message}</Text>
            )}
            
            {/* Buttons */}
            <View style={[
              styles.buttonContainer,
              sortedButtons.length > 2 && styles.buttonContainerVertical
            ]}>
              {sortedButtons.map((button, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.button,
                    sortedButtons.length <= 2 && styles.buttonHorizontal,
                    button.style === 'cancel' && styles.cancelButton,
                    button.style === 'destructive' && styles.destructiveButton,
                    button.style !== 'cancel' && button.style !== 'destructive' && styles.defaultButton,
                  ]}
                  onPress={() => hideAlert(button)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.buttonText,
                    button.style === 'cancel' && styles.cancelButtonText,
                    button.style === 'destructive' && styles.destructiveButtonText,
                    button.style !== 'cancel' && button.style !== 'destructive' && styles.defaultButtonText,
                  ]}>
                    {button.text || 'OK'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    maxWidth: 400,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    color: '#4a4a4a',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  buttonContainerVertical: {
    flexDirection: 'column',
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  buttonHorizontal: {
    flex: 1,
  },
  cancelButton: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  destructiveButton: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  defaultButton: {
    backgroundColor: '#16A34A',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: '#475569',
  },
  destructiveButtonText: {
    color: '#dc2626',
  },
  defaultButtonText: {
    color: 'white',
  },
});

export default AlertProvider;
