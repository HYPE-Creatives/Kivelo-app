export type LoginMode = "password" | "oneTimeCode";

export interface LoginFormData {
  email: string;
  password: string;
  code: string;
}

export interface GoogleAuthConfig {
  web: string;
  ios: string;
  android: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  data?: any;
}