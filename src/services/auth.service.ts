import api from './api';

export interface User {
  id: string;
  name: string;
  email?: string;
  isGuest: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await api.post('/auth/login', { email, password });
    return response.data.data;
  },

  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    const response = await api.post('/auth/register', { name, email, password });
    return response.data.data;
  },

  async guestLogin(name?: string): Promise<AuthResponse> {
    const response = await api.post('/auth/guest', { name });
    return response.data.data;
  },
};
