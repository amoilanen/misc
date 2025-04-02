import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  Category,
  CreateCategoryData,
  UpdateCategoryData,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_URL}/categories`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }

      const data = await response.json();
      setCategories(data);
      setError(null);
    } catch (error: any) {
      setError(error.message || 'Failed to fetch categories');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const createCategory = async (data: CreateCategoryData) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_URL}/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create category');
      }

      const newCategory = await response.json();
      setCategories((prev) => [...prev, newCategory]);
      toast.success('Category created successfully');
      return newCategory;
    } catch (error: any) {
      toast.error(error.message || 'Failed to create category');
      throw error;
    }
  };

  const updateCategory = async (id: string, data: CreateCategoryData) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_URL}/categories/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update category');
      }

      const updatedCategory = await response.json();
      setCategories((prev) =>
        prev.map((category) => (category.id === id ? updatedCategory : category))
      );
      toast.success('Category updated successfully');
      return updatedCategory;
    } catch (error: any) {
      toast.error(error.message || 'Failed to update category');
      throw error;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_URL}/categories/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete category');
      }

      setCategories((prev) => prev.filter((category) => category.id !== id));
      toast.success('Category deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete category');
      throw error;
    }
  };

  return {
    categories,
    isLoading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    refetch: fetchCategories,
  };
}; 