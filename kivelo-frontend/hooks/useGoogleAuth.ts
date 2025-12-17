import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import { showAlert } from '@/utils/showAlert';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_IDS = {
  web: '765956834253-ham5mqf94dkcnqlvlhf68lg1lqkqtfnq.apps.googleusercontent.com',
};

const WEB_REDIRECT_URI = 'https://hype-creatives.github.io/Kivelo-app/';

interface GoogleAuthResponse {
  idToken: string | null;
  accessToken: string | null;
}

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
    if (!hash || !hash.includes('id_token=')) return;

    const params = new URLSearchParams(hash.substring(1));
    const idToken = params.get('id_token');
    const accessToken = params.get('access_token');
    const error = params.get('error');

    if (error) {
      showAlert('Google Login Failed', error);
      window.history.replaceState({}, '', WEB_REDIRECT_URI);
      return;
    }

    if (!idToken) return;

    setLoading(true);

    // Clean URL immediately
    window.history.replaceState({}, '', window.location.pathname);

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
    // For mobile - open Google OAuth in browser
    if (!isWeb) {
      setLoading(true);
      
      try {
        const params = new URLSearchParams({
          client_id: GOOGLE_CLIENT_IDS.web,
          redirect_uri: WEB_REDIRECT_URI,
          response_type: 'id_token token',
          scope: 'openid profile email',
          nonce: Math.random().toString(36).substring(2),
          prompt: 'select_account',
        });

        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
        
        await WebBrowser.openBrowserAsync(authUrl);
      } catch (error: any) {
        console.error('Google login error:', error);
        showAlert('Error', 'Failed to open Google Sign-In');
      } finally {
        setLoading(false);
      }
      return;
    }

    // For web - implicit flow redirect
    setLoading(true);

    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_IDS.web,
      redirect_uri: WEB_REDIRECT_URI,
      response_type: 'id_token token',
      scope: 'openid profile email',
      nonce: Math.random().toString(36).substring(2),
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

  return {
    googleLoading: loading,
    googleRequest: { ready },
    handleGoogleLogin,
  };
};
