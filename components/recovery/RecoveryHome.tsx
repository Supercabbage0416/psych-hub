'use client';

import type { RecoveryState } from '@/lib/recovery/types';
import { getStage, STAGE_ORDER, TONE } from '@/lib/recovery/config';
import { getTodayNudge, shouldOfferChallenge } from '@/lib/recovery/scoring';
import { getTodayRecord, activateLowEnergyMode, deactivateLowEnergyMode, saveState } from '@/lib/recovery/storage';

const STAGE_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  stabilization: { bg: 'bg-blue-50',    text: 'text-blue-600',   border: 'border-blue-200',  dot: 'bg-blue-400' },
  competence:    { bg: 'bg-sage-pale',   text: 'text-sage',       border: 'border-sage-light',dot: 'bg-sage' },
  autonomy:      { bg: 'bg-amber-50',    text: 'text-amber-700',  border: 'border-amber-200', dot: 'bg-amber-400' },
  social:        { bg: 'bg-rose-pale',   text: 'text-rose',       border: 'border-rose-light',dot: 'bg-rose' },
  meaning:       { bg: 'bg-purple-50',   text: 'text-purple-600', border: 'border-purple-200',dot: 'bg-purple-400' },
};

const COMPLETION_LABEL: Record<string, string> = {
  completed: 'Completed ✓',
  partial: 'Partially done',
  tried: 'Tried',
  skipped: 'Could not continue',
};
const COMPLETION_COLOR: Record<string, string> = {
  completed: 'text-sage',
  partial: 'text-amber-600',
  tried: 'text-warm-500',
  skipped: 'text-warm-400',
};

interface Props {
  state: RecoveryState;
  onStateChange: (s: RecoveryState) => void;
  onStartReflection: () => void;
}

export default function RecoveryHome({ state, onStateChange, onStartReflection }: Props) {
  const stage = getStage(state.currentStage);
  const colors = STAGE_COLORS[state.currentStage];
  const todayRecord = getTodayRecord(state);
  const nudge = getTodayNudge(state);
  const stageIdx = STAGE_ORDER.indexOf(state.currentStage);
  const canOffer = shouldOfferChallenge(state);

  const stageRecords = state.records.filter(r => r.stageId === state.currentStage);
  const today = new Date().toISOString().split('T')[0];
  const stageStart = new Date(state.stageStartDate);
  const now = new Date(today);
  const daysInStage = Math.floor((now.getTime() - stageStart.getTime()) / 86400000) + 1;

  const toggleLowEnergy = () => {
    const next = state.lowEnergyMode
      ? deactivateLowEnergyMode(state)
      : activateLowEnergyMode(state);
    onStateChange(next);
    saveState(next);
  };

  return (
    <div className="space-y-4">
      {/* Stage header */}
      <div className={`rounded-3xl p-5 ${colors.bg} border ${colors.border}`}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs font-medium text-warm-400 uppercase tracking-wide mb-0.5">
              Stage {stageIdx + 1} of {STAGE_ORDER.length}
            </p>
            <h2 className="font-serif text-2xl text-warm-900">{stage.name}</h2>
            <p className={`text-xs font-medium mt-0.5 ${colors.text}`}>{stage.tagline}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-serif font-semibold text-warm-800">{daysInStage}</p>
            <p className="text-xs text-warm-400">days in</p>
          </div>
        </div>

        {/* Stage progress dots */}
        <div className="flex gap-1.5 mt-2">
          {STAGE_ORDER.map((id, i) => (
            <div
              key={id}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                i < stageIdx ? colors.dot :
                i === stageIdx ? `${colors.dot} opacity-100` :
                'bg-warm-200'
              } ${i > stageIdx ? 'opacity-30' : ''}`}
            />
          ))}
        </div>
      </div>

      {/* Mode badge */}
      {state.lowEnergyMode && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-blue-600 mb-0.5">Low-energy mode</p>
            <p className="text-xs text-blue-500 leading-snug">{TONE.low_energy_activated}</p>
          </div>
          <button
            onClick={toggleLowEnergy}
            className="text-xs text-blue-400 underline underline-offset-2 ml-3 flex-shrink-0"
          >
            Turn off
          </button>
        </div>
      )}

      {/* Success streak offer */}
      {canOffer && !state.lowEnergyMode && (
        <div className="bg-sage-pale border border-sage-light rounded-2xl px-4 py-3">
          <p className="text-xs font-semibold text-sage mb-0.5">Five days in a row</p>
          <p className="text-xs text-warm-500">{TONE.success_streak_5}</p>
        </div>
      )}

      {/* Today's nudge */}
      <div className="bg-white rounded-3xl p-5 shadow-card border border-warm-100">
        <p className="text-xs text-warm-400 uppercase tracking-wide mb-3">Today's nudge</p>
        <p className="font-serif text-lg text-warm-900 leading-snug mb-4">{nudge}</p>

        {todayRecord ? (
          <div className="pt-3 border-t border-warm-100">
            <p className="text-xs text-warm-400 mb-1">Today's reflection</p>
            <p className={`text-sm font-medium ${COMPLETION_COLOR[todayRecord.completion]}`}>
              {COMPLETION_LABEL[todayRecord.completion]}
            </p>
            {todayRecord.feedback && (
              <p className="text-xs text-warm-400 mt-2 leading-relaxed italic">"{todayRecord.feedback}"</p>
            )}
            <button
              onClick={onStartReflection}
              className="mt-3 text-xs text-sage underline underline-offset-2"
            >
              Update reflection
            </button>
          </div>
        ) : (
          <button
            onClick={onStartReflection}
            className={`w-full py-3 rounded-2xl text-sm font-medium ${colors.bg} ${colors.text} border ${colors.border} active:scale-[0.98] transition-transform`}
          >
            Start today's reflection →
          </button>
        )}
      </div>

      {/* Streak info */}
      {state.successStreak > 1 && (
        <div className="flex items-center gap-2 px-1">
          <div className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
          <p className="text-xs text-warm-400">{state.successStreak} days showing up in a row</p>
        </div>
      )}

      {/* Low energy toggle (when not in low energy mode) */}
      {!state.lowEnergyMode && (
        <button
          onClick={toggleLowEnergy}
          className="w-full py-3 text-xs text-warm-400 border border-warm-100 rounded-2xl bg-white"
        >
          Today feels too heavy — switch to gentle mode
        </button>
      )}
    </div>
  );
}
