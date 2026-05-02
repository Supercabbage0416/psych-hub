'use client';
import { useCallback, useEffect, useState } from 'react';

export type Period = 'day' | 'night';

const OVERRIDE_KEY = 'psychhub.periodOverride';

function detectPeriod(): Period {
  if (typeof window !== 'undefined') {
    const override = localStorage.getItem(OVERRIDE_KEY);
    if (override === 'day' || override === 'night') return override;
  }
  const h = new Date().getHours();
  return h >= 6 && h < 18 ? 'day' : 'night';
}

export function usePeriod() {
  const [period, setPeriod] = useState<Period>('night');

  useEffect(() => {
    setPeriod(detectPeriod());
    const id = setInterval(() => setPeriod(detectPeriod()), 60_000);
    return () => clearInterval(id);
  }, []);

  const setPeriodOverride = useCallback((p: Period) => {
    localStorage.setItem(OVERRIDE_KEY, p);
    setPeriod(p);
  }, []);

  const clearOverride = useCallback(() => {
    localStorage.removeItem(OVERRIDE_KEY);
    setPeriod(detectPeriod());
  }, []);

  return { period, setPeriodOverride, clearOverride };
}
