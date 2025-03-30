import { create } from 'zustand';
import { CarInfo } from '../types/car';

interface CarSearchState {
  carInfo: CarInfo | null;
  isLoading: boolean;
  error: string | null;
  email: string;
  showPayment: boolean;
  paymentError: string | null;
  showDetailedInfo: boolean;
  setCarInfo: (carInfo: CarInfo | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setEmail: (email: string) => void;
  setShowPayment: (show: boolean) => void;
  setPaymentError: (error: string | null) => void;
  setShowDetailedInfo: (show: boolean) => void;
  resetState: () => void;
}

const initialState = {
  carInfo: null,
  isLoading: false,
  error: null,
  email: '',
  showPayment: false,
  paymentError: null,
  showDetailedInfo: false,
};

export const useCarSearchStore = create<CarSearchState>((set) => ({
  ...initialState,
  setCarInfo: (carInfo) => set((state) => ({ ...state, carInfo })),
  setLoading: (isLoading) => set((state) => ({ ...state, isLoading })),
  setError: (error) => set((state) => ({ ...state, error })),
  setEmail: (email) => set((state) => ({ ...state, email })),
  setShowPayment: (show) => set((state) => ({ ...state, showPayment: show })),
  setPaymentError: (error) => set((state) => ({ ...state, paymentError: error })),
  setShowDetailedInfo: (show) => set((state) => ({ ...state, showDetailedInfo: show })),
  resetState: () => set(initialState),
})); 