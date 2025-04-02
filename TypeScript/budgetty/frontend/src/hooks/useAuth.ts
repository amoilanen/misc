import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  User,
  LoginCredentials,
  RegisterData,
  UpdateProfileData,
  AuthState,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const useAuth = () => {
  const navigate = useNavigate();
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUser(token);
    } else {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  const fetchUser = async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }

      const user = await response.json();
      setState({ user, loading: false, error: null });
    } catch (error) {
      setState({ user: null, loading: false, error: 'Failed to fetch user' });
      localStorage.removeItem('token');
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Invalid credentials');
      }

      const { token, user } = await response.json();
      localStorage.setItem('token', token);
      setState({ user, loading: false, error: null });
      navigate('/dashboard');
      toast.success('Logged in successfully');
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to login',
      }));
      toast.error(error.message || 'Failed to login');
    }
  };

  const register = async (data: RegisterData) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Registration failed');
      }

      const { token, user } = await response.json();
      localStorage.setItem('token', token);
      setState({ user, loading: false, error: null });
      navigate('/dashboard');
      toast.success('Registered successfully');
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to register',
      }));
      toast.error(error.message || 'Failed to register');
    }
  };

  const loginWithGoogle = () => {
    window.location.href = `${API_URL}/auth/google`;
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      setState({ user: null, loading: false, error: null });
      navigate('/login');
      toast.success('Logged out successfully');
    }
  };

  const updateProfile = async (data: UpdateProfileData) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const user = await response.json();
      setState((prev) => ({ ...prev, user, loading: false, error: null }));
      toast.success('Profile updated successfully');
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to update profile',
      }));
      toast.error(error.message || 'Failed to update profile');
    }
  };

  return {
    user: state.user,
    loading: state.loading,
    error: state.error,
    login,
    register,
    loginWithGoogle,
    logout,
    updateProfile,
  };
}; 