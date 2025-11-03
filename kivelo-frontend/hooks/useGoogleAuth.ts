import { useState, useEffect } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Alert } from 'react-native';
import { Platform } from 'react-native';
import { AuthResponse } from '../types/auth';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_IDS = {
  web: "765956834253-ham5mqf94dkcnqlvlhf68lg1lqkqtfnq.apps.googleusercontent.com",
  ios: "765956834253-4btchsr2mgarvqr09r5sto9vum76hjc8.apps.googleusercontent.com", 
  android: "765956834253-iqe4gdf3mar2nu482nu48i66v428bfdp.apps.googleusercontent.com",
};

export const useGoogleAuth = (onSuccess: (accessToken: string) => Promise<void>) => {
  const [loading, setLoading] = useState(false);

  const redirectUri = makeRedirectUri({
    scheme: 'your-app-scheme'
  });

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: Platform.OS === 'ios' ? GOOGLE_CLIENT_IDS.ios : 
              Platform.OS === 'android' ? GOOGLE_CLIENT_IDS.android : 
              GOOGLE_CLIENT_IDS.web,
    scopes: ['openid', 'profile', 'email'],
    redirectUri,
  });

  useEffect(() => {
    const handleGoogleResponse = async () => {
      if (response?.type === 'success') {
        const { authentication } = response;
        try {
          if (!authentication?.accessToken) {
            throw new Error('No access token received from Google');
          }
          await onSuccess(authentication.accessToken);
        } catch (error) {
          console.error('Google auth error:', error);
          Alert.alert('Google Login Failed', 'Failed to complete Google login');
        } finally {
          setLoading(false);
        }
      } else if (response?.type === 'error') {
        setLoading(false);
        console.error('Google auth error:', response.error);
        Alert.alert(
          'Google Login Failed', 
          `Something went wrong: ${response.error?.message || 'Unknown error'}`
        );
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
      await promptAsync();
    } catch (error) {
      console.error('Google prompt error:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to start Google login');
    }
  };

  return {
    googleLoading: loading,
    googleRequest: request,
    handleGoogleLogin,
  };
};