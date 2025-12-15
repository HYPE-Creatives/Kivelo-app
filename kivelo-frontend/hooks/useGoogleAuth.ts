import { useState, useEffect } from 'react';
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

interface GoogleAuthResponse {
  idToken: string | null;
  accessToken: string | null;
}

// Google OAuth discovery document
const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

export const useGoogleAuth = (onSuccess: (tokens: GoogleAuthResponse) => Promise<void>) => {
  const [loading, setLoading] = useState(false);

  // Check environment
  const isExpoGo = Constants.appOwnership === 'expo';
  const isWeb = Platform.OS === 'web';
  const isMobileExpoGo = isExpoGo && !isWeb;
  
  // For web, use localhost redirect
  const redirectUri = isWeb
    ? AuthSession.makeRedirectUri({ preferLocalhost: true })
    : AuthSession.makeRedirectUri({ scheme: 'family-wellness-app', path: 'auth' });

  console.log('🔗 Google OAuth Redirect URI:', redirectUri);
  console.log('📱 Running in Expo Go:', isExpoGo);
  console.log('🌐 Platform:', Platform.OS);

  // Use web client ID
  const clientId = GOOGLE_CLIENT_IDS.web;

  // Create auth request
  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId,
      scopes: ['openid', 'profile', 'email'],
      redirectUri,
      responseType: AuthSession.ResponseType.IdToken,
      usePKCE: false,
    },
    discovery
  );

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
    // Expo Go on mobile doesn't support OAuth redirect properly
    if (isMobileExpoGo) {
      showAlert(
        'Not Available in Expo Go', 
        'Google Sign-In requires a production build. Please use email/password login, or test on web (press W in terminal).'
      );
      return;
    }

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