import api from './api';

export interface Category {
  id: number;
  name: string;
  userId: number;
  rules: {
    patterns: string[];
    excludePatterns?: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryDto {
  name: string;
  rules: {
    patterns: string[];
    excludePatterns?: string[];
  };
}

export interface UpdateCategoryDto extends Partial<CreateCategoryDto> {}

export const categoryService = {
  async getCategories(): Promise<Category[]> {
    const response = await api.get<Category[]>('/categories');
    return response.data;
  },

  async getCategory(id: number): Promise<Category> {
    const response = await api.get<Category>(`/categories/${id}`);
    return response.data;
  },

  async createCategory(data: CreateCategoryDto): Promise<Category> {
    const response = await api.post<Category>('/categories', data);
    return response.data;
  },

  async updateCategory(id: number, data: UpdateCategoryDto): Promise<Category> {
    const response = await api.patch<Category>(`/categories/${id}`, data);
    return response.data;
  },

  async deleteCategory(id: number): Promise<void> {
    await api.delete(`/categories/${id}`);
  },

  async testRules(id: number, description: string): Promise<boolean> {
    const response = await api.post<{ matches: boolean }>(`/categories/${id}/test`, {
      description,
    });
    return response.data.matches;
  },
}; 