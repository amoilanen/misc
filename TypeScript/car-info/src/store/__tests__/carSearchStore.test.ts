import { useCarSearchStore } from '../carSearchStore';

describe('carSearchStore', () => {
  beforeEach(() => {
    useCarSearchStore.getState().reset();
  });

  it('should initialize with default values', () => {
    const state = useCarSearchStore.getState();
    expect(state.carInfo).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.email).toBeNull();
    expect(state.showPayment).toBe(false);
    expect(state.paymentError).toBeNull();
    expect(state.showDetailedInfo).toBe(false);
    expect(state.paymentStatus).toBe('idle');
  });

  it('should set car info', () => {
    const carInfo = { brand: 'Toyota', model: 'Camry', year: 2020 };
    useCarSearchStore.getState().setCarInfo(carInfo);
    expect(useCarSearchStore.getState().carInfo).toEqual(carInfo);
  });

  it('should set loading state', () => {
    useCarSearchStore.getState().setLoading(true);
    expect(useCarSearchStore.getState().isLoading).toBe(true);
  });

  it('should set error', () => {
    const error = 'Failed to fetch car info';
    useCarSearchStore.getState().setError(error);
    expect(useCarSearchStore.getState().error).toBe(error);
  });

  it('should set email', () => {
    const email = 'test@example.com';
    useCarSearchStore.getState().setEmail(email);
    expect(useCarSearchStore.getState().email).toBe(email);
  });

  it('should set show payment', () => {
    useCarSearchStore.getState().setShowPayment(true);
    expect(useCarSearchStore.getState().showPayment).toBe(true);
  });

  it('should set payment error', () => {
    const error = 'Payment failed';
    useCarSearchStore.getState().setPaymentError(error);
    expect(useCarSearchStore.getState().paymentError).toBe(error);
  });

  it('should set show detailed info', () => {
    useCarSearchStore.getState().setShowDetailedInfo(true);
    expect(useCarSearchStore.getState().showDetailedInfo).toBe(true);
  });

  it('should set payment status', () => {
    useCarSearchStore.getState().setPaymentStatus('success');
    expect(useCarSearchStore.getState().paymentStatus).toBe('success');
  });

  it('should reset state to initial values', () => {
    // Set some values first
    useCarSearchStore.getState().setCarInfo({ brand: 'Toyota', model: 'Camry', year: 2020 });
    useCarSearchStore.getState().setLoading(true);
    useCarSearchStore.getState().setError('test error');

    // Reset the state
    useCarSearchStore.getState().reset();

    // Check if values are reset
    const state = useCarSearchStore.getState();
    expect(state.carInfo).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.email).toBeNull();
    expect(state.showPayment).toBe(false);
    expect(state.paymentError).toBeNull();
    expect(state.showDetailedInfo).toBe(false);
    expect(state.paymentStatus).toBe('idle');
  });
}); 