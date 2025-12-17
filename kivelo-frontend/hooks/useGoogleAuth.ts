import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import { showAlert } from '@/utils/showAlert';
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_IDS = {
  web: '765956834253-ham5mqf94dkcnqlvlhf68lg1lqkqtfnq.apps.googleusercontent.com',
};

const WEB_REDIRECT_URI = 'https://hype-creatives.github.io/Kivelo-app/';
const OAUTH_STATE_KEY = 'kivelo_oauth_state';
const OAUTH_NONCE_KEY = 'kivelo_oauth_nonce';

interface GoogleAuthResponse {
  idToken: string | null;
  accessToken: string | null;
}

/**
 * Generate a cryptographically secure random string
 */
const generateSecureRandom = async (): Promise<string> => {
  try {
    const randomBytes = await Crypto.getRandomBytesAsync(32);
    return Array.from(randomBytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  } catch {
    // Fallback for web or if crypto fails
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
};

export const useGoogleAuth = (
  onSuccess: (payload: GoogleAuthResponse) => Promise<void>
) => {
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(true);

  const onSuccessRef = useRef(onSuccess);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  const isWeb = Platform.OS === 'web';

  /**
   * Handle OAuth callback (WEB ONLY) - Implicit flow returns tokens in hash
   */
  useEffect(() => {
    if (!isWeb || typeof window === 'undefined') return;

    const hash = window.location.hash;
    const queryParams = new URLSearchParams(window.location.search);
    
    // Handle user cancellation or errors in query params (Google returns error in query for cancel)
    const queryError = queryParams.get('error');
    
    if (queryError) {
      // Clean URL immediately
      window.history.replaceState({}, '', window.location.pathname);
      setLoading(false);
      
      if (queryError === 'access_denied') {
        // User cancelled - no alert needed, just silently return
        console.log('User cancelled Google Sign-In');
        return;
      }
      
      showAlert('Google Login Failed', queryError);
      return;
    }
    
    // Check for error in hash as well (some OAuth flows return errors in hash)
    if (hash) {
      const hashParams = new URLSearchParams(hash.substring(1));
      const hashError = hashParams.get('error');
      
      if (hashError) {
        window.history.replaceState({}, '', window.location.pathname);
        setLoading(false);
        
        if (hashError === 'access_denied') {
          console.log('User cancelled Google Sign-In');
          return;
        }
        
        showAlert('Google Login Failed', hashError);
        return;
      }
    }
    
    if (!hash || !hash.includes('id_token=')) return;

    const params = new URLSearchParams(hash.substring(1));
    const idToken = params.get('id_token');
    const accessToken = params.get('access_token');
    const error = params.get('error');
    const returnedState = params.get('state');

    // Clean URL immediately
    window.history.replaceState({}, '', window.location.pathname);

    if (error) {
      if (error === 'access_denied') {
        // User cancelled - no alert needed
        console.log('User cancelled Google Sign-In');
        return;
      }
      showAlert('Google Login Failed', error);
      return;
    }

    // Verify state parameter for CSRF protection
    const storedState = sessionStorage.getItem(OAUTH_STATE_KEY);
    if (storedState && returnedState !== storedState) {
      console.error('OAuth state mismatch - possible CSRF attack');
      showAlert('Security Error', 'Authentication failed due to security check. Please try again.');
      sessionStorage.removeItem(OAUTH_STATE_KEY);
      sessionStorage.removeItem(OAUTH_NONCE_KEY);
      return;
    }

    // Clear stored state
    sessionStorage.removeItem(OAUTH_STATE_KEY);
    sessionStorage.removeItem(OAUTH_NONCE_KEY);

    if (!idToken) {
      showAlert('Google Login Failed', 'No authentication token received');
      return;
    }

    setLoading(true);

    onSuccessRef
      .current({ idToken, accessToken })
      .catch((err) => {
        console.error('❌ Google OAuth error:', err);
        showAlert(
          'Google Login Failed',
          err?.message || 'Unable to authenticate with Google'
        );
      })
      .finally(() => setLoading(false));
  }, [isWeb]);

  /**
   * Start Google OAuth - Implicit flow (returns id_token directly)
   */
  const handleGoogleLogin = useCallback(async () => {
    // Generate secure state and nonce for CSRF and replay protection
    const state = await generateSecureRandom();
    const nonce = await generateSecureRandom();

    // For mobile - open Google OAuth in browser
    if (!isWeb) {
      setLoading(true);
      
      try {
        // Store state for verification (mobile uses AsyncStorage)
        await AsyncStorage.setItem(OAUTH_STATE_KEY, state);
        await AsyncStorage.setItem(OAUTH_NONCE_KEY, nonce);

        const params = new URLSearchParams({
          client_id: GOOGLE_CLIENT_IDS.web,
          redirect_uri: WEB_REDIRECT_URI,
          response_type: 'id_token token',
          scope: 'openid profile email',
          state,
          nonce,
          prompt: 'select_account',
        });

        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
        
        const result = await WebBrowser.openAuthSessionAsync(authUrl, WEB_REDIRECT_URI);
        
        if (result.type === 'cancel' || result.type === 'dismiss') {
          // User cancelled - clean up and return silently
          console.log('User cancelled Google Sign-In');
          await AsyncStorage.removeItem(OAUTH_STATE_KEY);
          await AsyncStorage.removeItem(OAUTH_NONCE_KEY);
          setLoading(false);
          return;
        }
        
        if (result.type === 'success' && result.url) {
          // Parse the returned URL
          const url = new URL(result.url);
          const hashParams = new URLSearchParams(url.hash.substring(1));
          const idToken = hashParams.get('id_token');
          const accessToken = hashParams.get('access_token');
          const returnedState = hashParams.get('state');
          const error = hashParams.get('error');
          
          // Clean up stored values
          const storedState = await AsyncStorage.getItem(OAUTH_STATE_KEY);
          await AsyncStorage.removeItem(OAUTH_STATE_KEY);
          await AsyncStorage.removeItem(OAUTH_NONCE_KEY);
          
          if (error) {
            if (error === 'access_denied') {
              console.log('User cancelled Google Sign-In');
              setLoading(false);
              return;
            }
            showAlert('Google Login Failed', error);
            setLoading(false);
            return;
          }
          
          // Verify state for CSRF protection
          if (storedState && returnedState !== storedState) {
            console.error('OAuth state mismatch - possible CSRF attack');
            showAlert('Security Error', 'Authentication failed due to security check. Please try again.');
            setLoading(false);
            return;
          }
          
          if (!idToken) {
            showAlert('Google Login Failed', 'No authentication token received');
            setLoading(false);
            return;
          }
          
          // Success - call onSuccess
          await onSuccessRef.current({ idToken, accessToken });
        }
      } catch (error: any) {
        console.error('Google login error:', error);
        showAlert('Error', 'Failed to complete Google Sign-In');
        await AsyncStorage.removeItem(OAUTH_STATE_KEY);
        await AsyncStorage.removeItem(OAUTH_NONCE_KEY);
      } finally {
        setLoading(false);
      }
      return;
    }

    // For web - implicit flow redirect
    setLoading(true);

    // Store state in sessionStorage for web (survives redirect)
    sessionStorage.setItem(OAUTH_STATE_KEY, state);
    sessionStorage.setItem(OAUTH_NONCE_KEY, nonce);

    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_IDS.web,
      redirect_uri: WEB_REDIRECT_URI,
      response_type: 'id_token token',
      scope: 'openid profile email',
      state,
      nonce,
      prompt: 'select_account',
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    window.location.href = authUrl;
  }, [isWeb]);

  return {
    googleLoading: loading,
    googleRequest: { ready },
    handleGoogleLogin,
  };
};
