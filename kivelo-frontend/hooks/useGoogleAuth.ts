import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { showAlert } from '@/utils/showAlert';

const GOOGLE_CLIENT_IDS = {
  web: "765956834253-ham5mqf94dkcnqlvlhf68lg1lqkqtfnq.apps.googleusercontent.com",
  ios: "765956834253-4btchsr2mgarvqr09r5sto9vum76hjc8.apps.googleusercontent.com", 
  android: "765956834253-iqe4gdf3mar2nu482nu48i66v428bfdp.apps.googleusercontent.com",
};

interface GoogleAuthResponse {
  idToken: string | null;
  accessToken: string | null;
}

export const useGoogleAuth = (onSuccess: (tokens: GoogleAuthResponse) => Promise<void>) => {
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const onSuccessRef = useRef(onSuccess);
  
  // Keep ref updated
  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  const isExpoGo = Constants.appOwnership === 'expo';
  const isWeb = Platform.OS === 'web';
  const isMobileExpoGo = isExpoGo && !isWeb;

  // Generate random nonce
  const generateNonce = () => {
    const array = new Uint8Array(32);
    if (typeof window !== 'undefined' && window.crypto) {
      window.crypto.getRandomValues(array);
    }
    return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
  };

  // Check URL for OAuth callback (for web)
  useEffect(() => {
    if (!isWeb || typeof window === 'undefined') {
      setReady(true);
      return;
    }

    console.log('🔍 useGoogleAuth mounted, checking URL...');
    console.log('📍 Current URL:', window.location.href);
    console.log('📍 Hash:', window.location.hash);

    // Check if URL has id_token (OAuth callback)
    const hash = window.location.hash;
    if (hash && hash.includes('id_token=')) {
      const params = new URLSearchParams(hash.substring(1));
      const idToken = params.get('id_token');
      
      if (idToken) {
        console.log('🔐 Found id_token in URL, processing...');
        console.log('🎫 Token length:', idToken.length);
        setLoading(true);
        
        // Clean up URL immediately
        window.history.replaceState(null, '', window.location.pathname);
        
        // Process the token
        onSuccessRef.current({ idToken, accessToken: null })
          .then(() => {
            console.log('✅ onSuccess completed');
          })
          .catch(err => {
            console.error('❌ Google login error:', err);
            showAlert('Google Login Failed', err.message || 'Failed to login with Google');
          })
          .finally(() => setLoading(false));
      }
    }
    
    setReady(true);
  }, [isWeb]); // Remove onSuccess from deps to prevent re-runs

  const handleGoogleLogin = useCallback(async () => {
    if (isMobileExpoGo) {
      showAlert(
        'Not Available in Expo Go', 
        'Google Sign-In requires a production build. Please use email/password login.'
      );
      return;
    }

    if (!isWeb) {
      showAlert('Not Available', 'Google Sign-In is only available on web for now.');
      return;
    }

    setLoading(true);
    
    try {
      const nonce = generateNonce();
      const clientId = GOOGLE_CLIENT_IDS.web;
      // Build redirect URI - handle GitHub Pages subdirectory
      let redirectUri = window.location.origin + '/';
      // If on GitHub Pages (has pathname like /Kivelo-app/), include it
      if (window.location.pathname.startsWith('/Kivelo-app')) {
        redirectUri = window.location.origin + '/Kivelo-app/';
      }
      
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'id_token',
        scope: 'openid profile email',
        nonce: nonce,
        prompt: 'select_account',
      });

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
      
      console.log('🚀 Opening Google OAuth in new window...');
      console.log('📋 Redirect URI:', redirectUri);
      
      // Open in a new window to avoid WebView/embedded browser issues
      // This ensures a proper browser context with standard user agent
      const authWindow = window.open(authUrl, '_blank', 'noopener,noreferrer');
      
      if (!authWindow) {
        // Popup was blocked, fall back to redirect
        console.log('⚠️ Popup blocked, falling back to redirect...');
        window.location.href = authUrl;
      } else {
        // Reset loading since user will come back after OAuth
        setLoading(false);
      }
    } catch (error) {
      console.error('Google login error:', error);
      setLoading(false);
      showAlert('Error', 'Failed to start Google login');
    }
  }, [isWeb, isMobileExpoGo]);

  return {
    googleLoading: loading,
    googleRequest: { ready },
    handleGoogleLogin,
  };
};