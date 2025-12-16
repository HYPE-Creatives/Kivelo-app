import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform, Linking } from 'react-native';
import { showAlert } from '@/utils/showAlert';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';

// Needed to complete auth session on mobile
WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_IDS = {
  web: '765956834253-ham5mqf94dkcnqlvlhf68lg1lqkqtfnq.apps.googleusercontent.com',
};

// Use expo-auth-session's proxy for mobile (avoids disallowed_useragent error)
const EXPO_REDIRECT_URI = AuthSession.makeRedirectUri({
  scheme: 'kivelo-app',
  path: 'oauth',
});

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
    // For mobile - use AuthSession which opens proper system browser
    if (!isWeb) {
      setLoading(true);
      
      try {
        // Use Expo's auth proxy to avoid disallowed_useragent error
        const redirectUri = AuthSession.makeRedirectUri({
          scheme: 'kivelo-app',
          useProxy: true,
        });
        
        const params = new URLSearchParams({
          client_id: GOOGLE_CLIENT_IDS.web,
          redirect_uri: redirectUri,
          response_type: 'code',
          scope: 'openid profile email',
          access_type: 'offline',
          prompt: 'select_account',
        });

        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
        
        console.log('🔐 Opening Google OAuth with redirect:', redirectUri);
        
        // Use openAuthSessionAsync - this uses system browser and handles redirect back
        const result = await WebBrowser.openAuthSessionAsync(
          authUrl,
          redirectUri,
          {
            showInRecents: true,
            preferEphemeralSession: false, // Keep session for better UX
          }
        );
        
        console.log('🔐 Auth session result:', result);
        
        if (result.type === 'success' && result.url) {
          // Extract code from redirect URL
          const url = new URL(result.url);
          const code = url.searchParams.get('code');
          
          if (code) {
            console.log('✅ Got auth code from redirect');
            await onSuccessRef.current({ code });
          } else {
            const error = url.searchParams.get('error');
            showAlert('Google Login Failed', error || 'No authorization code received');
          }
        } else if (result.type === 'cancel') {
          console.log('User cancelled Google Sign-In');
        } else if (result.type === 'dismiss') {
          console.log('Google Sign-In dismissed');
        }
      } catch (error: any) {
        console.error('Google login error:', error);
        showAlert('Error', error?.message || 'Failed to open Google Sign-In');
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
