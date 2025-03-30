import { renderHook, act } from '@testing-library/react';
import { useCarSearch } from '../useCarSearch';
import { useCarSearchStore } from '../../store/carSearchStore';

// Mock the next-i18next hook
jest.mock('next-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock fetch
global.fetch = jest.fn();

describe('useCarSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useCarSearchStore.getState().resetState();
  });

  it('should fetch car info when plate is provided', async () => {
    const mockCarInfo = {
      licensePlate: 'ABC-123',
      make: 'Toyota',
      model: 'Corolla',
      year: 2020,
      color: 'Red',
      basicInfo: {
        registrationDate: '2020-01-01',
        lastInspection: '2021-01-01',
        status: 'Active',
      },
      detailedInfo: {
        ownerHistory: [],
        serviceHistory: [],
      },
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockCarInfo),
    });

    const { result } = renderHook(() => useCarSearch('ABC-123'));

    // Wait for the effect to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/car-info?plate=ABC-123');
    expect(useCarSearchStore.getState().carInfo).toEqual(mockCarInfo);
  });

  it('should handle fetch error', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
    });

    const { result } = renderHook(() => useCarSearch('ABC-123'));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(useCarSearchStore.getState().error).toBe('Failed to fetch car information');
  });

  it('should handle payment success', async () => {
    const mockResponse = new Response(new Blob(['test']), {
      status: 200,
      headers: { 'Content-Type': 'application/pdf' },
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useCarSearch('ABC-123'));

    await act(async () => {
      await result.current.handlePaymentSuccess('test@example.com');
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/generate-invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', licensePlate: 'ABC-123' }),
    });

    expect(useCarSearchStore.getState().showDetailedInfo).toBe(true);
  });

  it('should handle payment error', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
    });

    const { result } = renderHook(() => useCarSearch('ABC-123'));

    await act(async () => {
      await result.current.handlePaymentSuccess('test@example.com');
    });

    expect(useCarSearchStore.getState().paymentError).toBe('Failed to generate invoice');
  });
}); 