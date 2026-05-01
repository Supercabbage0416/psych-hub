'use client';

import { useState } from 'react';
import type { RecoveryState } from '@/lib/recovery/types';
import { getStage, getNextStage, TONE, STAGE_ORDER } from '@/lib/recovery/config';
import { checkStageReadiness } from '@/lib/recovery/scoring';
import { advanceStage, saveState, activateLowEnergyMode } from '@/lib/recovery/storage';

const STAGE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  stabilization: { bg: 'bg-blue-50',   text: 'text-blue-600',   border: 'border-blue-200' },
  competence:    { bg: 'bg-sage-pale',  text: 'text-sage',       border: 'border-sage-light' },
  autonomy:      { bg: 'bg-amber-50',   text: 'text-amber-700',  border: 'border-amber-200' },
  social:        { bg: 'bg-rose-pale',  text: 'text-rose',       border: 'border-rose-light' },
  meaning:       { bg: 'bg-purple-50',  text: 'text-purple-600', border: 'border-purple-200' },
};

interface Props {
  state: RecoveryState;
  onStateChange: (s: RecoveryState) => void;
}

export default function StageReview({ state, onStateChange }: Props) {
  const [choice, setChoice] = useState<string | null>(null);

  const stage = getStage(state.currentStage);
  const nextStageId = getNextStage(state.currentStage);
  const nextStage = nextStageId ? getStage(nextStageId) : null;
  const colors = STAGE_COLORS[state.currentStage];
  const readiness = checkStageReadiness(state);
  const isLastStage = STAGE_ORDER.indexOf(state.currentStage) === STAGE_ORDER.length - 1;

  const engagementPct = Math.round(readiness.engagementRate * 100);
  const actionPct = Math.round((readiness.avgActionScore / 2) * 100);
  const effectivenessPct = Math.round((readiness.avgEffectivenessScore / 2) * 100);

  function handleAdvance() {
    const next = advanceStage(state);
    saveState(next);
    onStateChange(next);
    setChoice('advanced');
  }

  function handleExtend() {
    saveState(state);
    setChoice('extended');
  }

  function handleEasier() {
    const next = activateLowEnergyMode(state);
    onStateChange(next);
    setChoice('easier');
  }

  if (choice === 'advanced' && nextStage) {
    return (
      <div className="bg-white rounded-3xl p-6 shadow-card border border-warm-100 text-center">
        <p className="font-serif text-2xl text-warm-900 mb-2">Moving to {nextStage.name}</p>
        <p className="text-warm-500 text-sm leading-relaxed">{nextStage.tagline}</p>
        <p className="text-warm-400 text-xs mt-4 leading-relaxed">You built something real. The next chapter continues from here.</p>
      </div>
    );
  }

  if (choice === 'extended') {
    return (
      <div className="bg-white rounded-3xl p-6 shadow-card border border-warm-100 text-center">
        <p className="font-serif text-xl text-warm-900 mb-2">Staying with {stage.name}</p>
        <p className="text-warm-500 text-sm leading-relaxed">{TONE.stage_not_ready}</p>
      </div>
    );
  }

  if (choice === 'easier') {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-3xl p-6 text-center">
        <p className="font-serif text-xl text-warm-900 mb-2">Gentle mode activated</p>
        <p className="text-warm-500 text-sm leading-relaxed">{TONE.low_energy_activated}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Current stage */}
      <div className={`${colors.bg} border ${colors.border} rounded-3xl p-5`}>
        <p className="text-xs font-medium text-warm-400 uppercase tracking-wide mb-1">Currently in</p>
        <h2 className="font-serif text-2xl text-warm-900">{stage.name}</h2>
        <p className={`text-sm ${colors.text} mt-0.5`}>{stage.tagline}</p>
        <p className="text-warm-500 text-sm mt-2">{readiness.daysInStage} days so far</p>
      </div>

      {/* Readiness metrics */}
      <div className="bg-white rounded-3xl p-5 shadow-card border border-warm-100">
        <p className="text-xs text-warm-400 uppercase tracking-wide mb-4">Stage readiness</p>

        {[
          { label: 'Engagement (last 14 days)', pct: engagementPct, min: 60 },
          { label: 'Average action score', pct: actionPct, min: 60 },
          { label: 'Average effectiveness', pct: effectivenessPct, min: 50 },
        ].map(({ label, pct, min }) => (
          <div key={label} className="mb-4 last:mb-0">
            <div className="flex justify-between mb-1.5">
              <p className="text-xs text-warm-600">{label}</p>
              <p className={`text-xs font-medium ${pct >= min ? 'text-sage' : 'text-amber-600'}`}>{pct}%</p>
            </div>
            <div className="h-1.5 bg-warm-100 rounded-full">
              <div
                className={`h-1.5 rounded-full transition-all ${pct >= min ? 'bg-sage' : 'bg-amber-400'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        ))}

        {readiness.daysInStage < stage.minDays && (
          <p className="text-xs text-warm-400 mt-3">
            Minimum {stage.minDays} days recommended · {Math.max(0, stage.minDays - readiness.daysInStage)} more to go
          </p>
        )}
      </div>

      {/* Recommendation */}
      <div className={`rounded-3xl p-5 border ${readiness.ready ? 'bg-sage-pale border-sage-light' : 'bg-amber-50 border-amber-200'}`}>
        <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${readiness.ready ? 'text-sage' : 'text-amber-700'}`}>
          {readiness.ready ? 'Ready to advance' : 'Recommendation'}
        </p>
        <p className="text-sm text-warm-700 leading-relaxed">
          {readiness.ready ? TONE.stage_ready : TONE.stage_not_ready}
        </p>
      </div>

      {/* User choice */}
      <div className="bg-white rounded-3xl p-5 shadow-card border border-warm-100">
        <p className="text-xs text-warm-400 uppercase tracking-wide mb-4">Your choice</p>
        <div className="space-y-2.5">
          {!isLastStage && readiness.ready && nextStage && (
            <button
              onClick={handleAdvance}
              className="w-full py-3.5 rounded-2xl bg-sage text-white text-sm font-medium active:scale-[0.98] transition-transform"
            >
              Move to {nextStage.name} →
            </button>
          )}
          <button
            onClick={handleExtend}
            className="w-full py-3.5 rounded-2xl bg-warm-100 text-warm-700 text-sm font-medium"
          >
            Stay with this stage a little longer
          </button>
          <button
            onClick={handleEasier}
            className="w-full py-3.5 rounded-2xl border border-blue-200 text-blue-600 text-sm font-medium"
          >
            Make nudges gentler for now
          </button>
        </div>
      </div>

      {isLastStage && (
        <div className="bg-purple-50 border border-purple-200 rounded-3xl p-5 text-center">
          <p className="font-serif text-xl text-warm-900 mb-2">Final stage</p>
          <p className="text-warm-500 text-sm leading-relaxed">
            You are in the deepest stage of this recovery. Take all the time you need.
          </p>
        </div>
      )}
    </div>
  );
}
