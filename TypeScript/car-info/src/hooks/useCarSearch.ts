import { useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'next-i18next';
import { useCarSearchStore } from '../store/carSearchStore';

export const useCarSearch = (plate: string | string[] | undefined) => {
  const { t } = useTranslation('common');
  const {
    setCarInfo,
    setLoading,
    setError,
    setShowDetailedInfo,
    setPaymentError,
  } = useCarSearchStore();

  const plateRef = useRef(plate);
  plateRef.current = plate;

  const fetchCarInfo = useCallback(async () => {
    if (!plateRef.current) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/car-info?plate=${encodeURIComponent(plateRef.current as string)}`);
      if (!response.ok) throw new Error('Failed to fetch car information');
      const data = await response.json();
      setCarInfo(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error'));
    } finally {
      setLoading(false);
    }
  }, [t, setCarInfo, setLoading, setError]);

  useEffect(() => {
    if (plate) {
      fetchCarInfo();
    }
  }, [plate, fetchCarInfo]);

  const handlePaymentSuccess = useCallback(async (email: string) => {
    if (!plateRef.current) return;

    try {
      const response = await fetch('/api/generate-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, licensePlate: plateRef.current }),
      });

      if (!response.ok) throw new Error('Failed to generate invoice');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${plateRef.current}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setShowDetailedInfo(true);
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : t('error'));
    }
  }, [t, setShowDetailedInfo, setPaymentError]);

  return { handlePaymentSuccess };
}; 