import { useState, useEffect } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { showAlert } from '@/utils/showAlert';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_IDS = {
  web: "765956834253-ham5mqf94dkcnqlvlhf68lg1lqkqtfnq.apps.googleusercontent.com",
  ios: "765956834253-4btchsr2mgarvqr09r5sto9vum76hjc8.apps.googleusercontent.com", 
  android: "765956834253-iqe4gdf3mar2nu482nu48i66v428bfdp.apps.googleusercontent.com",
};

// Expo Auth Proxy URL for Expo Go
const EXPO_PROXY_REDIRECT = 'https://auth.expo.io/@fatai01/family-wellness-app';

interface GoogleAuthResponse {
  idToken: string | null;
  accessToken: string | null;
}

export const useGoogleAuth = (onSuccess: (tokens: GoogleAuthResponse) => Promise<void>) => {
  const [loading, setLoading] = useState(false);

  // Check if running in Expo Go
  const isExpoGo = Constants.appOwnership === 'expo';
  const isWeb = Platform.OS === 'web';
  
  // Determine redirect URI based on platform and environment
  const redirectUri = isWeb
    ? AuthSession.makeRedirectUri({ preferLocalhost: true })
    : isExpoGo 
      ? EXPO_PROXY_REDIRECT 
      : AuthSession.makeRedirectUri({ scheme: 'kivelo', path: 'auth' });

  console.log('🔗 Google OAuth Redirect URI:', redirectUri);
  console.log('📱 Running in Expo Go:', isExpoGo);
  console.log('🌐 Platform:', Platform.OS);

  // Use implicit flow for web to get ID token directly (no code exchange needed)
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_CLIENT_IDS.web,
    androidClientId: GOOGLE_CLIENT_IDS.android,
    iosClientId: GOOGLE_CLIENT_IDS.ios,
    scopes: ['openid', 'profile', 'email'],
    redirectUri,
    // Use implicit flow on web to get ID token directly in the redirect
    ...(isWeb && { responseType: AuthSession.ResponseType.IdToken }),
  });

  useEffect(() => {
    const handleGoogleResponse = async () => {
      if (response?.type === 'success') {
        const { authentication, params } = response;
        
        console.log('🔐 Google OAuth Response:', JSON.stringify(response, null, 2));
        console.log('🎫 Authentication object:', authentication);
        console.log('📦 Params:', params);
        
        try {
          // ID token can be in authentication object or params (web)
          const idToken = authentication?.idToken || params?.id_token || null;
          const accessToken = authentication?.accessToken || params?.access_token || null;
          
          console.log('🎟️ ID Token:', idToken ? 'Present' : 'Missing');
          console.log('🔑 Access Token:', accessToken ? 'Present' : 'Missing');
          
          if (!idToken) {
            throw new Error('No ID token received from Google. Check console for response details.');
          }
          
          await onSuccess({ idToken, accessToken });
        } catch (error) {
          console.error('Google auth error:', error);
          showAlert('Google Login Failed', error instanceof Error ? error.message : 'Failed to complete Google login');
        } finally {
          setLoading(false);
        }
      } else if (response?.type === 'error') {
        setLoading(false);
        console.error('Google auth error:', response.error);
        showAlert(
          'Google Login Failed', 
          `Something went wrong: ${response.error?.message || 'Unknown error'}`
        );
      } else if (response?.type === 'dismiss') {
        setLoading(false);
        console.log('User dismissed Google login');
      }
    };

    if (response) {
      handleGoogleResponse();
    }
  }, [response, onSuccess]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      if (!request) {
        throw new Error('Google auth request not ready');
      }
      console.log('🚀 Starting Google OAuth...');
      console.log('📋 Request config:', JSON.stringify({
        redirectUri: request.redirectUri,
        scopes: request.scopes,
        clientId: request.clientId,
      }, null, 2));
      
      // promptAsync without options - the redirect URI is already set in the request
      await promptAsync();
    } catch (error) {
      console.error('Google prompt error:', error);
      setLoading(false);
      showAlert('Error', 'Failed to start Google login');
    }
  };

  return {
    googleLoading: loading,
    googleRequest: request,
    handleGoogleLogin,
  };
};