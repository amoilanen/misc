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
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUser(token);
    } else {
      setLoading(false);
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
      setUser(user);
      setToken(token);
      localStorage.setItem('token', token);
    } catch (error) {
      setUser(null);
      setToken(null);
      localStorage.removeItem('token');
      setError('Failed to fetch user');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('token', data.token);
      navigate('/dashboard');
      toast.success('Logged in successfully');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginWithToken = async (token: string) => {
    try {
      setLoading(true);
      
      // Check if user is already logged in
      const wasLoggedIn = !!user;
      
      localStorage.setItem('token', token);
      await fetchUser(token);
      
      // Only show success toast if user wasn't already logged in
      if (!wasLoggedIn) {
        toast.success('Logged in successfully');
      }
    } catch (error) {
      setError('Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    try {
      setLoading(true);
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
      setToken(token);
      setUser(user);
      localStorage.setItem('token', token);
      navigate('/dashboard');
      toast.success('Registered successfully');
    } catch (error) {
      setError('Failed to register');
    } finally {
      setLoading(false);
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
      setUser(null);
      setToken(null);
      setError(null);
      navigate('/login');
      toast.success('Logged out successfully');
    }
  };

  const updateProfile = async (data: UpdateProfileData) => {
    try {
      setLoading(true);
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
      setUser(user);
      setToken(token);
      localStorage.setItem('token', token);
      toast.success('Profile updated successfully');
    } catch (error) {
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    error,
    token,
    login,
    loginWithToken,
    register,
    loginWithGoogle,
    logout,
    updateProfile,
  };
}; 