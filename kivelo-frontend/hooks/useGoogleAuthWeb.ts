import { useState, useEffect, useCallback, useRef } from 'react';
import { showAlert } from '@/utils/showAlert';

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
  clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '765956834253-ham5mqf94dkcnqlvlhf68lg1lqkqtfnq.apps.googleusercontent.com',
  clientSecret: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_SECRET,
  redirectUri: process.env.EXPO_PUBLIC_GOOGLE_WEB_REDIRECT_URI || 'https://hype-creatives.github.io/Kivelo-app/',
};

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const SCOPES = ['openid', 'profile', 'email'];

export const useGoogleAuthWeb = ({ onSuccess, onError }: UseGoogleAuthProps) => {
  const [loading, setLoading] = useState(false);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
  }, [onSuccess, onError]);

  const exchangeCodeForTokens = useCallback(async (code: string): Promise<TokenResponse> => {
    const params = new URLSearchParams({
      code,
      client_id: GOOGLE_OAUTH_CONFIG.clientId,
      client_secret: GOOGLE_OAUTH_CONFIG.clientSecret || '',
      redirect_uri: GOOGLE_OAUTH_CONFIG.redirectUri,
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

  // Process OAuth callback on page load
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const processCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const error = params.get('error');

      if (error) {
        handleAuthError(new Error(error), 'Web OAuth callback');
        window.history.replaceState({}, '', GOOGLE_OAUTH_CONFIG.redirectUri);
        return;
      }

      if (!code) return;

      setLoading(true);
      window.history.replaceState({}, '', GOOGLE_OAUTH_CONFIG.redirectUri);

      try {
        const tokens = await exchangeCodeForTokens(code);
        await handleTokens(tokens);
      } catch (error) {
        handleAuthError(error, 'Web token exchange');
      } finally {
        setLoading(false);
      }
    };

    processCallback();
  }, [exchangeCodeForTokens, handleTokens, handleAuthError]);

  const handleGoogleLogin = useCallback(() => {
    setLoading(true);

    const authUrl = new URL(GOOGLE_AUTH_URL);
    authUrl.searchParams.append('client_id', GOOGLE_OAUTH_CONFIG.clientId);
    authUrl.searchParams.append('redirect_uri', GOOGLE_OAUTH_CONFIG.redirectUri);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', SCOPES.join(' '));
    authUrl.searchParams.append('access_type', 'offline');
    authUrl.searchParams.append('prompt', 'select_account');

    window.location.href = authUrl.toString();
  }, []);

  return {
    googleLoading: loading,
    handleGoogleLogin,
    googleRequest: true,
  };
};
