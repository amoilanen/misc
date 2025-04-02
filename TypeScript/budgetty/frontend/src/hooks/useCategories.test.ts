import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCategories } from './useCategories';
import { categoryService } from '../services/categoryService';

// Mock the category service
vi.mock('../services/categoryService', () => ({
  categoryService: {
    getCategories: vi.fn(),
    createCategory: vi.fn(),
    updateCategory: vi.fn(),
    deleteCategory: vi.fn(),
  },
}));

describe('useCategories Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useCategories());

    expect(result.current.categories).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should fetch categories successfully', async () => {
    const mockCategories = [
      { id: 1, name: 'Category 1', color: '#FF0000' },
      { id: 2, name: 'Category 2', color: '#00FF00' },
    ];
    (categoryService.getCategories as any).mockResolvedValueOnce(mockCategories);

    const { result } = renderHook(() => useCategories());

    await act(async () => {
      await result.current.fetchCategories();
    });

    expect(result.current.categories).toEqual(mockCategories);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle fetch categories failure', async () => {
    const errorMessage = 'Failed to fetch categories';
    (categoryService.getCategories as any).mockRejectedValueOnce(new Error(errorMessage));

    const { result } = renderHook(() => useCategories());

    await act(async () => {
      await result.current.fetchCategories();
    });

    expect(result.current.categories).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(errorMessage);
  });

  it('should create category successfully', async () => {
    const mockCategory = { id: 1, name: 'New Category', color: '#FF0000' };
    (categoryService.createCategory as any).mockResolvedValueOnce(mockCategory);

    const { result } = renderHook(() => useCategories());

    await act(async () => {
      await result.current.createCategory({
        name: 'New Category',
        color: '#FF0000',
      });
    });

    expect(result.current.categories).toContainEqual(mockCategory);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle create category failure', async () => {
    const errorMessage = 'Failed to create category';
    (categoryService.createCategory as any).mockRejectedValueOnce(new Error(errorMessage));

    const { result } = renderHook(() => useCategories());

    await act(async () => {
      await result.current.createCategory({
        name: 'New Category',
        color: '#FF0000',
      });
    });

    expect(result.current.categories).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(errorMessage);
  });

  it('should update category successfully', async () => {
    const mockCategory = { id: 1, name: 'Updated Category', color: '#00FF00' };
    (categoryService.updateCategory as any).mockResolvedValueOnce(mockCategory);

    const { result } = renderHook(() => useCategories());

    await act(async () => {
      await result.current.updateCategory(1, {
        name: 'Updated Category',
        color: '#00FF00',
      });
    });

    expect(result.current.categories).toContainEqual(mockCategory);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle update category failure', async () => {
    const errorMessage = 'Failed to update category';
    (categoryService.updateCategory as any).mockRejectedValueOnce(new Error(errorMessage));

    const { result } = renderHook(() => useCategories());

    await act(async () => {
      await result.current.updateCategory(1, {
        name: 'Updated Category',
        color: '#00FF00',
      });
    });

    expect(result.current.categories).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(errorMessage);
  });

  it('should delete category successfully', async () => {
    (categoryService.deleteCategory as any).mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useCategories());

    await act(async () => {
      await result.current.deleteCategory(1);
    });

    expect(result.current.categories).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle delete category failure', async () => {
    const errorMessage = 'Failed to delete category';
    (categoryService.deleteCategory as any).mockRejectedValueOnce(new Error(errorMessage));

    const { result } = renderHook(() => useCategories());

    await act(async () => {
      await result.current.deleteCategory(1);
    });

    expect(result.current.categories).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(errorMessage);
  });
}); 