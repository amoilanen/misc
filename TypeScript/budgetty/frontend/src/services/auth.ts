import api from './api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    localStorage.setItem('token', response.data.token);
    return response.data;
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', data);
    localStorage.setItem('token', response.data.token);
    return response.data;
  },

  async loginWithGoogle(): Promise<void> {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
  },

  async logout(): Promise<void> {
    localStorage.removeItem('token');
    window.location.href = '/login';
  },

  async getCurrentUser(): Promise<AuthResponse['user']> {
    const response = await api.get<AuthResponse>('/auth/me');
    return response.data.user;
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  },
}; 