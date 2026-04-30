'use client';

import { useEffect, useState } from 'react';
import { getGrowthStats } from '@/lib/supabase';

export default function GrowthMarkers() {
  const [stats, setStats] = useState({ daysLogged: 0, thoughtsCaptured: 0, reflectionsDone: 0 });

  useEffect(() => {
    getGrowthStats().then(setStats);
  }, []);

  const markers = [
    { value: stats.daysLogged, label: 'days here' },
    { value: stats.thoughtsCaptured, label: 'thoughts' },
    { value: stats.reflectionsDone, label: 'reflections' },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {markers.map((m) => (
        <div key={m.label} className="bg-white rounded-2xl p-4 shadow-card text-center border border-warm-100">
          <p className="font-serif text-2xl text-warm-900 font-semibold">{m.value}</p>
          <p className="text-xs text-warm-400 mt-0.5">{m.label}</p>
        </div>
      ))}
    </div>
  );
}
