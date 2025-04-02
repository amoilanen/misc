import api from './api';

export interface Event {
  id: number;
  date: string;
  amount: number;
  currency: string;
  description: string;
  categoryId?: number;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventDto {
  date: string;
  amount: number;
  currency: string;
  description: string;
  categoryId?: number;
}

export interface UpdateEventDto extends Partial<CreateEventDto> {}

export interface EventFilters {
  startDate?: string;
  endDate?: string;
  categoryId?: number;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
}

export interface EventStats {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  categoryBreakdown: {
    categoryId: number;
    categoryName: string;
    amount: number;
    percentage: number;
  }[];
  monthlyTrend: {
    month: string;
    income: number;
    expenses: number;
    balance: number;
  }[];
}

export const eventService = {
  async getEvents(filters?: EventFilters): Promise<Event[]> {
    const response = await api.get<Event[]>('/events', { params: filters });
    return response.data;
  },

  async getEvent(id: number): Promise<Event> {
    const response = await api.get<Event>(`/events/${id}`);
    return response.data;
  },

  async createEvent(data: CreateEventDto): Promise<Event> {
    const response = await api.post<Event>('/events', data);
    return response.data;
  },

  async updateEvent(id: number, data: UpdateEventDto): Promise<Event> {
    const response = await api.patch<Event>(`/events/${id}`, data);
    return response.data;
  },

  async deleteEvent(id: number): Promise<void> {
    await api.delete(`/events/${id}`);
  },

  async importEvents(file: File): Promise<Event[]> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<Event[]>('/events/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async getStats(filters?: EventFilters): Promise<EventStats> {
    const response = await api.get<EventStats>('/events/stats', { params: filters });
    return response.data;
  },
}; 