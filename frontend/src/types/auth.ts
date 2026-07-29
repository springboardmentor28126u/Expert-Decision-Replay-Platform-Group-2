import { User } from './user';

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface MessageResponse {
  message: string;
  detail?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
}
