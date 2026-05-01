'use client';

import type { RecoveryState } from '@/lib/recovery/types';
import { buildWeeklySummary } from '@/lib/recovery/scoring';
import { getStage } from '@/lib/recovery/config';

interface Props {
  state: RecoveryState;
}

export default function WeeklyReview({ state }: Props) {
  const summary = buildWeeklySummary(state);
  const stage = getStage(state.currentStage);

  const engagementPct = Math.round((summary.daysEngaged / summary.totalDays) * 100);
  const barColor = engagementPct >= 70 ? 'bg-sage' : engagementPct >= 40 ? 'bg-amber-400' : 'bg-rose';

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-3xl p-5 shadow-card border border-warm-100">
        <p className="text-xs text-warm-400 uppercase tracking-wide mb-1">This week</p>
        <h2 className="font-serif text-2xl text-warm-900 mb-4">Weekly review</h2>

        {/* Engagement bar */}
        <div className="mb-5">
          <div className="flex justify-between mb-2">
            <p className="text-sm text-warm-700 font-medium">Days engaged</p>
            <p className="text-sm text-warm-500">{summary.daysEngaged} / {summary.totalDays}</p>
          </div>
          <div className="h-2 bg-warm-100 rounded-full">
            <div className={`h-2 ${barColor} rounded-full transition-all`} style={{ width: `${engagementPct}%` }} />
          </div>
        </div>

        {/* Most common energy */}
        <div className="flex items-center justify-between py-3 border-t border-warm-50">
          <p className="text-sm text-warm-600">Most common energy</p>
          <p className="text-sm font-medium text-warm-800">{summary.mostCommonEnergy}</p>
        </div>

        {/* Stage */}
        <div className="flex items-center justify-between py-3 border-t border-warm-50">
          <p className="text-sm text-warm-600">Current stage</p>
          <p className="text-sm font-medium text-warm-800">{stage.name}</p>
        </div>
      </div>

      {/* Small wins */}
      {summary.wins.length > 0 && (
        <div className="bg-sage-pale border border-sage-light rounded-3xl p-5">
          <p className="text-xs font-semibold text-sage uppercase tracking-wide mb-3">Small wins</p>
          <div className="space-y-2">
            {summary.wins.map((win, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-sage mt-1.5 flex-shrink-0" />
                <p className="text-sm text-warm-700 leading-snug">{win}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Patterns noticed */}
      {summary.patterns.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-3">Patterns noticed</p>
          <div className="space-y-2">
            {summary.patterns.map((p, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                <p className="text-sm text-warm-700 leading-snug">{p}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggested adjustment */}
      <div className="bg-white rounded-3xl p-5 shadow-card border border-warm-100">
        <p className="text-xs text-warm-400 uppercase tracking-wide mb-2">Next week</p>
        <p className="text-sm text-warm-700 leading-relaxed">{summary.adjustment}</p>
      </div>

      {/* Empty state */}
      {summary.daysEngaged === 0 && (
        <div className="text-center py-8">
          <p className="font-serif text-xl text-warm-300 mb-2">No reflections this week</p>
          <p className="text-warm-400 text-sm leading-relaxed">
            Start today's reflection on the Today tab.
          </p>
        </div>
      )}
    </div>
  );
}
