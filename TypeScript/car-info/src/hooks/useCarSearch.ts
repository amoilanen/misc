import { useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { useCarSearchStore } from '../store/carSearchStore';

export function useCarSearch(licensePlate: string | null) {
  const { t } = useTranslation();
  const store = useCarSearchStore();

  useEffect(() => {
    if (!licensePlate) return;

    const fetchCarInfo = async () => {
      try {
        store.setLoading(true);
        store.setError(null);
        const response = await fetch(`/api/car-info?plate=${licensePlate}`);
        if (!response.ok) throw new Error('Failed to fetch car information');
        const data = await response.json();
        store.setCarInfo(data);
      } catch (error) {
        store.setError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        store.setLoading(false);
      }
    };

    fetchCarInfo();
  }, [licensePlate]);

  const handlePaymentSuccess = async (email: string) => {
    try {
      store.setEmail(email);
      store.setPaymentStatus('success');
    } catch (error) {
      store.setPaymentStatus('error');
      store.setPaymentError(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const handlePaymentError = async () => {
    store.setPaymentStatus('error');
  };

  return {
    handlePaymentSuccess,
    handlePaymentError,
  };
} 