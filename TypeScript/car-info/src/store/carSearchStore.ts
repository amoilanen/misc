import { create } from 'zustand';

interface CarInfo {
  brand: string;
  model: string;
  year: number;
}

type PaymentStatus = 'idle' | 'success' | 'error';

interface CarSearchState {
  carInfo: CarInfo | null;
  isLoading: boolean;
  error: string | null;
  email: string | null;
  showPayment: boolean;
  paymentError: string | null;
  showDetailedInfo: boolean;
  paymentStatus: PaymentStatus;
  setCarInfo: (carInfo: CarInfo | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setEmail: (email: string | null) => void;
  setShowPayment: (show: boolean) => void;
  setPaymentError: (error: string | null) => void;
  setShowDetailedInfo: (show: boolean) => void;
  setPaymentStatus: (status: PaymentStatus) => void;
  reset: () => void;
}

const initialState = {
  carInfo: null,
  isLoading: false,
  error: null,
  email: null,
  showPayment: false,
  paymentError: null,
  showDetailedInfo: false,
  paymentStatus: 'idle' as PaymentStatus,
};

export const useCarSearchStore = create<CarSearchState>((set) => ({
  ...initialState,
  setCarInfo: (carInfo) => set({ carInfo }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setEmail: (email) => set({ email }),
  setShowPayment: (showPayment) => set({ showPayment }),
  setPaymentError: (paymentError) => set({ paymentError }),
  setShowDetailedInfo: (showDetailedInfo) => set({ showDetailedInfo }),
  setPaymentStatus: (paymentStatus) => set({ paymentStatus }),
  reset: () => set(initialState),
})); 