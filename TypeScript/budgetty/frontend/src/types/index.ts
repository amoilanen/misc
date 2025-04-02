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
  title: string;
  amount: number;
  date: string;
  categoryId: string;
  description?: string;
  userId: string;
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
  title: string;
  amount: number;
  date: string;
  categoryId: string;
  description?: string;
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