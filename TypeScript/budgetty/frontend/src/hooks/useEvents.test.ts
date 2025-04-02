import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEvents } from './useEvents';
import { eventService } from '../services/eventService';

// Mock the event service
vi.mock('../services/eventService', () => ({
  eventService: {
    getEvents: vi.fn(),
    createEvent: vi.fn(),
    updateEvent: vi.fn(),
    deleteEvent: vi.fn(),
  },
}));

describe('useEvents Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useEvents());

    expect(result.current.events).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should fetch events successfully', async () => {
    const mockEvents = [
      { id: 1, title: 'Event 1', date: '2024-01-01', amount: 100 },
      { id: 2, title: 'Event 2', date: '2024-01-02', amount: 200 },
    ];
    (eventService.getEvents as any).mockResolvedValueOnce(mockEvents);

    const { result } = renderHook(() => useEvents());

    await act(async () => {
      await result.current.fetchEvents();
    });

    expect(result.current.events).toEqual(mockEvents);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle fetch events failure', async () => {
    const errorMessage = 'Failed to fetch events';
    (eventService.getEvents as any).mockRejectedValueOnce(new Error(errorMessage));

    const { result } = renderHook(() => useEvents());

    await act(async () => {
      await result.current.fetchEvents();
    });

    expect(result.current.events).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(errorMessage);
  });

  it('should create event successfully', async () => {
    const mockEvent = { id: 1, title: 'New Event', date: '2024-01-01', amount: 100 };
    (eventService.createEvent as any).mockResolvedValueOnce(mockEvent);

    const { result } = renderHook(() => useEvents());

    await act(async () => {
      await result.current.createEvent({
        title: 'New Event',
        date: '2024-01-01',
        amount: 100,
        categoryId: 1,
      });
    });

    expect(result.current.events).toContainEqual(mockEvent);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle create event failure', async () => {
    const errorMessage = 'Failed to create event';
    (eventService.createEvent as any).mockRejectedValueOnce(new Error(errorMessage));

    const { result } = renderHook(() => useEvents());

    await act(async () => {
      await result.current.createEvent({
        title: 'New Event',
        date: '2024-01-01',
        amount: 100,
        categoryId: 1,
      });
    });

    expect(result.current.events).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(errorMessage);
  });

  it('should update event successfully', async () => {
    const mockEvent = { id: 1, title: 'Updated Event', date: '2024-01-01', amount: 150 };
    (eventService.updateEvent as any).mockResolvedValueOnce(mockEvent);

    const { result } = renderHook(() => useEvents());

    await act(async () => {
      await result.current.updateEvent(1, {
        title: 'Updated Event',
        amount: 150,
      });
    });

    expect(result.current.events).toContainEqual(mockEvent);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle update event failure', async () => {
    const errorMessage = 'Failed to update event';
    (eventService.updateEvent as any).mockRejectedValueOnce(new Error(errorMessage));

    const { result } = renderHook(() => useEvents());

    await act(async () => {
      await result.current.updateEvent(1, {
        title: 'Updated Event',
        amount: 150,
      });
    });

    expect(result.current.events).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(errorMessage);
  });

  it('should delete event successfully', async () => {
    (eventService.deleteEvent as any).mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useEvents());

    await act(async () => {
      await result.current.deleteEvent(1);
    });

    expect(result.current.events).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle delete event failure', async () => {
    const errorMessage = 'Failed to delete event';
    (eventService.deleteEvent as any).mockRejectedValueOnce(new Error(errorMessage));

    const { result } = renderHook(() => useEvents());

    await act(async () => {
      await result.current.deleteEvent(1);
    });

    expect(result.current.events).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(errorMessage);
  });
}); 