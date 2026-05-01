'use client';

import { useEffect, useState } from 'react';
import { loadState, getTodayRecord } from '@/lib/recovery/storage';
import { getStage } from '@/lib/recovery/config';
import { getTodayNudge } from '@/lib/recovery/scoring';
import type { RecoveryState } from '@/lib/recovery/types';

const STAGE_COLORS: Record<string, string> = {
  stabilization: 'border-blue-200 bg-blue-50',
  competence: 'border-sage-light bg-sage-pale',
  autonomy: 'border-amber-200 bg-amber-50',
  social: 'border-rose-200 bg-rose-pale',
  meaning: 'border-purple-200 bg-purple-50',
};

const STAGE_BADGE: Record<string, string> = {
  stabilization: 'bg-blue-100 text-blue-700',
  competence: 'bg-sage-pale text-sage',
  autonomy: 'bg-amber-100 text-amber-700',
  social: 'bg-rose-pale text-rose',
  meaning: 'bg-purple-100 text-purple-700',
};

export default function RecoveryNudgeCard() {
  const [state, setState] = useState<RecoveryState | null>(null);

  useEffect(() => {
    try { setState(loadState()); } catch {}
  }, []);

  if (!state) return null;

  const stage = getStage(state.currentStage);
  const nudge = getTodayNudge(state);
  const todayRecord = getTodayRecord(state);
  const done = !!todayRecord;
  const colorClass = STAGE_COLORS[state.currentStage] ?? STAGE_COLORS.stabilization;
  const badgeClass = STAGE_BADGE[state.currentStage] ?? STAGE_BADGE.stabilization;

  return (
    <div className={`rounded-3xl p-5 border ${colorClass}`}>
      <div className="flex items-center justify-between mb-3">
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${badgeClass}`}>
          {stage.name}
        </span>
        {done && (
          <span className="text-xs text-sage font-medium">✓ Done today</span>
        )}
      </div>

      <p className="text-xs text-warm-400 mb-1">Today's small action</p>
      <p className="text-warm-800 text-sm leading-snug font-medium mb-4">{nudge}</p>

      {!done && (
        <a href="/recover"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-warm-600 bg-white border border-warm-200 px-3 py-2 rounded-xl active:scale-95 transition-transform">
          Log in Recover →
        </a>
      )}
    </div>
  );
}
