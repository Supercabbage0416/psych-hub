'use client';
import { useEffect } from 'react';
import { usePeriod } from '@/lib/usePeriod';

export default function PeriodBody({ children }: { children: React.ReactNode }) {
  const { period } = usePeriod();

  useEffect(() => {
    document.body.classList.remove('mode-day', 'mode-night');
    document.body.classList.add(`mode-${period}`);
  }, [period]);

  return <>{children}</>;
}
