import { Platform } from 'react-native';
import { useGoogleAuthWeb } from './useGoogleAuthWeb';
import { useGoogleAuthMobile } from './useGoogleAuthMobile';

interface GoogleAuthResponse {
  idToken: string | null;
  accessToken: string | null;
}

interface UseGoogleAuthProps {
  onSuccess: (payload: GoogleAuthResponse) => Promise<void>;
  onError?: (error: Error) => void;
}

export const useGoogleAuth = (props: UseGoogleAuthProps) => {
  if (Platform.OS === 'web') {
    return useGoogleAuthWeb(props);
  }
  return useGoogleAuthMobile(props);
};
