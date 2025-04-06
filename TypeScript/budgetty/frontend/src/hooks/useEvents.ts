import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useQuery } from '@tanstack/react-query';
import {
  Event,
  CreateEventData,
  EventFilters,
} from '../types';
import { eventService } from '../services/eventService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const useEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_URL}/events`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }

      const data = await response.json();
      setEvents(data);
      setError(null);
    } catch (error: any) {
      setError(error.message || 'Failed to fetch events');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const createEvent = async (data: CreateEventData) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_URL}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create event');
      }

      const newEvent = await response.json();
      setEvents((prev) => [...prev, newEvent]);
      toast.success('Event created successfully');
      return newEvent;
    } catch (error: any) {
      toast.error(error.message || 'Failed to create event');
      throw error;
    }
  };

  const updateEvent = async (id: string, data: CreateEventData) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_URL}/events/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update event');
      }

      const updatedEvent = await response.json();
      setEvents((prev) =>
        prev.map((event) => (event.id === id ? updatedEvent : event))
      );
      toast.success('Event updated successfully');
      return updatedEvent;
    } catch (error: any) {
      toast.error(error.message || 'Failed to update event');
      throw error;
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_URL}/events/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete event');
      }

      setEvents((prev) => prev.filter((event) => event.id !== id));
      toast.success('Event deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete event');
      throw error;
    }
  };

  return {
    events,
    isLoading,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
    refetch: fetchEvents,
  };
};

export const useEventStats = (filters?: EventFilters) => {
  const {
    data: stats,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['eventStats', filters],
    queryFn: () => eventService.getStats(filters),
  });

  return {
    stats,
    isLoading,
    error,
  };
}; 