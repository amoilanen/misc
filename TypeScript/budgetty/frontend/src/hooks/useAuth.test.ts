import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuth } from './useAuth';
import { authService } from '../services/authService';

// Mock the auth service
vi.mock('../services/authService', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    getCurrentUser: vi.fn(),
  },
}));

describe('useAuth Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle successful login', async () => {
    const mockUser = { id: 1, name: 'Test User', email: 'test@example.com' };
    const mockToken = 'mock-token';
    (authService.login as any).mockResolvedValueOnce({ user: mockUser, token: mockToken });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login('test@example.com', 'password123');
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(localStorage.getItem('token')).toBe(mockToken);
  });

  it('should handle login failure', async () => {
    const errorMessage = 'Invalid credentials';
    (authService.login as any).mockRejectedValueOnce(new Error(errorMessage));

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login('test@example.com', 'wrongpassword');
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(errorMessage);
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('should handle successful registration', async () => {
    const mockUser = { id: 1, name: 'Test User', email: 'test@example.com' };
    const mockToken = 'mock-token';
    (authService.register as any).mockResolvedValueOnce({ user: mockUser, token: mockToken });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.register({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(localStorage.getItem('token')).toBe(mockToken);
  });

  it('should handle registration failure', async () => {
    const errorMessage = 'Registration failed';
    (authService.register as any).mockRejectedValueOnce(new Error(errorMessage));

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.register({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(errorMessage);
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('should handle logout', async () => {
    localStorage.setItem('token', 'mock-token');
    (authService.logout as any).mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('should load user from token on initialization', async () => {
    const mockUser = { id: 1, name: 'Test User', email: 'test@example.com' };
    localStorage.setItem('token', 'mock-token');
    (authService.getCurrentUser as any).mockResolvedValueOnce(mockUser);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.loadUser();
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle failed user loading', async () => {
    const errorMessage = 'Failed to load user';
    localStorage.setItem('token', 'mock-token');
    (authService.getCurrentUser as any).mockRejectedValueOnce(new Error(errorMessage));

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.loadUser();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(errorMessage);
    expect(localStorage.getItem('token')).toBeNull();
  });
}); 