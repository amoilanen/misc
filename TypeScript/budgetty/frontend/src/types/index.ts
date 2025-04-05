export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface Event {
  id: string;
  description: string;
  amount: number;
  currency: string;
  date: string;
  categoryId?: string;
  userId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  firstName: string;
  lastName: string;
}

export interface UpdateProfileData {
  email: string;
  currentPassword?: string;
  newPassword?: string;
}

export interface CreateEventData {
  description: string;
  amount: number;
  currency: string;
  date: string;
  categoryId?: string;
}

export interface UpdateEventData extends CreateEventData {
  id: string;
}

export interface CreateCategoryData {
  name: string;
  description?: string;
}

export interface UpdateCategoryData extends CreateCategoryData {
  id: string;
}

export enum DateFormat {
  DD_MM_YYYY = 'DD/MM/YYYY',
  MM_DD_YYYY = 'MM/DD/YYYY',
  YYYY_MM_DD = 'YYYY/MM/DD',
  DD_MM_YY = 'DD/MM/YY',
  MM_DD_YY = 'MM/DD/YY',
  YY_MM_DD = 'YY/MM/DD',
} 