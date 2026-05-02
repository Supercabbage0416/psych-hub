'use client';

import { useEffect, useState } from 'react';
import { loadState } from '@/lib/recovery/storage';
import { getStage } from '@/lib/recovery/config';
import { getLatestInsight } from '@/lib/supabase';

export default function DailyNudgeCard() {
  const [nudge, setNudge] = useState<string | null>(null);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const cacheKey = `ai_nudge_v1_${today}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) { setNudge(cached); return; }

    (async () => {
      try {
        const [recoveryState, insight] = await Promise.all([
          Promise.resolve(loadState()),
          getLatestInsight(),
        ]);
        if (!insight?.recommendation) return;

        const stage = recoveryState ? getStage(recoveryState.currentStage) : null;

        const res = await fetch('/api/daily-nudge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stageName: stage?.name ?? 'recovery',
            mood: insight.mood ?? 'okay',
            recommendation: insight.recommendation,
          }),
        });

        if (!res.ok) return;
        const data = await res.json();
        if (data.nudge) {
          localStorage.setItem(cacheKey, data.nudge);
          setNudge(data.nudge);
        }
      } catch { /* fail silently — not critical */ }
    })();
  }, []);

  if (!nudge) return null;

  return (
    <div className="bg-white rounded-2xl px-4 py-3.5 border border-warm-100 mb-3 flex gap-3 items-start">
      <span style={{ fontSize: 16, marginTop: 1, flexShrink: 0 }}>✨</span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--amber)' }}>
          Today&apos;s focus
        </p>
        <p className="text-warm-800 text-sm leading-relaxed">{nudge}</p>
      </div>
    </div>
  );
}
