import { useState, useCallback, useRef, useEffect } from 'react';
import { showAlert } from '@/utils/showAlert';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';

interface GoogleAuthResponse {
  idToken: string | null;
  accessToken: string | null;
}

interface UseGoogleAuthProps {
  onSuccess: (payload: GoogleAuthResponse) => Promise<void>;
  onError?: (error: Error) => void;
}

interface TokenResponse {
  id_token?: string;
  access_token?: string;
  error?: string;
  error_description?: string;
}

const GOOGLE_OAUTH_CONFIG = {
  clientId: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID || '765956834253-iqe4gdf3mar2nu482nu48i66v428bfdp.apps.googleusercontent.com',
};

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const SCOPES = ['openid', 'profile', 'email'];

WebBrowser.maybeCompleteAuthSession();

export const useGoogleAuthMobile = ({ onSuccess, onError }: UseGoogleAuthProps) => {
  const [loading, setLoading] = useState(false);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
  }, [onSuccess, onError]);

  const exchangeCodeForTokens = useCallback(async (
    code: string,
    redirectUri: string
  ): Promise<TokenResponse> => {
    const params = new URLSearchParams({
      code,
      client_id: GOOGLE_OAUTH_CONFIG.clientId,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });

    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.status}`);
    }

    return await response.json();
  }, []);

  const handleTokens = useCallback(async (tokens: TokenResponse) => {
    if (tokens.error) {
      throw new Error(tokens.error_description || tokens.error);
    }

    await onSuccessRef.current({
      idToken: tokens.id_token || null,
      accessToken: tokens.access_token || null,
    });
  }, []);

  const handleAuthError = useCallback((error: unknown, context: string) => {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error(`❌ ${context}:`, error);
    showAlert('Google Login Failed', errorMessage);
    if (onErrorRef.current) {
      onErrorRef.current(error instanceof Error ? error : new Error(errorMessage));
    }
  }, []);

  const handleGoogleLogin = useCallback(async () => {
    setLoading(true);

    try {
      const redirectUri = AuthSession.makeRedirectUri({
        scheme: 'kivelo-app',
        useProxy: true,
      });

      const authUrl = new URL(GOOGLE_AUTH_URL);
      authUrl.searchParams.append('client_id', GOOGLE_OAUTH_CONFIG.clientId);
      authUrl.searchParams.append('redirect_uri', redirectUri);
      authUrl.searchParams.append('response_type', 'code');
      authUrl.searchParams.append('scope', SCOPES.join(' '));
      authUrl.searchParams.append('access_type', 'offline');
      authUrl.searchParams.append('prompt', 'select_account');

      const result = await WebBrowser.openAuthSessionAsync(
        authUrl.toString(),
        redirectUri
      );

      if (result.type === 'success' && result.url) {
        const url = new URL(result.url);
        const code = url.searchParams.get('code');
        const error = url.searchParams.get('error');

        if (error) {
          throw new Error(error);
        }

        if (!code) {
          throw new Error('Authorization code not returned');
        }

        const tokens = await exchangeCodeForTokens(code, redirectUri);
        await handleTokens(tokens);
      } else if (result.type === 'cancel' || result.type === 'dismiss') {
        console.log('User cancelled Google login');
      } else {
        throw new Error(`Authentication failed: ${result.type}`);
      }
    } catch (error) {
      handleAuthError(error, 'Mobile authentication');
    } finally {
      setLoading(false);
    }
  }, [exchangeCodeForTokens, handleTokens, handleAuthError]);

  return {
    googleLoading: loading,
    handleGoogleLogin,
    googleRequest: true,
  };
};
