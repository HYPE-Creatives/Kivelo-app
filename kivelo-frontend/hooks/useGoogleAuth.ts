import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform, Linking } from 'react-native';
import { showAlert } from '@/utils/showAlert';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_IDS = {
  web: '765956834253-ham5mqf94dkcnqlvlhf68lg1lqkqtfnq.apps.googleusercontent.com',
};

const WEB_REDIRECT_URI = 'https://hype-creatives.github.io/Kivelo-app/';

interface GoogleAuthResponse {
  code: string;
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
   * Handle OAuth callback (WEB ONLY)
   */
  useEffect(() => {
    if (!isWeb || typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const error = params.get('error');

    if (error) {
      showAlert('Google Login Failed', error);
      window.history.replaceState({}, '', WEB_REDIRECT_URI);
      return;
    }

    if (!code) return;

    setLoading(true);

    // Clean URL immediately
    window.history.replaceState({}, '', WEB_REDIRECT_URI);

    onSuccessRef
      .current({ code })
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
   * Start Google OAuth
   */
  const handleGoogleLogin = useCallback(async () => {
    // For mobile - open Google OAuth in browser
    if (!isWeb) {
      setLoading(true);
      
      try {
        const params = new URLSearchParams({
          client_id: GOOGLE_CLIENT_IDS.web,
          redirect_uri: WEB_REDIRECT_URI,
          response_type: 'code',
          scope: 'openid profile email',
          access_type: 'offline',
          prompt: 'select_account',
        });

        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
        
        // Open in system browser - user will complete auth there
        // Then they can copy/paste or the web app handles it
        await WebBrowser.openBrowserAsync(authUrl);
      } catch (error: any) {
        console.error('Google login error:', error);
        showAlert('Error', 'Failed to open Google Sign-In');
      } finally {
        setLoading(false);
      }
      return;
    }

    // For web - redirect flow
    setLoading(true);

    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_IDS.web,
      redirect_uri: WEB_REDIRECT_URI,
      response_type: 'code',
      scope: 'openid profile email',
      access_type: 'offline',
      prompt: 'select_account',
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    // OAuth must happen in the same window
    window.location.href = authUrl;
  }, [isWeb]);

  return {
    googleLoading: loading,
    googleRequest: { ready },
    handleGoogleLogin,
  };
};
