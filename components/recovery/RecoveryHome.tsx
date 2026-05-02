'use client';

import type { RecoveryState } from '@/lib/recovery/types';
import { getStage, STAGE_ORDER, TONE } from '@/lib/recovery/config';
import { getTodayNudge, shouldOfferChallenge } from '@/lib/recovery/scoring';
import { getTodayRecord, activateLowEnergyMode, deactivateLowEnergyMode, saveState } from '@/lib/recovery/storage';

const STAGE_ACCENT: Record<string, string> = {
  stabilization: '#7aa6ff',
  competence:    '#7ec8a0',
  autonomy:      '#f0b46a',
  social:        '#e88fa0',
  meaning:       '#b591ff',
};

const COMPLETION_LABEL: Record<string, string> = {
  completed: 'Completed ✓',
  partial:   'Partially done',
  tried:     'Tried',
  skipped:   'Could not continue',
};

interface Props {
  state: RecoveryState;
  onStateChange: (s: RecoveryState) => void;
  onStartReflection: () => void;
}

export default function RecoveryHome({ state, onStateChange, onStartReflection }: Props) {
  const stage    = getStage(state.currentStage);
  const accent   = STAGE_ACCENT[state.currentStage] ?? '#7aa6ff';
  const todayRecord = getTodayRecord(state);
  const nudge    = getTodayNudge(state);
  const stageIdx = STAGE_ORDER.indexOf(state.currentStage);

  const today      = new Date().toISOString().split('T')[0];
  const stageStart = new Date(state.stageStartDate);
  const daysInStage = Math.floor((new Date(today).getTime() - stageStart.getTime()) / 86400000) + 1;

  const toggleLowEnergy = () => {
    const next = state.lowEnergyMode
      ? deactivateLowEnergyMode(state)
      : activateLowEnergyMode(state);
    onStateChange(next);
    saveState(next);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Stage header */}
      <div style={{
        borderRadius: 20, padding: '18px 20px',
        background: 'rgba(255,255,255,0.04)', border: `1px solid ${accent}28`,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <p style={{ fontSize: 11, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--ink-3, #6b789a)', marginBottom: 3 }}>
              Stage {stageIdx + 1} of {STAGE_ORDER.length}
            </p>
            <h2 style={{ fontFamily: "'Cormorant Garamond', 'Lora', Georgia, serif", fontSize: 24, fontWeight: 500, color: 'var(--ink, #e8eef9)', marginBottom: 2 }}>
              {stage.name}
            </h2>
            <p style={{ fontSize: 12, color: accent }}>{stage.tagline}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontFamily: "'Cormorant Garamond', 'Lora', Georgia, serif", fontSize: 28, fontWeight: 500, color: 'var(--ink, #e8eef9)' }}>{daysInStage}</p>
            <p style={{ fontSize: 11, color: 'var(--ink-3, #6b789a)' }}>days in</p>
          </div>
        </div>
        {/* Stage progress bar */}
        <div style={{ display: 'flex', gap: 4 }}>
          {STAGE_ORDER.map((id, i) => (
            <div key={id} style={{
              flex: 1, height: 4, borderRadius: 2,
              background: i < stageIdx ? accent : i === stageIdx ? accent : 'rgba(255,255,255,0.08)',
              opacity: i > stageIdx ? 0.25 : 1,
              transition: 'all 0.4s',
            }} />
          ))}
        </div>
      </div>

      {/* Low energy mode badge */}
      {state.lowEnergyMode && (
        <div style={{
          borderRadius: 16, padding: '12px 16px',
          background: 'rgba(122,166,255,0.06)', border: '1px solid rgba(122,166,255,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent, #7aa6ff)', marginBottom: 2 }}>Gentle mode</p>
            <p style={{ fontSize: 12, color: 'var(--ink-2, #a8b4cf)', lineHeight: 1.5 }}>{TONE.low_energy_activated}</p>
          </div>
          <button onClick={toggleLowEnergy} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--ink-3, #6b789a)', textDecoration: 'underline', marginLeft: 12, flexShrink: 0 }}>
            Off
          </button>
        </div>
      )}

      {/* Streak offer */}
      {shouldOfferChallenge(state) && !state.lowEnergyMode && (
        <div style={{ borderRadius: 16, padding: '12px 16px', background: 'rgba(126,200,160,0.06)', border: '1px solid rgba(126,200,160,0.15)' }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#7ec8a0', marginBottom: 2 }}>Five days in a row</p>
          <p style={{ fontSize: 12, color: 'var(--ink-2, #a8b4cf)' }}>{TONE.success_streak_5}</p>
        </div>
      )}

      {/* Today's nudge */}
      <div style={{ borderRadius: 20, padding: '18px 20px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <p style={{ fontSize: 11, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--ink-3, #6b789a)', marginBottom: 10 }}>
          Today&apos;s nudge
        </p>
        <p style={{ fontFamily: "'Cormorant Garamond', 'Lora', Georgia, serif", fontSize: 18, color: 'var(--ink, #e8eef9)', lineHeight: 1.5, marginBottom: 16 }}>
          {nudge}
        </p>

        {todayRecord ? (
          <div style={{ paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ fontSize: 11, color: 'var(--ink-3, #6b789a)', marginBottom: 4 }}>Today&apos;s reflection</p>
            <p style={{ fontSize: 13, fontWeight: 500, color: accent }}>
              {COMPLETION_LABEL[todayRecord.completion]}
            </p>
            {todayRecord.feedback && (
              <p style={{ fontSize: 12, color: 'var(--ink-2, #a8b4cf)', marginTop: 8, lineHeight: 1.6, fontStyle: 'italic' }}>
                &ldquo;{todayRecord.feedback}&rdquo;
              </p>
            )}
            <button onClick={onStartReflection} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: accent, textDecoration: 'underline', marginTop: 10, padding: 0 }}>
              Update reflection
            </button>
          </div>
        ) : (
          <button
            onClick={onStartReflection}
            style={{
              width: '100%', padding: '13px 0', borderRadius: 999, fontSize: 14, fontWeight: 500,
              background: `${accent}14`, border: `1px solid ${accent}40`,
              color: accent, cursor: 'pointer', transition: 'all 0.2s',
            }}>
            Reflect on today&apos;s nudge →
          </button>
        )}
      </div>

      {/* Streak */}
      {state.successStreak > 1 && (
        <p style={{ fontSize: 12, color: 'var(--ink-3, #6b789a)', paddingLeft: 4 }}>
          {state.successStreak} days showing up in a row
        </p>
      )}

      {/* Gentle mode toggle */}
      {!state.lowEnergyMode && (
        <button onClick={toggleLowEnergy}
          style={{
            width: '100%', padding: '12px 0', borderRadius: 999, fontSize: 13,
            background: 'transparent', border: '1px solid rgba(255,255,255,0.08)',
            color: 'var(--ink-3, #6b789a)', cursor: 'pointer',
          }}>
          Today feels too heavy — switch to gentle mode
        </button>
      )}
    </div>
  );
}
