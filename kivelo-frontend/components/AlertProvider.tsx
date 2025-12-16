import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Platform,
  Pressable,
  Dimensions,
} from 'react-native';
import { registerWebAlertHandler, unregisterWebAlertHandler } from '@/utils/showAlert';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

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

// Get emoji/icon based on title content
const getAlertIcon = (title: string): { name: string; color: string } => {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes('success') || lowerTitle.includes('🎉') || lowerTitle.includes('✅')) {
    return { name: 'checkmark-circle', color: '#10B981' };
  }
  if (lowerTitle.includes('error') || lowerTitle.includes('failed') || lowerTitle.includes('❌')) {
    return { name: 'close-circle', color: '#EF4444' };
  }
  if (lowerTitle.includes('warning') || lowerTitle.includes('⚠️')) {
    return { name: 'warning', color: '#F59E0B' };
  }
  if (lowerTitle.includes('oops') || lowerTitle.includes('🤔') || lowerTitle.includes('😅')) {
    return { name: 'alert-circle', color: '#F59E0B' };
  }
  if (lowerTitle.includes('coming soon') || lowerTitle.includes('🍎')) {
    return { name: 'time', color: '#8B5CF6' };
  }
  if (lowerTitle.includes('almost') || lowerTitle.includes('📝')) {
    return { name: 'document-text', color: '#3B82F6' };
  }
  return { name: 'information-circle', color: '#3B82F6' };
};

// Clean title of emojis for display
const cleanTitle = (title: string): string => {
  return title.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]/gu, '').trim();
};

/**
 * AlertProvider - Provides beautiful modal alerts for all platforms
 * Wrap your app with this component to enable styled alerts
 */
export function AlertProvider({ children }: AlertProviderProps) {
  const [alert, setAlert] = useState<AlertState>({
    visible: false,
    title: '',
    message: undefined,
    buttons: [],
  });

  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);

  const showAlert = useCallback((title: string, message?: string, buttons?: AlertButton[]) => {
    setAlert({
      visible: true,
      title,
      message,
      buttons: buttons || [{ text: 'OK', style: 'default' }],
    });
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
    opacity.value = withTiming(1, { duration: 200 });
  }, []);

  const hideAlert = useCallback((button?: AlertButton) => {
    scale.value = withTiming(0.9, { duration: 150 });
    opacity.value = withTiming(0, { duration: 150 });
    
    setTimeout(() => {
      setAlert(prev => ({ ...prev, visible: false }));
      // Execute button callback after modal closes
      setTimeout(() => {
        button?.onPress?.();
      }, 50);
    }, 150);
  }, []);

  useEffect(() => {
    // Register for all platforms now
    registerWebAlertHandler(showAlert);
    return () => unregisterWebAlertHandler();
  }, [showAlert]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  // Sort buttons: cancel first (left), then others
  const sortedButtons = [...alert.buttons].sort((a, b) => {
    if (a.style === 'cancel') return -1;
    if (b.style === 'cancel') return 1;
    return 0;
  });

  const icon = getAlertIcon(alert.title);
  const displayTitle = cleanTitle(alert.title);

  return (
    <>
      {children}
      <Modal
        visible={alert.visible}
        transparent
        animationType="fade"
        onRequestClose={() => hideAlert()}
        statusBarTranslucent
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
          <Animated.View style={[styles.container, animatedContainerStyle]}>
            <Pressable onPress={(e) => e.stopPropagation()}>
              {/* Icon */}
              <View style={[styles.iconContainer, { backgroundColor: icon.color + '15' }]}>
                <Ionicons name={icon.name as any} size={32} color={icon.color} />
              </View>

              {/* Title */}
              <Text style={styles.title}>{displayTitle}</Text>
              
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
          </Animated.View>
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
    padding: 24,
  },
  container: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    paddingTop: 28,
    maxWidth: 340,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.2,
    shadowRadius: 25,
    elevation: 15,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    color: '#6B7280',
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
    paddingHorizontal: 20,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  buttonHorizontal: {
    flex: 1,
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  destructiveButton: {
    backgroundColor: '#FEE2E2',
  },
  defaultButton: {
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: '#6B7280',
  },
  destructiveButtonText: {
    color: '#DC2626',
  },
  defaultButtonText: {
    color: 'white',
  },
});

export default AlertProvider;
