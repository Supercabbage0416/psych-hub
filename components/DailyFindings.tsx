'use client';

import { useEffect, useState } from 'react';
import FindingCard, { Finding } from './FindingCard';

export default function DailyFindings() {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const cacheKey = `findings_${new Date().toISOString().split('T')[0]}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      setFindings(JSON.parse(cached));
      setLoading(false);
      return;
    }

    fetch('/api/findings')
      .then((r) => r.json())
      .then((data) => {
        setFindings(data);
        sessionStorage.setItem(cacheKey, JSON.stringify(data));
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-3xl p-5 shadow-card animate-pulse">
            <div className="h-4 bg-warm-100 rounded w-20 mb-4" />
            <div className="h-8 bg-warm-100 rounded w-24 mb-2" />
            <div className="h-4 bg-warm-100 rounded w-full mb-1" />
            <div className="h-4 bg-warm-100 rounded w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  if (error || findings.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-6 shadow-card text-center">
        <p className="text-warm-500 text-sm">Couldn't load today's findings.</p>
        <p className="text-warm-400 text-xs mt-1">Check your connection and try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {findings.map((f, i) => <FindingCard key={i} finding={f} />)}
    </div>
  );
}
