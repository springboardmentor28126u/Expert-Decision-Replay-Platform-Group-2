import client from './client';
import { LoginRequest, RegisterRequest, TokenResponse, CaptchaResponse } from '../types';

export const authApi = {
  getCaptcha: async (): Promise<CaptchaResponse> => {
    const response = await client.get<CaptchaResponse>('/api/auth/captcha');
    return response.data;
  },

  login: async (data: LoginRequest): Promise<TokenResponse> => {
    const response = await client.post<TokenResponse>('/api/auth/login', data);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<TokenResponse> => {
    const response = await client.post<TokenResponse>('/api/auth/register', data);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await client.post('/api/auth/logout');
  },
};

