import { EventFilters } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class EventService {
  async getStats(filters?: EventFilters) {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    const queryParams = new URLSearchParams();
    if (filters?.startDate) {
      queryParams.append('startDate', filters.startDate.toISOString());
    }
    if (filters?.endDate) {
      queryParams.append('endDate', filters.endDate.toISOString());
    }
    if (filters?.categoryId) {
      queryParams.append('categoryId', filters.categoryId);
    }
    if (filters?.minAmount) {
      queryParams.append('minAmount', filters.minAmount.toString());
    }
    if (filters?.maxAmount) {
      queryParams.append('maxAmount', filters.maxAmount.toString());
    }

    const response = await fetch(`${API_URL}/api/events/stats?${queryParams.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch event stats');
    }

    return response.json();
  }
}

export const eventService = new EventService(); 